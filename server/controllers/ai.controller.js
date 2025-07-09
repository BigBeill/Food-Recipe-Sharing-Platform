const fs = require("fs");
const pdfParser = require("pdf-parse");
const fetch = require("node-fetch");
const openAI = require("openai");
require("dotenv").config();

const personalInfo = fs.readFileSync("./publicPersonalData/summary.txt", "utf8");

const personalAI = new openAI();

const pushover_user = process.env.PUSHOVER_USER;
const pushover_token = process.env.PUSHOVER_TOKEN;
const pushover_url = "https://api.pushover.net/1/messages.json"

const name = "Mackenzie Neill";

// async function for sending a message to my pushover account
async function sendToPushover(message) {
   const payload = new URLSearchParams({ token: pushover_token, user: pushover_user, message: message });

   const response = await fetch( pushover_url, {
      method: "POST",
      headers: {
         "Content-Type": "application/x-www-form-urlencoded"
      },
      body: payload
   });

   console.log("Pushover response: ", response.status, response.statusText);
}

// code for tools the AI can use
async function recordUserDetails(email="'NO EMAIL PROVIDED'", name="'NO NAME PROVIDED'", notes="'NO NOTES PROVIDED'") {
   const message = `Interest recorded! \n name: ${name} \n email: ${email} \n notes: ${notes}`;
   return await sendToPushover(message);
}

async function recordUnknownQuestion(email="'NO EMAIL PROVIDED'", question="'NO QUESTION PROVIDED'") {
   const message = `Unknown question recorded! \n email: ${email} \n question: ${question}`;
   return await sendToPushover(message);
}

// json documentation for tools the AI can use
const record_user_details_json = {
   "name": "record_user_details",
   "description": "Use this tool to record that a user is interested in being in touch and provided an email address",
   "parameters": {
      "type": "object",
      "properties": {
         "email": {
            "type": "string",
            "description": "The email address of this user"
         },
         "name": {
            "type": "string",
            "description": "The name of this user, if they are willing to provide it"
         },
         "notes": {
            "type": "string",
            "description": "Any additional notes that may be useful to know about this user"
         }
      },
      "required": ["email"],
      "additionalProperties": false
   },
}

const record_unknown_question_json = {
   "name": "record_unknown_question",
   "description": "Always use this tool to record any question that couldn't be answered as you didn't know the answer",
   "parameters": {
      "type": "object",
      "properties": {
         "email": {
            "type": "string",
            "description": "The email address of this user"
         },
         "question": {
            "type": "string",
            "description": "The question that the user asked"
         }
      },
   "required": ["email", "question"],
   "additionalProperties": false
   },
}

const tools = [
   {
      "type": "function",
      "function": record_user_details_json
   },
   {
      "type": "function",
      "function": record_unknown_question_json
   }
]

// function for any tool calls the AI sends back
async function handleToolCall(toolCall) {
   let results = [];

   for (let call of toolCall) {
      call.function.arguments = JSON.parse(call.function.arguments);
      console.log("Tool call: ", call);
      if (call.function.name == "record_user_details") { 
         await recordUserDetails(call.function.arguments.email, call.function.arguments.name, call.function.arguments.notes);
         results.push({"role":"tool", "content": "", "tool_call_id": call.id});
      } 
      else if (call.function.name == "record_unknown_question") { 
         await recordUnknownQuestion(call.function.arguments.email, call.function.arguments.question); 
         results.push({"role":"tool", "content": "", "tool_call_id": call.id});
      }
      call.function.arguments = JSON.stringify(call.function.arguments);
   }

   return results;
}

// function maintains the chat history and handles new messages to the AI
async function chat(message, history) {

   const linkedin = fs.readFileSync("./publicPersonalData/linkedin.pdf");
   const parsedLinkedin = await pdfParser(linkedin);
   const linkedinSummary = parsedLinkedin.text;

   let systemPrompt = `You are acting as ${name}. You are answering questions on ${name}'s website, \
   particularly questions related to ${name}'s career, background, skills and experience. \
   Your responsibility is to represent ${name} for interactions on the website as faithfully as possible. \
   You are given a summary of ${name}'s background and LinkedIn profile which you can use to answer questions. \
   Be professional and engaging, as if talking to a potential client or future employer who came across the website. \
   If you don't know the answer to any question, use your record_unknown_question tool to record the question that you couldn't answer. \
   If the user is engaging in discussion, try to steer them towards getting in touch via email; ask for their name, email, and record it using your record_user_details tool. Make sure to include a note about what their inquiring about. \
   It's important that you never make up information or speculate. If a question cannot be answered based on the provided summary or LinkedIn profile,\
   you must use the record_unknown_question tool to log the question and then reply with something like "I'm not sure about that" after using the tool. Never fabricate details. \
   If a user's question is vague or cannot be answered confidently, feel free to ask for clarification or guide the conversation toward known topics.`
   systemPrompt += `\n\n## Summary:\n${personalInfo}\n\n## LinkedIn Profile:\n${linkedinSummary}\n\n`
   systemPrompt += `With this context, please chat with the user, always staying in character as ${name}.`

   let updatedChat = [
      {"role": "system", "content": systemPrompt}, 
      ...history,
      {"role": "user", "content": message}
   ];

   let done = false;
   let finalMessage = "";

   while(!done) {
      console.log("Updated chat: ", updatedChat);
      const response  = await personalAI.chat.completions.create({
         model: "gpt-4o-mini", 
         messages: updatedChat, 
         tools:tools
      });
      console.log("AI response: ", response);
      console.log("AI response choice message: ", response.choices[0].message);
      const finishReason = response.choices[0].finish_reason;
      finalMessage = response.choices[0].message.content;
      

      if (finishReason == "tool_calls") {
         const responseMessage = response.choices[0].message;
         const toolCalls = responseMessage.tool_calls;
         const toolResponse = await handleToolCall(toolCalls);
         console.log("toolCalls: ", toolCalls[0]);

         updatedChat.push(responseMessage);
         updatedChat.push(...toolResponse);
      }
      else { done = true; }
   }
   return finalMessage;
}

exports.sendMessage = async (req, res) => {
   const { message, history } = req.body;
   try {
      history.forEach(element => {
         if (!element.role) element.role = "unknown";
         if (!element.content) element.content = "";
      });
      const response = await chat(message, history);
      res.status(200).json({ message: "The AI responded to your message", payload: response });
   } catch (error) {
      console.log("\x1b[31m%s\x1b[0m", "ai.controller.sendMessage failed... server failed to communicate with AI")
      console.error("Error in AI chat:", error);
      res.status(500).json({ error: "An error occurred while processing your request." });
   }
}