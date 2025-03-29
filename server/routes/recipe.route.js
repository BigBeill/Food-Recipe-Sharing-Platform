const router = require("express").Router();
const recipeController = require("../controllers/recipe.controller");
const recipes = require("../models/recipe");
const { body, query } = require("express-validator");
const { validateNoExtraFields, runValidation } = require("../library/sanitationUtils");



/*
------------ /data route ------------

One method type:
   GET - returns recipe data

Requires 1 argument from url:
   _id: mongoDB objectId (recipe id)

Method 'GET' description:
   finds all data in database associated with the recipe that has id matching req.query.id

Method 'GET' returns:
   json object containing recipe data
*/

router.get('/data', recipeController.data);



/*
---------- /list route ------------
One method type:
   GET - returns recipe data

Optionally takes 2 arguments from url:
   name: string
   amount: int (if missing then assume 1)

*/

router.get('/list', async (req, res) => {

   const title = req.query.title || '';
   const amount = parseInt(req.query.amount, 10) || 20;

   try {
      let query = {}
      if (title != '') { query = { title: {$regex: new RegExp(title, 'i')}}}
      const data = await recipes.find(query).limit(amount)
      return res.status(200).json(data)
   } catch {
      res.status(500).json({ message: "failed to collect recipes from database" });
   }
});






/*
------------ /find route ------------
Type: 
   GET - collects a list of recipes from the database

Requires 0 arguments from body:

Optionally accepts 5 arguments from body:
   title: string (assumed to be "")
   ingredients: [mongoDB objectId] (assumed to be [])
   limit: int (assumed to be 6)
   skip: int (assumed to be 0)
   count: boolean (assumed to be false)

method description:
   if title is provided, search for recipes with title containing title
   if ingredients is provided, search for recipes that contain all ingredients in ingredients
   return a list of recipes that match the search criteria

method returns:
   recipes:
      [
         {
            _id: mongoose object id
            title: string
            description: string
            image: string
            ingredients: [{_id: mongoose object id, unit: string, amount: number}]
            instructions: [string]
         }
      ]
   count: int (if count is true)
*/

router.get('/find',
   [
      query("title").optional().isString().isLength({ min: 3, max: 90 }).withMessage("title must be a string between 3 and 100 characters"),
      query("ingredients").optional().isArray().withMessage("ingredients must be an array"),
      query("limit").optional().isInt({ min: 1, max: 90 }).toInt().withMessage("limit must be an integer between 1 and 90"),
      query("skip").optional().isInt({ min: 0, max: 900 }).toInt().withMessage("skip must be an integer between 0 and 900"),
      validateNoExtraFields(["title", "ingredients", "limit", "skip"], "query")
   ], 
   runValidation,
   recipeController.find
);






/*
---------- /edit routes ------------

Two Method types:
   POST - saving new recipe
   PUT - saving over existing recipe

requires 5 arguments from body:
   title: string
   description: string
   image: string
   ingredients: [{_id: string, unit: string, amount: number}]
   instructions: [string]

method 'PUT' requires 1 additional argument from body:
   recipeId: mongoDB objectId (recipe id)

Method 'ALL' description:
   put relevant data from body into a json object
   check the newly created recipe schema to make sure all data inserted into the object is valid and forms a completed recipe schema
   if successful, store the approved recipe schema inside req.recipeSchema

Method 'POST' description:
   save recipe schema to database.
   add recipes Id to current users list of owned recipe

Method 'PUT' description:
   check to make sure the current user is the owner of the recipe with req.body._id as its id
   use the json object in req.recipeSchema to save over the recipe with the id req.body._id
*/

router.route('/edit',
   [
      body("title").isString().isLength({ min: 3, max: 90 }).withMessage("title must be a string between 3 and 100 characters"),
      body("description").isString().isLength({ min: 3, max: 9000 }).withMessage("description must be a string between 3 and 1000 characters"),
      body("image").isString().isLength({ min: 0, max: 90 }).withMessage("image must be a string between 3 and 900 characters"),
      body("ingredients").isArray().withMessage("ingredients must be an array"),
      body("instructions").isArray().withMessage("instructions must be an array"),
      body("_id").optional().isString().isLength({ min: 24, max: 24 }).withMessage("_id must be a string of 24 characters"),
      validateNoExtraFields(["title", "description", "image", "ingredients", "instructions", "_id"], "body")
   ],
   runValidation
)
.all(recipeController.packageIncoming)
.post(recipeController.add)
.put(recipeController.update);



module.exports = router