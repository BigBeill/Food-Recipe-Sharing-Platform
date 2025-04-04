const recipeUtils = require("../library/recipeUtils");
const recipes = require("../models/recipe");
const users = require("../models/user");

// IMPORTANT: go to server/routes/recipe.router.js for a more detailed explanations



/*

*/
exports.getObject = async (req, res) => {
   
   const { recipeId } = req.params;

   const recipe = {
      _id: recipeId
   }

   try {
      const recipeObject = await recipeUtils.verifyObject(recipe, true);
      return res.status(200).json({ message: "recipe object created", payload: recipeObject });
   }
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "recipe.controller.getObject failed... unable to create recipe object");
      console.error(error);
      return res.status(500).json({ error: 'server failed to convert provided data into a recipe object' })
   }
}



/*
finds a list of recipes in the database that match the query parameters
@route: GET /recipe/find
*/
exports.find = async (req, res) => {

   const { title, ingredients, limit, skip } = req.query;
   let recipeData = [];

   try {
      let query = {}
      if (title) { query.title = { $regex: new RegExp(title, 'i') } }
      if (ingredients) { query.ingredients = { $all: ingredients.split(',') } }
      recipeData = await recipes.find(query)
      .limit(limit)
      .skip(skip);
   }
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "recipe.controller.find failed... unable to fetch recipes from database");
      console.error(error);
      return res.status(500).json({ error: "server failed to find recipes" });
   }

   try {
      const recipeObjects = await Promise.all(recipeData.map((recipe) => { return recipeUtils.verifyObject(recipe); }));
      return res.status(200).json({ message: "recipes found", payload: recipeObjects });
   }
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "recipe.controller.find failed... unable to verify recipe objects before sending to client");
      console.error(error);
      return res.status(500).json({ error: "server failed to verify recipe objects" });
   }
}





/*
packages the data from the incoming request into a recipe schema
@route: n/a
*/
exports.packageIncoming = async (req, res, next) => {

   // make sure user is signed in
   if (!req.user) { return res.status(401).json({ error: 'user not signed in' }); }

   let recipe = req.body;
   if (!recipe.owner) { recipe.owner = req.user._id; }

   try {
      const recipeObject = await recipeUtils.verifyObject(recipe, false);
      req.recipeObject = recipeObject;
      next();
   }
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "recipe.controller.packageIncoming failed... unable to create recipe object");
      console.error(error);
      return res.status(500).json({ error: 'server failed to convert provided data into a recipe object' })
   }
}

/*
adds a new recipe to the database
@route: POST /recipe/edit
*/
exports.add = async (req, res) => {
   try {
      // create new recipe and save to database
      const newRecipe = await new recipes(req.recipeObject)
         .save();

      // add recipe to user's ownedRecipes list in database
      await users.updateOne({ _id: req.user._id }, { $push: { ownedRecipes: newRecipe._id } })

      return res.status(201).json({ message: 'new recipe created' });
   }
   // handle any errors caused by the controller
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "recipe.controller.add failed... unable to save recipeObject to database");
      console.error(error);
      return res.status(500).json({ error: 'server failed to save new recipe in the database' });
   }
}

/*
changes the contents of an existing recipe in the database
@route: PUT /recipe/edit
*/
exports.update = async (req, res) => {

   // check if recipe _id was provided
   if (!req.body._id) return res.status(400).json({ error: 'recipe _id was provided' });

   // grab recipe objet from req and attach _id to it
   const recipeObject = { ...req.recipeObject, _id: req.body._id };

   try {
      // find recipe being updated in database
      const recipe = await recipes.findOne({ _id: recipeObject._id });

      // make sure current user is the owner of found recipe
      if (!recipe.owner == req.user) { return res.status(401).json({ error: 'current user is not the owner of the recipe' }); }

      // update recipe in database
      await recipes.updateOne({ _id: req.body._id }, { $set: req.recipeSchema });

      return res.status(201).json({ message: 'recipe saved successfully' });
   }

   // handle any errors caused by the controller
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "recipe.controller.update failed... unable to save recipeObject to database");
      console.error(error);
      return res.status(500).json({ error: 'server failed to update recipe' });
   }
}