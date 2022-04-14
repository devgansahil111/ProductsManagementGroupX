// ------------------------------------------------------------------------------------------------ //
// Require Packages

const mongoose = require("mongoose");
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

const isValidAvailableSizes=function(availableSizes){
    return ['Mr','Mrs','Miss'].indexOf(availableSizes) !==-1
}


// ----------------------------------------------------------------------------------------------- //
// Create API

const createProduct = async function (req, res) {
    try {
        let data = req.body;
        let { title, description, price, currencyId, currencyFormat } = data // Destructuring
        let files = req.files
        if (files && files.length > 0) {
            //upload to s3 and get the uploaded link
            // res.send the link back to frontend/postman
            let uploadedFileURL = await awsdk.uploadFile(files[0])
            data.productImage = uploadedFileURL;
        } else {
            res.status(400).send({ msg: "productImage is required" })
            return
        }

        if (Object.keys(data).length == 0) {
            res.status(400).send({ status: false, msg: "BAD REQUEST" })
            return
        }
        if (!isValid(title)) {
            res.status(400).send({ status: false, msg: "Title is mandatory" })
            return
        }

        let isTitleAlreadyExists = await productModel.findOne({ title })

        if (isTitleAlreadyExists) {
            res.status(400).send({ status: false, msg: "This title already exists" })
            return
        }
        if (!isValid(description)) {
            res.status(400).send({ status: false, msg: "Description is mandatory" })
            return
        }
        if (!isValid(price)) {
            res.status(400).send({ status: false, msg: "Price is mandatory" })
            return
        }
        if (!(/^\d{0,8}(\.\d{1,2})?$/.test(price))) {
            res.status(400).send({ status: false, msg: "Invalid Price Number" })
            return
        }
        if (!isValid(currencyId)) {
            res.status(400).send({ status: false, msg: "Enter valid CurrencyId" })
            return
        }
        if (!isValid(currencyFormat)) {
            res.status(400).send({ status: false, msg: "CurrencyFormat is mandatory" })
            return
        }
        else {
            let createdProduct = await productModel.create(data)
            res.status(201).send({ status: true, msg: "Product Successfully Created", data: createdProduct })
            return
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({ msg: error.message });
    }
};


// ----------------------------------------------------------------------------------------- //
// Get API by Filter

const getProducts = async function (req, res) {
    try {
        let data = req.query;
        let { size, name, priceGreaterThan, priceLessThan, priceSort } = data;

        const finalFilter = [{ isDeleted: false }];

        if (isValid(name)) {
            finalFilter.push({ title: { $regex: name, $options: 'i' } })
        }
        if (isValid(size)) {
            if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(size))) {
                res.status(400).send({ status: false, msg: "Please Enter Valid Size" })
                return
            }
            finalFilter.push({ availableSizes: size })
        }
        if (isValid(priceGreaterThan)) {
            finalFilter.push({ price: { $gt: priceGreaterThan } })
        }
        if (isValid(priceLessThan)) {
            finalFilter.push({ price: { $lt: priceLessThan } })
        }
        // if there is a price to sort 
        if (isValid(priceSort)) {
            if (priceSort != 1 || priceSort != -1) {
                res.status(400).send({ status: false, msg: "pricesort must to 1 or -1" })
                return
            }

            const filteredProductsByPrice = await productModel.find({ $and: finalFilter }).sort({ price: priceSort })
            if (!isValid(filteredProductsByPrice) && filteredProductsByPrice.length === 0) {
                res.status(404).send({ status: false, msg: "Data not found" })
                return
            }
            res.status(200).send({ status: true, msg: "Products with sorted price", data: filteredProductsByPrice })
            return
        }

        const filteredProducts = await productModel.find({ $and: finalFilter })

        if (!isValid(filteredProducts) && filteredProducts.length === 0) {
            res.status(404).send({ status: false, msg: "Data not found" })
        }
        res.status(200).send({ status: true, msg: "Products without sorted price", data: filteredProducts })
        return

    } catch (error) {
        console.log(error);
        res.status(500).send({ status: false, msg: error.message });
        return
    }
};


// ----------------------------------------------------------------------------------------- //
// Get API


const getProductDetails = async function (req, res) {
    try {
        let productId = req.params.productId;

        if (!isValid(productId.trim().length == 0)) {
            res.status(400).send({ status: false, msg: "ProductId is required" })
            return
        }
        if (!isValidObjectId(productId)) {
            res.status(404).send({ status: false, msg: "Invalid ProductId" })
            return
        }
        let productData = await productModel.findById({ _id: productId })
        if (!isValid(productData)) {
            res.status(400).send({ status: false, msg: "No Product data found with this productId" })
            return
        } else {
            res.status(200).send({ status: true, msg: "Congratulations", data: productData })
            return
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({ msg: error.message });
    }
};


// ------------------------------------------------------------------------------------------ //
// Put API

const updatedData = async function (req, res) {
    try {
        let data = req.body;
        let productId = req.params.productId;

        let {description, title, isFreeShipping, price, style, availableSizes, installments } = data

        if (!isValid(data.length == 0)) {
            res.status(400).send({ status: false, msg: "Input via body is required" })
            return
        }
        if (!isValid(productId.length == 0)) {
            res.status(400).send({ status: false, msg: "productId is required" })
            return
        }
        if (!isValidObjectId(productId)) {
            res.status(404).send({ status: false, msg: "Invalid ProductId" })
            return
        }
        if (!isValid(description)) {
            res.status(400).send({ status: false, msg: "There is no description" })
            return
        }
        if (!isValid(title)) {
            res.status(400).send({ status: false, msg: "Please give title" })
            return
        }
        if (!isValid(isFreeShipping)) {
            res.status(400).send({ status: false, msg: "Only give true or false" })
            return
        }
        if (!isValid(price)) {
            res.status(400).send({ status: false, msg: "Give me money" })
            return
        }
        if (!(/^\d{0,8}(\.\d{1,2})?$/.test(price))) {
            res.status(400).send({ status: false, msg: "Invalid Price Number" })
            return
        }
        if (!isValid(style)) {
            res.status(400).send({ status: false, msg: "Please give style" })
            return
        }
        if (!isValid(availableSizes)) {
            res.status(400).send({ status: false, msg: "May i know correct size plz" })
            return
        }
        if (!isValidAvailableSizes(availableSizes)) {
            res.status(400).send({ status: false, msg: "Invalid size" })
            return
        }
        if (!isValid(installments)) {
            res.status(400).send({ status: false, msg: "It should be in number form" })
            return
        }
        
        let productUpdatedData = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!isValid(productUpdatedData)) {
            res.status(404).send({ status: false, msg: "No user data found with this Id" })
            return
        }
         else {
            let updateDetails = await productModel.findByIdAndUpdate({ _id: productId, isDeleted: false }, data, { new: true })
            // let updateDetails = await productModel.find({ _id: productId })
            res.status(200).send({ status: true, msg: "Data updated Successfully", data: updateDetails })
            return
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({ msg: error.message });
    }
};


// ---------------------------------------------------------------------------------------- //
// Delete API

const deletedProduct = async function (req, res) {
    try {
        let data = req.body;
        let productId = req.params.productId;

        if (!isValid(data.length == 0)) {
            res.status(400).send({ status: false, msg: "Input via body is required" })
            return
        }
        if (!isValid(productId.length == 0)) {
            res.status(400).send({ status: false, msg: "productId is required" })
            return
        }
        if (!isValidObjectId(productId)) {
            res.status(404).send({ status: false, msg: "Invalid ProductId" })
            return
        }

        let deletedData = await productModel.findById({ _id: productId })
        if (!isValid(deletedData)) {
            res.status(404).send({ status: false, msg: "No data found" })
            return

        } else {
            let deletedDetails = await productModel.findByIdAndUpdate({ _id: productId }, { $set: { isDeleted: true, deletedAt: Date.now() } }, { new: true })
            // let deletedDetails = await productModel.findById({ _id: productId })
            res.status(200).send({ status: true, msg: "Data deleted Successfully", data: deletedDetails })
            return
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({ msg: error.message });
    }
};


// ------------------------------------------------------------------------------------------ //
// Exports

module.exports.createProduct = createProduct;
module.exports.getProducts = getProducts;
module.exports.getProductDetails = getProductDetails;
module.exports.updatedData = updatedData;
module.exports.deletedProduct = deletedProduct;
