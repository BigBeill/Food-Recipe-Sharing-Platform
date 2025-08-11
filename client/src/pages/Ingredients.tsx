// external imports
import {useEffect, useState} from "react";
import { useParams, useNavigate } from 'react-router-dom';

// internal imports
import axios from '../api/axios';

import FoodGroupObject from "../interfaces/FoodGroupObject";
import IngredientObject from "../interfaces/IngredientObject";

export default function Ingredients () {
	const params = useParams();
	const navigate = useNavigate();

	const [groupID, setGroupID] = useState<string>('');
	const [ingredientID, setIngredientID] = useState<string>('');

	useEffect(() => {
		if (params.groupID) { setGroupID(params.groupID); }
		else { setGroupID(''); }
		if (params.ingredientID) { setIngredientID(params.ingredientID); }
		else { setIngredientID('') }
	},[params]);

	function selectGroup(group: FoodGroupObject) {
		navigate(`/ingredients/${group.foodGroupId}`);
	}

	function selectIngredient(ingredient: IngredientObject) {
		navigate(`/ingredients/${groupID}/${ingredient.foodId}`);
	}

	// router for page
	if (!groupID) {
		return <GroupList clickHandler={selectGroup}/>
	} else if (!ingredientID) {
		return <IngredientList groupID={groupID} clickHandler={selectIngredient}/>
	} else {
		return <IngredientDetails ingredientID={ingredientID}/>
	}
}






interface GroupListProps {
	clickHandler: (group: FoodGroupObject) => void;
}

function GroupList({clickHandler}: GroupListProps) {
	const [groupList, setGroupList] = useState<FoodGroupObject[]>([]);

	useEffect(() => {
		axios({ method: 'get', url:`ingredient/groups` })
		.then(response => {
			setGroupList(response)
		})
		.catch(error => console.error(error));
	},[]);

	return (
		<div className="displayButtons">
			{groupList.map((group, index) => (
			<button key={index} onClick={() => clickHandler(group)}>{group.foodGroupName}</button>
			))}
		</div>
	);
}

interface IngredientListProps {
	groupID: string;
	clickHandler: (ingredient: IngredientObject) => void;
}

function IngredientList({groupID, clickHandler}: IngredientListProps) {
	const [ingredientList, setIngredientList] = useState<IngredientObject[]>([])

	useEffect(() => {
		axios({ method: 'get', url:`ingredient/find?foodGroupId=${groupID}` })
		.then((response) => { setIngredientList(response.ingredientObjectArray) })
		.catch(error => console.error(error));
	},[])

	return (
		<div className="displayButtons">
			{ingredientList.map((ingredient, index) => (
			<button key={index} onClick={() => clickHandler(ingredient)}>{ingredient.foodDescription}</button>
			))}
		</div>
	)
}

interface IngredientDetailsProps {
	ingredientID: string;
}

function IngredientDetails({ingredientID}: IngredientDetailsProps) {
	const [ingredientData, setIngredientData] = useState<IngredientObject>();
	const [amount, setAmount] = useState<{value: number, unit: string}>({value: 100, unit: 'g'});

	useEffect(() => {
		axios({ method: 'get', url:`ingredient/details/?foodId=${ingredientID}` })
		.then(response => { 
			setIngredientData(response);
		})
		.catch(error => console.error(error));
	},[]);

	if (!ingredientData || !ingredientData.nutrition) { return <p>loading page</p> }
	return (
		<div className="whiteBackground">
			<h1>{ingredientData.foodDescription}</h1>
			<input type='number' value={amount.value} onChange={(event) => setAmount({...amount, value: Number(event.target.value)})}/>
			<p>calories: {((ingredientData.nutrition.calories/100) * amount.value).toFixed(0)}</p>
			<p>fat: {((ingredientData.nutrition.fat/100) * amount.value).toFixed(2)}g</p>
			<p>cholesterol: {((ingredientData.nutrition.cholesterol/100) * amount.value).toFixed(0)}mg</p>
			<p>sodium: {((ingredientData.nutrition.sodium/100) * amount.value).toFixed(0)}mg</p>
			<p>potassium: {((ingredientData.nutrition.potassium/100) * amount.value).toFixed(0)}mg</p>
			<p>carbohydrates: {((ingredientData.nutrition.carbohydrates/100) * amount.value).toFixed(2)}g</p>
			<p>fibre: {((ingredientData.nutrition.fibre/100) * amount.value).toFixed(1)}g</p>
			<p>sugar: {((ingredientData.nutrition.sugar/100) * amount.value).toFixed(2)}g</p>
			<p>protein: {((ingredientData.nutrition.protein/100) * amount.value).toFixed(2)}g</p>
		</div>
	);
}