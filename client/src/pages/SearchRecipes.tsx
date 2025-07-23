import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleXmark } from '@fortawesome/free-regular-svg-icons';

import Notebook from '../components/Notebook';
import PageObject from '../interfaces/PageObject';
import RecipeObject from '../interfaces/RecipeObject';
import IngredientObject from '../interfaces/IngredientObject';
import RecipePreview from '../components/notebookPages/RecipePreview';
import axios from '../api/axios';
import Loading from '../components/Loading';

export default function PublicRecipes() {

   const { category } = useParams<{ category: "public" | "friends" | "personal" }>();
   const [searchParams, setSearchParams] = useSearchParams();
   const pageNumber: number = Number(searchParams.get('pageNumber')) || 1;
   const titleParam: string | null = searchParams.get('title') || null;
   const foodIdParam: string | null = searchParams.get('foodIdList') || null;
   const foodIdList: number[] | null = foodIdParam ? foodIdParam.split(',').map(Number) : null;

   // state variables for saving the current search parameters
   const [recipeTitle, setRecipeTitle] = useState<string>('');
   const [ingredientList, setIngredientList] = useState<IngredientObject[]>([]);

   const [useStatesDefined, setUseStatesDefined] = useState<boolean>(false); // used to ensure that the useStates are defined before running the useEffects

   // state variables for saving the current recipe information
   const [recipeList, setRecipeList] = useState<RecipeObject[]>([]);
   const [recipeCount, setRecipeCount] = useState<number>(0);

   // state variable for saving the actual components being sent to the notebook
   const [pageList, setPageList] = useState<PageObject[]>([]);

   // send parameters to the url
   function handleSubmit(title: string, ingredients: IngredientObject[]) {

      // create params object
      let newParams: {title?: string, foodIdList?: string } = {};
      if (title) { newParams.title = title; } // add the title field if applicable

      if (ingredients.length > 0) {  // add the foodIdList field if applicable
         const foodIdList: string[] = ingredients.map((ingredient) => { return ingredient.foodId;  }); // get a list of food ids
         newParams.foodIdList = foodIdList.join(','); // save them in the url as a comma separated string
      }
      setSearchParams(newParams); // update the url with the new params
   }

   // fetches the recipes being displayed on a given page and places them directly into the recipeList state variable
   function fetchPageContent(requestPage: number) {
      let url = `recipe/find?category=${category}`
      if (recipeTitle) { url += `&title=${recipeTitle}`; }
      if (foodIdList && foodIdList.length > 0) { 
         const foodIdParams = foodIdList.map(id => `foodIdList[]=${encodeURIComponent(id)}`).join('&');
         url += `&${foodIdParams}`;
      }
      if (requestPage == 1) { url += `&limit=1&skip=0`; }
      else { url += `&limit=2&skip=${((requestPage - 1) * 2) - 1}`; }
      url += `&count=true&includeNutrition=true`
      axios({method: 'get', url})
      .then((response) => {
         if (response.count == undefined) { 
            console.error("server failed to return count"); 
            return;
         }
         const maxPages = Math.round(((response.count + 1) / 2));
         if (maxPages >= requestPage) {
            setRecipeList(response.recipeObjectArray);
            setRecipeCount(response.count);
         }
         else { handlePageChange(maxPages) }
      });
   }

   // handle the logic for changing the page
   function handlePageChange(newPage: number) {
      const newParam = new URLSearchParams(searchParams.toString());
      newParam.set('pageNumber', newPage.toString());
      setSearchParams(newParam);

      fetchPageContent(newPage); // fetch the recipes for the new page
   }

   // set the recipe filters when the the url is set/changed
   useEffect(() => {
      // set the recipe title if it exists
      setRecipeTitle(titleParam || "");

      // set the ingredient list if it exists
      if (foodIdList && foodIdList.length > 0) {
         Promise.all(
            foodIdList.map((foodId) => {
               return axios({method: 'get', url: `ingredient/getObject/${foodId}`})
               .then((response) => { return response });
            })
         )
         .then((allIngredients: IngredientObject[]) => {
            setIngredientList(allIngredients);
         })
      }
      else {
         setIngredientList([]);
      }

      // set the useStatesDefined to true so that the other useEffects can run
      setUseStatesDefined(true);
   }, [searchParams, category]);

   // triggers fetchPageContent when filters have been set/changed
   useEffect(() => {
      if (!useStatesDefined) { return; } // if the useStates are not defined, do not run this useEffect
      fetchPageContent(pageNumber); // fetch the recipes for the current page
   }, [recipeTitle, ingredientList, useStatesDefined]);

   // converts the contents of recipeList to a PageObject array and saving it to pageList
   useEffect(() => { 
      // if the useStates are not defined, do not run this useEffect
      if (!useStatesDefined) { return; }

      let newPageList: PageObject[] = [];
      if (pageNumber == 1) {
         newPageList = [{
            content: FilterSearchPage,
            props: {
               parentTitle: recipeTitle,
               parentIngredientList: ingredientList,
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

   // if the useStates are not defined, show loading
   if (!useStatesDefined) { return <Loading /> }

   return <Notebook pageList={pageList} parentPageNumber={pageNumber} requestNewPage={handlePageChange} pageCount={recipeCount + 1}/>
}

interface FilterSearchPageProps {
   parentTitle: string;
   parentIngredientList: IngredientObject[];
   handleSubmit: (recipeTitle: string, ingredientList: IngredientObject[]) => void;
}

function FilterSearchPage({parentTitle, parentIngredientList, handleSubmit}: FilterSearchPageProps) {

   // variables for saving whats currently being typed into the text inputs
   const [recipeTitle, setRecipeTitle] = useState<string>(parentTitle || '');
   const [ingredientList, setIngredientList] = useState<IngredientObject[]>(parentIngredientList || []);
   
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

      axios({method: 'get', url: `ingredient/find?foodDescription=${value}&limit=12`})
      .then(response => { setIngredientsAvailable(response.ingredientObjectArray); })
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

   function submitChanges() {
      handleSubmit(recipeTitle, ingredientList);
   }

   return (
      <div className='standardContent'>
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
                     <li key={index} onClick={() => selectIngredient(ingredient)}> {ingredient.commonName ? ingredient.commonName : ingredient.foodDescription} </li>
                  ))}
               </ul>
            </div>
            <div className='svgButtonContainer'>
               <FontAwesomeIcon icon={faCircleCheck} onClick={addIngredient}/>
            </div>
         </div>

         <ul className='displayList'>
            {ingredientList.map((ingredient, index) => (
               <li key={index} className='listItem'>
                  <div className='options'>
                     <FontAwesomeIcon icon={faCircleXmark} style={{color: "#575757",}} onClick={() => removeIngredient(index)} />
                  </div>
                  <p>[{ingredient.foodDescription}]</p>
               </li>
            ))}
         </ul>

         <button className='additionalMargin' onClick={submitChanges}> search </button>
      </div>
   )
}