const { verify } = require("jsonwebtoken");
require("dotenv").config();

function validateToken(req, res, next) {
  const accessToken = req.cookies?.accessToken;

  if (!accessToken) { console.log("no access token found"); }

  try {
    const validToken = verify(accessToken, process.env.SESSION_SECRET);
    if (validToken && typeof validToken._id === "string") {
      req.user = {
        _id: validToken._id,
      };
    }
    else {
      console.log("invalid access token");
    }
  } catch (error) {
    console.log("error validating access token:", error.message);
  }
  return next();
}

module.exports = validateToken;
