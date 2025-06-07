import { useParams } from "react-router-dom";

export default function Recipe() {

   // Manual URL extraction of the recipeId
   const urlSection = window.location.pathname.match(/\/Recipe\/(.+)/);
   const recipeId = urlSection ? urlSection[1] : null;

   if ( !recipeId ) {
      return <p>Error: Recipe ID not found.</p>;
   }

   return (
      <div>
         <p> {recipeId} </p>
      </div>
   );
}