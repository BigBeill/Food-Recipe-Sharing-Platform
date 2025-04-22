const router = require("express").Router();
const ingredientController = require("../controllers/ingredient.controller");
const { body, query, param } = require("express-validator");
const { validateNoExtraFields, runValidation } = require("../library/sanitationUtils");

/*
------------ /getObject route ------------

One method type:
   GET - returns a completed ingredient object

Requires 1 argument from param:
   foodId: integer

Optionally accepts 2 arguments from param:
   measureId: integer (must be included if amount is included)
   amount: integer (must be included if measureId is included)

Method 'GET' description:
   builds a completed ingredient object using data provided in the request
   adds ingredient nutrition if measureId and amount are provided
   returns the competed ingredientObject

Method 'GET' returns:
   ingredientObject
*/
router.get('/getObject/:foodId/:measureId?/:amount?', 
   [
      param("foodId").toInt().isInt({ min: 1 }).withMessage("foodId must be a positive integer"),
      param("measureId").optional().toInt().isInt({ min: 1 }).withMessage("measureId must be a positive integer"),
      param("amount").optional().toInt().isInt({ min: 1 }).withMessage("amount must be a positive integer"),
      validateNoExtraFields(["foodId", "measureId", "amount"], "param")
   ],
   runValidation,
   ingredientController.getObject
);



// returns a 404 error, use the getObject route instead
router.get('/details', ingredientController.details);



/*
------------ /list route ------------

One method type:
   GET - returns a list of ingredients found in the canadian nutrient file

Requires 0 argument

Optionally accepts 4 arguments from param:
   foodDescription: string
   foodGroupId: string
   skip: integer (default 0)
   limit: integer (default 15)


Method 'GET' description:
   collects a list of ingredients from the canadian nutrient file that match contents of the foodDescription and foodGroupId fields
   list will skip over the first 'skip' number of results
   list will be limited to 'limit' number of results
   convert the contents of the list into an ingredientObject array

Method 'GET' returns:
   ingredientObject array

*/
router.get('/list',
   [
      query("foodDescription").optional().isString().trim().escape().withMessage("foodDescription must be a string"),
      query("foodGroupId").optional().isString().trim().escape().withMessage("foodGroupId must be a string"),
      query("skip").optional().toInt().isInt({ min: 0 }).withMessage("skip must be a positive integer"),
      query("limit").optional().toInt().isInt({ min: 1, max: 60 }).withMessage("limit must be a positive integer between 1 and 60"),
      validateNoExtraFields(["foodDescription", "foodGroupId", "skip", "limit"], "query")
   ],
   runValidation,
   ingredientController.list
);



/*
------------ /conversionOptions route ------------

*/
router.get('/conversionOptions/:foodId',
   [
      param("foodId").toInt().isInt({ min: 1 }).withMessage("foodId must be a positive integer"),
      validateNoExtraFields(["foodId"], "param")
   ],
   runValidation,
   ingredientController.conversionOptions
);



/*
------------ /groups route ------------

One method type:
   GET - returns a list of all ingredient groups fond in the canadian nutrient file

Requires 0 arguments

Method 'GET' description:
   returns a list of all ingredient groups found in the canadian nutrient file

Method 'GET' returns:
   foodGroupObject array
*/
router.get('/groups', ingredientController.groups);



module.exports = router;