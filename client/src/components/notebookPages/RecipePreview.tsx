import { useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

import RecipeObject from "../../interfaces/RecipeObject";
import GrowingText from "../GrowingText";
import Popup from "../Popup";
import Recipe from "../../pages/Recipe";

interface RecipePreviewProps {
   recipe: RecipeObject;
}

export default function RecipePreview({ recipe }: RecipePreviewProps) {
   const navigate = useNavigate();
   const { userId } = useOutletContext<{userId: string}>();

   const titleRef = useRef(null);
   const [showRecipe, setShowRecipe] = useState<boolean>(false);
   const [baseUrl, setBaseUrl] = useState<string>("");

   function displayRecipe() {
      setBaseUrl(window.location.href);
      window.history.pushState({}, '', `/Recipe/${recipe._id}`);
      setShowRecipe(true);
   }

   function closePopup() {
      window.history.pushState({}, '', baseUrl);
      setShowRecipe(false);
   }

   return (
      <>
      <div className="recipeObjectView previewPage">
         <div className="titleContainer" ref={titleRef}>
            <GrowingText text={recipe.title} parentDiv={titleRef}/>
         </div>
         <p className="image">{recipe.image}</p>
         <p className="description">{recipe.description}</p>
         <div className="ingredients">
            <p>Ingredients:</p>
            <ul>
               {recipe.ingredients.map((ingredient, index) => (
                  <li key={index}>
                     {ingredient.label ? ingredient.label : ingredient.portion?.amount + " " + ingredient.portion?.measureDescription + " of [" + ingredient.foodDescription + "]"}
                  </li>
               ))}
            </ul>
         </div>
         <div className="displayNutritionalInformation">
            { recipe.nutrition ? 
            <>
               <p>Calories: {recipe.nutrition.calories.toFixed(2)}</p>
               <p>Fat: {recipe.nutrition.fat.toFixed(2)}</p>
               <p>Cholesterol: {recipe.nutrition.cholesterol.toFixed(2)}</p>
               <p>Sodium: {recipe.nutrition.sodium.toFixed(2)}</p>
               <p>Potassium: {recipe.nutrition.potassium.toFixed(2)}</p>
               <p>Carbohydrates: {recipe.nutrition.carbohydrates.toFixed(2)}</p>
               <p>Fibre: {recipe.nutrition.fibre.toFixed(2)}</p>
               <p>Sugar: {recipe.nutrition.sugar.toFixed(2)}</p>
               <p>Protein: {recipe.nutrition.protein.toFixed(2)}</p>
            </>
            : null }
         </div>

         <div className="bottomButtons splitSpace">
            <button onClick={displayRecipe}> View Recipe </button>
            { recipe.owner == userId ? 
               <button onClick={() => {navigate(`/editRecipe/${recipe._id}`)}}>Edit Recipe</button>
               : null
            }
         </div>
         
      </div>
      
      {showRecipe && (
         <Popup Child={Recipe} childProps={{recipe: recipe}} closePopup={closePopup} />
      )}

      </>
   );
};