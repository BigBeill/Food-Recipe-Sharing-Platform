const mongoose = require('mongoose');
require('dotenv').config()

mongoose.connect("mongodb+srv://BigBeill:" + process.env.MONGO_DB_PASSWORD + "@beillsgreenhouse.oull8qn.mongodb.net/Main-Database?retryWrites=true&w=majority") 
.then(() => console.log("Connected to Mongodb"))
.catch((error) => console.log(error))

const database = mongoose.connection

module.exports = database