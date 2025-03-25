import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleXmark } from '@fortawesome/free-regular-svg-icons';

import Notebook from '../components/Notebook';
import PageObject from '../interfaces/PageObject';
import RecipeObject from '../interfaces/RecipeObject';
import IngredientObject from '../interfaces/IngredientObject';
import RecipePreview from '../components/notebookPages/RecipePreview';
import axios from '../api/axios';

export default function Home() {

   const [searchParams, setSearchParams] = useSearchParams();

   const pageNumber: number = Number(searchParams.get('pageNumber')) || 1;

   const [recipeName, setRecipeName] = useState<string>('');
   const [ingredientList, setIngredientList] = useState<IngredientObject[]>([]);

   const [recipes, setRecipes] = useState<RecipeObject[]>([]);

   useEffect(() => {
      axios({method: 'get', url: `recipe/find?limit=${pageNumber == 1 ? 1 : 2}&skip=${pageNumber == 1 ? 0 : ((pageNumber - 1) * 2) - 1 }`})
      .then(response => { setRecipes(response); });
   }, [searchParams])

   function handleSubmit() {
      setSearchParams({name: recipeName, ingredients: JSON.stringify(ingredientList)});
   }

   function handlePageChange(newPage: number) {
      setSearchParams(searchParams => ({...searchParams, pageNumber: newPage}));
   }

   let pageList: PageObject[] = [];

   if (pageNumber == 1) {
      pageList = [{
         content: MainPage,
         props: {
            recipeName,
            setRecipeName,
            ingredientList,
            setIngredientList,
            handleSubmit
         }
      }];
   }

   recipes.forEach((recipe) => {
      pageList.push({
         content: RecipePreview,
         props: {
            recipe
         }
      });
   });

   return <Notebook pageList={pageList} parentPageNumber={pageNumber} requestNewPage={handlePageChange}/>
}

interface MainPageProps {
   recipeName: string;
   setRecipeName: React.Dispatch<React.SetStateAction<string>>;
   ingredientList: IngredientObject[];
   setIngredientList: React.Dispatch<React.SetStateAction<IngredientObject[]>>;
   handleSubmit: () => void;
}

function MainPage({recipeName, setRecipeName, ingredientList, setIngredientList, handleSubmit}: MainPageProps) {

   const [newIngredient, setNewIngredient] = useState<IngredientObject>({foodId:"", foodDescription:""});
   const [ingredientsAvailable, setIngredientsAvailable] = useState<IngredientObject[]>([]);

   // handler for the onChange event of the ingredient text input
   function handleIngredientInputChange(event: React.ChangeEvent<HTMLInputElement>) {
      const value = event.target.value;

      setNewIngredient({foodId:"", foodDescription: value});
      if (event.target.value.length < 3) {
         setIngredientsAvailable([]);
         return; 
      }

      axios({method: 'get', url: `ingredient/list?foodDescription=${value}&limit=12`})
      .then(response => { 
         console.log(response);
         setIngredientsAvailable(response); 
      })
      .catch(error => { console.error('unable to fetch ingredients:', error); });
   }

   // handles an ingredient being selected from the search bar pop-up
   function selectIngredient (ingredient: IngredientObject) {
      setIngredientsAvailable([]);
      setNewIngredient(ingredient);
   }

   // handle adding an ingredient to the ingredient list
   function addIngredient() {
      if (!newIngredient.foodId) { return; }

      setIngredientList((list: IngredientObject[]) => [...list, newIngredient]);
      setNewIngredient({foodId:"", foodDescription:""});
   }

   // handle removing an ingredient from the ingredient list
   function removeIngredient(index: number) {
      let tempArray = ingredientList.slice();
      tempArray.splice(index, 1);
      setIngredientList(tempArray);
   }

   return (
      <div className='standardPage'>
         <h1>Public Recipes</h1>

         <div className='textInput additionalMargin'>
            <label>Name</label>
            <input type='text' value={recipeName} onChange={(event) => setRecipeName(event.target.value)} placeholder='recipe name' />
         </div>

         <div className='textInput sideButton additionalMargin'>
            <div className='activeSearchBar bottom'> {/* ingredient search bar */}
               <input type='text' value={newIngredient.foodDescription} onChange={handleIngredientInputChange} placeholder='Ingredient Name'/>
               <ul className={`${ingredientsAvailable.length == 0 ? 'hidden' : ''}`}>
               {ingredientsAvailable.map((ingredient, index) => (
                  <li key={index} onClick={() => selectIngredient(ingredient)}> {ingredient.foodDescription} </li>
               ))}
               </ul>
            </div>
            <div className='svgButtonContainer'>
               <FontAwesomeIcon icon={faCircleCheck} onClick={addIngredient}/>
            </div>
         </div>

         <ul className='displayList '>
            {ingredientList.map((ingredient, index) => (
               <li key={index} className='listItemContainer'>
                  <div className='itemOptions'>
                     <FontAwesomeIcon icon={faCircleXmark} style={{color: "#575757",}} onClick={() => removeIngredient(index)} />
                  </div>
                  <div className='listItem'> 
                     <p>{ingredient.foodDescription}</p>
                  </div>
               </li>
            ))}
         </ul>

         <button className='additionalMargin' onClick={handleSubmit}> search </button>
      </div>
   )
}