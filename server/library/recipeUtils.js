const recipes = require('../models/recipe');
const ingredientUtils = require('./ingredientUtils');

/*
verifies that the object passed is a complete recipeObject
if not the function will attempt to complete the object
minimum expected input:
recipe: {
   _id: mongoose.Schema.Types.ObjectId,
}
optional input:
insideDatabase: boolean (default: true) - if false, function will not check the database for missing fields or require _id
*/
async function verifyObject (recipe, insideDatabase = true) {
   console.log("function called: " + "\x1b[36m%s\x1b[0m", "server/library/recipeUtils.verifyObject");

   let recipeObject = {};
   // set recipeObject to the recipe passed
   if (recipe.toObject) { recipeObject = recipe.toObject(); }
   else { recipeObject = recipe; }
   
   // make sure an _id field is present
   if (!recipe._id && insideDatabase) { throw new Error('missing _id field in recipe object'); }

   // define function to check for missing fields
   async function checkInvalidFields() {
      let found = [];
      if (insideDatabase && ( !recipeObject.owner || typeof recipeObject.owner == 'string' )) { found.push('owner'); }
      if (!recipeObject.title || typeof recipeObject.title != 'string') { found.push('title'); }
      if (!recipeObject.description || typeof recipeObject.description != 'string') { found.push('description'); }
      if (!recipeObject.image || typeof recipeObject.image != 'string') { found.push('image'); }
      try { recipeObject.ingredients = await Promise.all(recipeObject.ingredients.map(async (ingredient) => {
         const checkedIngredient = await ingredientUtils.verifyObject(ingredient, false); // call verifyObject from ingredientUtils
         if (!checkedIngredient.portion) { throw new Error('missing portion field in ingredient object'); } //make sure ingredient has a portion attached
         return checkedIngredient;
      }));}
      catch (error) { 
         found.push('ingredients'); 
         console.error(error); 
      }
      try { recipeObject.instructions.forEach((instruction) => { if (typeof instruction != 'string') found.push('instructions'); }); } 
      catch (error) { 
         found.push('instructions'); 
         console.error(error); 
      }
      return found;
   }

   // check for any missing fields in the recipe object
   let invalidFields = await checkInvalidFields();

   if (invalidFields.length == 0) { return recipeObject; } // no missing fields return object
   if (!insideDatabase) { throw new Error('missing fields in recipe object: ' + invalidFields.join(', ')); } // return error if insideDatabase is false

   // search the database for any missing fields
   try {
      const updatedRecipe = await recipes.findOne({ _id: recipe._id }, invalidFields.join(' '));
      if (!updatedRecipe) { throw new Error('recipe not found in database'); }
      invalidFields.forEach((field) => { recipeObject[field] = updatedRecipe[field]; });
   }
   catch (error) {
      console.log("failed to search database for missing fields belonging to recipe:", recipe);
      console.error(error);
      throw new Error('failed to search database for missing fields');
   }

   // make sure all fields are present after searching the database
   invalidFields = await checkInvalidFields();
   if (invalidFields.length != 0) { throw new Error('missing fields in recipe object: ' + invalidFields.join(', ')); }

   // check if the nutrition field is present, if not attach it
   if (!recipeObject.nutrition) { recipeObject = await attachNutritionField(recipeObject); }
   else {
      const requiredNutritionFields = ['calories', 'fat', 'cholesterol', 'sodium', 'potassium', 'carbohydrates', 'fibre', 'sugar', 'protein'];
      for (const field of requiredNutritionFields) {
         if (recipeObject.nutrition[field] == null || typeof recipeObject.nutrition[field] != 'number') {
            recipeObject = await attachNutritionField(recipeObject);
            break;
         }
      }
   }

   // make sure any additional fields are removed
   return {
      ...(insideDatabase ? { _id: recipeObject._id, } : {}),
      owner: recipeObject.owner,
      title: recipeObject.title,
      description: recipeObject.description,
      image: recipeObject.image,
      ingredients: recipeObject.ingredients,
      instructions: recipeObject.instructions,
      nutrition: {
         calories: recipeObject.nutrition.calories,
         fat: recipeObject.nutrition.fat,
         cholesterol: recipeObject.nutrition.cholesterol,
         sodium: recipeObject.nutrition.sodium,
         potassium: recipeObject.nutrition.potassium,
         carbohydrates: recipeObject.nutrition.carbohydrates,
         fibre: recipeObject.nutrition.fibre,
         sugar: recipeObject.nutrition.sugar,
         protein: recipeObject.nutrition.protein
      }
   }
}

/*
attaches the nutrition field to a recipeObject
minimum expected input:
recipe: {
   ingredients: [{
      foodId: int,
      portion: {
         measureId: int,
         amount: int
      }
   }]
}
*/
async function attachNutritionField (recipe) {
   console.log("function called: " + "\x1b[36m%s\x1b[0m", "server/library/recipeUtils.attachNutritionField");

   if (!recipe.ingredients) { throw new Error('missing ingredients field in recipe object'); }

   let totalNutrients = { calories: 0, fat: 0, cholesterol: 0, sodium: 0, potassium: 0, carbohydrates: 0, fibre: 0, sugar: 0, protein: 0 };

   try {
      for (let ingredient of recipe.ingredients) {
         if (!ingredient.nutrition) { ingredient = await ingredientUtils.attachNutritionField(ingredient); }

         totalNutrients.calories += ingredient.nutrition.calories || 0;
         totalNutrients.fat += ingredient.nutrition.fat || 0;
         totalNutrients.cholesterol += ingredient.nutrition.cholesterol || 0;
         totalNutrients.sodium += ingredient.nutrition.sodium || 0;
         totalNutrients.potassium += ingredient.nutrition.potassium || 0;
         totalNutrients.carbohydrates += ingredient.nutrition.carbohydrates || 0;
         totalNutrients.fibre += ingredient.nutrition.fibre || 0;
         totalNutrients.sugar += ingredient.nutrition.sugar || 0;
         totalNutrients.protein += ingredient.nutrition.protein || 0;

      }
   }
   catch (error) {
      console.log('failed to collect nutrient data for recipe:', recipe);
      console.error(error);
      throw new Error ('failed to collect nutrient data from database');
   }

   return { ...recipe, nutrition: totalNutrients };
}

module.exports = {
   verifyObject,
   attachNutritionField
};