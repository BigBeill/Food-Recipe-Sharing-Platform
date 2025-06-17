export default interface IngredientObject {
   foodId: string;
   label?: string;
   foodDescription: string;
   portion?: {
      measureId: string;
      measureDescription: string;
      amount: string | null;
   }
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