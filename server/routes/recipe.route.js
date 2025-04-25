const router = require("express").Router();
const recipeController = require("../controllers/recipe.controller");
const { body, query, param } = require("express-validator");
const { validateNoExtraFields, runValidation } = require("../library/sanitationUtils");


/*
------------ /getObject route ------------

One method type:
   GET - returns a completed recipe object

Requires 1 argument from param:
   recipeId: integer

Method 'GET' description:
   builds a completed recipe object using data provided in the request
   returns the competed recipe object

Method 'GET' returns:
   json object containing recipe data
*/
router.get("getObject/:recipeId",
   [
      param("recipeId").toInt().isInt({ min: 1 }).withMessage("recipeId must be a positive integer"),
      validateNoExtraFields(["recipeId"], "param")
   ],
   runValidation,
   recipeController.getObject
);



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
      query("ingredients").optional().isArray().withMessage("ingredients must be an array")
      .custom((ingredients) => {
         ingredients.map((ingredient) => { return Number(ingredient); })
         if (!ingredients.every((ingredient) => { return Number.isInteger(ingredient); })) { throw new Error("ingredients must be an array of integers"); }
         else { return true; }
      }),
      query("limit").optional().toInt().isInt({ min: 1, max: 90 }).withMessage("limit must be an integer between 1 and 90"),
      query("skip").optional().toInt().isInt({ min: 0, max: 900 }).withMessage("skip must be an integer between 0 and 900"),
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