const postgresConnection = require('../config/postgres');
const { conversionFactorList } = require('../library/canadianNutrientFileUtils');
const ingredientUtils = require('../library/ingredientUtils');


/*
takes a foodId and converts it into a ingredientObject
@route: GET /ingredient/getObject/:foodId/:measureId?/:amount?
*/
exports.getObject = async (req, res) => {

   const { foodId, measureId, amount } = req.params;

   // create object containing foodId field
   let skipPortion = true;
   let recipe = {
      foodId,
   };

   // add extra fields to recipe object if they are provided
   if (measureId &&  amount) {
      skipPortion = false;
      recipe.portion = {
         measureId,
         amount
      };
   }

   try {
      const ingredientObject = await ingredientUtils.verifyObject(recipe, skipPortion);
      return res.status(200).json({ message: 'returning ingredientObject', payload: ingredientObject });
   }
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "ingredient.controller.getObject failed... unable to create ingredient object");
      console.error(error);
      return res.status(500).json({ error: 'server failed to convert provided data into a recipe object' });
   }
}



/*
returns a 404 error
@route: GET /ingredient/details
*/
exports.details = async (req, res) => {
   return res.status(404).json({ error: 'this route is deprecated, please use the getObject route instead' });
}



/*
returns a list of ingredients based on search criteria
@route: GET /ingredient/list
*/
exports.list = async (req, res) => {
   const {foodDescription, foodGroupId, skip = 0, limit = 15} = req.query

   // collect ingredientsData from the database
   let ingredientDataArray = [];
   try {
      // find all ingredients
      let query = 'SELECT food_id, Food_description FROM food_name ';
      let values = [];
      
      // add foodDescription restriction
      if (foodDescription) {
         values = foodDescription.split(" ");
         values = values.map(substring => `%${substring}%`);
         query += 'WHERE food_description ILIKE $1 ';
         for (let i = 2; i <= values.length; i++) { query += `AND food_description ILIKE $${i} `; }
      }

      // add foodGroup restriction
      if (foodGroupId) {
         if (values.length == 0) { query += 'WHERE '; }
         else { query += 'AND '; }
         values.push(foodGroupId);
         query += `food_group_id=$${values.length} `;
      }

      // tag the skip on to the end of the query
      values.push(skip);
      query += ` OFFSET $${values.length}`;

      // tag the limit on to the end of the query
      values.push(limit);
      query += ` LIMIT $${values.length}`;

      ingredientDataArray = await postgresConnection.query(query, values);
   }
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "ingredient.controller.list failed... unable to collect ingredient list from database");
      console.error(error);
      return res.status(500).json({ error: 'server failed to collect ingredient list from database' });
   }

   // format ingredientDataArray into usable objects
   let ingredientObjectArray = [];
   try {
      // change the data to make it usable by the client
      ingredientObjectArray = await Promise.all( ingredientDataArray.rows.map(async (ingredientData) => {
         const formattedIngredient = { foodId: ingredientData.food_id, foodDescription: ingredientData.food_description };
         const ingredientObject = await ingredientUtils.verifyObject(formattedIngredient, false);
         return ingredientObject;
      }));
   }
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "ingredient.controller.list failed... unable to convert ingredient list into usable objects");
      console.error(error);
      return res.status(500).json({ error: 'server failed to convert ingredient list into usable objects' });
   }

   return res.status(200).json({ message: "ingredient list collected from server", payload: ingredientObjectArray });
}



/*
returns a list of all conversion types found for given foodId in the canadian nutrient file database
@route: GET /ingredient/conversionOptions/:foodId
*/
exports.conversionOptions = async (req, res) => {
   const { foodId } = req.params;

   try {
      const conversionObjectArray = await conversionFactorList(foodId);
      return res.status(200).json({ message: "ingredient measurements collected from server", payload: conversionObjectArray });
   }
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "ingredient.controller.measurements failed... unable to collect measurements from database");
      console.error(error);
      return res.status(500).json({ error: 'server failed to collect measurement information from database' });
   }

}



/*
returns a list of all food groups found in the canadian nutrient file database
@route: GET /ingredient/groups
*/
exports.groups = async (req, res) => {
   const data = await postgresConnection.query('select * from food_group');
   // change the data to make it usable by the client
   data.rows = data.rows.map(row => { return { foodGroupId: row.food_group_id, foodGroupName: row.food_group_name } });
   return (res.status(200).json({ message: "ingredient groups collected from server", payload: data.rows }));
};