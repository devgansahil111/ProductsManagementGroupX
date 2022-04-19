//--------------------------------------------------------------------------------------//
// Require Packages


const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");


// ------------------------------------------------------------------------------------------- //
// Validation Format

const isValid = function (value) {
  if (typeof value === "undefined" || value === "null") return false
  if (typeof value === "string" && value.trim().length === 0) return false
  return true;
}


//--------------------------------------------------------------------------------------//
// Authentication


const authentication = async function (req, res, next) {

  try {
    const bearerHeader = req.header('Authorization', 'Bearer Token')

    if (!isValid(bearerHeader)) {
      res.status(400).send({ status: false, msg: "token is required" })
      return
    }
    const bearer = bearerHeader.split(' ');
    const token = bearer[1];
    let decodetoken = jwt.verify(token, "Project-05-Shopping-Cart-Group-36")
    if (!decodetoken) {
      res.status(401).send({ status: false, msg: "please enter the right token" })
      return
    }

    req.userId = decodetoken.userId
    next()
  }
  catch (error) {
    res.status(500).send({ status: false, msg: error.message })
    return
  }
}

// -------------------------------------------------------------------------------------------- //
// Exports

module.exports.authentication = authentication;