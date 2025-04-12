const postgresConnection = require('../config/postgres');
const { conversionFactorList } = require('../library/canadianNutrientFileUtils');
const ingredientUtils = require('../library/ingredientUtils');


/*
takes an ingredients id and converts it into a ingredientObject
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



exports.details = async (req, res) => {
   const { foodId } = req.query;

   // check if foodId is provided
   if (!req.query.foodId) return res.status(400).json({ error:'foodId not provided' });

   let ingredientData = { foodId };

   try {
      // get ingredient name from database
      const query = "select food_description from food_name where food_id=$1";
      const values = [foodId];
      const result = await postgresConnection.query(query, values);
      ingredientData.foodDescription = result.rows[0].food_description;

      // get ingredients nutritional value (per 100 grams)
      ingredientData.nutrition = await ingredientNutrition({foodId});

      // get all possible conversion values for ingredient
      ingredientData.conversionFactors = await conversionFactorList(foodId);

      return res.status(200).json({message: "ingredient data collected from server", payload: ingredientData});
   }

   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "ingredient.controller.details failed... unable to create ingredient object");
      console.error(error);
      return res.status(500).json({ error: 'server failed to convert provided data into a recipe object' });
   }
}






exports.list = async (req, res) => {
   const {foodDescription, foodGroupId, limit} = req.query

   // find all ingredients with given key words
   let query = 'SELECT food_id, FoodDescription FROM food_name ';
   let values = [];
   if (foodDescription) {
      values = foodDescription.split(" ");
      values = values.map(substring => `%${substring}%`);
      query += 'WHERE food_description ILIKE $1 ';
      for (let i = 2; i <= values.length; i++) query += `AND food_description ILIKE $${i} `;
   }

   // add foodGroup restriction
   if (foodGroupId) {
      if (values.length == 0) query += 'WHERE ';
      else query += 'AND ';
      values.push(foodGroupId);
      query += `food_group_id=$${values.length} `;
   }

   // tag the limit on to the end of the query
   if (limit) {
      values.push(limit);
      query += `LIMIT $${values.length}`;
   }

   const data = await postgresConnection.query(query, values);
   // change the data to make it usable by the client
   data.rows = data.rows.map(row => { return { foodId: row.food_id, foodDescription: row.food_description } });
   return res.status(200).json({ message: "ingredient list collected from server", payload: data.rows });
}






exports.groups = async (req, res) => {
   const data = await postgresConnection.query('select * from food_group');
   console.log(data.rows);
   // change the data to make it usable by the client
   data.rows = data.rows.map(row => { return { foodGroupId: row.food_group_id, foodGroupName: row.food_group_name } });
   return (res.status(200).json({ message: "ingredient groups collected from server", payload: data.rows }));
};