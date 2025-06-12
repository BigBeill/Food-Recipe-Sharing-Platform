// router for managing authentication related
const router = require("express").Router();
const authenticationController = require("../controllers/authentication.controller");
const { body, checkExact } = require("express-validator");
const { runValidation } = require("../library/sanitationUtils");






/*
---------- /register route ------------

Type:
   POST - registers a new user

Requires 3 arguments from body:
   username: string
   email: string
   password: string

Route description:
   checks database for any data already being used by another account
   encrypt password
   create user profile and save in database
   create json cookies
   send json cookies to client
*/
router.post("/register",
   [
      body("username").isString().isLength({ min: 3, max: 60 }).withMessage("Username must be a string between 3 and 60 characters"),
      body("email").isString().isEmail().withMessage("Email must be a valid email address"),
      body("password").isString().isLength({ min: 3, max: 60 }).withMessage("Password must be a string between 3 and 60 characters"),
      checkExact(),
   ],
   runValidation,
   authenticationController.register
);






/*
---------- /login route ------------

Type:
   POST - logs user in

Requires 3 arguments from body:
   username: string
   password: string
   rememberMe: boolean

Route description:
   get user data from database
   encrypt password and compare to database
   return json web token to client if valid password
   set cookies max age if rememberMe is true
*/
router.post("/login", 
   [
      body("username").isString().isLength({ min: 3, max: 60 }).withMessage("Username must be a string between 3 and 60 characters"),
      body("password").isString().isLength({ min: 3, max: 60 }).withMessage("Password must be a string between 3 and 60 characters"),
      body("rememberMe").isBoolean().withMessage("Remember must be a boolean value"),
      checkExact(),
   ],
   runValidation,
   authenticationController.login
);






/*
---------- /refresh route ------------

Type: 
   POST - gets a new user token

Requires 0 arguments from body

Route description:
   check validity of refresh tokens saved in cookies
   create and send new user token to client
*/
router.post("/refresh", 
   [
      checkExact(),
   ],
   runValidation,
   authenticationController.refresh
);






/*
---------- /logout route ------------

Type:
   POST - logs user out

Requires 0 arguments from body

Route description:
   removes cookies from clients local storage
*/
router.post("/logout",
   [
      checkExact(),
   ],
   runValidation,
   authenticationController.logout
);






module.exports = router;