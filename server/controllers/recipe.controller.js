const { createRecipeSchema } = require("../library/validSchemaUtils");
const recipes = require("../models/recipe");
const users = require("../models/user");

// IMPORTANT: go to server/routes/recipe.router.js for a more detailed explanations

/*
returns all data associated with a given recipe id
@route: GET /recipe/data
*/
exports.data = async (req, res) => {
   const { _id } = req.query

   if (!_id) return res.status(400).json({error: "_id not provided"});

   try {
      // find recipe in database
      const data = await recipes.findOne({ _id:_id })

      // return error if recipe does not exist
      if(!data) return res.status(404).json({ error: "recipe with _id does not exist in database"});

      //return recipe data to client
      return res.status(200).json({ message: "recipe found", payload: data})
   }

   // handle any errors caused by the controller
   catch (error) {
      console.error(error);
      return res.status(500).json({ error: "server failed to find recipe" });
   }
}





/*
finds a list of recipes in the database that match the query parameters
@route: GET /recipe/find
*/
exports.find = async (req, res) => {

   const { title, ingredients, limit, skip } = req.query;

   try {
      let query = {}
      if (title) { query.title = {$regex: new RegExp(title, 'i')} }
      if (ingredients) { query.ingredients = {$all: ingredients.split(',')} }
      const data = await recipes.find(query)
      .limit(limit)
      .skip(skip);

      return res.status(200).json({ message: "recipes found", payload: data });
   }
   catch (error) {
      console.error(error);
      return res.status(500).json({ error: "server failed to find recipes" });
   }
}





/*
packages the data from the incoming request into a recipe schema
@route: n/a
*/
exports.packageIncoming = async (req, res, next) => {

   // make sure user is signed in
   if(!req.user) return res.status(401).json({ error: 'user not signed in' });

   createRecipeSchema(req.body, req.user._id)
   .then((response) => {
      req.recipeSchema = response;
      next();
   })
   .catch((error) => {
      try {
         // attempt to send detailed error back to client
         return res.status(error.status).json({ error: error.message});
      }
      catch (error) {
         // if server failed to send detailed error, send generic error to client
         console.error(error);
         return res.status(500).json({ error: "server failed to provide valid error response" });
      }
   });
}

/*
adds a new recipe to the database
@route: POST /recipe/edit
*/
exports.add = async (req, res) => {
   try {
      // create new recipe and save to database
      const newRecipe = await new recipes(req.recipeSchema)
      .save();

      // add recipe to user's ownedRecipes list in database
      await users.updateOne({_id: req.user._id}, { $push: { ownedRecipes: newRecipe._id } })

      return res.status(201).json({ message: 'new recipe created' });
   }

   // handle any errors caused by the controller
   catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'server failed to create new recipe' });
   }
}

/*
changes the contents of an existing recipe in the database
@route: PUT /recipe/edit
*/
exports.update = async (req, res) => {
   const { _id } = req.body;

   // check if recipe id was provided
   if (!_id) return res.status(400).json({ error: 'no recipe id provided' });

   try {
      // find recipe being updated in database
      const recipe = await recipes.findOne({_id: req.body._id})

      // make sure current user is the owner of found recipe
      if (!recipe.owner == req.user) return res.status(401).json({ error: 'current user is not the owner of the recipe' });

      // update recipe in database
      await recipes.updateOne({_id: req.body._id}, {$set: req.recipeSchema})
      
      return res.status(201).json({ message: 'recipe saved successfully' });
   }

   // handle any errors caused by the controller
   catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'server failed to update recipe' });
   }
}