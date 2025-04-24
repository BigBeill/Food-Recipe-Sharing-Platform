const router = require("express").Router();

const user = require("../models/user");
const { encryptPassword } = require("../library/passwordUtils");
const refreshToken = require("../models/refreshToken");
const friendship = require("../models/joinTables/friendship");
const friendRequest = require("../models/joinTables/friendRequest");
const friendFolder = require("../models/friendFolder");
const { presetUsers, presetFriendRequests, presetFriends } = require("../testingSampleData/sampleUsers");

require("dotenv").config();






router.put("/resetUsers", async (req, res) => {

   // delete all user related data from the database (users, refreshTokens, friendships, friendRequests, folders)
   try { 
      await user.deleteMany({})
      await refreshToken.deleteMany({})
      await friendship.deleteMany({})
      await friendRequest.deleteMany({})
      await friendFolder.deleteMany({})
   }
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "admin.router.resetUsers failed... unable to remove all user data from database");
      console.error(error);
      return res.status(500).json({ error: "server failed to delete all data around users"})
   }
   
   // fill database with preset users
   try {
      for (const userData of presetUsers) {
         const encryptedPassword = encryptPassword(userData.password);
         await new user({ username: userData.username, email: userData.email, bio: userData.bio, hash: encryptedPassword.hash, salt: encryptedPassword.salt, })
         .save();
      }
   }
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "admin.router.resetUsers failed... unable to save preset users to database");
      console.error(error);
      return res.status(500).json({ error: "server failed to save preset users" });
   }


   // fill database with preset friendRequests
   try {
      for (const friendRequestData of presetFriendRequests) {
         const senderData = await user.findOne({ username: friendRequestData.sender });
         const receiverData = await user.findOne({ username: friendRequestData.receiver });
         await new friendRequest({ senderId: senderData._id, receiverId: receiverData._id })
         .save();
      }
   }
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "admin.router.resetUsers failed... unable to save preset friendRequests to database");
      console.error(error);
      return res.status(500).json({ error: "server failed to save preset friendRequests" });
   }

   // fill database with preset friends
   try {
      for (const friendData of presetFriends) {
         const user1 = await user.findOne({ username: friendData.users[0] });
         const user2 = await user.findOne({ username: friendData.users[1] });
         await new friendship({ friendIds: [user1._id, user2._id] })
         .save();
      }
   }
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "admin.router.resetUsers failed... unable to save preset friends to database");
      console.error(error);
      return res.status(500).json({ error: "server failed to save preset friends" });
   }

   return res.status(200).json({ message: "users, relationships and refresh tokens reset" });
});



module.exports = router;