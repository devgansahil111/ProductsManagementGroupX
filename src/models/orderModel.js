// ------------------------------------------------------------------------------------ //
// Require Packages

const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;


// ------------------------------------------------------------------------------------- //
// Create Schema

const orderSchema = new mongoose.Schema({
    "userId": {
        type: ObjectId,
        required: true,
        trim: true,
        ref: "User"
    },
    "items": [{
    "productId": {
        type: ObjectId,
        required: true,
        trim: true,
        ref: "Product"
    },
    "quantity": {
        type: Number,
        trim: true,
        required: true
    }
  }],
  "totalPrice": {
      type: Number,
      required: true,
      trim: true
  },
  "totalItems": {
      type: Number,
      required: true,
      trim: true
  },
  "totalQuantity": {
      type: Number,
      required: true,
      trim: true
  },
  "cancellable": {
      type: Boolean,
      default: true
  },
  "status": {
      type: String,
      default: "Pending",
      enum: ["Pending", "Completed", "Cancelled"]
  },
  "deletedAt": {
      type: Date,
      default: null
  }, 
  "isDeleted": {
      type: Boolean,
      default: false
  }
}, { timestamps: true });


// ----------------------------------------------------------------------------------------------- //
// Exports

module.exports = new mongoose.model("Order", orderSchema);