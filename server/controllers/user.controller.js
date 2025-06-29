const FriendRequest = require("../models/joinTables/friendRequest");
const Friendship = require("../models/joinTables/friendship");
const FriendFolder = require("../models/friendFolder");
const User = require("../models/user");
const userUtils = require('../library/userUtils');
require("dotenv").config();



/*
returns a complete userObject depending on the parameters provided in the request
@route: GET /user/getObject/:userId?/:relationship?
*/
exports.getObject = async (req, res) => {
   // get necessary data from request
   const _id = req.user?._id;
   const { userId = _id, relationship = false } = req.params;
   if (!userId) { return res.status(401).json({ error: "no user signed in and missing userId field in params" }); }

   try {

      let userData = await User.findOne({ _id: userId });
      if (!userData) { return res.status(400).json({ error: "user not found in database" }); }
      userData = userData.toObject(); // convert userData to a plain object

      // attach current user as target if relationship is true
      if (relationship) { userData.relationship = {target: _id}; }

      // create userObject from data in database
      const userObject = await userUtils.verifyObject(userData, true);
      return res.status(200).json({ message: "user data collected successfully", payload: userObject });
   }
   catch(error){
      console.log("\x1b[31m%s\x1b[0m", "user.controller.getObject failed... unable to create user object");
      console.error(error);
      return res.status(500).json({ error: "server failed to get user data" });
   }

   
}



/*
returns a userObject array containing all the users in the database that match the query parameters
@route: GET /user/find
*/
exports.find = async (req, res) => {

   // define variables for the request
   const _id = req.user?._id;
   const { username, email, limit, skip, relationship, count } = req.query;

   // make sure no required fields are missing
   if (relationship != 0 && !_id) { return res.status(401).json({ error: "user not signed in" }); };

   let userList = []; // create empty array to hold user objects
   let query = {}; // create query for searching the database with required user fields
   try {

      // add username and email fields to query if provided
      if (username) query.username = { $regex: new RegExp(username, 'i') };
      if (email) query.email = { $regex: new RegExp(email, 'i') };

      if (relationship == 1) {
         // collect a list of friendship relationships user is involved in
         const friendshipList = await Friendship.find({ friendIds: _id });
         // extract the _ids of each non-signed in user
         const friendsList = friendshipList.map((friendship) => friendship.friendIds.filter((friend) => friend != _id) );
         // add the _ids to the query
         query._id = { $in: friendsList };
      }

      else if (relationship == 2) {
         // collect a list of friend requests user has received
         const receivedRequests = await FriendRequest.find({ receiverId: _id });
         // extract the _ids of each non-signed in user
         const requestList = receivedRequests.map((request) => request.senderId);
         // add the _ids to the query
         query._id = { $in: requestList };
      }

      else if (relationship == 3) {
         // collect a list of friend requests user has sent
         const sentRequests = await FriendRequest.find({ senderId: _id });
         // extract the _ids of each non-signed in user
         const requestList = sentRequests.map((request) => request.receiverId);
         // add the _ids to the query
         query._id = { $in: requestList };
      }

      // use query to find users in database
      userList = await User.find(query)
      .skip(skip)
      .limit(limit);
   }
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "user.controller.find failed... unable to find users in database");
      console.error(error);
      return res.status(500).json({ error: "server failed to find users in database" });
   }


   try {
      const userObjectList = await Promise.all( userList.map( async (user) => {
         userData = user.toObject();
         userData.relationship = { target: _id };
         const userObject = await userUtils.verifyObject(userData, true);
         return userObject;
      }));

      let payload = {userObjectList: userObjectList};

      // attach count if requested by the client
      if (count) {
         const totalCount = await User.countDocuments(query);
         payload.count = totalCount;
      }

      return res.status(200).json({message: "List of users collected successfully", payload})
   }
   catch (error){
      console.log("\x1b[31m%s\x1b[0m", "user.controller.find failed... unable confirm complete user objects before returning to client");
      console.error(error);
      return res.status(500).json({ error: "server failed to find users with provided parameters" });
   }
}



/*
returns a folderObject array containing all the folders in the database that match the query parameters
@route: GET /user/folder
*/
exports.folder = async (req, res) => {
   // make sure user is signed in
   if (!req.user) return res.status(401).json({ error: "user not signed in" });

   const _id = req.user._id;
   const { folderId, count, limit, skip } = req.query;

   try {
      let query;
      if (!folderId) { query = { owner: _id, parent: null }; }
      else { query = { owner: _id, parent: folderId }; }

      // find folders in database
      const foldersList = await FriendFolder.find(query)
      .skip(skip)
      .limit(limit);
      let payload = { folders: foldersList };

      // attach count if requested by the client
      if (count) {
         const totalCount = await FriendFolder.countDocuments(query);
         payload.count = totalCount;
      }

      res.status(200).json({ message: "folders collected successfully", payload });
   }
   catch (error) {
      console.error(error);
      return res.status(500).json({ error: "server failed to find folders" });
   }
}



/*
updates the information inside database for the signed in user
@route: POST /user/updateAccount
*/
exports.updateAccount = async (req, res) => {
   if (!req.user) { return res.status(401).json({ error: "user not signed in" }); }

   const { username, email, bio } = req.body;

   // check for any missing fields in the request
   if (!username) return res.status(400).json({error: 'missing username filed provided in body'});
   if (!email) return res.status(400).json({error: 'missing email field provided in body'});

   try{
      //make sure username or email isn't already taken
      const foundUsername = await User.findOne({ username: new RegExp(`^${username}$`, 'i') });
      if (foundUsername && foundUsername._id != req.user._id) { return res.status(400).json({ error: "username already taken" }); }
      const foundEmail = await User.findOne({ email: new RegExp(`^${email}$`, 'i') }) 
      if (foundEmail && foundEmail._id != req.user._id) { return res.status(400).json({ error: "email already taken" }); }

      // save user to database
      await users.updateOne(
         { _id: req.user._id },
         { $set: {
            email: email,
            username: username,
            bio: bio,
         }, }
      );

      return res.status(200).json({ message: "account registered successfully" });
   }

   // handle any errors caused by the controller
   catch(error){
      console.error(error);
      return res.status(500).json({ error: "server failed to update user account" });
   }
}



/*
creates a friend request object in the database between the signed in user and the userId provided in the request body
@route: POST /user/sendFriendRequest
*/
exports.sendFriendRequest = async (req, res) => {
   // make sure user is signed in
   if (!req.user) return res.status(401).json({ error: "user not signed in" });

   const userId = req.user._id;
   const { receiverId } = req.body;

   // find receiver in the database
   try {
      const receiverData = await User.findOne({ _id: receiverId });
      if (!receiverData) { return res.status(404).json({ error: "user receiving friend request not found" }); }
   }
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "user.controller.sendFriendRequest failed... unable to find receiver in database");
      console.error(error);
      return res.status(500).json({ error: "server failed to find user receiving friend request" });
   }

   // check if friend request or friendship already exist inside the database
   try {
      const sentRequest = await FriendRequest.findOne({ senderId: userId, receiverId: receiverId });
      if (sentRequest) return res.status(409).json({ error: "friend request already sent to this user" });

      const receivedRequest = await FriendRequest.findOne({ senderId: receiverId, receiverId: userId });
      if (receivedRequest) return res.status(409).json({ error: "friend request already received from this user" });

      // make sure friendship doesn't already exist in database
      const existingFriendship = await Friendship.findOne({ friendIds: { $all: [receiverId, userId] } });
      if (existingFriendship) return res.status(409).json({ error: "friendship already created with this user" });
   }
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "user.controller.sendFriendRequest failed... unable to check for existing friend requests or friendships in database");
      console.error(error);
      return res.status(500).json({ error: "server failed to check if friendRequest or friendship already exist" });
   }

   // create the friend request and save to the database
   try {
      const newRequest = { senderId: userId, receiverId: receiverId };
      const friendship = await new FriendRequest(newRequest)
      .save();

      return res.status(201).json({ message: "friend request sent", payload: friendship });
   }
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "user.controller.sendFriendRequest failed... unable to create friend request in database");
      console.error(error);
      return res.status(500).json({ error: "server failed to create friend request inside the database" });
   }
}



/*
Removes a friend request from the database and creates a friendshipObject if the request is accepted
@route: POST /user/processFriendRequest
*/
exports.processFriendRequest = async (req, res) => {
   // make sure user is signed in
   if (!req.user) return res.status(401).json({ error: "no valid access token provided" });

   const userId = req.user._id;
   const { requestId, accept } = req.body;

   let friendRequestData;

   // find fiend request in the database
   try {
      friendRequestData = await FriendRequest.findOne({ _id: requestId });
      if (!friendRequestData) { return res.status(404).json({ error: "friend request not found in database" }); }      
   }
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "user.controller.processFriendRequest failed... unable to find friend request in database");
      console.error(error);
      return res.status(500).json({ error: "server failed to find friend request in database" });
   }

   // instructions for accepting the friend request
   try {
      if (accept) { 
         if (friendRequestData.receiverId != userId) { return res.status(403).json({ error: "current user is not the receiver of this request" }); }
         const existingFriendship = await Friendship.findOne({ friendIds: { $all: [friendRequestData.senderId, userId] } });

         if (existingFriendship) {
            // delete friend request from database and return an error message
            await FriendRequest.deleteOne({ _id: requestId });
            return res.status(409),json({ error: "friendship already exists inside the database" }); 
         }

         // add friendship to the database
         const newFriendship = await new Friendship({ friendIds: [friendRequestData.senderId, userId] })
         .save();
         
         // delete friend request from database
         await FriendRequest.deleteOne({ _id: requestId });

         return res.status(201).json({ message: "friendship  created successfully", payload: newFriendship });
      }
   }
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "user.controller.processFriendRequest failed... unable to approve friend request");
      console.error(error);
      return res.status(500).json({ error: "server failed to approve friend request" });
   }

   // instructions for denying or canceling the friend request
   try {
      // check if the client has write access to the friend request
      if (friendRequestData.senderId != userId && friendRequestData.receiverId != userId) { return res.status(403).json({ error: "current user does not have write access to this request" }); }

      // delete friend request from database
      await FriendRequest.deleteOne({ _id: requestId });

      return res.status(204).json({ message: "friendRequest removed from the database" });
   }
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "user.controller.processFriendRequest failed... unable to remove friend request from database");
      console.error(error);
      return res.status(500).json({ error: "server failed to remove friend request from the database" });
   }
}



/*
removes a friendshipObject from the database
@route: POST /user/deleteFriend
*/
exports.deleteFriend = async (req, res) => {

   // make sure user is signed in
   if (!req.user) { return res.status(401).json({ error: "user not signed in" }); }

   const userId = req.user._id;
   const { relationshipId } = req.body;

   // check for any missing fields in the request
   if (!relationshipId) return res.status(400).json({ error: 'missing relationshipId field in body' });

   try {
      // find friendship in the database
      const friendship = await Friendship.findOne({ _id: relationshipId });
      if (!friendship) { return res.status(400).json({ error: "friendship not found in database" }); }

      // check if client has write access to the friendship
      if (!friendship.friendIds.includes(userId)) { return res.status(403).json({ error: "client does not have write access to this friendship" }); }

      // delete friendship from database
      await Friendship.deleteOne({ _id: relationshipId });
      return res.status(204).json({ message: "friendship deleted successfully" });
   }

   // handle any errors caused by the controller
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "user.controller.deleteFriend failed... unable to delete friendship from database");
      console.error(error);
      return res.status(500).json({ error: "server failed to delete friendship" });
   }
}