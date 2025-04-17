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

### Setting Up the Project
 1. Open the `run_website.txt` file in the root directory.
 2. Set the URL to the path where you saved this project.
 3. Save the file with a `.bat` extension.
 4. Double-click the `.bat` file to run the application.

Note: The application will run, but no data will be accessible until the databases are properly configured. Refer to the [Database Explanation](#database-explanation) section for more details.

## Database Explanation
There are two databases I'm using for this project, I created some relational diagrams to show what's going on.

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
 - HTTPS connection
 - HTTP-only cookies
 - Sanitization of all client input (cookies, query, params, and body)

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
      measureDescription: string,
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

### relationshipObject
```js
{
   _id: mongoose.SchemaTypes.ObjectId;
   target:  mongoose.SchemaTypes.ObjectId;
   type: number; // 0 = no relationship, 1 = friends, 2 = received friend request, 3 sent friend request, 4 = self
}
```

### userObject
```js
{
   _id: mongoose.SchemaTypes.ObjectId,
   username: string,
   email: string,
   bio: string,
   relationship?: {
      _id: mongoose.SchemaTypes.ObjectId,
      type: number
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



## Component Explanations
Some components in this project can be a bit tricky to use at first. This section explains how to use them properly.

### Notebook.jsx Explanation 
location: (client/src/components/Notebook.jsx)

The Notebook component simulates a flip-book style UI for content. It has three main parts:
- blank space
   - the area on each page that will be filled in by content passed from the parent component.
- arrow buttons
   - large arrows the user can click to flip through pages.
   - Keyboard shortcuts (arrow and A/D keys) also work.
- page number
   - shown at the bottom to indicate the current page.

This is what notebook.jsx looks like without any props being provided: \
![blank Notebook.jsx](/readmeImages/notebookBlank.png)

Notebook accepts the following 3 props:
- pageList
   - required prop
   - Array of page objects to display in the notebook.
- parentPageNumber
   - optional prop
   - Sets the initial page number. Defaults to 1.
- requestNewPage
   - optional prop
   - Function that fires when a user tries to navigate to a page that doesn’t exist yet. 
   - Receives the requested page number as a prop.

#### PageList Structure
pageList is an array of objects. Each object represents one page and has two fields:
 - content: the react component that will be displayed on the notebook page
 - props: an array of props being passed to component

#### Example Code
Some sample code for creating a paginated list: 
```js
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Notebook from '../components/Notebook';
import PageObject from '../interfaces/PageObject';

export default function SamplePageManager() {

   const [searchParams, setSearchParams] = useSearchParams();
   const pageNumber: number = Number(searchParams.get('pageNumber')) || 1;

   const [objectList, setObjectList] = useState<any[]>([]);

   useEffect(() => {
      // some logic for retrieving the objects you want to display from the server and placing it inside objectList
   }, [searchParams]);

   // change the page number in the url without affecting any other url parameters
   function handleNewPage(newPage: number) {
      const newParam = new URLSearchParams(searchParams.toString());
      newParam.set('pageNumber', newPage.toString());
      setSearchParams(newParam);
   }

   // create the pageList for the notebook component
   let pageList: PageObject[] = [];

   // create pages for notebook and add them to the pageList array
   objectList.forEach((object) => {
      pageList.push({
         content: Page,
         props: {
            object: object
         }
      });
   });

   // call the notebook function
   return <Notebook pageList={pageList} parentPageNumber={pageNumber} requestNewPage={handlePageChange}/>
}

interface PageProps {
   object: any;
}

function Page({object}: PageProps) {
   return (
      // code for displaying object content in HTML format
   )
}
```