// --------------------------------------------------------------------------------------- //
// Require Packages

const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;


// --------------------------------------------------------------------------------------- //
// Create Schema

const cartSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        required: true,
        unique: true,
        ref: "User",
        trim: true
    },
    items: [{
        productId: {
            type: ObjectId,
            required: true,
            ref: "Product",
            trim: true
        },
        quantity: {
            type: Number,
            required: true,
            trim: true
        }
    }],
    totalPrice: {
        type: Number,
        required: true,
        trim: true
    },
    totalItems: {
        type: Number,
        required: true,
        trim: true
    }
}, { timestamps: true });

// ------------------------------------------------------------------------------------------ //
// Exports

module.exports = new mongoose.model("Cart", cartSchema);