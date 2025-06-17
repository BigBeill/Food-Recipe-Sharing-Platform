## Table of Contents
1. [Program Overview](#program-overview)
2. [General Overview](#general-overview)
3. [Setting Up the Project](#setting-up-the-project)
4. [Database Explanation](#database-explanation)
   - [MongoDB](#mongodb)
   - [PostgreSQL](#postgresql)
5. [Security Features](#security-features)
6. [Custom JSON Object Structures](#custom-json-object-structures)
7. [Component Explanation](#component-explanation)
   - [Notebook.jsx Explanation](#notebook.jsx-explanation)

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
 3. Save the file with a `.bat` extension (or respective file type if your not using windows).
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

This project uses two databases:

- **MongoDB** is used to store larger and more dynamic data in a remote, cloud-hosted environment.
- **PostgreSQL** stores a small amount of static data that needs to be accessed quickly. It is kept local, next to the server.

I have created some relational diagrams to illustrate the structure and relationships within these databases.

### MongoDB
The MongoDB database is cloud-hosted. To run the project locally:

 - Create your own MongoDB cluster online.
 - Update the connection string in `server/config/connectMongo.js`.

That's it, collections and schemas are auto-generated on first run.

Note: MongoDB supports nested JSON objects, which don't translate cleanly to relational diagrams. Any field labeled "nested" refers to embedded subdocuments, not actual independent objects.

![mongoDB Diagram](/readmeImages/relationalDiagramMongoDb.png)

### PostgreSQL
This is the PostgreSQL server, containing data from the Canadian Nutrient File. The software runs locally on the machine you're running the server on and requires manual setup. Setup instructions can be found in:

`canadian-nutrient-file/Ingredient Database Instructions.txt`

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






## Custom JSON Object Structures
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



## Client Side Component Explanations
On the client side, some components in this project can be a bit tricky to use at first. This section explains how to use them properly.

### Notebook.jsx Explanation 
location: (client/src/components/Notebook.jsx)

The Notebook component simulates a flip-book style UI for content you wish to display to the user.
It will display two react components at a time, inside the notebook pages (each page sharing the screen space width wise).
Any additional react components will be accessible through a pagination bar under the notebook.

#### Using Notebook.jsx

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

#### componentList Structure
ComponentList is an array of JSON objects. Two of these objects make up a single page. Each object consists of two fields:
 - content: the react component that will be displayed on the notebook page
 - props: an object containing the props being passed to the content component (field name is what the content component reads the prop as)

#### requestNewPage structure
This is a function that accepts one numerical prop. When the Notebook tries to display a page that it doesn't currently have access to the components for (like trying to display components 5 and 6 when only having access to 4 components) this function will be called, passing the page trying to be accessed as a numerical value prop. Its then this functions job to figure out how to handle accessing the page that's not currently accessible.

#### Example Code
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