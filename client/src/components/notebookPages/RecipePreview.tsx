import "../../styles/pageSpecific/recipePreview.scss";
import RecipeObject from "../../interfaces/RecipeObject";
import { useRef } from "react";

import GrowingText from "../GrowingText";

interface RecipePreviewProps {
   recipe: RecipeObject;
}

export default function RecipePreview({ recipe }: RecipePreviewProps) {
   const titleRef = useRef(null);

   return (
      <div className="recipePreviewPage">
         <div className="titleContainer" ref={titleRef}>
            <GrowingText text={recipe.title} parentDiv={titleRef}/>
         </div>
         <p className="image">🍗</p>
         <p className="description">{recipe.description}</p>
         <div className="ingredients">
            <p>Ingredients:</p>
            <ul>
               {recipe.ingredients.map((ingredient, index) => (
                     <li key={index}>{ingredient.portion?.amount} {ingredient.portion?.measureDescription} of {ingredient.foodDescription}</li>
               ))}
            </ul>
         </div>
         <div className="nutritionInformation">
            { recipe.nutrition ? 
            <>
               <p>Calories: {recipe.nutrition.calories}</p>
               <p>Fat: {recipe.nutrition.fat}</p>
               <p>Cholesterol: {recipe.nutrition.cholesterol}</p>
               <p>Sodium: {recipe.nutrition.sodium}</p>
               <p>Potassium: {recipe.nutrition.potassium}</p>
               <p>Carbohydrates: {recipe.nutrition.carbohydrates}</p>
               <p>Fibre: {recipe.nutrition.fibre}</p>
               <p>Sugar: {recipe.nutrition.sugar}</p>
               <p>Protein: {recipe.nutrition.protein}</p>
            </>
            : null }
         </div>
      </div>
   );
};