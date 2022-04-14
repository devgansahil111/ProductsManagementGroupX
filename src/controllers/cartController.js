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

const createCart = async function (req, res){
    try {
        let data = req.body;
        let { userId, items, totalPrice, totalItems } = data 

        if (!isValid(userId)){
            res.status(400).send({ status: false, msg: "UserId is mandatory"})
            return
        }
        if (!isValidObjectId(userId)){
            res.status(400).send({ status: false, msg: "Invalid UserId"})
            return
        }
        let isUserIdAlreadyUsed = await cartModel.findById({ _id: userId })
        if (isUserIdAlreadyUsed){
            res.status(400).send({ status: false, msg: "This UserId Already Exists"})
            return
        }
        if (!isValid(items)){
            res.status(400).send({ status: false, msg: "Items are mandatory"})
            return
        }
        if (!isValid(items.productId)){
            res.status(400).send({ status: false, msg: "ProductId is mandatory"})
            return
        }
        if (!isValidObjectId(items.productId)){
            res.status(400).send({ status: false, msg: "Invalid ProductId"})
            return
        }
        if (!isValid(items.quantity)){
            res.status(400).send({ status: false, msg: "Quantity is mandatory"})
            return
        }
        if (!isValid(items.quantity < 1)){
            res.status(400).send({ status: false, msg: "More than 1 Quantity is mandatory"})
            return
        }
        if (!isValid(totalPrice)){
            res.status(400).send({ status: false, msg: "Total Price is mandatory in Cart"})
            return
        }
        if (!isValid(totalItems)){
            res.status(400).send({ status: false, msg: "Total Items are mandatory in Cart"})
            return
        }else{
            let createdCart = await cartModel.create(data)
            res.status(201).send({ status: true, msg: "Cart created Successfully", data: createdCart })
            return
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({ msg: error.message });
    }
};

// -------------------------------------------------------------------------------------------- //
// Put



// -------------------------------------------------------------------------------------------- //
// Exports

module.exports.createCart = createCart;
