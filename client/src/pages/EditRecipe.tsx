import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPen } from '@fortawesome/free-solid-svg-icons';
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons';
import { Reorder } from 'framer-motion';

import axios from '../api/axios';
import Notebook from '../components/Notebook'
import { assignIds, removeIds } from '../tools/general'
import LoadingPage from '../components/Loading';

import RecipeObject from '../interfaces/RecipeObject';
import IngredientObject from '../interfaces/IngredientObject';

export default function NewEditRecipe () {

	// define react hooks
	const navigate = useNavigate();
	const { userId } = useOutletContext<{userId: string}>();
	const { recipeId } = useParams(); //get recipeId if in url

	const [loadingContent, setLoadingContent] = useState<boolean>(false);

	//define required useStates
	const [recipeObject, setRecipeObject] = useState<RecipeObject>({_id: 'unsavedRecipe', title: '', description: '', image: '', ingredients: [], instructions: [], visibility: 'public'});
	function setTitle(title: string) { setRecipeObject((oldRecipe) => ({ ...oldRecipe, title })); }
	function setDescription(description: string) { setRecipeObject((oldRecipe) => ({ ...oldRecipe, description })); }
	function setImage(image: string) { setRecipeObject((oldRecipe) => ({ ...oldRecipe, image })); }
	function setIngredients(ingredients: IngredientObject[]) { setRecipeObject((oldRecipe) => ({ ...oldRecipe, ingredients })); }
	function setInstructions(instructions: string[]) { setRecipeObject((oldRecipe) => ({ ...oldRecipe, instructions })); }
	function setVisibility(visibility: 'public' | 'private' | 'personal') { setRecipeObject((oldRecipe) => ({ ...oldRecipe, visibility })); }

	const [errorMessage, setErrorMessage] = useState<string>("");

	//run useEffect on page start
	useEffect (() => {
		// make sure current user is signed in, otherwise redirect to login
		if (!userId) { navigate('/login'); }

		// if recipeId exists, populate the page with data from server for associated recipe
		if (recipeId) {
			setLoadingContent(true);
			axios({ method:'get', url:`recipe/getObject/${recipeId}/false` })
			.then ((returnObject) => {
				setRecipeObject(returnObject);
				setLoadingContent(false);
			})
			.catch(console.error);
		}
	},[]);

	//function for sending recipe changes to server
	function submitRecipe(){
		setErrorMessage("");

		// check for any empty fields
		if (!recipeObject.title) { 
			setErrorMessage("your recipe must have a title");
			return; 
		}
		if (!recipeObject.description) { 
			setErrorMessage("your recipe must have a description"); 
			return; 
		}
		if (!recipeObject.image) { 
			setErrorMessage("your recipe must have an image"); 
			return; 
		}
		if (recipeObject.ingredients.length == 0) { 
			setErrorMessage("your recipe must have at least one ingredient");
			return; 
		}
		if (recipeObject.instructions.length == 0) { 
			setErrorMessage("your recipe must have at least one instruction");
			return; 
		}

		//remove recipeId if its unsaved
		if (recipeObject._id == 'unsavedRecipe') { delete recipeObject._id }

		//define what type of request is being sent to the server
		let method: string;
		if (!recipeId) method = 'post';
		else method = 'put';

		const requestBody = {
			_id: recipeObject._id != 'unsavedRecipe' ? recipeObject._id : undefined,
			title: recipeObject.title,
			description: recipeObject.description,
			image: recipeObject.image,
			ingredients: recipeObject.ingredients,
			instructions: recipeObject.instructions,
			visibility: recipeObject.visibility
		}

		//send request to the server
		axios({ method:method, url:'recipe/edit', data: requestBody })
		.then(() => { navigate('/'); })
		.catch(console.error);
	}

	function deleteRecipe() {

		// if recipeId doesn't exist, don't delete
		if (!recipeId) { 
			navigate('/');
			return;
		}

		axios({ method: 'delete', url: `recipe/delete/${recipeId}` })
		.then(() => {
			navigate('/');
		})
		.catch((error) => {
			console.error('Error deleting recipe:', error);
			setErrorMessage('Failed to delete recipe. Please try again later.');
		});
	}

	function revertChanges() {
		window.location.reload();
	}

	// create pageList, a list of all function (plus associated variables) that are apart of the edit recipe page.
	const pageList = [
		{
			content: GeneralInfoPage,
			props: {
				newRecipe: !recipeId,
				title: recipeObject.title,
				setTitle,
				description: recipeObject.description,
				setDescription,
			}
		},
		{ 
			content: AdditionalInfoPage,
			props: {
				image: recipeObject.image,
				setImage,
				visibility: recipeObject.visibility,
				setVisibility
			}
		},
		{ 
			content: IngredientPage,
			props: {
				ingredients: recipeObject.ingredients,
				setIngredients
			}
		},
		{ 
			content: InstructionPage,
			props: {
				instructions: recipeObject.instructions,
				setInstructions
			}
		},
		{
			content: FinalizeChangesPage,
			props: {
				errorMessage,
				submitRecipe,
				revertChanges: recipeId ? revertChanges : undefined,
				deleteRecipe
			}
		}
	]

	// don't load the actual page if content is being grabbed from the server
	if (loadingContent) { return <LoadingPage /> }

	// call notebook and give it pageList
	return <Notebook pageList={pageList} />
}






//  ------------ GENERAL INFORMATION PAGE ------------

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






//  ------------ ADDITIONAL INFORMATION PAGE ------------
interface AdditionalInfoPageProps {
	image: string;
	setImage: React.Dispatch<React.SetStateAction<string>>;
	visibility: 'public' | 'private' | 'personal';
	setVisibility: React.Dispatch<React.SetStateAction<'public' | 'private' | 'personal'>>;
}

function AdditionalInfoPage ({image, setImage, visibility, setVisibility}: AdditionalInfoPageProps) {
	const imageOptions = ['🧀', '🥞', '🍗', '🍔','🍞', '🥯', '🥐','🥨','🍗','🥓','🥩','🍟','🍕','🌭','🥪','🌮','🌯','🥙','🥚','🍳','🥘','🥣','🥗','🍿','🧂','🥫']
	return (
		<div className='standardContent'>
			<h2>Additional Information</h2>
			
			<div className='imageInput'>
				<label htmlFor='image'>Recipe Image</label>
				<select id='image' value={image} onChange={(event) => setImage(event.target.value)}>
					<option value="" disabled hidden>choose image</option>
					{imageOptions.map((option, index) => ( <option key={index}>{option}</option> ))}
				</select>
			</div>

			<div className='textInput center additionalMargin'>
				<div className='radioButtonInput'>
					<label>Recipe Visibility</label>
					<div className='radioOption'>
						<input type='radio' id='public' name='visibility' value='public' checked={visibility == 'public'} onChange={() => { setVisibility('public'); }}/>
						<label htmlFor='public'>Public - Anyone can view this recipe</label>
					</div>
					<div className='radioOption'>
						<input type='radio' id='private' name='visibility' value='private' checked={visibility == 'private'} onChange={() => { setVisibility('private'); }}/>
						<label htmlFor='private'>Private - You and friends can view this recipe</label>
					</div>
					<div className='radioOption'>
						<input type='radio' id='personal' name='visibility' value='personal' checked={visibility == 'personal'} onChange={() => { setVisibility('personal') }}/>
						<label htmlFor='personal'>Personal - Only you can view this recipe</label>
					</div>
				</div>
			</div>
		</div>
	)
}






// ------------ INGREDIENTS PAGE ------------

interface IngredientPageProps { 
	ingredients: {id: number, content: IngredientObject}[];
	setIngredients: React.Dispatch<React.SetStateAction<{id: number, content: IngredientObject}[]>>;
}

function IngredientPage ({ingredients, setIngredients}: IngredientPageProps) {

	const [ingredientList, setIngredientList] = useState<{id: number, content: IngredientObject}[]>(assignIds(ingredients));
	const [newIngredient, setNewIngredient] = useState<IngredientObject>({foodId:"", label:"", foodDescription:"", portion: { measureId:"", measureDescription:"", amount: null } });
	const [conversionFactorsAvailable, setConversionFactorsAvailable] = useState<{measureId: string, measureDescription: string, conversionFactorValue: number }[]>([{ measureId: '1489', measureDescription: 'g', conversionFactorValue: 1 }]);
	const [ingredientsAvailable, setIngredientsAvailable] = useState<IngredientObject[]>([])
	const [availableId, setAvailableId] = useState<number>(ingredientList.length)

	useEffect(() => {
		setIngredients(removeIds(ingredientList));
	}, [ingredientList]);
	
	function updateNewIngredientName (value: string) {
		setNewIngredient({...newIngredient, foodId:"", foodDescription: value});
		if (value.length >= 3) searchIngredients(value);
		else setIngredientsAvailable([]);
	}

	//fetch up to 12 ingredients from database that have similar names to value given
	function searchIngredients (value: string) { 
		axios({ method: 'get', url:`ingredient/find?foodDescription=${value}&limit=12` })
		.then((response) => {
			setIngredientsAvailable(response.ingredientObjectArray);
		})
		.catch(error => { console.error('unable to fetch ingredients:', error); });
	}

	function ingredientSelected (ingredient: IngredientObject) {
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
								<li key={index} onClick={() => ingredientSelected(ingredient)}> {ingredient.commonName ? ingredient.commonName : ingredient.foodDescription} </li>
						))}
						</ul>
					</div>
				</div>
			</div>
			<button className="darkText additionalMargin" onClick={() => addIngredient()}>Add Ingredient</button>

		</div>
	)
}






// ------------ INSTRUCTIONS PAGE ------------

interface InstructionPageProps {
	instructions: {id: number, content: string}[];
	setInstructions: React.Dispatch<React.SetStateAction<{id: number, content: string}[]>>;
}

function InstructionPage ({instructions, setInstructions}: InstructionPageProps) {

	const [instructionList, setInstructionList] = useState<{id: number, content: string}[]>(assignIds(instructions));
	const [availableId, setAvailableId] = useState(instructionList.length);
	const [newInstruction, setNewInstruction] = useState('');

	const [changingInstructionIndex, setChangingInstructionIndex] = useState<number | null>(null);

	useEffect(() => {
		setInstructions(removeIds(instructionList));
	}, [instructionList]);

	function addInstruction() {
		if(newInstruction.length < 3) { return; }

		if (changingInstructionIndex != null) {
			let tempArray = instructionList;
			tempArray[changingInstructionIndex].content = newInstruction;
			setInstructionList(tempArray);
			setChangingInstructionIndex(null);
		}
		else {
			setInstructionList((list) => [...list, {
				id: availableId,
				content: newInstruction
			}]);
			setAvailableId(availableId+1);
		}

		setNewInstruction('');
	}

	function removeInstruction(index: number){
		let tempArray = instructionList.slice()
		tempArray.splice(index, 1)
		setInstructionList(tempArray)
	}

	function updateInstruction(index: number, content: string) {
		setChangingInstructionIndex(index);
		setNewInstruction(content);
	}

	function cancelUpdateInstruction() {
		setChangingInstructionIndex(null);
		setNewInstruction('');
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
							<FontAwesomeIcon icon={faTrash} style={{color: "#575757",}} onClick={() => { removeInstruction(index) }} />
							<FontAwesomeIcon icon={faPen} style={{color: "#575757",}} onClick={() => { updateInstruction(index, item.content) }} />
						</div>
					</Reorder.Item>
				))}
			</Reorder.Group>

			<div className='textInput additionalMargin'>
				<label htmlFor='newInstruction'>New Instruction</label>
				<textarea id="newInstruction" rows={6} value={newInstruction} onChange={(event) => {setNewInstruction(event.target.value)}} placeholder='add a new instruction'/>
			</div>
			<div className='devisableButton additionalMargin'>
				<button onClick={() => { addInstruction(); }}>{changingInstructionIndex != null ? "Update" : "Add" } Instruction</button>
				<button className={changingInstructionIndex != null ? 'showButton' : 'hideButton'} onClick={() => { cancelUpdateInstruction() }} >Revert Changes</button>
			</div>
		</div>
	)
}






//  ------------ FINALIZE CHANGES PAGE ------------

interface FinalizeChangesPageProps {
	errorMessage: string;
  	submitRecipe: () => void;
	revertChanges?: () => void;
	deleteRecipe: () => void;
}

function FinalizeChangesPage({errorMessage, submitRecipe, deleteRecipe, revertChanges}: FinalizeChangesPageProps) {

	const [revertChangesConfirmation, setRevertConfirmation] = useState<boolean>(false);
	const [deleteConfirmation, setDeleteConfirmation] = useState<boolean>(false);

	function attemptRevertChanges() {
		if (!revertChangesConfirmation) {
			setRevertConfirmation(true);
			return;
		}

		// Call the revertChanges function if it exists
		if (revertChanges) { revertChanges(); } 
	}

	function attemptDeleteRecipe() {
		if (!deleteConfirmation) {
			setDeleteConfirmation(true);
			return;
		}

		deleteRecipe();
	}

	return (
		<div className='standardContent'>
			<h2>Finalize Recipe Changes</h2>
			<button className="darkText additionalMargin" onClick={() => submitRecipe()}>Save recipe</button>
			<p className={errorMessage ? "error" : "hidden"} area-live="assertive">{errorMessage}</p>
			{ revertChanges ? (
				<div className='devisableButton additionalMargin'>
					<button onClick={() => attemptRevertChanges()}>{!revertChangesConfirmation ? "Revert Changes" : "Confirm Revert"}</button>
					<button className={revertChangesConfirmation ? 'showButton' : 'hideButton'} onClick={() => setRevertConfirmation(false)}>Cancel</button>
				</div>
			) : null}
			<div className='devisableButton additionalMargin'>
				<button onClick={() => attemptDeleteRecipe()}>{!deleteConfirmation? "Delete Recipe" : "Confirm Delete"}</button>
				<button className={deleteConfirmation ? 'showButton' : 'hideButton'} onClick={() => { setDeleteConfirmation(false); }}>Cancel</button>
			</div>
		</div>
	)
}