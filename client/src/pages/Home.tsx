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
   const foodIdParam: string | null = searchParams.get('foodIdList') || null;
   const foodIdList: number[] | null = foodIdParam ? foodIdParam.split(',').map(Number) : null;

   const [recipeTitle, setRecipeTitle] = useState<string>('');
   const [ingredientList, setIngredientList] = useState<IngredientObject[]>([]);

   const [recipeList, setRecipeList] = useState<RecipeObject[]>([]);
   const [recipeCount, setRecipeCount] = useState<number>(0);

   const [pageList, setPageList] = useState<PageObject[]>([]);

   // send parameters to the url
   function handleSubmit() {
      // create params object
      let newParams: {title?: string, foodIdList?: string } = {};
      if (recipeTitle) { newParams.title = recipeTitle; } // add the title field if applicable
      if (ingredientList.length > 0) {  // add the foodIdList field if applicable
         const foodIdList: string[] = ingredientList.map((ingredient) => { return ingredient.foodId;  }); // get a list of filed ids
         newParams.foodIdList = foodIdList.join(','); // save them in the url as a comma separated string
      }
      setSearchParams(newParams); // update the url with the new params
   }

   // handle fetching page contents
   function handlePageChange(newPage: number) {

      const newParam = new URLSearchParams(searchParams.toString());
      newParam.set('pageNumber', newPage.toString());
      setSearchParams(newParam);

      setRecipeList([]);

      axios({method: 'get', url: `recipe/find?limit=${newPage == 1 ? 1 : 2}&skip=${newPage == 1 ? 0 : (((newPage - 1) * 2) - 1)}&count=true`})
      .then((response) => {
         if (!response.count) { 
            console.error("server failed to return count"); 
            return;
         }
         const maxPages = Math.round(((response.count + 1) / 2));
         if (maxPages >= newPage) {
            setRecipeList(response.recipeObjectArray);
            setRecipeCount(response.count);
         }
         else { handlePageChange(maxPages) }
      });
   }

   // on object mount, add any ingredients inside the url to the ingredientList
   useEffect(() => {
      if(!foodIdList) { return; } // if there are no foodIds, do nothing
      foodIdList?.forEach((foodId) => {
         axios({method: 'get', url: `ingredient/getObject/${foodId}`})
         .then(response => { setIngredientList((list: IngredientObject[]) => [...list, response]); });
      });
   }, []);

   // when ingredientList changes, request new recipeList
   useEffect(() => {
      handlePageChange(pageNumber);
   }, [ingredientList]);

   // useEffect for converting contents of recipeList into a PageObject array and saving it to pageList
   useEffect(() => {
      let newPageList: PageObject[] = [];
      if (pageNumber == 1) {
         newPageList = [{
            content: MainPage,
            props: {
               recipeTitle,
               setRecipeTitle,
               ingredientList,
               setIngredientList,
               handleSubmit
            }
         }]
      }

      recipeList.forEach((recipe) => {
         newPageList.push({
            content: RecipePreview,
            props: {
               recipe
            }
         })
      })

      setPageList(newPageList);
   }, [recipeList]);

   return <Notebook pageList={pageList} parentPageNumber={pageNumber} requestNewPage={handlePageChange} pageCount={recipeCount + 1}/>
}

interface MainPageProps {
   recipeTitle: string;
   setRecipeTitle: React.Dispatch<React.SetStateAction<string>>;
   ingredientList: IngredientObject[];
   setIngredientList: React.Dispatch<React.SetStateAction<IngredientObject[]>>;
   handleSubmit: () => void;
}

function MainPage({recipeTitle, setRecipeTitle, ingredientList, setIngredientList, handleSubmit}: MainPageProps) {

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
      .then(response => { setIngredientsAvailable(response); })
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
            <input type='text' value={recipeTitle} onChange={(event) => setRecipeTitle(event.target.value)} placeholder='recipe name' />
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