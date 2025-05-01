const postgresConnection = require('../config/postgres');


/*
accepts an foodId and returns a list of all possible that ingredient can be measured in and there conversion values.
does not return grams as its assumed all ingredients can be measured in grams

expected input:
	foodId = int

returns:
	[{
		measureId: int,
		measureDescription: string,
		value: int
	}]
*/
async function conversionFactorList (foodId) {
	console.log("function called: " + "\x1b[36m%s\x1b[0m", "server/library/canadianNutritionFileUtils.conversionFactorList");

	// accumulate a list of every posable conversion and there values for provided ingredient
	try {
		let conversionOptions = [];

		// get a list of all possible conversions from database
		const query = `SELECT measure_id, conversion_factor_value FROM conversion_factor WHERE food_id = $1`;
		const values = [foodId];
		const possibleConversionsData = await postgresConnection.query(query, values);

		//go though all items in list of possible conversions and collect more detailed information
		for(const conversion of possibleConversionsData.rows){
			// get more detailed information about conversion from database
			const query = `SELECT measure_description FROM measure_name WHERE measure_id = $1 LIMIT 1`;
			const values = [conversion.measure_id];
			const data = await postgresConnection.query(query, values);

			// if conversion is found add to conversionOptions arrays
			if (data.rows[0]){
				const brokenString = breakupMeasureDescription(data.rows[0].measure_description);
				conversionOptions.push({ measureId: conversion.measure_id, measureDescription: brokenString.string, value: conversion.conversion_factor_value / brokenString.integer, });
			}
		}

		// remove any duplicate entries from conversionOptions array
		for (let i = conversionOptions.length - 1;  i >= 0; i--) {
			if (conversionOptions[i].measureDescription == 'g') conversionOptions.splice(i, 1);
			else {
				for(let j = i-1; j >=0; j--) {
					if (conversionOptions[i].measureDescription == conversionOptions[j].measureDescription) {
						conversionOptions.splice(j, 1);
						i--;
					}
				}
			}
		}
		conversionOptions.push({ measureId: 1489, measureDescription: 'g', value: 1 });
		return conversionOptions;
	}
	catch (error) {
		console.log("failed to collect conversion information from database for foodId: ", foodId);
		console.error(error);
		throw new Error ('failed to collect conversion information from database');
	}
}

/*
accepts a string starting with a number and breaks it into an int and string
example:
	input: "12345 testing"
	output: { 12345, "testing" }
*/
function breakupMeasureDescription(measureDescription) {
	let integer = "";
	let denominator = "";
	let slashFound = false;
	let unitStart = 0;

	// go through each number in the string until a character is found
	for (let i = 0; i < measureDescription.length; i++) {
		if ( (!isNaN(measureDescription[i]) && measureDescription[i].trim() !== '') || measureDescription[i] == ".") {
			if(!slashFound) integer += measureDescription[i];
			else denominator += measureDescription[i];
		} 
		else if (measureDescription[i] == "/") slashFound = true;
		else{
			if (measureDescription[i] == " ") unitStart = i + 1;
			else unitStart = i;
			break;
		}
	}

	integer = parseInt(integer);
	if(denominator) integer = integer/parseInt(denominator);

	const string =  measureDescription.slice(unitStart);

	return { integer, string }
}

module.exports = {
	conversionFactorList,
	breakupMeasureDescription
}