import IngredientObject from './IngredientObject'

export default interface RecipeObject {
   _id: string | null;
   title: string;
   description: string;
   image: string;
   ingredients: IngredientObject[];
   instructions: string[];
   nutrition?: {
      calories: number;
      fat: number;
      cholesterol: number;
      sodium: number;
      potassium: number;
      carbohydrates: number;
      fibre: number;
      sugar: number;
      protein: number;
   }
}