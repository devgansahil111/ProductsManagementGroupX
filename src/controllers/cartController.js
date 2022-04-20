// --------------------------------------------------------------------------------------- //
// Require Packages

const mongoose = require("mongoose");
const cartModel = require("../models/cartModel");
const userModel = require("../models/userModel");
const productModel = require("../models/productModel");
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

// ---------------------------------------------------------------------------------------- //
// Create API

const createCart = async (req, res) => {
    try {
        const data = req.body
        const userIdbyParams = req.params.userId
        let { userId, productId, cartId } = data

        if (!isValidObjectId(userId)) {
            res.status(400).send({ status: false, msg: "Please provide valid UserId" });
            return
        }
        if (!isValid(userId)) {
            res.status(400).send({ status: false, msg: 'Please provide userId' })
            return
        }
        if (userIdbyParams !== data.userId) {
            res.status(400).send({ status: false, msg: "Plz Provide Similar UserId's in params and body" })
            return
        }

        const isProductPresent = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!isProductPresent) {
            res.status(404).send({ status: false, msg: `Product not found by this productId ${productId}` })
            return
        }
        if (data.hasOwnProperty("cartId")) {

            if (!isValid(cartId)) {
                res.status(400).send({ status: false, msg: "CartId could not be blank" });
                return
            }
            if (!isValidObjectId(cartId)) {
                res.status(400).send({ status: false, msg: "CartId  is not valid" });
                return
            }

            const isCartIdPresent = await cartModel.findById(cartId);

            if (!isCartIdPresent) {
                res.status(404).send({ status: false, msg: `Cart not found by this cartId ${cartId}` });
                return
            }

            const cartIdForUser = await cartModel.findOne({ userId: userId });

            if (!cartIdForUser) {
                res.status(403).send({ status: false, msg: `User is not allowed to update this cart` });
                return
            }
            if (req.userId !== isCartPresentForUser.userId.toString()) {
                res.status(403).send({ status: false, message: "You are not authorized to create and update the cart" })
                return
            }
            if (cartId !== cartIdForUser._id.toString()) {
                res.status(403).send({ status: false, msg: `User is not allowed to update this cart` });
                return
            }

            const isProductPresentInCart = isCartIdPresent.items.map(
                (product) => (product["productId"] = product["productId"].toString()));

            if (isProductPresentInCart.includes(productId)) {

                const updateExistingProductQuantity = await cartModel.findOneAndUpdate({ _id: cartId, "items.productId": productId },
                    {
                        $inc: { totalPrice: +isProductPresent.price, "items.$.quantity": +1, },
                    }, { new: true });

                return res.status(200).send({ status: true, msg: "Product quantity updated to cart", data: updateExistingProductQuantity });
            }

            const addNewProductInItems = await cartModel.findOneAndUpdate({ _id: cartId }, { $addToSet: { items: { productId: productId, quantity: 1 } }, $inc: { totalItems: +1, totalPrice: +isProductPresent.price } }, { new: true });
            res.status(200).send({ status: true, msg: "Item updated to cart", data: addNewProductInItems, });
            return
        }
        else {
            const isCartPresentForUser = await cartModel.findOne({ userId: userId });

            if (isCartPresentForUser) {
                res.status(400).send({ status: false, msg: "cart already exist, provide cartId in req. body" });
                return
            }

            const productData = { productId: productId, quantity: 1 }

            const cartData = {
                userId: userId,
                items: [productData],
                totalPrice: isProductPresent.price,
                totalItems: 1,
            };

            const createCart = await cartModel.create(cartData);

            res.status(201).send({ status: true, msg: "New cart created and product added to cart", data: createCart });
            return
        }
    }
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
        return
    }
};

// -------------------------------------------------------------------------------------------- //
// Put

const updateCart = async function (req, res) {
    try {
        let userId = req.params.userId
        if (!isValid(userId)) {
            res.status(400).send({ status: false, msg: "userId is required" })
            return
        }
        if (!isValidObjectId(userId)) {
            res.status(400).send({ status: false, msg: "userId is not valid" })
            return
        }
        let updatedCart = await userModel.findOne({ _id: userId })
        if (!updatedCart) {
            res.status(400).send({ status: false, msg: "userId is not present" })
            return
        }
        if (updatedCart._id.toString() != req.userId) {
            res.status(403).send({ status: false, message: `Unauthorized access! User's info doesn't match` });
            return
        }
        let updatedDetails = await cartModel.findOne({ userId: userId })
        if (!updatedDetails) {
            res.status(400).send({ status: false, msg: "cart is not present" })
            return
        }

        let data = req.body

        for (let i = 0; i < data.items.length; i++) {
            if (!isValid(data.items[i].productId)) {
                res.status(400).send({ status: false, msg: "productId is mandatory" })
                return
            }
            if (!isValidObjectId(data.items[i].productId)) {
                res.status(400).send({ status: false, msg: "productId is not valid" })
                return
            }
            let updatedProduct = await productModel.findById({ _id: data.items[i].productId })
            if (!updatedProduct) {
                res.status(400).send({ status: false, msg: "productId is not present" })
                return
            }
            if (!isValid(data.items[i].quantity)) {
                res.status(400).send({ status: false, msg: "quantity is mandatory" })
                return
            }
            if (!isValidObjectId(data.items[i].quantity)) {
                res.status(400).send({ status: false, msg: "quantity is not valid" })
                return
            }
            let updateFinal = await productModel.findById({ _id: data.items[i].productId })
            if ((updateFinal).installments < data.items[i].quantity) {
                res.status(400).send({ status: false, msg: "out of stock" })
                return
            }
        }

        data.totalPrice = 0
        data.totalItems = 0
        let price = 0
        //let quantity = 0
        for (let i = 0; i < data.items.length; i++) {
            let findprice = await productModel.findById({ _id: data.items[i].productId })
            price = price + findprice.price * data.items[i].quantity
            data.totalPrice = price
            //quantity = quantity + data.items[i].quantity
        }

        data.totalItems = data.items.length

        let savedData = await cartModel.findOneAndUpdate({ userId: userId }, data, { new: true })
        res.status(201).send({ status: true, msg: " cart updated successfully", msg2: savedData })
        return
    } catch (error) {
        res.status(500).send({ status: false, msg: error.message })
        return
    }
};

// --------------------------------------------------------------------------------------------- //
// Get API

const getCart = async function (req, res) {
    try {
        let userId = req.params.userId
        if (!isValid(userId)) {
            res.status(400).send({ status: false, msg: "userId is required" })
            return
        }
        if (!isValidObjectId(userId)) {
            res.status(400).send({ status: false, msg: "userId is not valid" })
            return
        }
        let getData = await cartModel.findOne({ userId: userId })
        if (!getData) {
            res.status(400).send({ status: false, msg: "cart is not present" })
            return
        }
        let getDetails = await userModel.findOne({ _id: userId })
        if (!getDetails) {
            res.status(400).send({ status: false, msg: "userId is not present" })
            return
        }
        else {
            const cartdata = await cartModel.findOne({ userId: userId })
            if (req.userId != oneUser._id) {
                res.status(403).send({ status: false, message: "Unauthorized access! You are not authorized to Get this cart details" });
                return
            }
            res.status(200).send({ status: true, msg: "success", data: cartdata })
            return
        }
    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
        return
    }
};

// ------------------------------------------------------------------------------------------- //
// Delete API

const deleteCart = async function (req, res) {
    try {
        let userId = req.params.userId
        if (!isValid(userId)) {
            res.status(400).send({ status: false, msg: "userId is required" })
            return
        }
        if (!isValidObjectId(userId)) {
            res.status(400).send({ status: false, msg: "userId is not valid" })
            return
        }
        let deletedData = await cartModel.findOne({ userId: userId })
        if (!deletedData) {
            res.status(400).send({ status: false, msg: "cart is not present" })
            return
        }
        let deletedDetails = await cartModel.findOne({ userId: userId, totalItems: totalItems = 0, totalPrice: totalPrice = 0 })
        if (!deletedDetails) {
            res.status(400).send({ status: false, msg: "cart has some product" })
            return
        }
        else {
            const cartDeleted = await cartModel.findOneAndDelete({ userId: userId }, { new: true })
            res.status(200).send({ status: true, msg: "cart is deleted", data: cartDeleted })
            return
        }
    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
        return
    }
}

// -------------------------------------------------------------------------------------------- //
// Exports

module.exports.createCart = createCart;
module.exports.updateCart = updateCart;
module.exports.getCart = getCart;
module.exports.deleteCart = deleteCart;
