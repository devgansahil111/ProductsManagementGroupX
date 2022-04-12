// ------------------------------------------------------------------------------------ //
// Require Packages


const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const aws = require("aws-sdk");



// ------------------------------------------------------------------------------------ //
// User API's

router.post("/aws", userController.writeFile);
router.post("/register", userController.createUser);
router.post("/login", userController.loginUser);
router.get("/user/:userId/profile", userController.getUserProfile);
router.put("/user/:userId/profile", userController.updatedData);


// ------------------------------------------------------------------------------------- //
// Exports


module.exports = router;