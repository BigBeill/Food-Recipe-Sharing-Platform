## JSON Object Models
Any JSON object being sent from the server to the client should follow one of these patterns

### foodGroupObject
```js
{
   foodGroupId: number, //primary key
   foodGroupName: string
}
```

###  ingredientObject
```js
{
   foodId: number, //primary key
   foodDescription: string,
   portion?: {
      measureId: number,
      measureDescription?: string,
      amount: number
   },
   nutrition?: {
      calories: number,
      fat: number,
      cholesterol: number,
      sodium: number,
      potassium: number,
      carbohydrates: number,
      fibre: number,
      sugar: number,
      protein: number
   }
}
```

### conversionObject
```js
{
   measureId: number,
   measureDescription?: string,
   conversionFactorValue: number,
}
```

### recipeObject
```js
{
   _id: mongoose.SchemaTypes.ObjectId,
   owner: mongoose.SchemaTypes.ObjectId,
   title: string,
   description: string,
   image: string, // to be changed
   ingredients: Array<ingredientObject>, // must include portion and nutrient field 
   instructions: Array<string>,
   nutrition: {
      calories: number,
      fat: number,
      cholesterol: number,
      sodium: number,
      potassium: number,
      carbohydrates: number,
      fibre: number,
      sugar: number,
      protein: number
   }
}
```

### userObject
```js
{
   _id: mongoose.SchemaTypes.ObjectId,
   username: string,
   email: string,
   bio: string,
   relationship?: { // relationship with given target (usually current signed in user)
      _id: mongoose.SchemaTypes.ObjectId,
      target: mongoose.SchemaTypes.ObjectId,
      type: number // 0 = no relationship, 1 = friends, 2 = received friend request, 3 sent friend request, 4 = self
   }
}
```

### userFolderObject
```js
{
   _id: mongoose.SchemaTypes.ObjectId,
   folders: Array<userFolderObject | mongoose.SchemaTypes.ObjectId>,
   users: Array<userObject | mongoose.SchemaTypes.ObjectId>
}
```