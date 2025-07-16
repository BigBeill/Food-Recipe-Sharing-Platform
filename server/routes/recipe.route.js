const router = require("express").Router();
const recipeController = require("../controllers/recipe.controller");
const { body, query, param, checkExact } = require("express-validator");
const { advancedCheckExact, runValidation } = require("../library/sanitationUtils");


/*
------------ /getObject route ------------

Type:
   GET - returns a completed recipe object

Expects 1 argument from params:
   recipeId: integer
   includeNutrition: boolean (optional, default false)

Route description:
   - Builds a completed recipeObject using the recipeId provided
   - Checks to make sure the client has read access to the recipe
   - If includeNutrition is true, attaches the nutrition field to the recipeObject
   - Returns the competed recipe object

Returns:
   - 200 recipeObject returned
   - 400 invalid or missing arguments
   - 401 client is attempting to access a private recipeObject without an access token
   - 403 client does not have read access to recipeObject being requested

payload: recipeObject
*/
router.get("/getObject/:recipeId/:includeNutrition?",
   [
      param("recipeId").isString({ min: 24, max:24 }).withMessage("recipeId must be a positive integer"),
      param("includeNutrition").optional().isBoolean().toBoolean().withMessage("includeNutrition must be a boolean"),
      checkExact()
   ],
   runValidation,
   recipeController.getObject
);



/*
------------ /find route ------------

Type: 
   GET - returns a list of recipes from the database

Expects 6 arguments from query:
   category: enum["public", "friends", "personal"] (optional, default "public")
   title: string (optional)
   ingredients: number[] (optional)
   limit: number (optional, default 6)
   skip: number (optional, default 0)
   count: boolean (optional, default false)
   includeNutrition: boolean (optional, default false)
Route description:
   - Collect a list of recipeObjects based on title and ingredients provided
   - Skip the first {skip} number or recipeObjects found
   - Limit the list to {limit} number of recipeObjects
   - If {includeNutrition} is true, attach the nutrition field to each recipeObject
   - Return the list to the client
   - If {count} is true, also return the total number of recipeObjects that match search criteria

Returns:
   - 200 recipeObject array returned
   - 400 invalid or missing arguments
   - 401 client is attempting to use a category other than "all" without an access token

payload: {
   recipeObjectArray: recipeObject[], 
   count: number
}
*/

router.get('/find',
   [
      query("category").optional().isString().isIn(["public", "friends", "personal"]).withMessage("category must be one of the following: all, friends, personal"),
      query("title").optional().isString().isLength({ min: 3, max: 90 }).withMessage("title must be a string between 3 and 100 characters"),
      query("ingredients").optional().isArray().withMessage("ingredients must be an array")
      .custom((ingredients) => {
         ingredients.map((ingredient) => { return Number(ingredient); })
         if (!ingredients.every((ingredient) => { return Number.isInteger(ingredient); })) { throw new Error("ingredients must be an array of integers"); }
         else { return true; }
      }),
      query("limit").optional().toInt().isInt({ min: 1, max: 90 }).withMessage("limit must be an integer between 1 and 90"),
      query("skip").optional().toInt().isInt({ min: 0, max: 900 }).withMessage("skip must be an integer between 0 and 900"),
      query("count").optional().isBoolean().withMessage("count must be a boolean"),
      query("includeNutrition").optional().isBoolean().toBoolean().withMessage("includeNutrition must be a boolean"),
      checkExact()
   ],
   runValidation,
   recipeController.find
);






/*
---------- /edit routes ------------

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
   visibility: enum["public", "friends", "personal"] (optional, default "public")

Route Description:
   - Packages arguments into a single json object
   - Checks the json object to make sure it forms a valid RecipeObject
   - If using POST method, saves the recipeObject to the database with current user as the recipe owner
   - If using PUT method, checks to make sure client has write pillages for recipe with _id provided
   - If using PUT method, replaces contents of the recipeObject in database with contents of the new recipeObject

Returns: 
   - 201 recipe was added/changed in the database
   - 400 invalid or missing arguments
   - 401 client did not provide a valid access token
   - 403 client does not have write access to the recipeObject
*/

router.route('/edit')
.all(
   [
      body("_id").optional().isString().isLength({ min: 24, max: 24 }).withMessage("_id must be a string of 24 characters"),
      body("title").isString().isLength({ min: 3, max: 900 }).withMessage("Your recipe must contain a title between 1 and 900 characters long"),
      body("description").isString().isLength({ min: 3, max: 90000 }).withMessage("description must be a string between 3 and 90000 characters"),
      body("image").isString().isLength({ min: 0, max: 90 }).withMessage("image must be a string"),
      body("ingredients").isArray().withMessage("ingredients must be an array"),
      body("ingredients.*").isObject().withMessage("ingredients must be an array of objects"),
      body("ingredients.*.foodId").toInt().isInt({ min: 1, max: 100000000 }).withMessage("All ingredients must have a valid foodId"),
      body("ingredients.*.label").optional().isString().isLength({ min: 1, max: 900}).withMessage("All ingredients with the label field must have a label as a string between 1 and 900 characters long"),
      body("ingredients.*.foodDescription").isString().isLength({ min: 1, max: 900 }).withMessage("All ingredients must have a foodDescription that is a string between 1 and 900 characters long"),
      body("ingredients.*.portion").isObject().withMessage("All ingredients must have a portion object"),
      body("ingredients.*.portion.measureId").toInt().isInt({ min: 1, max: 900000 }).withMessage("All ingredients portion field must have a valid measureId"),
      body("ingredients.*.portion.measureDescription").isString().isLength({ min: 1, max: 900 }).withMessage("All ingredients portion field must have a measureDescription that is a string between 1 and 900 characters long"),
      body("ingredients.*.portion.amount").toFloat().isFloat({ min: 0.01, max: 90000 }).withMessage("All ingredients portion field must have an amount that is a float between 0.01 and 90000"),
      body("instructions").isArray().withMessage("instructions must be an array"),
      body("instructions.*").isString().isLength({ min: 3, max: 10000 }).withMessage("instructions must be an array of strings"),
      body("visibility").optional().isString().isIn(["public", "private", "personal"]).withMessage("visibility must be one of the following: public, private, personal"),
      checkExact(),
      advancedCheckExact({
         _id: true,
         title: true,
         description: true,
         image: true,
         ingredients: [{foodId: true, label: true, foodDescription: true, portion: {measureId: true, measureDescription: true, amount: true}}],
         instructions: [],
         visibility: true
      }, "body" )
   ],
   runValidation,
   recipeController.packageIncoming
)
.post(recipeController.add)
.put(recipeController.update);






/*
------------ /delete route ------------
Type:
   DELETE - Deletes a recipe from the database

Expects 1 argument from params:
   recipeId: mongoose.SchemaTypes.ObjectId

Route Description:
   - Checks to make sure the client has write access to the recipe being deleted
   - Deletes the recipe from the database

Returns:
   - 200 recipe was deleted from the database
   - 400 invalid or missing arguments
   - 401 client did not provide a valid access token
   - 403 client does not have write access to the recipeObject
*/
router.delete('/delete/:recipeId',
   [
      param("recipeId").isString({ min: 24, max: 24 }).withMessage("recipeId must be a string of 24 characters"),
      checkExact()
   ],
   runValidation,
   recipeController.delete
);



module.exports = router