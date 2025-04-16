const users = require("../models/user");
const refreshTokens = require("../models/refreshToken");
const passwordUtils = require("../library/passwordUtils");
const { verify } = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const createToken = require("../config/jsonWebToken");
require("dotenv").config();

// the max age of all cookies created by this controller
const cookieAge = 1000 * 60 * 60 * 24 * 30; // 30 days in milliseconds






exports.register = async (req, res) => {

   const inputErrors = validationResult(req);
   if (!inputErrors.isEmpty()) { return res.status(400).json({ error: errors.array() }); }

   const { username, email, password } = req.body;

   try {
      // make sure username and email don't already exist in database
      const searchUsername = await users.findOne({ username: { $regex: `^${username}$`} });
      if (searchUsername) { return res.status(400).json({ error: "username already taken" }); }

      const searchEmail = await users.findOne({ email: { $regex: `^${email}$`} });
      if (searchEmail) { return res.status(400).json({ error: "email already taken" }); }

      // check if given password meets all requirements and encrypt it
      if (!passwordUtils.validPassword(password)) { return res.status(400).json({ error: "password does not meet requirements" }); }
      const hashedPassword = passwordUtils.encryptPassword(password);

      // create user
      const newUser = {
         username,
         email,
         hash: hashedPassword.hash,
         salt: hashedPassword.salt,
      };

      // save new user to database
      const savedUser = await new users(newUser)
      .save();

      // create tokens
      const tokens = createToken(savedUser);

      // save refresh token in database
      await new refreshTokens({ user: savedUser._id, token: tokens.refreshToken })
      .save();

      // send cookies to client
      res.cookie("accessToken", tokens.accessToken, { maxAge: cookieAge });
      res.cookie("refreshToken", tokens.refreshToken, { maxAge: cookieAge });
      return res.status(200).json({ message: "account registered successfully" });
   }

   // handle any errors caused by the controller
   catch (error) {
      console.error(error);
      return res.status(500).json({ error: "server failed to register new user" });
   }
}






exports.login = async (req, res) => {

   const inputErrors = validationResult(req);
   if (!inputErrors.isEmpty()) { return res.status(400).json({ error: errors.array() }); }

   const { username, password } = req.body;

   try {
      // find user in database with provided username
      const user = await users.findOne(
         { username: new RegExp(`^${username}$`, 'i') },
         { _id: 1, username: 1, email: 1, bio: 1, hash: 1, salt: 1 }
      );
      if (!user) return res.status(400).json({ error: "username not found" });

      // check if password is correct
      if (!passwordUtils.correctPassword(password, user.hash, user.salt)) return res.status(400).json({ error: "incorrect password" });

      // create new refresh tokens
      const tokens = createToken(user);

      //save refresh tokens in database
      await new refreshTokens({ user: user._id, token: tokens.refreshToken })
      .save();

      // save tokens as cookies for client
      res.cookie("accessToken", tokens.accessToken, { maxAge: cookieAge });
      res.cookie("refreshToken", tokens.refreshToken, { maxAge: cookieAge });
      return res.status(200).json({ message: "user Signed in" });
   }

   // handle any errors caused by the controller
   catch (error) {
      console.error(error);
      return res.status(500).json({ error: "server failed to login user" });
   }
}






exports.refresh = async (req, res) => {
   const inputErrors = validationResult(req);
   if (!inputErrors.isEmpty()) { return res.status(400).json({ error: errors.array() }); }

   if (!req.cookies) { return res.status(403).json({ error: "no cookies found" }); }
   const refreshToken = req.cookies.refreshToken;
   if (!refreshToken) { return res.status(403).json({ error: "no refresh token found" }); }
   
   try {
      // make sure refresh token exists in database
      const databaseToken = await refreshTokens.findOne({ token: refreshToken });
      if (!databaseToken)
         return res.status(403).json({ error: "invalid refresh token" });
   
      // validate the refresh token and send a new access token
      const validToken = verify(refreshToken, process.env.SESSION_SECRET);
      if (validToken && validToken._id == databaseToken.user) {
         const tokens = createToken({
            _id: validToken._id,
            username: validToken.username,
         });
         res.cookie("accessToken", tokens.accessToken, { maxAge: cookieAge });
         return res.status(200).json({ message: "new access token sent" });
      }
   } 
   catch (error) {
      console.error("error creating new access token:", refreshToken);
      console.error(error);
      return res.status(500).json({ error: "could not create new access token" });
   }
}






exports.logout = async (req, res) => {
   const inputErrors = validationResult(req);
   if (!inputErrors.isEmpty()) { return res.status(400).json({ error: errors.array() }); }
   
   res.clearCookie("accessToken");
   res.clearCookie("refreshToken");
   res.status(200).json({ message: "success" });
}