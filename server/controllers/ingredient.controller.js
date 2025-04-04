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

   // get ingredient name from database
   const ingredientName = await postgresConnection.query(`select fooddescription from foodname where foodid=${foodId}`);
   ingredientData.foodDescription = ingredientName.rows[0].fooddescription;

   // get ingredients nutritional value (per 100 grams)
   ingredientData.nutrition = await ingredientNutrition({foodId});

   // get all possible conversion values for ingredient
   ingredientData.conversionFactors = await conversionFactorList(foodId);

   return res.status(200).json({message: "ingredient data collected from server", payload: ingredientData});
}






exports.list = async (req, res) => {
   const {foodDescription, foodGroupId, limit} = req.query

   // find all ingredients with given key words
   let query = 'SELECT foodid, FoodDescription FROM foodname ';
   let values = [];
   if (foodDescription) {
      values = foodDescription.split(" ");
      values = values.map(substring => `%${substring}%`);
      query += 'WHERE fooddescription ILIKE $1 ';
      for (let i = 2; i <= values.length; i++) query += `AND fooddescription ILIKE $${i} `;
   }

   // add foodGroup restriction
   if (foodGroupId) {
      if (values.length == 0) query += 'WHERE ';
      else query += 'AND ';
      values.push(foodGroupId);
      query += `foodgroupid=$${values.length} `;
   }

   // tag the limit on to the end of the query
   if (limit) {
      values.push(limit);
      query += `LIMIT $${values.length}`;
   }

   const data = await postgresConnection.query(query, values);
   // change the data to make it usable by the client
   data.rows = data.rows.map(row => { return { foodId: row.foodid, foodDescription: row.fooddescription } });
   return res.status(200).json({ message: "ingredient list collected from server", payload: data.rows });
}






exports.groups = async (req, res) => {
   const data = await postgresConnection.query('select * from foodgroup');
   console.log(data.rows);
   // change the data to make it usable by the client
   data.rows = data.rows.map(row => { return { foodGroupId: row.foodgroupid, foodGroupName: row.foodgroupname } });
   return (res.status(200).json({ message: "ingredient groups collected from server", payload: data.rows }));
};