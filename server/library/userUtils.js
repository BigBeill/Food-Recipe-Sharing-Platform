const users = require('../models/user');
const friendships = require('../models/joinTables/friendship');
const friendRequest = require('../models/joinTables/friendRequest');

/*
verifies that the object passed is a complete userObject
minimum expected input:
user: {
   _id: mongoose.Schema.Types.ObjectId,
}
optional input:
insideDatabase: boolean (default: true) - if false, function will not check the database for missing fields or require _id
*/
async function verifyObject (user, insideDatabase = true) {
   console.log("function called: " + "\x1b[36m%s\x1b[0m", "server/library/userUtils.verifyObject");

   let userObject = {};
   // set userObject to the user passed
   if (user.toObject) { userObject = user.toObject(); }
   else { userObject = user; }

   if (insideDatabase && !userObject._id) { throw new Error('missing user _id'); }

   function checkInvalidFields() {
      let found = [];
      if (!userObject.username || typeof userObject.username != 'string') { found.push('username'); }
      if (!userObject.email || typeof userObject.email != 'string') { found.push('email'); }
      if (!userObject.bio || typeof userObject.bio != 'string') { found.push('bio'); }
      return found;
   }

   // check for any missing fields in the user object
   let invalidFields = checkInvalidFields();

   if (invalidFields.length == 0) { return userObject; } // no missing fields return object
   if (!insideDatabase) { throw new Error('missing fields in user object: ' + invalidFields.join(', ')); } // return error if insideDatabase is false

   // search the database for any missing fields
   try {
      const updatedUser = await users.findOne({ _id: user._id }, invalidFields.join(' '));
      if (!updatedUser) { throw new Error('user not found in database'); }
      invalidFields.forEach((field) => { userObject[field] = updatedUser[field]; });
   }
   catch (error) {
      console.log("failed to search database for missing fields belonging to user:", user);
      console.error(error);
      throw new Error('failed to search database for missing fields');
   }

   invalidFields = checkInvalidFields(); // check for any missing fields again after searching the database
   if (invalidFields.length > 0) {
      console.log("missing fields in user object: " + invalidFields.join(', '));
      throw new Error('missing fields in user object: ' + invalidFields.join(', '));
   }

   return userObject; // return the user object with all fields filled in
}

async function getRelationship (userId, targetId) {
   console.log("function called: " + "\x1b[36m%s\x1b[0m", "server/library/userUtils.getRelationship");

   // make sure user and target are not the same
   if (userId == targetId) { return { _id: 0, target: targetId, type: 4 } }

   let relationship;

   try {
      let relationship;

      // check if users are friends
      relationship = await friendships.findOne({ friendIds: { $all: [user, target] } });
      if (relationship) { return { _id: relationship._id, target: targetId,  type: 1 } }

      // check if friend request has been received
      relationship = await friendRequest.findOne({ senderId: target, receiverId: user });
      if (relationship) { return resolve({ type: 2, _id: relationship._id }); }

      // check if friend request has been sent
      relationship = await friendRequest.findOne({ senderId: user, receiverId: target });
      if (relationship) { return resolve({ type: 3, _id: relationship._id }); }

      return { _id: 0, target: targetId, type: 0 }; // no relationship found
   }
   catch (error) {
      console.log("filed to get relationship between user:", user, "and target:", target);
      console.error(error);
      throw new Error('failed to find relationship between users');
   }
}

module.exports = {
   verifyObject,
   getRelationship
}