const postgresConnection = require('../config/postgres');
const { breakupMeasureDescription } = require('./canadianNutrientFileUtils');


/*
verifies that the object passed is a complete ingredientObject
minimum expected input:
ingredient: {
   foodId: int,
}
if your expecting portion and nutrition to be present, minimum expected input:
ingredient: {
   foodId: int,
   portion: {
      measureId: int,
      amount: int
   }
}
includeNutrition: boolean (default true) - if false, nutrition will not be attached to the object
*/
async function verifyObject (ingredient, includeNutrition = true) {
   console.log("function called: " + "\x1b[36m%s\x1b[0m", "server/library/ingredientUtils.verifyObject");

   let ingredientObject = {};
   // set ingredientObject to the ingredient passed
   if (ingredient.toObject) { ingredientObject = ingredient.toObject(); }
   else { ingredientObject = ingredient; }
   
   // make sure an foodId field is present
   if (!ingredient.foodId) { throw new Error('missing foodId field in ingredient object'); }

   // check if food description is present
   if (!ingredient.foodDescription) { 
      try {
         const query = `SELECT food_description FROM food_name WHERE food_id = $1 LIMIT 1`;
         const values = [ingredient.foodId];
         const data = await postgresConnection.query(query, values);
         ingredientObject.foodDescription = data.rows[0].food_description;
      }
      catch (error) {
         console.log('failed to collect foodDescription from database for ingredient:', ingredient);
         console.error(error);
         throw new Error('failed to collect foodDescription from database');
      }
   }

   if (!ingredientObject.portion) {
      return {
         foodId: ingredientObject.foodId,
         foodDescription: ingredientObject.foodDescription
      }
   }

   // check for required missing fields
   if (!ingredientObject.portion.measureId || typeof ingredientObject.portion.measureId != 'number') { throw new Error('missing measureId field in ingredientObject portion'); }
   if (!ingredientObject.portion.amount || typeof ingredientObject.portion.amount != 'number') { throw new Error('missing amount field in ingredientObject portion'); }

   // check if measureDescription is present, if not attach it
   if (!ingredientObject.portion.measureDescription) {
      try {
         const query = `SELECT measure_description FROM measure_name WHERE measure_id = $1 LIMIT 1`;
         const values = [ingredient.portion.measureId];
         const data = await postgresConnection.query(query, values);
         const brokenMeasureDescription = breakupMeasureDescription(data.rows[0].measure_description);
         ingredientObject.portion.measureDescription = brokenMeasureDescription.string;
      }
      catch (error) {
         console.log('failed to collect measureDescription from database for ingredient:', ingredient);
         console.error(error);
         throw new Error('failed to collect measureDescription from database');
      }
   }

   if (!includeNutrition) {
      return {
         foodId: ingredientObject.foodId,
         foodDescription: ingredientObject.foodDescription,
         portion: {
            measureId: ingredientObject.portion.measureId,
            measureDescription: ingredientObject.portion.measureDescription,
            amount: ingredientObject.portion.amount
         }
      }
   }

   // check if nutrition is present, if not attach it
   if (!ingredientObject.nutrition) { ingredientObject = await attachNutritionField(ingredientObject); }
   else {
      const requiredNutritionFields = ['calories', 'fat', 'cholesterol', 'sodium', 'potassium', 'carbohydrates', 'fibre', 'sugar', 'protein'];
      for (const field of requiredNutritionFields) {
         if (ingredientObject.nutrition[field] == null || typeof ingredientObject.nutrition[field] != 'number') {
            ingredientObject = await attachNutritionField(ingredientObject);
            break;
         }
      }
   }

   // make sure no extra fields are present
   return {
      foodId: ingredientObject.foodId,
      foodDescription: ingredientObject.foodDescription,
      portion: {
         measureId: ingredientObject.portion.measureId,
         measureDescription: ingredientObject.portion.measureDescription,
         amount: ingredientObject.portion.amount
      },
      nutrition: {
         calories: ingredientObject.nutrition.calories,
         fat: ingredientObject.nutrition.fat,
         cholesterol: ingredientObject.nutrition.cholesterol,
         sodium: ingredientObject.nutrition.sodium,
         potassium: ingredientObject.nutrition.potassium,
         carbohydrates: ingredientObject.nutrition.carbohydrates,
         fibre: ingredientObject.nutrition.fibre,
         sugar: ingredientObject.nutrition.sugar,
         protein: ingredientObject.nutrition.protein
      }
   }
};


/*
attaches the nutrition field to an ingredientObject
minimum expected input:
ingredient: {
   foodId: int,
   portion: {
      measureId: int,
      amount: int
   }
}
*/
async function attachNutritionField (ingredient) {
   console.log("function called: " + "\x1b[36m%s\x1b[0m", "server/library/ingredientUtils.attachNutritionField");

   // check for any missing required fields
   if (!ingredient.foodId || !ingredient.portion || !ingredient.portion.measureId || !ingredient.portion.amount) { throw new Error('missing required fields in ingredient object');}

   let nutrients = { calories: 0, fat: 0, cholesterol: 0, sodium: 0, potassium: 0, carbohydrates: 0, fibre: 0, sugar: 0, protein: 0 };

   // get the base nutritional data for ingredient (per 100g)
   try {

      // query the database for the base nutritional data
      const query = `SELECT nutrient_id, nutrient_value FROM nutrient_amount WHERE food_id = $1 AND nutrient_id IN (203, 204, 205, 208, 269, 291, 306, 307, 601) ORDER BY nutrient_id;`;
      const values = [ingredient.foodId];
      const data = await postgresConnection.query(query, values);
      let nutritionData = data.rows;

      // if any data is missing, set it to 0
      {
         if (nutritionData[0].nutrient_id != 203) nutritionData.splice(0, 0, { nutrient_id: '203', nutrient_value: '0' } );
         if (nutritionData[1].nutrient_id != 204) nutritionData.splice(1, 0, { nutrient_id: '204', nutrient_value: '0' } );
         if (nutritionData[2].nutrient_id != 205) nutritionData.splice(2, 0, { nutrient_id: '205', nutrient_value: '0' } );
         if (nutritionData[3].nutrient_id != 208) nutritionData.splice(3, 0, { nutrient_id: '208', nutrient_value: '0' } );
         if (nutritionData[4].nutrient_id != 269) nutritionData.splice(4, 0, { nutrient_id: '269', nutrient_value: '0' } );
         if (nutritionData[5].nutrient_id != 291) nutritionData.splice(5, 0, { nutrient_id: '291', nutrient_value: '0' } );
         if (nutritionData[6].nutrient_id != 306) nutritionData.splice(6, 0, { nutrient_id: '306', nutrient_value: '0' } );
         if (nutritionData[7].nutrient_id != 307) nutritionData.splice(7, 0, { nutrient_id: '307', nutrient_value: '0' } );
         if (!nutritionData[8]) nutritionData.splice(8, 0, { nutrient_id: '601', nutrient_value: '0' } );
      }

      // put all values into a json file as parseInts
      nutrients = {
         calories: parseInt(nutritionData[3].nutrient_value),
         fat: parseInt(nutritionData[1].nutrient_value),
         cholesterol: parseInt(nutritionData[8].nutrient_value),
         sodium: parseInt(nutritionData[7].nutrient_value),
         potassium: parseInt(nutritionData[6].nutrient_value),
         carbohydrates: parseInt(nutritionData[2].nutrient_value),
         fibre: parseInt(nutritionData[5].nutrient_value),
         sugar: parseInt(nutritionData[4].nutrient_value),
         protein: parseInt(nutritionData[0].nutrient_value)
      }

      // convert all nutrients to per 1g
      Object.keys(nutrients).forEach((key) => { nutrients[key] /= 100 });
   }
   catch (error) {
      console.log('failed to collect nutritional data from database for ingredient:', ingredient);
      console.error(error);
      throw new Error('failed to collect nutrient data from database');
   }

   if (ingredient.portion.measureId != 1489) { // measureId 1489 is "g" (grams) and does not require conversion
      // apply the conversionFactorValue
      try {
         //get the conversionFactorValue
         const query = `SELECT conversion_factor_value FROM conversion_factor WHERE food_id = $1 AND measure_id = $2 LIMIT 1`;
         const values = [ingredient.foodId, ingredient.portion.measureId];
         const data = await postgresConnection.query(query, values);
         const conversionFactorValue = parseInt(data.rows[0].conversion_factor_value);

         // apply conversionFactorValue to each item in nutrition
         Object.keys(nutrients).forEach((key) => { nutrients[key] *= conversionFactorValue; });
      }
      catch (error) {
         console.log('failed to collect conversionFactorValue for ingredient:', ingredient);
         console.error(error);
         throw new Error('failed to collect conversionFactorValue for ingredient');
      }

      // divide by number of items in measureDescription
      try {
         //get the number of items in the measureDescription
         const query = `SELECT measure_description FROM measure_name WHERE measure_id = $1 LIMIT 1`;
         const values = [ingredient.portion.measureId];
         const data = await postgresConnection.query(query, values);
         const brokenMeasureDescription = breakupMeasureDescription(data.rows[0].measure_description);

         // divide the nutrients by the number of items in the measureDescription
         nutrients.map((nutrient) => { return nutrient / brokenMeasureDescription.integer });
      }
      catch (error) {
         console.log('failed to apply conversion factor to ingredient:', ingredient);
         console.error(error);
         throw new Error('failed to apply conversion factor to ingredient');
      }
   }

   // multiply by the amount
   return {...ingredient, nutrition: nutrients};
};

module.exports = { 
   verifyObject,
   attachNutritionField
};