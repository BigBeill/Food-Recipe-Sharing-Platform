const recipeUtils = require("../library/recipeUtils");
const userUtils = require("../library/userUtils");
const recipes = require("../models/recipe");
const users = require("../models/user");

// IMPORTANT: go to server/routes/recipe.router.js for a more detailed explanations



/*
finds a recipeObject based of id provided
@route: GET /recipe/getObject
*/
exports.getObject = async (req, res) => {

   const userId = req.user?._id;
   const { recipeId, includeNutrition = false } = req.params;

   if (includeNutrition) { console.log("includeNutrition is true, nutrition field will be attached to recipe object"); }
   else { console.log("includeNutrition is false, nutrition field will not be attached to recipe object"); }

   const recipe = {
      _id: recipeId
   }

   // get recipe object from recipeUtils
   let recipeObject;
   try {
      recipeObject = await recipeUtils.verifyObject(recipe, true, includeNutrition);

      // return recipe if client is the owner or the recipe is public
      if (recipe.visibility == "public") { return res.status(200).json({ message: "recipe object found", payload: recipeObject }); }
   }
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "recipe.controller.getObject failed... unable to create recipe object");
      console.error(error);
      return res.status(500).json({ error: 'server failed to convert provided data into a recipe object' })
   }

   // logic for handling the return of non-public recipes
   try {
      // check if the user is signed in
      if (!userId) { return res.status(401).json({ error: "user must be signed in to access a non public recipe" }); }

      // check if the user is the owner of the recipe
      if (recipeObject.owner == userId) { return res.status(200).json({ message: "recipe object found", payload: recipeObject }); }

      // check if the recipe is private
      if (recipeObject.visibility == "personal") { return res.status(403).json({ error: "current user does not have read access to the recipe" }); }

      // check if the user is friends with the owner of the recipe
      const isFriend = await userUtils.isFriend({ _id: userId }, recipeObject.owner);
      if (isFriend) { return res.status(200).json({ message: "recipe object found", payload: recipeObject }); }
      else { return res.status(403).json({ error: "current user does not have read access to the recipe" }); }
   }
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "recipe.controller.getObject failed... unable to verify clients access to recipe object");
      console.error(error);
      return res.status(500).json({ error: 'server failed to verify if the client has read access to the recipe' });
   }
}



/*
finds a list of recipes in the database that match the query parameters
@route: GET /recipe/find
*/
exports.find = async (req, res) => {

   // get query parameters from request
   const { title, foodIdList, limit, skip, count, category = 'public', includeNutrition = false } = req.query;
   const userId = req.user?._id;

   // make sure user is signed in if visibility is not public
   if ( category != 'public' && !userId) { return res.status(401).json({ error: "user must be signed in to access a non public visibility" }); }
   
   let recipeData = [];
   let query = {};

   if (category == "public") {
      // only return public recipes
      query.visibility = "public";
   }

   // if searching the friends category, get an array of all friends and attach them to the query
   if (category == "friends") {
      try {
         // get a list of user _ids that the current user is friends with
         const friendList = await userUtils.getFriendList({_id: userId}, false);

         // add the friend _ids to the query
         query.owner = { $in: friendList };
         query.visibility = { $in: ["public", "friends"] }; // only return public and friends recipes
      }
      catch (error) {
         console.log("\x1b[31m%s\x1b[0m", "recipe.controller.find failed... unable to define valid user _ids for query");
         console.error(error);
         return res.status(500).json({ error: "server failed to define valid user _ids for query" });
      }
   }

   // if searching the personal category, attach current users id to the query
   if (category == "personal") { query.owner = userId; }

   try {
      if (title) { query.title = { $regex: new RegExp(title, 'i') } }
      if (foodIdList) { query["ingredients.foodId"] = { $all: foodIdList }; }
      console.log("Query: ", query);
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
      const recipeObjectArray = await Promise.all(recipeData.map((recipe) => { return recipeUtils.verifyObject(recipe, true, includeNutrition); }));
      let payload = { recipeObjectArray };

      if (count) {
         const recipeCount = await recipes.countDocuments(query);
         payload.count = recipeCount;
      }

      return res.status(200).json({ message: "recipes found", payload });
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
      if (!recipe.visibility) { recipe.visibility = "public"; }
      const recipeObject = await recipeUtils.verifyObject(recipe, false);
      req.recipeObject = recipeObject;
      console.log("Recipe Object: ", req.recipeObject);
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

   recipeId = req.body._id;

   // check if recipe _id was provided
   if (!recipeId) return res.status(400).json({ error: 'recipe _id needs to be provided' });

   // grab recipe object from req and attach _id to it
   const recipeObject = req.recipeObject;

   try {
      // find recipe being updated in database
      const recipeData = await recipes.findOne({ _id: recipeId });

      // make sure current user is the owner of found recipe
      if (!recipeData.owner == req.user) { return res.status(403).json({ error: 'current user does not have write access to this recipe' }); }

      // update recipe in database
      await recipes.updateOne({ _id: recipeId }, { $set: recipeObject });

      return res.status(201).json({ message: 'recipe saved successfully' });
   }

   // handle any errors caused by the controller
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "recipe.controller.update failed... unable to save recipeObject to database");
      console.error(error);
      return res.status(500).json({ error: 'server failed to update recipe' });
   }
}






/*
deletes a recipe from the database
@route: DELETE /recipe/edit
*/
exports.delete = async (req, res) => {

   const userId = req.user?._id;
   const { recipeId } = req.params;

   if (!userId) { return res.status(401).json({ error: "user must be signed in to delete a recipe" }); }

   // make sure client as access to the recipe being deleted
   try {
      const recipe = await recipeUtils.verifyObject({ _id: recipeId }, true);
      if (recipe.owner != userId) { return res.status(403).json({ error: "current user does not have write access to this recipe" }); }
   }
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "recipe.controller.deleteRecipe failed... unable to verify recipe object");
      console.error(error);
      return res.status(500).json({ error: 'server failed to verify recipe object' });
   }

   // delete the recipe from the database
   try {
      await recipes.deleteOne({ _id: recipeId });
      return res.status(200).json({ message: 'recipe deleted successfully' });
   }
   catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "recipe.controller.deleteRecipe failed... unable to delete recipe from database");
      console.error(error);
      return res.status(500).json({ error: 'server failed to delete recipe' });
   }
}