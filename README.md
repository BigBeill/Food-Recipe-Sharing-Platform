## Table of Contents
1. [Program Overview](#program-overview)
   - [General Overview](#general-overview)
   - [Setting Up the Project](#setting-up-the-project)
   - [Database Design](#database-design)
   - [Security Features](#security-features)
   - [JSON Object Models](#json-object-models)
2. [API Documentation](#api-documentation)
   - [/authentication Routes](#authentication-routes)
   - [/ingredient Routes](#ingredient-routes)
   - [/recipe Routes](#recipe-routes)
   - [/user Routes](#user-routes)
3. [Component Documentation](#component-documentation)
   - [Notebook.tsx Documentation](#notebooktsx-documentation)

# Program Overview
Hi! I'm Mackenzie Neill, a COIS student at Trent University. This is a personal project I've been working on to sharpen my web development skills beyond coursework. It's been a great learning experience in full-stack development, cybersecurity, and server management. If you have questions, feedback, or suggestions, feel free to reach out at mackenzie.neill.359@gmail.com.

## General Overview
Author: Mackenzie Neill 
Start date: December 15th, 2023

Tech Stack
 - Frontend: React (TypeScript) 
 - Backend: Node.js
 - Database: MongoDB (cloud-hosted) and PostgreSQL (local)

Architecture:
 - Client-server model: frontend and backend communicate over HTTPS
 - model-view-controller: Backend file organization

### Setting Up the Project
 1. Open the `run_website.txt` file in the root directory.
 2. Set the URL to the path where you saved this project.
 3. Save the file with a `.bat` extension (or respective file type if you're not using windows).
 4. Inside the `client` folder, create a `.env` file and add:
```
VITE_SERVER_LOCATION=http://localhost:4000
```
 5. Inside the `server` folder, create a `.env` file and add:
 ```
SESSION_SECRET=
LOCAL_ENVIRONMENT=true
```
 6. Fill in a value for `SESSION_SECRET` (choose a strong secret).
 7. Double-click the `.bat` file to run the application.

Note: The application will run, but no data will be accessible until the databases are properly configured. Refer to the [Database Explanation](#database-explanation) section for more details.

## Database Design
This project uses two databases:

- **MongoDB** is used to store larger and more dynamic data in a remote, cloud-hosted environment.
- **PostgreSQL** stores a small amount of static data that needs to be accessed quickly. It is kept local, next to the server.

I have created some relational diagrams to illustrate the structure and relationships within these databases.

### MongoDB
The MongoDB database is cloud-hosted. To run the project locally:

- Create your own MongoDB cluster online.
- Update the connection string in `server/config/connectMongo.js`.
- Add the following line to the server’s `.env` file:
```
MONGO_DB_PASSWORD=
```
- Fill in your MongoDB password.

That’s it, collections and schemas are auto-generated on first run.

> **Note:** MongoDB supports nested JSON objects, which don’t translate cleanly into relational diagrams. Any field labeled “nested” refers to embedded subdocuments, not independent objects.

![MongoDB Diagram](/readmeImages/relationalDiagramMongoDb.png)

### PostgreSQL
This is the PostgreSQL server, containing data from the Canadian Nutrient File. The software runs locally on the machine you're using to run the server and requires manual setup. Setup instructions can be found in:

`/canadian-nutrient-file/DB_Setup.md`

![PostgreSQL Diagram](/readmeImages/relationalDiagramPostgreSQL.png)






## Security Features
 - HTTPS connection (only on cloud deployment)
 - HTTP-only cookies
 - Sanitization of all client input (cookies, query, params, and body)

Originally I did have this code configured to use HTTPS connections. 
However, both render and vercel automatically convert HTTP messages to HTTPS, so i had to revert everything back to http when debugging the cloud deployment.
Any local deployment of this project now uses HTTP but the cloud deployment uses HTTPS
Since we cant use the secure tags on cookies in a local host environment they have been set to cross-site: 'strict'.

### User Authentication
 - JSON web tokens (JWT)
 - Access token that lasts 15 minutes
 - Refresh token that lasts 30 days

### Password Protection Features
Client side:
 - Password masking
 - User must enter their password twice to verify they entered it correctly
 - Minimum password requirements

Server side:
 - Passwords are salted and hashed before storage

## JSON Object Models
Any JSON object being sent from the server to the client should follow one of these patterns

### foodGroupObject
```js
{
   foodGroupId: number, //primary key
   foodGroupName: string
}
```

###  ingredientObject
```js
{
   foodId: number, //primary key
   foodDescription: string,
   portion?: {
      measureId: number,
      measureDescription?: string,
      amount: number
   },
   nutrition?: {
      calories: number,
      fat: number,
      cholesterol: number,
      sodium: number,
      potassium: number,
      carbohydrates: number,
      fibre: number,
      sugar: number,
      protein: number
   }
}
```

### conversionObject
```js
{
   measureId: number,
   measureDescription?: string,
   conversionFactorValue: number,
}
```

### recipeObject
```js
{
   _id: mongoose.SchemaTypes.ObjectId,
   owner: mongoose.SchemaTypes.ObjectId,
   title: string,
   description: string,
   image: string, // to be changed
   ingredients: Array<ingredientObject>, // must include portion and nutrient field 
   instructions: Array<string>,
   nutrition: {
      calories: number,
      fat: number,
      cholesterol: number,
      sodium: number,
      potassium: number,
      carbohydrates: number,
      fibre: number,
      sugar: number,
      protein: number
   }
}
```

### userObject
```js
{
   _id: mongoose.SchemaTypes.ObjectId,
   username: string,
   email: string,
   bio: string,
   relationship?: { // relationship with given target (usually current signed in user)
      _id: mongoose.SchemaTypes.ObjectId,
      target: mongoose.SchemaTypes.ObjectId,
      type: number // 0 = no relationship, 1 = friends, 2 = received friend request, 3 sent friend request, 4 = self
   }
}
```

### userFolderObject
```js
{
   _id: mongoose.SchemaTypes.ObjectId,
   folders: Array<userFolderObject | mongoose.SchemaTypes.ObjectId>,
   users: Array<userObject | mongoose.SchemaTypes.ObjectId>
}
```

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



# Component Documentation
On the client side, some components in this project can be a bit tricky to use at first. This section explains how to use them properly.

## Notebook.tsx Documentation
location: client/src/components/Notebook.jsx

The Notebook component simulates a flip-book style UI for content you wish to display to the user.
It will display two react components at a time, inside the notebook pages (each page sharing the screen space width wise).
Any additional react components will be accessible through a pagination bar under the notebook.

### Using Notebook.tsx

Notebook accepts the following 4 props:
- componentList
   - Required prop.
   - JSON object array (continue reading for structure)
   - Array of page objects to display in the notebook.
- parentPageNumber
   - Optional prop.
   - Number
   - Tells notebook the exact page number that the first component in componentList belongs to. 
   - Defaults to 1.
- requestNewPage
   - Optional prop.
   - Function (continue reading for structure)
   - A function that fires when a user tries to navigate to a page that doesn’t exist yet. 
- componentCount
   - Optional prop.
   - Number
   - Tells the notebook how many components exist, even if not all of them appear inside componentList.
   - Defaults to size of componentList

Note: looking at the naming conventions, you may notice that some props reference pages and others reference components, a page is just a set of 2 components. So the 5th and 6th components should be displayed on page 3.

### componentList Structure
ComponentList is an array of JSON objects. Two of these objects make up a single page. Each object consists of two fields:
 - content: the react component that will be displayed on the notebook page
 - props: an object containing the props being passed to the content component (field name is what the content component reads the prop as)

### requestNewPage structure
This is a function that accepts one numerical prop. When the Notebook tries to display a page that it doesn't currently have access to the components for (like trying to display components 5 and 6 when only having access to 4 components) this function will be called, passing the page trying to be accessed as a numerical value prop. Its then this functions job to figure out how to handle accessing the page that's not currently accessible.

### Example Code
Some sample code for creating a paginated list while utilizing Notebook.jsx:

Note: in this example RecipePreview.jsx is a regular react component that takes a recipe as a prop
```js
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Notebook from '../components/Notebook';
import PageComponentObject from '../interfaces/PageComponentObject';
import RecipePreview from '../components/notebookPages/RecipePreview';

export default function Home() {
   const [searchParams, setSearchParams] = useSearchParams();
   const pageNumber: number = Number(searchParams.get('pageNumber')) || 1;

   const [componentList, setComponentList] = useState<PageComponentObject[]>([]);
   const [componentCount, setComponentCount] = useState<number>(0);

   // handle fetching page contents
   function handlePageChange(newPage: number) {

      // update the url to have the new page number
      const newParam = new URLSearchParams(searchParams.toString());
      newParam.set('pageNumber', newPage.toString());
      setSearchParams(newParam);

      // empty the componentList so the page does not look frozen to user
      setComponentList([]);

      //send a request to the server for 2 new items, based on newPage value
      axios({method: 'get', url: `recipe/find?limit=2&skip=${((newPage - 1) * 2)}&count=true`})
      .then((response) => {
         // make sure enough entries exist in the database to display requested page
         const maxPages = Math.round(((response.count + 1) / 2) + 1);
         if (maxPages >= newPage) {
            // add each recipe to a component list
            let newComponentList: PageComponentObject[] = [];
            response.recipeObjectArray.forEach((recipe) => {
               newComponentList.push({
                  content: RecipePreview,
                  props: {
                     recipe
                  }
               })
            });
            setComponentList(newComponentList);
            setComponentCount(response.count);
         }
         // if page being requested is too large to be accessible, return a page that isn't
         else { handlePageChange(maxPages) }
      });
   }

   return <Notebook componentList={componentList} parentPageNumber={pageNumber} requestNewPage={handlePageChange} componentCount={componentCount}/>
}
```