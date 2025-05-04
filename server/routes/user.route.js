const router = require("express").Router();
const userController = require("../controllers/user.controller");
const { body, param, query, checkExact } = require("express-validator");
const { runValidation } = require("../library/sanitationUtils");



/*
------------ /getObject route ------------

requires 0 arguments from query:

optionally accepts 2 argument from query:
    userId: mongoose object id
    relationship: boolean (assumed to be false)

route will:
    returns a complete userObject for userId provided in params
    if no userId is provided, it will return the userObject for the currently logged in user
    if {relationship} is true, it will add a relationship field to the userObject

returns:
    userObject;
    userObject.relationship ( if relationship is true)
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
    GET - get a list of users

Requires 0 arguments from body:

Optionally accepts 5 arguments from body:
    username: string (assumed to be "")
    email: string (assumed to be "")
    limit: int (assumed to be 6)
    skip: int (assumed to be 0)
    relationship: int (assumed to be 0):
        0: all users
        1: friends
        2: received friend requests
        3: sent friend requests
    count: boolean (assumed to be false)

Route description:
    get a count of all users in the database that match the search criteria
    gathers a list of users of size {limit} that match the search criteria
    skip over the first {skip} results found
    return list and count to client

Returns: 
    userObjectList: userObject Array (including relationship fields)
    count: int (if count is true)
*/
router.get("/find",
    [
        query("username").optional().isString().isLength({ min: 3, max: 60 }).withMessage("username must be a string between 3 and 60 characters"),
        query("email").optional().isString().isEmail().withMessage("email must be a valid email address"),
        query("limit").optional().isInt({ min: 1, max: 90 }).toInt().withMessage("limit must be an integer between 1 and 90"),
        query("skip").optional().isInt({ min: 0, max: 900 }).toInt().withMessage("skip must be an integer between 0 and 900"),
        query("relationship").optional().isInt({ min: 0, max: 4 }).toInt().withMessage("relationship must be an integer between 0 and 4"),
        query("count").optional().isBoolean().withMessage("count must be a boolean"),
        checkExact()
    ],
    runValidation,
    userController.find
);






/*
---------- /folder route ------------

type: 
    GET - get a list of folders

requires 0 arguments from body

Optionally accepts 4 arguments from body:
    skip: int (assumed to be 0)
    limit: int (assumed to be 6)
    folderId: mongoose object id
    count: boolean (assumed to be false)

Route description:
    gets a list of all folders in the database that are owned by the user that is currently logged in
    if folderId is provided, get the folders that are inside the folder with {folderId}
    if count is true, return the count of folders that match the search criteria

Returns:
    folders:
        [
            {
                _id: mongoose object id
                name: string
            }
        ]
    count: int (if count is true)

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
    POST - change user profile data saved in database

Requires 2 arguments from body:
    username: string
    email: string

Optionally takes 1 argument from body:
    bio: string

Route description:
    make sure username and email doesn't already exist in database
    update users profile data in database
    create and send new cookies to client
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

Requires 1 arguments from body:
    userId: mongoose object id

Route description:
    creates a friend request in the database, setting the current user as the sender and {receiver} as the receiver
*/
router.post("/sendFriendRequest", 
    [
        body("userId").isString().isLength({ min: 24, max: 24 }).withMessage("userId must be a string of 24 characters"),
        checkExact()
    ],
    runValidation,
    userController.sendFriendRequest
);

/*
---------- /acceptFriendRequest route ------------

Type:
    POST - logs user out

Requires 2 arguments from body:
    requestId: mongoose object id
    accept: boolean

Route description:
    checks the validity of the friend request
    if accept is true, create a friendship object between the sender and receiver of the request
    if accept is false, delete the friend request from the database
*/
router.post("/processFriendRequest", 
    [
        body("requestId").isString().isLength({ min: 24, max: 24 }).withMessage("requestId must be a string of 24 characters"),
        body("accept").isBoolean().withMessage("accept must be a boolean"),
        checkExact()
    ],
    runValidation,
    userController.processFriendRequest
);




/*
---------- /deleteFriend route ------------

Type:
    POST - deletes a friendship object from the database

Requires 1 argument from body:
    relationshipId: mongoose object id

Route description:
    deletes the friendship object from the database
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
