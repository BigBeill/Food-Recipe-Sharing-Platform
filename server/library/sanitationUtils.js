const { body, query, param, validationResult } = require('express-validator');

// use to make sure express input only contains the expected fields
// and that the fields are of the expected types
function validateNoExtraFields (allowedFields, location) {
   // Dynamically select the appropriate validator based on the location (body, query, params)
   const validator = { body, query, param }[location];
   if (!validator) {
      console.log("\x1b[31m%s\x1b[0m", "server/library/sanitationUtils.validateNoExtraFields failed... Invalid location:", location);
      throw new Error(`Invalid location: ${location}. Expected 'body', 'query', or 'param'.`);  // If the location is invalid, throw an error
   }

   return validator().custom((value, { req }) => {
      const receivedFields = Object.keys(req[location]);    // Get the keys in the request field
      const unexpectedFields = receivedFields.filter((field) => !allowedFields.includes(field));  // Find unexpected fields

      if (unexpectedFields.length > 0) {
         throw new Error(`Unexpected fields: ${unexpectedFields.join(", ")}`);  // Return an error for extra fields
      }

      return true;  // If no extra fields, return true to indicate validation passed
   });
}

function runValidation (req, res, next) {
   const errors = validationResult(req);
   if (!errors.isEmpty()) { 
      console.log("\x1b[31m%s\x1b[0m", "REQUEST FAILED VALIDATION");
      return res.status(400).json({ error: errors.array() }); 
   }
   next();
}

module.exports = { 
   validateNoExtraFields,
   runValidation
};