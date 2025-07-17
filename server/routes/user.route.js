const router = require("express").Router();
const userController = require("../controllers/user.controller");
const { body, param, query, checkExact } = require("express-validator");
const { runValidation } = require("../library/sanitationUtils");



/*
------------ /getObject route ------------

Type:
   GET - return a userObject from the database

Expects 2 arguments from params:
   userId: mongoose object id (optional)
   relationship: boolean (optional, default false)

Route Description:
   - Gets a userObject based on userId provided
   - If userId is not provided, get the userObject associated with the current signed in user
   - If {relationship} is true, attach the relationship field to the userObject
   - Reminder: the relationship field represents how the userObject feels about the current user

Returns:
   - 200 userObject returned
   - 400 invalid arguments
   - 401 userId and access token missing or relationship was requested without an access token

payload: userObject
*/
router.get("/getObject/:userId?/:relationship?",
   [
      param("userId").optional().isString().isLength({ min: 24, max: 24 }).withMessage("userId must be a string of 24 characters"),
      param("relationship").optional().isBoolean().withMessage("relationship must be a boolean"),
      checkExact()
   ],
   runValidation,
   userController.getObject
);



/*
---------- /find route ------------

Type:
   GET - return a list of users from the database

Expects 6 arguments from query:
   username: string (optional)
   email: string (optional)
   limit: number (optional, default 6)
   skip: number (optional, default 0)
   category: "friends" | "requests" | "all" (optional, default "all")
   count: boolean (optional, default false)

Route description:
   - Collects a list of all users in the database that contain {username} and {email}
   - If category field exists, only include userObjects that the current user has the given relationship with
   - Skip over the first {skip} number of results found
   - Limit the list size to the {limit} number of objects
   - Return the list to the client
   - If {count} is true, return the total number of items matching search criteria alongside count

Returns: 
   - 200 userObject array returned
   - 400 missing or invalid arguments
   - 401 relationship filed exists but no access token found

payload: {
   userObjectArray: userObject[]
   count: number
}
*/
router.get("/find",
   [
      query("username").optional().isString().isLength({ min: 3, max: 60 }).withMessage("username must be a string between 3 and 60 characters"),
      query("email").optional().isString().isEmail().withMessage("email must be a valid email address"),
      query("limit").optional().isInt({ min: 1, max: 90 }).toInt().withMessage("limit must be an integer between 1 and 90"),
      query("skip").optional().isInt({ min: 0, max: 900 }).toInt().withMessage("skip must be an integer between 0 and 900"),
      query("category").optional().isIn(["friends", "requests", "all"]).withMessage("category must be one of: friends, requests, all, any"),
      query("count").optional().isBoolean().withMessage("count must be a boolean"),
      checkExact()
   ],
   runValidation,
   userController.find
);






/*
---------- /folder route ------------

Type: 
   GET - return a list of folders from the database

Expects 4 arguments from query:
   folderId: mongoose object id (optional)
   skip: number (optional, default 0)
   limit: number (optional, default 6)
   count: boolean (optional, default false)

Route description:
   - If folderId does not exits, Collects a list of all folders owned by the current user
   - If folderId field exists, Collect a list of all folders that have {folderId} in the parent folder field
   - Skip the first {skip} number of folderObjects
   - Limit the list to the {limit} number of folders
   - Return list to client
   - If count is true, return the number of folderObjects that meet search criteria

Returns:
   - 200 folderObject array returned
   - 400 invalid arguments
   - 401 access token could not be found

payload: {
   folderObjectArray: folderObject[]
   count: number
}
*/
router.get("/folder",
   [
      query("skip").optional().isInt({ min: 0, max: 900 }).toInt().withMessage("skip must be an integer between 3 and 900"),
      query("limit").optional().isInt({ min: 1, max: 90 }).toInt().withMessage("limit must be an integer between 3 and 90"),
      query("folderId").optional().isString().isLength({ min: 24, max: 24 }).withMessage("folderId must be a string of 24 characters"),
      query("count").optional().isBoolean().withMessage("count must be a boolean"),
      checkExact()
   ],
   runValidation,
   userController.folder
);








/*
---------- /updateAccount route ------------

Type:
   POST - change the userObject saved in the database for current user

Expects 3 arguments from body:
   username: string
   email: string
   bio: string (optional)

Route description:
   - Make sure the username or email doesn't already exist in database
   - Update usersObject associated with the signed in user inside the database

Returns:
   - 200 userObject associated with signed in user has been updated
   - 400 missing or invalid arguments
   - 401 access token could not be found
*/
router.post("/updateAccount", 
   [
      body("username").isString().isLength({ min: 3, max: 60 }).withMessage("Username must be a string between 3 and 60 characters"),
      body("email").isString().isEmail().withMessage("Email must be a valid email address"),
      body("bio").isString().withMessage("Bio must be a string"),
      checkExact()
   ],
   runValidation,
   userController.updateAccount
);

/*
---------- /sendFriendRequest route ------------

Type:
   POST - creates a friend request in server database

Expects 1 arguments from body:
   targetId: mongoose object id

Route description:
   creates a friend request in the database, setting the current user as the sender and the {targetId} as the target of the friend request

Returns:
   - 201 friendRequestObject created and saved in the database
   - 400 missing or invalid arguments
   - 401 access token could not be found
   - 409 friendRequestObject or friendshipObject already exists in the database

payload: friendRequestObject
*/
router.post("/sendFriendRequest", 
   [
      body("targetId").isString().isLength({ min: 24, max: 24 }).withMessage("userId must be a string of 24 characters"),
      checkExact()
   ],
   runValidation,
   userController.sendFriendRequest
);

/*
---------- /processFriendRequest route ------------

Type:
   POST - logs user out

Expects 2 arguments from body:
   requestId: mongoose object id
   accept: boolean

Route description:
   - Checks the validity of the friend request
   - If accept is true, create a friendship object between the sender and receiver of the request
   - If accept is false, delete the friend request from the database

Returns:
   - 201 friendRequestObject has been deleted and friendObject has been created in the database
   - 204 friendRequestObject has been deleted from the database
   - 400 missing or invalid arguments
   - 401 client did not provide a valid access token
   - 403 client does not have write access to the friendRequestObject
   - 404 requestId not found in database
   - 409 the approved friendship already exists in the database

payload: friendshipObject
*/
router.post("/processFriendRequest", 
   [
      body("requestId").isString().isLength({ min: 24, max: 24 }).withMessage("requestId field must be a string of 24 characters"),
      body("accept").isBoolean().withMessage("accept field must be a boolean"),
      checkExact()
   ],
   runValidation,
   userController.processFriendRequest
);




/*
---------- /deleteFriend route ------------

Type:
   POST - deletes a friendship object from the database

Expects 1 argument from body:
   relationshipId: mongoose object id

Route description:
   - Deletes the friendship object from the database

Return:
   - 204 friendshipObject removed from databases
   - 400 missing or invalid arguments
   - 401 client did not provide a valid access token
   - 403 client doesn't have write access to the friendship object
*/
router.post("/deleteFriend", 
   [
      body("relationshipId").isString().isLength({ min: 24, max: 24 }).withMessage("relationshipId must be a string of 24 characters"),
      checkExact()
   ],
   runValidation,
   userController.deleteFriend
);

module.exports = router;
