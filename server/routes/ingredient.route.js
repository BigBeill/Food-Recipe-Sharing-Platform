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
   returns the competed ingredientObject object

Method 'GET' returns:
   json object containing ingredientObject
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

router.get('/details', ingredientController.details);

router.get('/list', ingredientController.list);

router.get('/groups', ingredientController.groups);

module.exports = router;