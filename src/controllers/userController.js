// ------------------------------------------------------------------------------------------ //
// Require Packages


const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");
const ObjectId = mongoose.Schema.Types.ObjectId;
const aws = require("aws-sdk");
const jwt = require("jsonwebtoken");
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


// -------------------------------------------------------------------------------------------- //
// Create

const createUser = async function(req, res){
    try {
        let data = req.body;
        // let Data = JSON.parse(data.abcd);
        let files = req.files;

        if (files && files.length > 0) {
            //upload to s3 and get the uploaded link
            // res.send the link back to frontend/postman
            let uploadedFileURL = await awsdk.uploadFile(files[0])
            data.profileImage = uploadedFileURL;
        } else {
            res.status(400).send({ msg: "profileImage is required" })
        }
        
        let { fName, lName, email, password, phone, address } = data // Destructuring
        
        if (Object.keys(data).length == 0) {
            res.status(400).send({ status: false, msg: "BAD REQUEST" })
            return
        }
        if (Object.keys(files).length == 0) {
            res.status(400).send({ status: false, msg: "BAD REQUEST" })
            return
        }
        if (!isValid(fName)){
            res.status(400).send({ status: false, msg: "First name is mandatory" })
            return
        }
        if (!isValid(lName)){
            res.status(400).send({ status: false, msg: "Last name is mandatory" })
            return
        }
        if (!isValid(email)){
            res.status(400).send({ status: false, msg: "Email is mandatory" })
            return
        }
        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
            res.status(400).send({ status: false, msg: "Email should be valid email address" })
            return
        }
        
        let isEmailAlreadyUsed = await userModel.findOne({ email })
        if (isEmailAlreadyUsed) {
            res.status(400).send({ status: false, msg: "Email Already Exist" })
            return
        }
        if (!isValid(password)){
            res.status(400).send({ status: false, msg: "Password is mandatory" })
            return
        }

        const salt = await bcrypt.genSalt(10);
        data.password = await bcrypt.hash(data.password, salt);
        // data.password = await bcrypt.compare(data.password, hash);

        if (!isValid(password > 8 || password < 15)){
            res.status(400).send({ status: false, msg: "Password range should be between 8 to 15" })
            return
        }
        if (!isValid(phone)){
            res.status(400).send({ status: false, msg: "Phone Number is mandatory" })
            return
        }
        if (!(/^\d{10}$/.test(phone))) {
            res.status(400).send({ status: false, msg: "Invalid Phone Number, it should be of 10 digits" })
            return
        }

        let isPhoneAlreadyUsed = await userModel.findOne({ phone })
        if (isPhoneAlreadyUsed) {
            res.status(400).send({ status: false, msg: "Phone Number Already Exist" })
            return
        }
        if (!isValid(address)){
            res.status(400).send({ status: false, msg: "Address is mandatory" })
            return
        }
        if (isValid(address == undefined)){
            res.status(400).send({ status: false, msg: "Address should not be undefined" })
            return
        }
        if (!isValid(address.shipping)){
            res.status(400).send({ status: false, msg: "Shipping Address is mandatory" })
            return
        }
        if (!isValid(address.shipping.street)){
            res.status(400).send({ status: false, msg: "Shipping Street is mandatory" })
            return
        }
        if (!isValid(address.shipping.city)){
            res.status(400).send({ status: false, msg: "Shippping City is mandatory" })
            return
        }
        if (!isValid(address.shipping.pincode)){
            res.status(400).send({ status: false, msg: "Shipping Pincode is mandatory" })
            return
        }
        if (!/^[1-9]{1}[0-9]{5}$/.test(address.shipping.pincode)){
            res.status(400).send({ status: false, msg: "Pincode is of 6 digits and does not start with 0" })
            return
        }
        if (!isValid(address.billing)){
            res.status(400).send({ status: false, msg: "Billing Address is mandatory" })
            return
        }
        if (!isValid(address.billing.street)){
            res.status(400).send({ status: false, msg: "Billing Street is mandatory" })
            return
        }
        if (!isValid(address.billing.city)){
            res.status(400).send({ status: false, msg: "Billing city is mandatory" })
            return
        }
        if (!isValid(address.billing.pincode)){
            res.status(400).send({ status: false, msg: "Billing Pincode is mandatory" })
            return
        }
        if (!/^[1-9]{1}[0-9]{5}$/.test(address.billing.pincode)){
            res.status(400).send({ status: false, msg: "Pincode is of 6 digits and does not start with 0" })
            return
        }
        else {
            let createdUser = await userModel.create(data);
            res.status(201).send({ status: true, message: "User Created Successfully", msg: createdUser })
            return
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({msg: error.message});
    }
};


// ----------------------------------------------------------------------------------------------- //
// Login User


const loginUser = async function (req, res) {
    try {
        let data = req.body

        if (Object.keys(data).length == 0) {
            res.status(400).send({ status: false, msg: "BAD REQUEST" })
            return
        }

        let email = req.body.email;
        let password = req.body.password;

        if (!isValid(email)) {
            res.status(400).send({ status: false, msg: "Email is required" })
            return
        }
        if (!isValid(password)) {
            res.status(400).send({ status: false, msg: "Password is required" })
            return
        }

        let userDetails = await userModel.findOne({ email: email })
        if (!isValid(userDetails)) {
            res.status(400).send({ status: false, msg: "User details is not correct" })
            return
        }

        bcrypt.compare(password, userDetails.password, function(err, result) {
            if (result) {
                let token = jwt.sign({
                    userId: userDetails._id,
                    iat: Math.floor(Date.now() / 1000),
                    exp: Math.floor(Date.now() / 1000) + 10 * 60 * 60
                }, "Project-05-Shopping-Cart-Group-36");

                const userData = { userId: userDetails._id, token: token }
                res.status(201).send({ status: true, msg: "User login successfully", data: userData })
                return

            } else {
                res.status(401).send({ status: true, msg: "Plz provide correct password" })
                return
            }
        })
    } catch (error) {
        res.status(500).send({ status: false, msg: error.message })
        return
    }
};


// ----------------------------------------------------------------------------------------- //
// Get API

const getUserProfile = async function (req, res){
    try {
        let userId = req.params.userId;

        if (!isValid(userId.trim().length == 0)){
            res.status(400).send({ status: false, msg: "UserId is required"})
            return
        }
        if (!isValidObjectId(userId)){
            res.status(404).send({ status: false, msg: "Invalid UserId"})
            return
        }

        let profileData = await userModel.findById({_id: userId})
        if (!isValid(profileData)){
            res.status(400).send({ status: false, msg: "There is no user with this userId"})
            return
        }else{
            res.status(200).send({ status: true, msg: "Congratulations", data: profileData })
            return
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({ msg: error.message });
    }
};

// ---------------------------------------------------------------------------------------------- //
// Put API

const updatedData = async function (req, res){
    try {
        let data = req.body;
        let userId = req.params.userId;

        let { fName, lName, phone, email, password, address } = data;

        if (!isValid(data.length == 0)){
            res.status(400).send({ status: false, msg: "Input via body is required"})
            return
        }
        if (!isValid(userId.length == 0)){
            res.status(400).send({ status: false, msg: "UserId is required"})
            return
        }
        if (!isValidObjectId(userId)){
            res.status(404).send({ status: false, msg: "Invalid UserId"})
            return
        }
        if (!isValid(fName)){
            res.status(400).send({ status: false, msg: "First name is required"})
            return
        }
        if (!isValid(lName)){
            res.status(400).send({ status: false, msg: "Last name is required"})
            return
        }
        if (!isValid(phone)){
            res.status(400).send({ status: false, msg: "Phone Number is mandatory" })
            return
        }
        if (!(/^\d{10}$/.test(phone))) {
            res.status(400).send({ status: false, msg: "Invalid Phone Number, it should be of 10 digits" })
            return
        }

        let isPhoneAlreadyUsed = await userModel.findOne({ phone })
        if (isPhoneAlreadyUsed) {
            res.status(400).send({ status: false, msg: "Phone Number Already Exist" })
            return
        }
        if (!isValid(email)){
            res.status(400).send({ status: false, msg: "Email is mandatory" })
            return
        }
        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
            res.status(400).send({ status: false, msg: "Email should be valid email address" })
            return
        }
        
        let isEmailAlreadyUsed = await userModel.findOne({ email })
        if (isEmailAlreadyUsed) {
            res.status(400).send({ status: false, msg: "Email Already Exist" })
            return
        }
        if (!isValid(password)){
            res.status(400).send({ status: false, msg: "Password is mandatory" })
            return
        }
        if (!isValid(password > 8 || password < 15)){
            res.status(400).send({ status: false, msg: "Password range should be between 8 to 15" })
            return
        }
        if (!isValid(address)){
            res.status(400).send({ status: false, msg: "Address is mandatory" })
            return
        }
        if (isValid(address == undefined)){
            res.status(400).send({ status: false, msg: "Address should not be undefined" })
            return
        }
        if (!isValid(address.shipping)){
            res.status(400).send({ status: false, msg: "Shipping Address is mandatory" })
            return
        }
        if (!isValid(address.shipping.street)){
            res.status(400).send({ status: false, msg: "Shipping street is mandatory" })
            return
        }
        if (!isValid(address.shipping.city)){
            res.status(400).send({ status: false, msg: "Shipping city is mandatory" })
            return
        }
        if (!isValid(address.shipping.pincode)){
            res.status(400).send({ status: false, msg: "Shipping Pincode is mandatory" })
            return
        }
        if (!/^[1-9]{1}[0-9]{5}$/.test(address.shipping.pincode)){
            res.status(400).send({ status: false, msg: "Pincode is of 6 digits and does not start with 0" })
            return
        }
        if (!isValid(address.billing)){
            res.status(400).send({ status: false, msg: "Billing Address is mandatory" })
            return
        }
        if (!isValid(address.billing.street)){
            res.status(400).send({ status: false, msg: "Billing street is mandatory" })
            return
        }
        if (!isValid(address.billing.city)){
            res.status(400).send({ status: false, msg: "Billing city is mandatory" })
            return
        }
        if (!isValid(address.billing.pincode)){
            res.status(400).send({ status: false, msg: "Billing pincode is mandatory" })
            return
        }
        if (!/^[1-9]{1}[0-9]{5}$/.test(address.billing.pincode)){
            res.status(400).send({ status: false, msg: "Pincode is of 6 digits and does not start with 0" })
            return
        }
        let userUpdatedData = await userModel.findOne({ _id: userId, isDeleted: false  })

        if (!isValid(userUpdatedData)){
            res.status(400).send({ status: false, msg: "No user data found with this userId"})
            return
        }
        else{
            let updateDetails = await userModel.findByIdAndUpdate({_id: userId}, data, { new: true })
            // let updateDetails = await userModel.find({_id: userId})
            res.status(200).send({ status: true, msg: "Data updated Successfully", data: updateDetails })
            return
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({ msg: error.message });
    }
};


// ----------------------------------------------------------------------------------------------- //
// Exports


module.exports.createUser = createUser;
module.exports.loginUser = loginUser;
module.exports.getUserProfile = getUserProfile;
module.exports.updatedData = updatedData;