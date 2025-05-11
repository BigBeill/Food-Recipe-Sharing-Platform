const { body, query, param, validationResult } = require('express-validator');

// Use to make sure express input only contains the expected fields
// and that the fields are of the expected types
function advancedCheckExact(allowedFields, location) {

   // Validate allowedFields
   if (typeof allowedFields !== 'object' || allowedFields === null) {
      throw new Error("Invalid allowedFields: must be a non-null object.");
   }
   if (Object.keys(allowedFields).length === 0) {
      throw new Error("Invalid allowedFields: must not be an empty object.");
   }

   // Dynamically select the appropriate validator based on the location (body, query, params)
   const validator = { body, query, param }[location];
   if (!validator) {
      console.log("\x1b[31m%s\x1b[0m", "server/library/sanitationUtils.advancedCheckExact failed... Invalid location:", location);
      throw new Error(`Invalid location: ${location}. Expected 'body', 'query', or 'param'.`);
   }

   function examenArray(actual, allowed, path) {
      let unexpectedFields = [];

      for (let i = 0; i < actual.length; i++) {
         const currentPath = path ? `${path}[${i}]` : `[${i}]`;
         const actualValue = actual[i];
         if (typeof allowed === 'object') {
            if (typeof actualValue !== 'object') {
               unexpectedFields.push(currentPath);
               continue;
            }
            unexpectedFields = unexpectedFields.concat(findUnexpectedFields(actualValue, allowed, currentPath));
         }
      }
      return unexpectedFields;
   }

   function findUnexpectedFields(actual, allowed, path) {
      let unexpectedFields = [];

      for (const key in actual) {
         const currentPath = path ? `${path}.${key}` : key;

         if (!(key in allowed)) {
            unexpectedFields.push(currentPath);
            continue;
         }

         const actualValue = actual[key];
         const allowedValue = allowed[key];

         if (Array.isArray(actualValue)) {
            if (!Array.isArray(allowedValue)) {
               unexpectedFields.push(currentPath);
               continue;
            }
            unexpectedFields = unexpectedFields.concat(examenArray(actualValue, allowedValue[0], currentPath));
            continue;
         }
         if (typeof allowedValue === 'object') {
            if (typeof actualValue !== 'object') {
               unexpectedFields.push(currentPath);
               continue;
            }
            unexpectedFields = unexpectedFields.concat(findUnexpectedFields(actualValue, allowedValue, currentPath));
         }
      }

      return unexpectedFields;
   }

   const customValidator = validator().custom((value, { req }) => {

      const data = req[location];
      if (typeof data !== 'object' || data === null) {
         throw new Error(`Invalid data in ${location}: must be a non-null object.`);
      }

      const unexpectedFields = findUnexpectedFields(data, allowedFields);

      if (unexpectedFields.length > 0) {
         console.log("\x1b[31m%s\x1b[0m", "server/library/sanitationUtils.advancedCheckExact failed... Unexpected fields");
         throw new Error(`Unexpected fields: ${unexpectedFields.join(", ")}`);
      }

      return true;
   });

   return customValidator; // Return the custom validator to be used by the routers
}

function runValidation(req, res, next) {
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      console.log("\x1b[31m%s\x1b[0m", "REQUEST FAILED VALIDATION");
      return res.status(400).json({ error: errors.array() });
   }
   next();
}

module.exports = {
   advancedCheckExact,
   runValidation
};