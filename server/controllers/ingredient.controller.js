const postgresConnection = require('../config/postgres');
const { conversionFactorList } = require('../library/canadianNutrientFileUtils');
const ingredientUtils = require('../library/ingredientUtils');
const { update } = require('./recipe.controller');


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
returns a list of ingredients based on search criteria
@route: GET /ingredient/find
*/
exports.find = async (req, res) => {
   const {foodDescription, foodGroupId, skip = 0, limit = 15, includeCommonNames = true, count = false} = req.query

   // keep track of whats been grabbed from the database so far
   let currentCount = 0
   let ingredientDataArray = [];

   // ingredientObjectArray will be used to store the final results at the end
   let ingredientObjectArray = [];

   // function for adding the offset and limit to a query and values array
   function attachQueryLimits(query, values) {

      // add the offset field if applicable
      const updatedSkip = skip - currentCount;
      if (skip > 0) {
         query += ` OFFSET $${values.length + 1}`;
         values.push(updatedSkip);
      }

      // add the limit field if applicable
      const updatedLimit = limit - currentCount;
      query += ` LIMIT $${values.length + 1}`;
      if (updatedLimit > 0) { values.push(updatedLimit); }
      else { values.push(0); }

      // only query must be returned functions send arrays to functions as pointers but not strings
      return query;
   }

   // this try block collects all ingredients matching the search criteria inside the common_food_names table
   // this only gets used if includeCommonNames is true and foodGroupId is not provided
   try {
      if (includeCommonNames && !foodGroupId && currentCount < limit) { 
         
         let queryFilter = ''
         let values = [];

         // create the foodDescription portion of the query filter
         if (foodDescription) {
            const foodDescriptionArray = foodDescription.split(" ");
            queryFilter += ' WHERE common_name ILIKE $1';
            for (let i = 2; i <= foodDescriptionArray.length; i++) { queryFilter += ` AND common_name ILIKE $${i}`; }
            values = foodDescriptionArray.map((substring) => { return `%${substring}%` });
         }

         // get a count of all results that match search criteria
         let query = 'SELECT COUNT(*) FROM common_food_names' + queryFilter;
         console.log("query: ", query);
         console.log("values: ", values);
         const countData = await postgresConnection.query(query, values);

         // collect the actual data from the common_food_names table
         query = 'SELECT food_id, common_name FROM common_food_names' + queryFilter;
         query = attachQueryLimits(query, values);
         const ingredientData = await postgresConnection.query(query, values);

         // send the collected variables to the parent function
         currentCount += parseInt(countData.rows[0].count);
         ingredientDataArray = ingredientData.rows;
      }
   }
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "ingredient.controller.find failed... unable to collect common ingredient names from database");
      console.error(error);
      return res.status(500).json({ error: 'server failed to collect ingredient list from database' });
   }

   // this try block collects all ingredients matching the search criteria inside the food_name table
   // this only gets used if ingredientDataArray has not yet reached its limit
   try {
      if (currentCount < limit) {

         let queryFilter = '';
         let values = [];

         // create the foodDescription portion of the query filter
         if (foodDescription) {
            const foodDescriptionArray = foodDescription.split(" ");
            queryFilter += ' WHERE food_description ILIKE $1';
            for (let i = 2; i <= foodDescriptionArray.length; i++) { queryFilter += ` AND food_description ILIKE $${i}`; }
            values = foodDescriptionArray.map((substring) => { return `%${substring}%` });
         }

         // create the foodGroupId portion of the query filter
         if (foodGroupId) {
            if (values.length == 0) { queryFilter += ' WHERE'; }
            else { queryFilter += ' AND'; }
            queryFilter += ` food_group_id=$${values.length + 1}`;
            values.push(foodGroupId);
         }

         // if count is true, get the count of all results that match search criteria
         let countData;
         if (count) {
            query = 'SELECT COUNT(*) FROM food_name' + queryFilter;
            countData = await postgresConnection.query(query, values);
         }

         // collect the actual data from the food_name table and add it to ingredientDataArray
         let query = 'SELECT food_id, Food_description FROM food_name' + queryFilter;
         query = attachQueryLimits(query, values);
         const ingredientData = await postgresConnection.query(query, values);

         // send the collected variables to the parent function
         if(countData) { currentCount += parseInt(countData.rows[0].count); } 
         ingredientDataArray = [...ingredientDataArray, ...ingredientData.rows];
      }
   }
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "ingredient.controller.list failed... unable to collect ingredient list from database");
      console.error(error);
      return res.status(500).json({ error: 'server failed to collect ingredient list from database' });
   }

   // This try block formats ingredientDataArray into usable objects
   try {
      ingredientObjectArray = await Promise.all( ingredientDataArray.map(async (ingredientData) => {
         const formattedIngredient = { foodId: ingredientData.food_id, foodDescription: ingredientData.food_description, commonName: ingredientData.common_name };
         const ingredientObject = await ingredientUtils.verifyObject(formattedIngredient, false);
         return ingredientObject;
      }));
   }
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "ingredient.controller.list failed... unable to convert ingredient list into usable objects");
      console.error(error);
      return res.status(500).json({ error: 'server failed to convert ingredient list into usable objects' });
   }

   payload = { ingredientObjectArray }
   if (count) { payload.count = currentCount; }

   return res.status(200).json({ message: "ingredient list collected from server", payload });
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