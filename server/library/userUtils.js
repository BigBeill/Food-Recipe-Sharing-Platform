const User = require('../models/user');
const Friendship = require('../models/joinTables/friendship');
const FriendRequest = require('../models/joinTables/friendRequest');

/*
verifies that the object passed is a complete userObject
minimum expected input:
user: {
   _id: mongoose.Schema.Types.ObjectId,
}
optional input:
user.relationship.target: mongoose.Schema.Types.ObjectId - if you want a relationship field to be added to the user object
insideDatabase: boolean (default: true) - if false, function will not check the database for missing fields or require _id
*/
async function verifyObject (user, insideDatabase = true) {
   console.log("function called: " + "\x1b[36m%s\x1b[0m", "server/library/userUtils.verifyObject");

   let userObject = {}; 
   // set userObject to the user passed in params
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

   if (invalidFields.length != 0) {  
      if (!insideDatabase) { throw new Error('missing fields in user object: ' + invalidFields.join(', ')); } // return error if insideDatabase is false

      // search the database for any missing fields
      try {
         const updatedUser = await User.findOne({ _id: user._id }, invalidFields.join(' '));
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
   }

   if (!user.relationship) {
      // return the user object with all fields filled in
      return {
         _id: userObject._id,
         username: userObject.username,
         email: userObject.email,
         bio: userObject.bio,
      }
   }

   if (!insideDatabase) { throw new Error('no relationship field should exist for userObject not inside the database'); }
   if (!userObject.relationship.target) { throw new Error('relationship field passed, but no target was given'); }
   if (!userObject.relationship._id || !userObject.relationship.type) { userObject = await attachRelationshipField(userObject, userObject.relationship.target); }

   return {
      _id: userObject._id,
      username: userObject.username,
      email: userObject.email,
      bio: userObject.bio,
      relationship: {
         _id: userObject.relationship._id,
         target: userObject.relationship.target,
         type: userObject.relationship.type
      }
   }
}



/*
attaches a relationship field to the user object provided
minimum expected input:
user: {
   _id: mongoose.Schema.Types.ObjectId,
}
optional input:
   targetId: mongoose.Schema.Types.ObjectId - the id of the user to check the relationship with

if no targetId is provided, the function will return a relationship field of { _id: "0", target: "0", type: 0}

*/
async function attachRelationshipField (user, targetId) {
   console.log("function called: " + "\x1b[36m%s\x1b[0m", "server/library/userUtils.getRelationship");

   // make sure both userId and targetId are provided
   if (!user || !user._id) { throw new Error('no user was provided to attachRelationshipFiled'); }
   if (!targetId) { return { ...user, relationship: { _id: "0", target: "0", type: 0 } }; } // no targetId provided

   // make sure user and target are not the same
   if (user._id == targetId) { return { ...user, relationship: { _id: 0, target: targetId, type: 4 } }; }

   try {
      let relationship;

      // check if users are friends
      relationship = await Friendship.findOne({ friendIds: { $all: [user._id, targetId] } });
      if (relationship) { return { ...user, relationship: { _id: relationship._id, target: targetId,  type: 1 } }; }

      // check if friend request has been received
      relationship = await FriendRequest.findOne({ senderId: targetId, receiverId: user._id });
      if (relationship) { return {...user, relationship: { _id: relationship._id, target: targetId, type: 2 } }; }

      // check if friend request has been sent
      relationship = await FriendRequest.findOne({ senderId: user._id, receiverId: targetId });
      if (relationship) { return { ...user, relationship: { _id: relationship._id, target: targetId, type: 3 } };}

      return { ...user, relationship: { _id: 0, target: targetId, type: 0 } }; // no relationship found
   }
   catch (error) {
      console.log("filed to get relationship between user:", user, "and target:", targetId);
      console.error(error);
      throw new Error('failed to find relationship between users');
   }
}

module.exports = {
   verifyObject,
   attachRelationshipField
}