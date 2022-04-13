// ----------------------------------------------------------------------------------------- //
// Require Packages


const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const moment = require("moment");


// ------------------------------------------------------------------------------------------ //
// Create Schema

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        trim: true
    },
    currencyId: {
        type: String,
        required: true,
        trim: true,
        default: "INR"
    },
    currencyFormat: {
        type: String,
        required: true,
        trim: true,
        default: '₹'
    },
    isFreeShipping: {
        type: Boolean,
        default: false
    },
    productImage: {
        type: String,
        required: true,
        trim: true
    },
    style: {
        type: String,
        trim: true
    },
    availableSizes: {
        type: String,
        enum: ["S", "XS","M","X", "L","XXL", "XL"],
        trim: true
    },
    installements: {
        type: Number,
        trim: true
    },
    deletedAt:{
        type: Date,
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// -------------------------------------------------------------------------------------- //
// Exports


module.exports = new mongoose.model("Product", productSchema);