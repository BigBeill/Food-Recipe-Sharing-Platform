# API Documentation
This project uses REST API's for communication between client and server, this section of the documentation is dedicated to how to use them.

## /Authentication Routes

### /register
```
Type:
   POST - Registers a new user

Expects 3 arguments in body:
   username: string
   email: string
   password: string

Route description:
   - Checks if the username or email is already registered
   - Salts and hashes the password
   - Creates a user object and saves it to the database
   - Creates JSON Web Token cookies and sends them to the client

Returns:
   - 201 user was successfully registered
   - 400 invalid or missing arguments
   - 409 username or email is already registered
```

### /login
```
Type:
   POST - Logs user in

Expects 3 arguments in body:
   username: string
   password: string
   rememberMe: boolean

Route description:
   - Retrieves user data from the database
   - Verifies the password matches the hashed password
   - Creates JWT cookies and sends them to the client
   - If rememberMe is true, sets cookie max-age to 30 days

Returns:
   - 200 user verified and cookies sent
   - 400 invalid or missing arguments
   - 401 username or password is incorrect
```

### /refresh
```
Type:
   POST - Issues a new user token

Expects 0 arguments in body

Route description:
   - Checks validity of refresh tokens in the client’s cookies
   - Creates and sends a new user token

Returns:
   - 200 new user token sent
   - 400 arguments were provided
   - 401 no valid refresh token was found
```

### /logout
```
Type:
   POST - Logs the current user out

Expects 0 arguments in body

Route description:
   - Removes all cookies from the client’s browser

Returns:
   - 200 cookies successfully removed
   - 400 arguments were provided with this request
```

## /ingredient Routes

### /getObject/:foodId/:measureId?/:amount?
```
Type:
   GET - Returns a completed ingredient object

Expects 3 arguments in params:
   foodId: number
   measureId: number (optional)
   amount: number (optional)

Route description
   - Grabs ingredientObject for foodID from the database
   - If both measureId and amount have been provided, attach nutrition field to the ingredientObject
   - Returns ingredientObject to client

Returns:
   - 200 ingredientObject returned
   - 400 invalid or missing arguments

payload: IngredientObject
```

### /list
```
Type:
   GET - returns a list of ingredientObjects

Expects 4 arguments in query:
   foodDescription: string (optional)
   foodGroupId: string (optional)
   skip: number (optional, default 0)
   limit: number (optional, default 15)

Route description:
   - Collects a list of ingredientObjects from the postgres database
   - List will skip over the first {skip} number of results
   - List will be limited to {limit} number of results
   - Convert the contents of the list into an ingredientObject array

Returns:
   - 200 ingredientObject array returned
   - 400 Invalid arguments

payload: {
   ingredientObjectArray: ingredientObject[],
   count: number
}
```

### /conversionOptions/:foodId
```
Type:
   GET - returns a list of conversion options for a given foodId

Expects 1 argument in params:
   foodId: number

Route description:
   - Gathers a list of all conversion types associated with the foodId

Returns:
   - 200 conversionObject array
   - 400 invalid or missing arguments

payload: conversionObject[]
```

### /groups
```
Type:
   GET - returns a list of all food groups inside postgres

Expects 0 arguments in query

Method 'GET' description:
   - Gathers a list of all food groups inside the postgres database

Method 'GET' returns:
   - 200 foodGroupObject array returned
   - 400 arguments were provided with this request

payload: foodGroupObject[]
```

## /recipe Routes

### /getObject/:recipeId
```
Type:
   GET - returns a completed recipe object

Expects 1 argument from params:
   recipeId: integer

Route description:
   - Builds a completed recipeObject using the recipeId provided
   - Checks to make sure the client has read access to the recipe
   - Returns the competed recipe object

Returns:
   - 200 recipeObject returned
   - 400 invalid or missing arguments
   - 401 client does not have read access to recipeObject being requested

payload: recipeObject
```

### /find
```
Type: 
   GET - returns a list of recipes from the database

Expects 5 arguments from query:
   title: string (optional)
   ingredients: number[] (optional)
   limit: number (optional, default 6)
   skip: number (optional, default 0)
   count: boolean (optional, default false)

Route description:
   - Collect a list of recipeObjects based on title and ingredients provided
   - Skip the first {skip} number or recipeObjects found
   - Limit the list to {limit} number of recipeObjects
   - Return the list to the client
   - If {count} is true, also return the total number of recipeObjects that match search criteria

Returns:
   - 200 recipeObject array returned
   - 400 invalid or missing arguments

payload: {
   recipeObjectArray: recipeObject[], 
   count: number
}
```

### /edit
```
Type:
   POST - Creates a new recipe in the database
   PUT - Makes changes to an already existing recipe in the databases

Expects 6 arguments from body:
   _id: mongoose.SchemaTypes.ObjectId (Only for PUT method)
   title: string
   description: string
   image: string
   ingredients: ingredientObject[]
   instructions: string[]

Route Description:
   - Packages arguments into a single json object
   - Checks the json object to make sure it forms a valid RecipeObject
   - If using POST method, saves the recipeObject to the database with current user as the recipe owner
   - If using PUT method, checks to make sure client has write pillages for recipe with _id provided
   - If using PUT method, replaces contents of the recipeObject in database with contents of the new recipeObject

Returns: 
   - 201 recipe was added/changed in the database
   - 400 invalid or missing arguments
   - 401 client does not have write access to the recipeObject (no/wrong user signed in)
```

## /user Routes

### /getObject/:userId?/:relationship?
```
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
```

### /find
```
Type:
   GET - return a list of users from the database

Expects 6 arguments from query:
   username: string (optional)
   email: string (optional)
   limit: number (optional, default 6)
   skip: number (optional, default 0)
   relationship: number (optional)
   count: boolean (optional, default false)

Route description:
   - Collects a list of all users in the database that contain {username} and {email}
   - If relationship field exists, only include userObjects that the current user has the given relationship with
   - Reminder: 1 = friends, 2 = received friend requests, 3 = sent friend requests
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
```

### /folder
```
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
```

### /updateAccount
```
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
```

### /sendFriendRequest
```
Type:
   POST - creates a friend request in server database

Expects 1 arguments from body:
   userId: mongoose object id

Route description:
   creates a friend request in the database, setting the current user as the sender and the {userId} as the receiver

Returns:
   - 201 friendRequestObject created and sent saved to the database
   - 400 missing or invalid arguments
   - 401 access token could not be found
```

### /processFriendRequest
```
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
   - 400 missing or invalid arguments
   - 401 current user does not have write access to the friendRequestObject
```

### /deleteFriendRequest
```
Type:
   POST - deletes a friendship object from the database

Expects 1 argument from body:
   relationshipId: mongoose object id

Route description:
   - Deletes the friendship object from the database

Return:
   - 200 friendshipObject removed from databases
   - 400 missing or invalid arguments
   - 401 current user doesn't have write access to the friendship object
```