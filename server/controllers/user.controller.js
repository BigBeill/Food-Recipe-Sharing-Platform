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
creates a friend request object in the database between the signed in user and the userId provided in the request body
@route: POST /user/sendFriendRequest
*/
exports.sendFriendRequest = async (req, res) => {
   if (!req.user) return res.status(401).json({ error: "user not signed in" });

   const _id = req.user._id;
   const { userId } = req.body;

   // check if user is signed in
   if (!_id) return res.status(401).json({ error: "user not signed in" });

   // check for any missing or invalid fields in the request
   if (!userId) return res.status(400).json({error: 'missing userId field in body'});
   if (userId == _id) return res.status(400).json({ error: "user cannot send friend request to self" });

   try {
      // make sure user exists in database
      const senderData = await User.findOne({ _id });
      if (!senderData) return res.status(400).json({ error: "signed in user not found in database" });

      // make sure receiver exists in database
      const receiverData = await User.findOne({ _id: userId });
      if (!receiverData) return res.status(400).json({ error: "receiver not found" });

      // make sure friend request doesn't already exist in database
      const sentRequest = await FriendRequest.findOne({ senderId: _id, receiverId: userId });
      if (sentRequest) return res.status(400).json({ error: "friend request already sent" });
      const receivedRequest = await FriendRequest.findOne({ senderId: userId, receiverId: _id });
      if (receivedRequest) return res.status(400).json({ error: "friend request already received" });

      // make sure friendship doesn't already exist in database
      const existingFriendship = await Friendship.findOne({ friendIds: { $all: [senderData._id, receiverData._id] } });
      if (existingFriendship) return res.status(400).json({ error: "friendship already exists" });

      // create friend request
      const newRequest = {
         senderId: _id,
         receiverId: userId,
      };

      // save friend request to database
      const friendship = await new FriendRequest(newRequest)
      .save();

      return res.status(200).json({ message: "friend request sent", payload: friendship });
   }

   // handle any errors caused by the controller
   catch (error) {
      console.error(error);
      return res.status(500).json({ error: "server failed to send friend request" });
   }
}



/*
Removes a friend request from the database and creates a friendshipObject if the request is accepted
@route: POST /user/processFriendRequest
*/
exports.processFriendRequest = async (req, res) => {
   if (!req.user) return res.status(401).json({ error: "user not signed in" });

   const _id = req.user._id;
   const { requestId, accept } = req.body;

   // check if user is signed in
   if (!_id) return res.status(401).json({ error: "user not signed in" });

   // check for any missing fields in the request
   if (!requestId) { return res.status(400).json({ error: 'missing sender field in body' }); }
   if (accept === undefined) { return res.status(400).json({ error: 'missing accept field in body' }); }

   try {

      // make sure friend request exists in database
      const requestData = await FriendRequest.findOne({ _id: requestId });
      if (!requestData) { return res.status(400).json({ error: "request not found in database" }); }
      // check if sender is current user
      if (requestData.senderId == _id) {
         if (accept) { return res.status(401).json({ error: "you cant accept a friend request sent by you" }); }
         await FriendRequest.deleteOne({ _id: requestData._id });
         return res.status(200).json({ message: "friend request canceled" });
      }
      // check that current user is the receiver of the request
      if (!requestData.receiverId == _id) { return res.status(401).json({ error: "current user is not the receiver of this request" }); }

      // check if user accepted the friend request
      if (!accept) {
         // delete friend request from database
         await FriendRequest.deleteOne({ _id: requestData._id });
         return res.status(200).json({ message: "friend request denied" });
      }

      // make sure user exists in database
      const receiverData = await User.findOne({ _id });
      if (!receiverData) { return res.status(400).json({ error: "signed in user not found in database" }); }

      // make sure receiver exists in database
      const senderData = await User.findOne({ _id: requestData.senderId });
      if (!senderData) { return res.status(400).json({ error: "request sender not found in database" }); }

      // make sure friendship doesn't already exist in database
      const existingFriendship = await Friendship.findOne({ friends: { $all: [senderData._id, _id] }});
      if (existingFriendship) {
         await FriendRequest.deleteOne({ _id: request });
         return res.status(400).json({ error: "friendship already exists" });
      }

      // delete friend request from database
      await FriendRequest.deleteOne({ _id: requestId });

      // create friendship and save to database
      const newFriendship = await new Friendship({
         friendIds: [senderData._id, _id]
      })
      .save();

      return res.status(200).json({ message: "friend request accepted", payload: newFriendship });
   }

   // handle any errors caused by the controller
   catch (error) {
      console.error(error);
      return res.status(500).json({ error: "server failed to accept friend request" });
   }
}



/*
removes a friendshipObject from the database
@route: POST /user/deleteFriend
*/
exports.deleteFriend = async (req, res) => {
   if (!req.user) return res.status(401).json({ error: "user not signed in" });

   const _id = req.user._id;
   const { relationshipId } = req.body;

   // check if user is signed in
   if (!_id) return res.status(401).json({ error: "user not signed in" });

   // check for any missing fields in the request
   if (!relationshipId) return res.status(400).json({ error: 'missing relationshipId field in body' });

   try {
      // make sure friendship exists in database
      const friendship = await Friendship.findOne({ _id: relationshipId });
      if (!friendship) return res.status(400).json({ error: "friendship not found in database" });

      // make sure user is part of the friendship
      if (!friendship.friendIds.includes(_id)) return res.status(401).json({ error: "user is not part of this friendship" });

      // delete friendship from database
      await Friendship.deleteOne({ _id: relationshipId });
      return res.status(200).json({ message: "friendship deleted successfully" });
   }

   // handle any errors caused by the controller
   catch (error) {
      console.error(error);
      return res.status(500).json({ error: "server failed to delete friendship" });
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