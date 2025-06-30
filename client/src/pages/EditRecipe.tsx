import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPen } from '@fortawesome/free-solid-svg-icons';
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons';
import { Reorder } from 'framer-motion';

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
	const { recipeId } = useParams(); //get recipeId if in url

	//define required useStates
	const [title, setTitle] = useState<string>('');
	const [description, setDescription] = useState<string>('');
	const [image, setImage] = useState<string>('');
	const [ingredientList, setIngredientList] = useState<{id: number, content: IngredientObject}[]>([]);
	const [instructionList, setInstructionList] = useState<{id: number, content: string}[]>([]);

	const [errorMessage, setErrorMessage] = useState<string>("");

	//run useEffect on page start
	useEffect (() => {
		// make sure current user is signed in, otherwise redirect to login
		if (!userData) { navigate('/login'); }

		// if recipeId exists, populate the page with data from server for associated recipe
		if (recipeId) {
			axios({ method:'get', url:`recipe/getObject/${recipeId}` })
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
		// check for any empty fields
		if (!title) { 
			setErrorMessage("your recipe must have a title");
			return; 
		}
		if (!description) { 
			setErrorMessage("your recipe must have a description"); 
			return; 
		}
		if (!image) { 
			setErrorMessage("your recipe must have an image"); 
			return; 
		}
		if (ingredientList.length == 0) { 
			setErrorMessage("your recipe must have at least one ingredient");
			return; 
		}
		if (instructionList.length == 0) { 
			setErrorMessage("your recipe must have at least one instruction");
			return; 
		}

		//define what type of request is being sent to the server
		let method: string;
		if (!recipeId) method = 'post';
		else method = 'put';

		//package relevant data into recipeData
		const recipeData: RecipeObject = {
			_id: recipeId,
			owner: userData?._id || '',
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
				errorMessage,
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
		<div className='standardContent'>
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
		<div className='standardContent'>
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
	const [newIngredient, setNewIngredient] = useState<IngredientObject>({foodId:"", label:"", foodDescription:"", portion: { measureId:"", measureDescription:"", amount: null } });
	const [conversionFactorsAvailable, setConversionFactorsAvailable] = useState<{measureId: string, measureDescription: string, conversionFactorValue: number }[]>([{ measureId: '1489', measureDescription: 'g', conversionFactorValue: 1 }]);
	const [ingredientsAvailable, setIngredientsAvailable] = useState<IngredientObject[]>([])
	const [availableId, setAvailableId] = useState<number>(ingredientList.length)
	
	function updateNewIngredientName (value: string) {
		setNewIngredient({...newIngredient, foodId:"", foodDescription: value});
		if (value.length >= 3) searchIngredients(value);
		else setIngredientsAvailable([]);
	}

	//fetch up to 10 ingredients from database that have similar names to value given
	function searchIngredients (value: string) { 
		axios({ method: 'get', url:`ingredient/list?foodDescription=${value}&limit=12` })
		.then(response => {
			setIngredientsAvailable(response);
		})
		.catch(error => { console.error('unable to fetch ingredients:', error); });
	}

	function ingredientSelected (ingredient: IngredientObject) {
		console.log("ingredient selected:", ingredient)
		setNewIngredient((oldIngredient) => ({ ...oldIngredient, foodId: ingredient.foodId, foodDescription: ingredient.foodDescription }));
		axios({ method: 'get', url:`ingredient/conversionOptions/${ingredient.foodId}` })
		.then((response) => { setConversionFactorsAvailable(response); });
		setIngredientsAvailable([]);
	}

	function addIngredient () {
		if (!newIngredient.foodId || !newIngredient.portion?.measureDescription || !newIngredient.portion?.measureDescription) { return }

		// add new ingredient to ingredientList
		setIngredientList([
			...ingredientList, 
			{
				id: availableId, 
				content: (() => {
					const { label, ...rest } = newIngredient;
					return label ? { ...rest, label } : { ...rest };
				})()
			} 
		]);

		console.log("ingredientList:", ingredientList);

		setAvailableId( availableId+1 );
		setNewIngredient({foodId: "", foodDescription: "", label:"", portion: { measureId: "", measureDescription: "", amount: null }});
	}

	function removeIngredient (index: number) {
		let tempArray = ingredientList.slice()
		tempArray.splice(index, 1)
		setIngredientList(tempArray)
	}

	return (
		<div className='standardContent'>
			<h2>Recipe Ingredients</h2>

			{/* ingredients list */}
			<Reorder.Group className='displayList' axis='y' values={ingredientList} onReorder={setIngredientList}>
				{ingredientList.map((item, index) => (
					<Reorder.Item key={item.id} value={item} className='listItem'>
						<div className='options'>
							<FontAwesomeIcon icon={faCircleXmark} style={{color: "#575757",}} onClick={() => removeIngredient(index)} />
						</div>
						{ item.content.label ? (
							<p>{item.content.label}</p>
						) : item.content.portion ? (
							<p>{item.content.portion.amount} {item.content.portion.measureDescription} of [{item.content.foodDescription}]</p>
						
						) : null }
					</Reorder.Item>
				))}
			</Reorder.Group>

			{/* add new ingredient section */}
			<div className='textInput shared additionalMargin'> 
				<label>New Ingredient</label>

				<input type='text' placeholder='Ingredient Label (optional)' value={newIngredient.label} onChange={(event) => setNewIngredient({...newIngredient, label: event.target.value})}/>

				<div className='inputs'>
					<input type='number'  placeholder='Amount' value={newIngredient.portion?.amount ?? ''} onChange={(event) => setNewIngredient({...newIngredient, portion: { measureId: newIngredient.portion?.measureId || "", measureDescription: newIngredient.portion?.measureDescription || "", amount: event.target.value }})}/>
					<select value={newIngredient.portion?.measureDescription} onChange={(event) => setNewIngredient({...newIngredient, portion: { measureId: event.target.options[event.target.selectedIndex].id, measureDescription: event.target.value, amount: newIngredient.portion?.amount || null }})} >
						<option value="" disabled hidden className='light'>Units</option>
						{conversionFactorsAvailable.map((conversionFactor, index) => (
						<option key={index} id={conversionFactor.measureId}>{conversionFactor.measureDescription}</option>
						))}
					</select>
					<div className='activeSearchBar'> {/* ingredient search bar */}
						<input type='text' className='mainInput' value={newIngredient.foodDescription} onChange={(event) => {updateNewIngredientName(event.target.value)}} placeholder='Ingredient Description'/>
						<ul className={`${ingredientsAvailable.length == 0 ? 'hidden' : ''}`}>
						{ingredientsAvailable.map((ingredient, index) => (
								<li key={index} onClick={() => ingredientSelected(ingredient)}> {ingredient.foodDescription} </li>
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
		<div className='standardContent'>
			<h2>Recipe Instructions</h2>
			<Reorder.Group className='displayList' axis='y' values={instructionList} onReorder={setInstructionList}>
			{instructionList.map((item, index) => (
				<Reorder.Item key={item.id} value={item} className='listItem'>
					<div className='contents'>
					<h4>Step {index + 1} </h4>
					<p>{item.content}</p>
					</div>
					<div className='options'>
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
	errorMessage: string;
  	submitRecipe: () => void;
}

function SubmissionPage({errorMessage, submitRecipe}: SubmissionPageProps) {
	return (
		<div className='standardContent'>
			<h2>Save Recipe</h2>
			<button className="darkText additionalMargin" onClick={() => submitRecipe()}>Save recipe</button>
			<p className={errorMessage ? "error" : "hidden"} area-live="assertive">{errorMessage}</p>
		</div>
	)
}