import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import RecipeObject from "../interfaces/RecipeObject";
import axios from "../api/axios";

interface RecipeParams {
   recipe: RecipeObject
}

export default function Recipe({recipe}: RecipeParams) {
   const navigate = useNavigate();

   const { recipeId } = useParams<{ recipeId: string }>();
   const [recipeObject, setRecipeObject] = useState<RecipeObject | null>(null);

   useEffect(() => {
      if (recipe) { setRecipeObject(recipe); }
      else if (!recipeId){ navigate("/home"); }
      else {
         axios({ method:'get', url:`/recipe/getObject${recipeId}` })
         .then((Response) => { setRecipeObject(Response.data); })
         .catch((error) => { console.error(error); });
      }
   }, [recipeId, recipe]);

   if ( !recipeObject ) {
      return <p>Error: Recipe ID not found.</p>;
   }

   return (
      <div>
         <h1>{recipeObject.title}</h1>
         <p>{recipe.image}</p>
         <h2>Nutrition</h2>
         <ul>
            { recipe.nutrition ? 
            <>
               <li>Calories: {recipe.nutrition.calories}</li>
               <li>Fat: {recipe.nutrition.fat}</li>
               <li>Cholesterol: {recipe.nutrition.cholesterol}</li>
               <li>Sodium: {recipe.nutrition.sodium}</li>
               <li>Potassium: {recipe.nutrition.potassium}</li>
               <li>Carbohydrates: {recipe.nutrition.carbohydrates}</li>
               <li>Fibre: {recipe.nutrition.fibre}</li>
               <li>Sugar: {recipe.nutrition.sugar}</li>
               <li>Protein: {recipe.nutrition.protein}</li>
            </>
            : null }
         </ul>
         <h2>Ingredients</h2>
         <ul>
            {recipeObject.ingredients.map((ingredient, index) => (
               <li key={index}>
                  {ingredient.portion?.amount} {ingredient.portion?.measureDescription} of {ingredient.foodDescription}
               </li>
            ))}
         </ul>
         <h2>Instructions</h2>
         <ol>
            {recipeObject.instructions.map((instruction, index) => (
               <li key={index}>{instruction}</li>
            ))}
         </ol>
      </div>
   );
}