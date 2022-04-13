// ------------------------------------------------------------------------------------------------ //
// Require Packages

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const productModel = require("../models/productModel");
const ObjectId = mongoose.Schema.Types.ObjectId;
const aws = require("aws-sdk");
const awsdk = require("../aws-sdk/aws");


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


// ----------------------------------------------------------------------------------------------- //
// Create API

const createProduct = async function (req, res){
    try {
        let data = req.body;
        let { title, description, price } = data // Destructuring
        let files = req.files
        if (files && files.length > 0) {
            //upload to s3 and get the uploaded link
            // res.send the link back to frontend/postman
            let uploadedFileURL = await awsdk.uploadFile(files[0])
            data.productImage = uploadedFileURL;
        } else {
            res.status(400).send({ msg: "productImage is required" })
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

        if (isTitleAlreadyExists){
            res.status(400).send({ status: false, msg: "This title already exists"})
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
        if (!(/(\-?\d+\.?\d{0,2})/.test(price))){
            res.status(400).send({ status: false, msg: "Invalid Price Number"})
            return
        }
        else{
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
        let { size, name, price } = data;

        // if (!isValid(productId)) {
        //     res.status(400).send({ status: false, msg: "ProductId not present" })
        //     return
        // }
        // if (!isValidObjectId(productId)) {
        //     res.status(400).send({ status: false, msg: "Invalid ProductId" })
        //     return
        // }
        if (!isValid(size)) {
            res.status(400).send({ status: false, msg: "Size not present" })
            return
        }
        if (!isValid(name)) {
            res.status(400).send({ status: false, msg: "Product name not present" })
            return
        }
        if (!isValid(price)) {
            res.status(400).send({ status: false, msg: "Price not present" })
            return
        }
        let productDetails = await productModel.find({ isDeleted: false }).select({ _id: 1, title: 1, description: 1, price: 1, currencyId: 1, currencyFormat: 1, isFreeShipping: 1, productImage: 1, style: 1, availableSizes: 1, installements: 1, deletedAt: 1, isDeleted: 1 }).sort({ price: 1 });
        if (!isValid(productDetails)) {
            res.status(404).send({ status: false, msg: "No product exist" })
            return

        } else {
            res.status(200).send({ status: true, msg: "Products list", data: productDetails })
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};


// ----------------------------------------------------------------------------------------- //
// Get API


const getProductDetails = async function (req, res){
    try {
        let productId = req.params.productId;

        if (!isValid(productId.trim().length == 0)){
            res.status(400).send({ status: false, msg: "ProductId is required"})
            return
        }
        if (!isValidObjectId(productId)){
            res.status(404).send({ status: false, msg: "Invalid ProductId"})
            return
        }
         let productData = await productModel.findById({ _id: productId })
         if (!isValid(productData)){
             res.status(400).send({ status: false, msg: "No Product data found with this productId"})
             return
         }else{
             res.status(200).send({ status: true, msg: "Congratulations", data: productData })
             return
         }
    } catch (error) {
        console.log(error);
        res.status(500).send({ msg: error.message});
    }
};


// ------------------------------------------------------------------------------------------ //
// Put API

const updatedData = async function(req, res){
    try {
        let data = req.body;
        let productId = req.params.productId;

        if (!isValid(data.length == 0)){
            res.status(400).send({ status: false, msg: "Input via body is required"})
            return
        }
        if (!isValid(productId.length == 0)){
            res.status(400).send({ status: false, msg: "productId is required"})
            return
        }
        if (!isValidObjectId(productId)){
            res.status(404).send({ status: false, msg: "Invalid ProductId"})
            return
        }

        let productUpdatedData = await productModel.findById({ _id: productId, isDeleted: false })

        if (!isValid(productUpdatedData)){
            res.status(404).send({ status: false, msg: "No user data found with this Id"})
            return

        }else{
            await productModel.findByIdAndUpdate({ _id: productId, isDeleted: false }, data, { new: true })
            let updateDetails = await productModel.find({ _id: productId })
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

const deletedProduct = async function (req, res){
    try {
        let data = req.body;
        let productId = req.params.productId;

        if (!isValid(data.length == 0)){
            res.status(400).send({ status: false, msg: "Input via body is required"})
            return
        }
        if (!isValid(productId.length == 0)){
            res.status(400).send({ status: false, msg: "productId is required"})
            return
        }
        if (!isValidObjectId(productId)){
            res.status(404).send({ status: false, msg: "Invalid ProductId"})
            return
        }

        let deletedData = await productModel.findById({ _id: productId })
        if (!isValid(deletedData)){
            res.status(404).send({ status: false, msg: "No data found"})
            return

        }else{
            let deletedDetails= await productModel.findByIdAndUpdate({ _id: productId }, {$set: {isDeleted: true, deletedAt: Date.now() }}, { new: true })
            // let deletedDetails = await productModel.findById({ _id: productId })
            res.status(200).send({ status: true, msg: "Data deleted Successfully", data: deletedDetails })
            return
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({ msg: error.message });
    }
};


// ------------------------------------------------------------------------------------------- //
// Get

const getAllProducts = async function (req, res) {
    try {
        const filterQuery = { isDeleted: false }
        const data = req.query;

        if (isValid(data)) {
            const { size, name, priceGreaterThan, priceLessThan, priceSort } = data;


            if (isValid(size)) {
                filterQuery['availableSizes'] = size  
            }

            if (isValid(name)) {

                filterQuery['title'] = {}
                filterQuery['title']['$regex'] = name          
                //https://www.guru99.com/regular-expressions-mongodb.html
                filterQuery['title']['$options'] = 'i'
            }

            if (isValid(priceGreaterThan)) {

                if (!(!isNaN(Number(priceGreaterThan)))) {
                    return res.status(400).send({ status: false, message: `priceGreaterThan should be a valid number` })
                }
                if (priceGreaterThan <= 0) {
                    return res.status(400).send({ status: false, message: `priceGreaterThan should be a valid number` })
                }
                if (!filterQuery.hasOwnProperty('price'))
                    filterQuery['price'] = {}
                filterQuery['price']['$gte'] = Number(priceGreaterThan)
            }

            if (isValid(priceLessThan)) {

                if (!(!isNaN(Number(priceLessThan)))) {
                    return res.status(400).send({ status: false, message: `priceLessThan should be a valid number` })
                }
                if (priceLessThan <= 0) {
                    return res.status(400).send({ status: false, message: `priceLessThan should be a valid number` })
                }
                if (!filterQuery.hasOwnProperty('price'))
                    filterQuery['price'] = {}
                filterQuery['price']['$lte'] = Number(priceLessThan)
            }

            if (isValid(priceSort)) {

                if (!((priceSort == 1) || (priceSort == -1))) {
                    return res.status(400).send({ status: false, message: `priceSort should be 1 or -1 ` })
                }

                const products = await productModel.find(filterQuery).sort({ price: priceSort })

                if (Array.isArray(products) && products.length === 0) {
                    return res.status(404).send({ statuproductss: false, message: 'No Product found' })
                }

                return res.status(200).send({ status: true, message: 'Product list', data: products })
            }
        }

        const products = await productModel.find(filterQuery)
       


        if (Array.isArray(products) && products.length === 0) {
            return res.status(404).send({ statuproductss: false, message: 'No Product found' })
        }

        return res.status(200).send({ status: true, message: 'Product list', data: products })
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

// ------------------------------------------------------------------------------------------ //
// Exports

module.exports.createProduct = createProduct;
module.exports.getProducts = getProducts;
module.exports.getProductDetails = getProductDetails;
module.exports.updatedData = updatedData;
module.exports.deletedProduct = deletedProduct;