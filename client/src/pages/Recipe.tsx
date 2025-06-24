import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import RecipeObject from "../interfaces/RecipeObject";
import axios from "../api/axios";

interface RecipeParams {
   recipe?: RecipeObject
}

export default function Recipe({recipe}: RecipeParams) {
   const navigate = useNavigate();

   const { recipeId } = useParams<{ recipeId: string }>();
   const [recipeObject, setRecipeObject] = useState<RecipeObject | null>(null);

   useEffect(() => {
      if (recipe) { setRecipeObject(recipe); }
      else if (!recipeId){ navigate("/home"); }
      else {
         axios({ method:'get', url:`/recipe/getObject/${recipeId}` })
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
         <p>{recipeObject.image}</p>
         <h2>Nutrition</h2>
         <ul>
            { recipeObject.nutrition ? 
            <>
               <li>Calories: {recipeObject.nutrition.calories}</li>
               <li>Fat: {recipeObject.nutrition.fat}</li>
               <li>Cholesterol: {recipeObject.nutrition.cholesterol}</li>
               <li>Sodium: {recipeObject.nutrition.sodium}</li>
               <li>Potassium: {recipeObject.nutrition.potassium}</li>
               <li>Carbohydrates: {recipeObject.nutrition.carbohydrates}</li>
               <li>Fibre: {recipeObject.nutrition.fibre}</li>
               <li>Sugar: {recipeObject.nutrition.sugar}</li>
               <li>Protein: {recipeObject.nutrition.protein}</li>
            </>
            : null }
         </ul>

         <h2>Description</h2>
         <p>{recipeObject.description}</p>

         <h2>Ingredients</h2>
         <ul>
            {recipeObject.ingredients.map((ingredient, index) => (
               <li key={index}>
                  {ingredient.label ? ingredient.label :
                     ingredient.portion?.amount + " " + ingredient.portion?.measureDescription + " of " + ingredient.foodDescription
                  }
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