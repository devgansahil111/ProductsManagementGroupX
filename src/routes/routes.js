// ------------------------------------------------------------------------------------ //
// Require Packages


const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const awsdk = require("../aws-sdk/aws");
const aws = require("aws-sdk");
const productController = require("../controllers/productController");
const cartController = require("../controllers/cartController");



// ------------------------------------------------------------------------------------ //
// User API's

router.post("/register", userController.createUser);
router.post("/login", userController.loginUser);
router.get("/user/:userId/profile", userController.getUserProfile);
router.put("/user/:userId/profile", userController.updatedData);


// -------------------------------------------------------------------------------------- //
// Product API's

router.post("/products", productController.createProduct);
router.get("/products", productController.getProducts);
router.get("/products/:productId", productController.getProductDetails);
router.put("/products/:productId", productController.updatedData);
router.delete("/products/:productId", productController.deletedProduct);


// ------------------------------------------------------------------------------------- //
// Cart API's

router.post("/users/:userId/cart", cartController.createCart);

// ------------------------------------------------------------------------------------- //
// Exports


module.exports = router;