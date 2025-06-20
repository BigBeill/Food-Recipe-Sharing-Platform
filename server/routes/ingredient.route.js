const router = require("express").Router();
const ingredientController = require("../controllers/ingredient.controller");
const { body, query, param, checkExact } = require("express-validator");
const { runValidation } = require("../library/sanitationUtils");

/*
------------ /getObject route ------------

Type:
   GET - Returns a completed ingredient object

Expects 3 arguments in params:
   foodId: integer
   measureId: integer (optional)
   amount: integer (optional)

Route description
   - Grabs ingredientObject for foodID from the database
   - If both measureId and amount have been provided, attach nutrition field to the ingredientObject
   - Returns ingredientObject to client

Returns:
   - 200 IngredientObject returned
   - 400 Invalid or missing arguments

payload: IngredientObject
*/
router.get('/getObject/:foodId/:measureId?/:amount?', 
   [
      param("foodId").toInt().isInt({ min: 1 }).withMessage("foodId must be a positive integer"),
      param("measureId").optional().toInt().isInt({ min: 1 }).withMessage("measureId must be a positive integer"),
      param("amount").optional().toInt().isInt({ min: 1 }).withMessage("amount must be a positive integer"),
      checkExact()
   ],
   runValidation,
   ingredientController.getObject
);






/*
------------ /list route ------------

Type:
   GET - returns a list of ingredientObjects

Expects 4 arguments in params:
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
*/
router.get('/list',
   [
      query("foodDescription").optional().isString().trim().escape().withMessage("foodDescription must be a string"),
      query("foodGroupId").optional().isString().trim().escape().withMessage("foodGroupId must be a string"),
      query("skip").optional().toInt().isInt({ min: 0 }).withMessage("skip must be a positive integer"),
      query("limit").optional().toInt().isInt({ min: 1, max: 60 }).withMessage("limit must be a positive integer between 1 and 60"),
      checkExact()
   ],
   runValidation,
   ingredientController.list
);



/*
------------ /conversionOptions route ------------

Type:
   GET - returns a list of conversion options for a given foodId

Expects 1 argument in params:
   foodId: integer

Route description:
   - Gathers a list of all conversion types associated with the foodId

Returns:
   - 200 conversionObject array
   - 400 Invalid or missing arguments

payload: conversionObject[]
*/
router.get('/conversionOptions/:foodId',
   [
      param("foodId").toInt().isInt({ min: 1 }).withMessage("foodId must be a positive integer"),
      checkExact()
   ],
   runValidation,
   ingredientController.conversionOptions
);



/*
------------ /groups route ------------

Type:
   GET - returns a list of all food groups inside postgres

Expects 0 arguments in params

Method 'GET' description:
   - Gathers a list of all food groups inside the postgres database

Method 'GET' returns:
   - 200 foodGroupObject array returned
   - 400 Arguments were provided with this request

payload: foodGroupObject[]
*/
router.get('/groups', ingredientController.groups);



module.exports = router;