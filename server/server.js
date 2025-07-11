const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const validateToken = require ('./middleware/auth/validateToken');
const setCookieFlags = require ('./middleware/auth/cookieFlags');
require ('./config/connectMongo');
require("dotenv").config();

// define cors settings
const allowedOrigins = process.env.FRONTEND_URLS.split(',').map(url => url.trim());
const corsOptions = {
   origin: function (origin, callback) {
      if (origin && allowedOrigins.includes(origin)) {
         callback(null, true);
      } else {
         console.warn('CORS request from origin not allowed:', origin);
         callback(new Error('Not allowed by CORS'));
      }
   },
   credentials: true
};

//setup server
const app = express();
app.use((req, res, next) => {console.log("\n\n\n"); next();}); // split up request logs
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(setCookieFlags);

app.use(validateToken);

const logGeneralData = require('./middleware/debugging/logGeneralData')
app.use(logGeneralData)

const aiRouter = require('./routes/ai.route');
app.use('/ai', aiRouter);

const authenticationRouter = require('./routes/authentication.route')
app.use('/authentication', authenticationRouter)

const ingredientRouter = require('./routes/ingredient.route')
app.use('/ingredient', ingredientRouter)

const recipeRouter = require('./routes/recipe.route')
app.use('/recipe', recipeRouter)

const userRouter = require('./routes/user.route')
app.use('/user', userRouter)

const errorHandler = require('./middleware/debugging/errorHandler');
app.use(errorHandler);

//listen to port
const PORT = process.env.PORT || 4000
app.listen(PORT, () => {console.log("Server started on port " + PORT)})