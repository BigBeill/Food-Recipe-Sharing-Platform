import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import NoteBook from '../components/NoteBook'
import { Reorder } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPen } from '@fortawesome/free-solid-svg-icons';
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons';
import { assignIds, removeIds } from '../tools/general'

export default function NewEditRecipe ({userData}) {
  const navigate = useNavigate();

  if (userData && userData._id == ""){ return navigate('/login') }

  const [searchParams] = useSearchParams();
  const recipeId = searchParams.get('recipeId');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  const [ingredientList, setIngredientList] = useState([]);

  const [instructionList, setInstructionList] = useState([]);

  useEffect (() => {
    // if recipe exists, populate this page with recipes data from server
    if (recipeId) {
      fetch('/server/recipe/data?_id=' + recipeId)
      .then (response => response.json())
      .then (data => {
        setTitle(data.title)
        setDescription(data.description)
        setImage(data.image)
        setIngredientList(assignIds(data.ingredients))
        setInstructionList(assignIds(data.instructions))
      })
      .catch((error) => { console.error(error.message) })
    }
  },[])

  function submitRecipe(){
    let method
    if (!recipeId) { method = 'POST' }
    else { method = 'PUT' }

    const serverRequest = {
      method: method,
      headers: { 'Content-type': 'application/json; charset=UTF-8', },
      body: JSON.stringify({
        id: recipeId,
        title: title,
        description: description,
        image: image,
        ingredients: removeIds(ingredientList),
        instructions: removeIds(instructionList)
      })
    }
    fetch('/server/recipe/edit', serverRequest)
    .then((response) => {
      if (!response.ok) { throw new Error(`HTTP error, status: ${response.status}`) }
      navigate('/') 
    })
    .catch((error) => { console.error('server failed to save recipe:', error) })
  }

  const pageList = [
    {
      name: GeneralInfoPage,
      props: {
        newRecipe: !recipeId,
        title,
        setTitle,
        description, 
        setDescription,
      }
    },
    { 
      name: ImagePage,
      props: {
        image,
        setImage,
      }
    },
    { 
      name: IngredientPage,
      props: {
        ingredientList,
        setIngredientList
      }
    },
    { 
      name: InstructionPage,
      props: {
        instructionList,
        setInstructionList
      }
    },
    {
      name: SubmissionPage,
      props: {
        submitRecipe
      }
    }
  ]

  return <NoteBook pageList={pageList} />
}

function GeneralInfoPage ({newRecipe, title, setTitle, description, setDescription}) {
  return (
    <div className='standardPage'>
      <h1>{newRecipe ? 'New Recipe' : 'Edit Recipe'}</h1>

      <div className='textInput center extraBottom'>
        <label htmlFor='title'>Title</label>
        <input id='title' type='text' value={title} onChange={(event) => setTitle(event.target.value)} placeholder='give your recipe a title'/>
      </div>

      <div className='textInput center'>
        <label htmlFor='description'>Description</label>
        <textarea id='description' rows="9" value={description} onChange={(event) => setDescription(event.target.value)} placeholder='describe your recipe' />
      </div>
    </div>
  )
}

function ImagePage ({image, setImage}) {
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

function IngredientPage ({ingredientList, setIngredientList}) {
  const baseUnits = ['physical', 'milligrams', 'grams', 'pounds', 'ounces', 'liters', 'millimeters', 'cups', 'tablespoons']

  const [newIngredient, setNewIngredient] = useState({_id:"", name:"", unit:"", amount:""})
  const [unitsAvailable, setUnitsAvailable] = useState(baseUnits)
  const [ingredientsAvailable, setIngredientsAvailable] = useState([])
  const [availableId, setAvailableId] = useState(ingredientList.length)
  
  function updateNewIngredientName (value) {
    setNewIngredient({...newIngredient, name: value})
    if (newIngredient.name.length >= 3) { searchIngredients(value) }
  }

  function searchIngredients (value) { 
    fetch(`/server/ingredients/list?name=${value}&limit=10`)
    .then(response => response.json())
    .then(setIngredientsAvailable)
  }

  function removeIngredient (index) {
    let tempArray = ingredientList.slice()
    tempArray.splice(index, 1)
    setIngredientList(tempArray)
  }

  return (
    <div className='standardPage'>
      <h2>Recipe Ingredients</h2>
      <Reorder.Group className='itemList' axis='y' values={ingredientList} onReorder={setIngredientList}>
        {ingredientList.map((item, index) => (
          <Reorder.Item key={item.id} value={item} className='listItem'>
            <div className='itemOptions'>
              <FontAwesomeIcon icon={faCircleXmark} style={{color: "#575757",}} onClick={() => removeIngredient(index)} />
            </div>
            <div className='itemContent'>
              {(item.content.unit == 'physical') ? (
                <p>{item.content.amount} {item.content.name}{item.content.amount != 1 ? 's' : ''}</p>
              ):(
              <p>{item.content.amount} {item.content.unit}{item.content.amount != 1 ? 's' : ''} of {item.content.name}</p>
              )}
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
      <div className='textInput shared'>
        <label>New Ingredient</label>
        <div className='inputs'>
          <input type='number' value={newIngredient.amount} onChange={(event) => setNewIngredient({...newIngredient, amount: event.target.value})} placeholder='Amount'/>
          <select value={newIngredient.unit} onChange={(event) => setNewIngredient({...newIngredient, unit: event.target.value})}>
            <option value="" disabled hidden className='light'>Units</option>
            {unitsAvailable.map((unit, index) => (
              <option key={index}>{unit}</option>
            ))}
          </select>
          <div className='activeSearchBar'>
            <input type='text' className='mainInput' value={newIngredient.name} onChange={(event) => {updateNewIngredientName(event.target.value)}} placeholder='Ingredient Name'/>
            <ul className={`${ingredientsAvailable.length == 0 ? 'hidden' : ''}`}>
              {ingredientsAvailable.map(ingredient => (
                <li key={ingredient._id} type='button' value={ingredient.name} onClick={(event) => ingredientSelected(ingredient.name, ingredient._id, ingredient.unitType)}> {ingredient.name} </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <button onClick={() => addIngredient()}>Add Ingredient</button>
    </div>
  )
}

function InstructionPage ({instructionList, setInstructionList}) {
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

  function removeInstruction(index){
    let tempArray = instructionList.slice()
    tempArray.splice(index, 1)
    setInstructionList(tempArray)
  }

  return (
    <div className='standardPage'>
      <h2>Recipe Instructions</h2>
      <Reorder.Group className='itemList noMargin' axis='y' values={instructionList} onReorder={setInstructionList}>
        {instructionList.map((item, index) => (
          <Reorder.Item key={item.id} value={item} className='listItem'>
            <div className='itemContent'>
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

      <div className='textInput'>
        <label htmlFor='newInstruction'>New Instruction</label>
        <textarea id="newInstruction" rows='6' value={newInstruction} onChange={(event) => {setNewInstruction(event.target.value)}} placeholder='add a new instruction'/>
      </div>
      <button onClick={() => addInstruction()}>Add Instruction</button>
    </div>
  )
}

function SubmissionPage({submitRecipe}) {
  return (
    <>
      <h2>Save Recipe</h2>
      <button onClick={() => submitRecipe()}>Save recipe</button>
    </>
  )
}