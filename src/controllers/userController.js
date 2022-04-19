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

const createUser = async function (req, res) {
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
        if (!isValid(fName)) {
            res.status(400).send({ status: false, msg: "First name is mandatory" })
            return
        }
        if (!isValid(lName)) {
            res.status(400).send({ status: false, msg: "Last name is mandatory" })
            return
        }
        if (!isValid(email)) {
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
        if (!isValid(password)) {
            res.status(400).send({ status: false, msg: "Password is mandatory" })
            return
        }

        const salt = await bcrypt.genSalt(10);
        data.password = await bcrypt.hash(data.password, salt);
        // data.password = await bcrypt.compare(data.password, hash);

        if (!isValid(password > 8 || password < 15)) {
            res.status(400).send({ status: false, msg: "Password range should be between 8 to 15" })
            return
        }
        if (!isValid(phone)) {
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
        if (!isValid(address)) {
            res.status(400).send({ status: false, msg: "Address is mandatory" })
            return
        }
        if (!isValid(address.shipping)) {
            res.status(400).send({ status: false, msg: "Shipping Address is mandatory" })
            return
        }
        if (!isValid(address.shipping.street)) {
            res.status(400).send({ status: false, msg: "Shipping Street is mandatory" })
            return
        }
        if (!isValid(address.shipping.city)) {
            res.status(400).send({ status: false, msg: "Shippping City is mandatory" })
            return
        }
        if (!isValid(address.shipping.pincode)) {
            res.status(400).send({ status: false, msg: "Shipping Pincode is mandatory" })
            return
        }
        if (!/^[1-9]{1}[0-9]{5}$/.test(address.shipping.pincode)) {
            res.status(400).send({ status: false, msg: "Pincode is of 6 digits and does not start with 0" })
            return
        }
        if (!isValid(address.billing)) {
            res.status(400).send({ status: false, msg: "Billing Address is mandatory" })
            return
        }
        if (!isValid(address.billing.street)) {
            res.status(400).send({ status: false, msg: "Billing Street is mandatory" })
            return
        }
        if (!isValid(address.billing.city)) {
            res.status(400).send({ status: false, msg: "Billing city is mandatory" })
            return
        }
        if (!isValid(address.billing.pincode)) {
            res.status(400).send({ status: false, msg: "Billing Pincode is mandatory" })
            return
        }
        if (!/^[1-9]{1}[0-9]{5}$/.test(address.billing.pincode)) {
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
        res.status(500).send({ msg: error.message });
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

        bcrypt.compare(password, userDetails.password, function (err, result) {
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

const getUserProfile = async function (req, res) {
    try {
        let userId = req.params.userId;

        if (!isValid(userId.trim().length == 0)) {
            res.status(400).send({ status: false, msg: "UserId is required" })
            return
        }
        if (!isValidObjectId(userId)) {
            res.status(404).send({ status: false, msg: "Invalid UserId" })
            return
        }

        let profileData = await userModel.findById({ _id: userId })
        if (!isValid(profileData)) {
            res.status(400).send({ status: false, msg: "There is no user with this userId" })
            return
        } else {
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

const updatedData = async (req, res) => {
    try {
        let data = req.body
        const profileImage = req.files
        let userId = req.params.userId
        let { fName, lName, email, phone, password, address } = data

        if (!profileImage && !Object.keys(data).length > 0) return res.status(400).send({ status: false, message: "Please Provide Some data to update" })

        if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
            res.status(400).send({ status: false, message: "please provide valid UserId" });
            return
        }


        if (profileImage) {
            if (profileImage && profileImage.length > 0) {
                profileImageUrl = await aws.uploadFile(profileImage[0])
                data.profileImage = profileImageUrl;
            }
        }


        if (!isValid(fName)) {
            res.status(400).send({ status: false, message: "First name can't be empty" })
            return
        }
        if (!isValid(lName)) {
            res.status(400).send({ status: false, message: "last name can't be empty" })
            return
        }
        if (!isValid(email)) {
            res.status(400).send({ status: false, message: "Email Id can't be empty" })
            return
        }
        if (!isValid(phone)) {
            res.status(400).send({ status: false, message: "Mobile No. can't be empty" })
            return
        }
        if (!isValid(password)) {
            res.status(400).send({ status: false, message: "Password can't be empty" })
            return
        }

        if (address && Object.keys(address).length === 0) {
            return res.status(400).send({ status: false, message: "Address can't be empty" });
        }

        if (typeof address != 'undefined') {
            let { shipping, billing } = address

            if (shipping) {
                let { street, city, pincode } = shipping
                if (!isValid(street)) {
                    res.status(400).send({ status: false, message: "Shipping Street name can't be empty" })
                    return
                }
                if (!isValid(city)) {
                    res.status(400).send({ status: false, message: "Shipping City name can't be empty" })
                    return
                }
                if (!isValid(pincode)) {
                    res.status(400).send({ status: false, message: "Shipping pincode can't be empty" })
                    return
                }
            }

            if (billing) {
                let { street, city, pincode } = billing
                if (!isValid(street)) {
                    res.status(400).send({ status: false, message: "billing Street name can't be empty" })
                    return
                }
                if (!isValid(city)) {
                    res.status(400).send({ status: false, message: "billing City name can't be empty" })
                    return
                }
                if (!isValid(pincode)) {
                    res.status(400).send({ status: false, message: "billing Pincode can't be empty" })
                    return
                }
            }
        }


        if (data.email && !(/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email))) {
            res.status(400).send({ status: false, message: 'please provide valid Email ID' })
            return
        }
        if (data.password && !(/^[a-zA-Z0-9!@#$%^&*]{8,15}$/.test(password))) {
            res.status(400).send({ status: false, message: 'please provide valid password(minLength=8 , maxLength=15)' })
            return
        }
        if (data.phone && !(/^\+?([6-9]{1})\)?[-. ]?([0-9]{4})[-. ]?([0-9]{5})$/.test(phone))) {
            res.status(400).send({ status: false, message: 'please provide valid Mobile no.' })
            return
        }
        if (password) {
            const salt = bcrypt.genSaltSync(10);
            const encryptedPass = await bcrypt.hash(password, salt);
            password = encryptedPass
        }

        const isUserIdPresent = await userModel.findOne({ _id: userId })
        if (!isUserIdPresent) {
            return res.status(404).send({ status: false, message: "User not found with this userId" })
        }

        const isEmailPresent = await userModel.findOne({ email: email })
        if (isEmailPresent) {
            return res.status(400).send({ status: false, message: "This email is already present you can't upadate it" })
        }
        const isPhonePresent = await userModel.findOne({ phone: phone })
        if (isPhonePresent) {
            return res.status(400).send({ status: false, message: "This Mobile No. is already present you can't upadate it" })
        }

        if (req.userId != isUserIdPresent._id) {
            res.status(401).send({ status: false, message: "You are not authorized to update" })
            return
        }

        let userData = await userModel.findByIdAndUpdate(userId, data, { new: true })
        return res.status(200).send({ status: true, message: "User profile updated", data: userData });


    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}


// ----------------------------------------------------------------------------------------------- //
// Exports


module.exports.createUser = createUser;
module.exports.loginUser = loginUser;
module.exports.getUserProfile = getUserProfile;
module.exports.updatedData = updatedData;