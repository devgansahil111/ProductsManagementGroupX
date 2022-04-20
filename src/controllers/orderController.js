// ---------------------------------------------------------------------------------------- //
// Require Packages

const mongoose = require("mongoose");
const cartModel = require("../models/cartModel");
const userModel = require("../models/userModel");
const productModel = require("../models/productModel");
const orderModel = require("../models/orderModel");
const middleware = require("../middleware/auth");
const ObjectId = mongoose.Schema.Types.ObjectId;
const aws = require("aws-sdk");
const awsdk = require("../aws-sdk/aws");
const moment = require("moment");

// ------------------------------------------------------------------------------------------- //
// Validation Format

const isValid = function (value) {
    if (typeof value === "undefined" || value === "null") return false
    if (typeof value === "string" && value.trim().length === 0) return false
    return true;
}

const isValidObjectId = function (ObjectId) {
    return mongoose.Types.ObjectId.isValid(ObjectId)
}

const isValidStatus = function (status) {
    return ["Pending", "Completed", "Cancelled"].indexOf(status) !== -1
}

// ----------------------------------------------------------------------------------------- //
// Create API

const createOrder = async(req, res) => {
    try {
        const userId = req.params.userId;
        const requestBody = req.body;

        //validation for request body
        if (!isValid(requestBody)) {
            res.status(400).send({ status: false, msg: "Invalid request body. Please provide the the input to proceed." });
            return
        }
        //Extract parameters
        const { cartId, cancellable, status } = requestBody;

        //validating userId
        if (!isValidObjectId(userId)) {
            res.status(400).send({ status: false, message: "Invalid userId in params." });
            return
        }

        const searchUser = await userModel.findOne({ _id: userId });
        if (!searchUser) {
            res.status(400).send({ status: false, msg: `user doesn't exists for ${userId}`});
            return
        }
        if (searchUser._id.toString() != req.userId) {
            res.status(403).send({ status: false, message: `Unauthorized access! User's info doesn't match` });
            return
        }

        if (!isValid(cartId)) {
            res.status(400).send({ status: false, msg: `Cart doesn't exists for ${userId}`});
            return
        }
        if (!isValidObjectId(cartId)) {
            res.status(400).send({ status: false, msg: `Invalid cartId in request body.`});
            return
        }

        //searching cart to match the cart by userId whose is to be ordered.
        const searchCartDetails = await cartModel.findOne({ _id: cartId, userId: userId });
        if (!searchCartDetails) {
            res.status(400).send({ status: false, msg: `Cart doesn't belongs to ${userId}`});
            return
        }

        //must be a boolean value.
        if (cancellable) {
            if (typeof cancellable != "boolean") {
                res.status(400).send({ status: false, msg: `Cancellable must be either 'true' or 'false'.`});
                return
            }
        }

        // must be either - pending , completed or cancelled.
        if (status) {
          if(!["pending", "completed", "cancelled"].includes(status)){
            res.status(400).send({ status : false, msg: "status should be from [pending, completed, cancelled]"})
            return
          }
        }

        //verifying whether the cart is having any products or not.
        if (!searchCartDetails.items.length) {
            res.status(202).send({ status: false, msg: `Order already placed for this cart. Please add some products in cart to make an order.`});
            return
        }

        //adding quantity of every products
        const reducer = (previousValue, currentValue) =>
            previousValue + currentValue;

        let totalQuantity = searchCartDetails.items.map((x) => x.quantity).reduce(reducer);

        //object destructuring for response body.
        const orderDetails = {
            userId: userId,
            items: searchCartDetails.items,
            totalPrice: searchCartDetails.totalPrice,
            totalItems: searchCartDetails.totalItems,
            totalQuantity: totalQuantity,
            cancellable,
            status
        };
        const savedOrder = await orderModel.create(orderDetails);

        //Empty the cart after the successfull order
        await cartModel.findOneAndUpdate({ _id: cartId, userId: userId }, { $set: { items: [], totalPrice: 0, totalItems: 0 } });
        res.status(200).send({ status: true, msg: "Order placed.", data: savedOrder });
        return
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message });
        return
    }
};

// ----------------------------------------------------------------------------------------- //
// Put API

const updateOrder = async function (req, res) {
    try {
        const data = req.body;
        const requiredParams = ['orderId', 'status'];
        for (let i = 0; i < requiredParams.length; i++) {
            if (!data[requiredParams[i]] || !data[requiredParams[i]].trim()) {
                res.status(400).send({ status: false, msg: `${requiredParams[i]} field is required` });
                return
            }
        }
        if (!isValidObjectId(data.orderId)) {
            res.status(400).send({ status: false, msg: 'Only mongodb object id is allowed !' });
            return
        }
        const orderRes = await orderModel.findOne({ _id: data.orderId, deletedAt: null, isDeleted: false });
        if (!orderRes) {
            res.status(400).send({ status: false, msg: 'Order not found' });
            return
        }
        const statusEnum = ['pending', 'completed', 'cancelled'];

        if (!statusEnum.includes(data.status)) {
            res.status(400).send({ status: false, msg: `Only these params are allowed on status ${statusEnum.join(", ")}` });
            return
        }
        if (data.status == "cancelled") {
            if (!orderRes.cancellable) {
                res.status(400).send({ status: false, msg: 'You are not able to cancel your order' });
                return
            }
        }
        if (orderRes.status == 'completed') {
            res.status(200).send({ status: true, msg: 'Order is already completed' });
            return
        }
        if (orderRes.status == 'cancelled') {
            res.status(200).send({ status: true, msg: 'Order is already cancelled' });
            return
        }
        else {
            const updateRes = await orderModel.findByIdAndUpdate(data.orderId, { status: data.status }, { new: true });
            res.status(200).send({ status: true, msg: "status update success", data: updateRes });
            return
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).send({ status: false, msg: error.message });
        return
    }
}

// ------------------------------------------------------------------------------------------- //
// Exports

module.exports.createOrder = createOrder;
module.exports.updateOrder = updateOrder;