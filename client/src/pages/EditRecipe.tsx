// external imports
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPen } from '@fortawesome/free-solid-svg-icons';
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons';
import { Reorder } from 'framer-motion';

// internal imports
import axios from '../api/axios';
import Notebook from '../components/Notebook'
import { assignIds, removeIds } from '../tools/general'

import RecipeObject from '../interfaces/RecipeObject';
import UserObject from '../interfaces/UserObject';
import IngredientObject from '../interfaces/IngredientObject';

export default function NewEditRecipe () {

  // define react hooks
  const navigate = useNavigate();
  const { userData } = useOutletContext<{userData: UserObject}>();
  const [searchParams] = useSearchParams();

  //get recipeId if in url
  const recipeId = searchParams.get('recipeId');

  // make sure current user is signed in, otherwise redirect to login
  if (userData._id == "") navigate('/login');

  //define required useStates
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [image, setImage] = useState<string>('');
  const [ingredientList, setIngredientList] = useState<{id: number, content: IngredientObject}[]>([]);
  const [instructionList, setInstructionList] = useState<{id: number, content: string}[]>([]);

  //run useEffect on page start
  useEffect (() => {
    // if recipeId exists, populate the page with data from server for associated recipe
    if (recipeId) {
      axios({ method:'get', url:`recipe/data?_id=${recipeId}` })
      .then (response => {
        setTitle(response.title);
        setDescription(response.description);
        setImage(response.image);
        setIngredientList(assignIds(response.ingredients));
        setInstructionList(assignIds(response.instructions));
      })
      .catch(console.error);
    }
  },[])

  //function for sending recipe changes to server
  function submitRecipe(){

    //define what type of request is being sent to the server
    let method: string;
    if (!recipeId) method = 'post';
    else method = 'put';

    //package relevant data into recipeData
    const recipeData: RecipeObject = {
      _id: recipeId,
      title: title,
      description: description,
      image: image,
      ingredients: removeIds(ingredientList),
      instructions: removeIds(instructionList)
    }

    //send request to the server
    axios({ method:method, url:'recipe/edit', data: recipeData })
    .then(() => { navigate('/'); })
    .catch(console.error);
  }

  // create pageList, a list of all function (plus associated variables) that are apart of the edit recipe page.
  const pageList = [
    {
      content: GeneralInfoPage,
      props: {
        newRecipe: !recipeId,
        title,
        setTitle,
        description, 
        setDescription,
      }
    },
    { 
      content: ImagePage,
      props: {
        image,
        setImage,
      }
    },
    { 
      content: IngredientPage,
      props: {
        ingredientList,
        setIngredientList
      }
    },
    { 
      content: InstructionPage,
      props: {
        instructionList,
        setInstructionList
      }
    },
    {
      content: SubmissionPage,
      props: {
        submitRecipe
      }
    }
  ]

  // call notebook and give it pageList
  return <Notebook pageList={pageList} />
}




interface GeneralInfoPageProps {
  newRecipe: boolean;
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  description: string;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
}

function GeneralInfoPage ({newRecipe, title, setTitle, description, setDescription}: GeneralInfoPageProps) {
  return (
    <div className='standardPage'>
      <h1>{newRecipe ? 'New Recipe' : 'Edit Recipe'}</h1>

      <div className='textInput center extraBottom additionalMargin'>
        <label htmlFor='title'>Title</label>
        <input id='title' type='text' value={title} onChange={(event) => setTitle(event.target.value)} placeholder='give your recipe a title'/>
      </div>

      <div className='textInput center additionalMargin'>
        <label htmlFor='description'>Description</label>
        <textarea id='description' rows={9} value={description} onChange={(event) => setDescription(event.target.value)} placeholder='describe your recipe' />
      </div>
    </div>
  )
}




interface ImagePageProps {
  image: string;
  setImage: React.Dispatch<React.SetStateAction<string>>;
}

function ImagePage ({image, setImage}: ImagePageProps) {
  const imageOptions = ['🧀', '🥞', '🍗', '🍔','🍞', '🥯', '🥐','🥨','🍗','🥓','🥩','🍟','🍕','🌭','🥪','🌮','🌯','🥙','🥚','🍳','🥘','🥣','🥗','🍿','🧂','🥫']
  return (
    <div className='standardPage'>
      <p>page two</p>
      <label htmlFor='image'>image</label>
      <select id='image' value={image} onChange={(event) => setImage(event.target.value)}>
        <option value="" disabled hidden>choose image</option>
        {imageOptions.map((option, index) => ( <option key={index}>{option}</option> ))}
      </select>
    </div>
  )
}




interface IngredientPageProps { 
  ingredientList: {id: number, content: IngredientObject}[];
  setIngredientList: React.Dispatch<React.SetStateAction<{id: number, content: IngredientObject}[]>>;
}

function IngredientPage ({ingredientList, setIngredientList}: IngredientPageProps) {

  // define useStates
  const [newIngredient, setNewIngredient] = useState<IngredientObject>({foodId:"", foodDescription:"", measureId:"", unit:"", amount: null});
  const [conversionFactorsAvailable, setConversionFactorsAvailable] = useState<{measureId: string, unit: string}[]>([{ measureId: '1489', unit: 'g' }])
  const [ingredientsAvailable, setIngredientsAvailable] = useState<IngredientObject[]>([])
  const [availableId, setAvailableId] = useState<number>(ingredientList.length)
  
  function updateNewIngredientName (value: string) {
    setNewIngredient({...newIngredient, foodId:"", foodDescription: value});
    if (value.length >= 3) searchIngredients(value);
    else setIngredientsAvailable([]);
  }

  //fetch up to 10 ingredients from database that have similar names to value given
  function searchIngredients (value: string) { 
    axios({ method: 'get', url:`ingredient/list?foodDescription=${value}&limit=10` })
    .then(response => {
      setIngredientsAvailable(response);
    })
    .catch(error => { console.error('unable to fetch ingredients:', error); });
  }

  function ingredientSelected (foodId: string) {
    axios({ method: 'get', url:`ingredient/details?foodId=${foodId}`})
    .then(response => {
      setNewIngredient({ ...newIngredient, foodId, foodDescription: response.foodDescription});
      setConversionFactorsAvailable([ ...response.conversionFactors, { measureId: '1455', unit: 'g' } ]);
    });

    setIngredientsAvailable([]);
  }

  function addIngredient () {
    if (!newIngredient.foodId || !newIngredient.unit || !newIngredient.amount) return
    setIngredientList([...ingredientList, {id: availableId, content: newIngredient} ]);
    setAvailableId( availableId+1 );
    setNewIngredient({foodId:"", foodDescription:"", unit:"", amount:0});
  }

  function removeIngredient (index: number) {
    let tempArray = ingredientList.slice()
    tempArray.splice(index, 1)
    setIngredientList(tempArray)
  }

  return (
    <div className='standardPage'>
      <h2>Recipe Ingredients</h2>

      {/* ingredients list */}
      <Reorder.Group className='displayList addPadding' axis='y' values={ingredientList} onReorder={setIngredientList}>
        {ingredientList.map((item, index) => (
          <Reorder.Item key={item.id} value={item} className='listItemContainer'>
            <div className='itemOptions'>
              <FontAwesomeIcon icon={faCircleXmark} style={{color: "#575757",}} onClick={() => removeIngredient(index)} />
            </div>
            <div className='listItem'>
              {(item.content.unit == 'physical') ? (
                <p>{item.content.amount} {item.content.foodDescription}{item.content.amount != 1 ? 's' : ''}</p>
              ):(
              <p>{item.content.amount} {item.content.unit}{item.content.amount != 1 ? 's' : ''} of {item.content.foodDescription}</p>
              )}
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* add new ingredient section */}
      <div className='textInput shared additionalMargin'>
        <label>New Ingredient</label>
        <div className='inputs'>
          <input type='number' value={newIngredient.amount ?? ''} onChange={(event) => setNewIngredient({...newIngredient, amount: Number(event.target.value)})} placeholder='Amount'/>
          <select value={newIngredient.unit} onChange={(event) => setNewIngredient({...newIngredient, measureId: event.target.options[event.target.selectedIndex].id, unit: event.target.value})} >
            <option value="" disabled hidden className='light'>Units</option>
            {conversionFactorsAvailable.map((conversionFactor, index) => (
              <option key={index} id={conversionFactor.measureId}>{conversionFactor.unit}</option>
            ))}
          </select>
          <div className='activeSearchBar'> {/* ingredient search bar */}
            <input type='text' className='mainInput' value={newIngredient.foodDescription} onChange={(event) => {updateNewIngredientName(event.target.value)}} placeholder='Ingredient Name'/>
            <ul className={`${ingredientsAvailable.length == 0 ? 'hidden' : ''}`}>
              {ingredientsAvailable.map((ingredient, index) => (
                  <li key={index} onClick={() => ingredientSelected(ingredient.foodId)}> {ingredient.foodDescription} </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <button className="darkText additionalMargin" onClick={() => addIngredient()}>Add Ingredient</button>

    </div>
  )
}



interface InstructionPageProps {
  instructionList: {id: number, content: string}[];
  setInstructionList: React.Dispatch<React.SetStateAction<{id: number, content: string}[]>>;
}

function InstructionPage ({instructionList, setInstructionList}: InstructionPageProps) {
  const [newInstruction, setNewInstruction] = useState('')
  const [availableId, setAvailableId] = useState(instructionList.length)

  function addInstruction() {
    if(newInstruction.length < 3) { return }

    setInstructionList(list => [...list, {
      id: availableId,
      content: newInstruction
    }])
    
    setAvailableId(availableId+1)
    setNewInstruction('')
  }

  function removeInstruction(index: number){
    let tempArray = instructionList.slice()
    tempArray.splice(index, 1)
    setInstructionList(tempArray)
  }

  return (
    <div className='standardPage'>
      <h2>Recipe Instructions</h2>
      <Reorder.Group className='displayList' axis='y' values={instructionList} onReorder={setInstructionList}>
        {instructionList.map((item, index) => (
          <Reorder.Item key={item.id} value={item} className='listItemContainer'>
            <div className='listItem'>
              <h4>Step {index + 1} </h4>
              <p>{item.content}</p>
            </div>
            <div className='itemOptions extraMargin'>
              <FontAwesomeIcon icon={faTrash} style={{color: "#575757",}} onClick={() => removeInstruction(index)} />
              <FontAwesomeIcon icon={faPen} style={{color: "#575757",}} />
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      <div className='textInput additionalMargin'>
        <label htmlFor='newInstruction'>New Instruction</label>
        <textarea id="newInstruction" rows={6} value={newInstruction} onChange={(event) => {setNewInstruction(event.target.value)}} placeholder='add a new instruction'/>
      </div>
      <button className="darkText additionalMargin" onClick={() => addInstruction()}>Add Instruction</button>
    </div>
  )
}




interface SubmissionPageProps {
  submitRecipe: () => void;
}

function SubmissionPage({submitRecipe}: SubmissionPageProps) {
  return (
    <>
      <h2>Save Recipe</h2>
      <button className="darkText additionalMargin" onClick={() => submitRecipe()}>Save recipe</button>
    </>
  )
}