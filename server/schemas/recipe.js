const mongoose = require('mongoose')
const ingredient = require('./ingredient')

const recipeSchema = new mongoose.Schema({
    owner: mongoose.SchemaTypes.ObjectId,
    title: String,
    description: String,
    image: {type: String, enum: ['🧀', '🥞', '🍗', '🍔','🍞', '🥯', '🥐','🥨','🍗','🥓','🥩','🍟','🍕','🌭','🥪','🌮','🌯','🥙','🥚','🍳','🥘','🥣','🥗','🍿','🧂','🥫']},
    ingredients: {
        name: String,
        unit: String,
        amount: Number
    },
    instructions: [String],
    nutrition: {
        calories: Number,
        protein: Number,
        fat: Number,
        carbohydrates: Number,
        sodium: Number,
        fiber: Number,
    }
})

module.exports = mongoose.model("recipe", recipeSchema)