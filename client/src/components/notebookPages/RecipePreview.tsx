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

         </div>
         <div className="nutritionInformation">

         </div>
      </div>
   );
};