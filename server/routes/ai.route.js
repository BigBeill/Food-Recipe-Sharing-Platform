const router = require("express").Router();
const aiController = require("../controllers/ai.controller");
const { body, checkExact } = require("express-validator");
const { runValidation } = require("../library/sanitationUtils");

router.post("/sendMessage",
   [
      body("message").isString().isLength({ min: 1, max: 1000 }).withMessage("Message must be a string between 1 and 1000 characters"),
      body("history").isArray().withMessage("History must be an array of messages"),
      checkExact(),
   ],
   runValidation,
   aiController.sendMessage
);

module.exports = router;