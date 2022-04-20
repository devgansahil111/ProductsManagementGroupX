// ------------------------------------------------------------------------------------ //
// Require Packages


const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const awsdk = require("../aws-sdk/aws");
const aws = require("aws-sdk");
const productController = require("../controllers/productController");
const cartController = require("../controllers/cartController");
const middleware = require("../middleware/auth");
const orderController = require("../controllers/orderController");



// ------------------------------------------------------------------------------------ //
// User API's

router.post("/register", userController.createUser);
router.post("/login", userController.loginUser);
router.get("/user/:userId/profile", middleware.authentication, userController.getUserProfile);
router.put("/user/:userId/profile", middleware.authentication, userController.updatedData);


// -------------------------------------------------------------------------------------- //
// Product API's

router.post("/products", productController.createProduct);
router.get("/products", productController.getProducts);
router.get("/products/:productId", productController.getProductDetails);
router.put("/products/:productId", productController.updatedData);
router.delete("/products/:productId", productController.deletedProduct);


// ------------------------------------------------------------------------------------- //
// Cart API's

router.post("/users/:userId/cart", middleware.authentication, cartController.createCart);
router.put("/users/:userId/cart", middleware.authentication, cartController.updateCart);
router.get("/users/:userId/cart", middleware.authentication, cartController.getCart);
router.delete("/users/:userId/cart", middleware.authentication, cartController.deleteCart);


// ------------------------------------------------------------------------------------- //
// Order API'S

router.post("/users/:userId/orders", middleware.authentication, orderController.createOrder);
router.put("/users/:userId/orders", middleware.authentication, orderController.updateOrder);


// ------------------------------------------------------------------------------------- //
// Exports

module.exports = router;