const mongoose = require('mongoose')

const recipeSchema = new mongoose.Schema({
    owner: mongoose.SchemaTypes.ObjectId,
    title: String,
    description: String,
    image: {type: String, enum: ['🧀', '🥞', '🍗', '🍔','🍞', '🥯', '🥐','🥨','🍗','🥓','🥩','🍟','🍕','🌭','🥪','🌮','🌯','🥙','🥚','🍳','🥘','🥣','🥗','🍿','🧂','🥫']},
    ingredients: [{
        foodId: Number,
        label: String,
        portion: {
            measureId: Number,
            amount: Number
        }
    }],
    instructions: [String],
    nutrition: {
        calories: Number,
        fat: Number,
        cholesterol: Number,
        sodium: Number,
        potassium: Number,
        carbohydrates: Number,
        fibre: Number,
        sugar: Number,
        protein: Number,
    }
})

module.exports = mongoose.model("recipe", recipeSchema)