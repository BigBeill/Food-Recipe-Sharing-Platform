const { sign } = require("jsonwebtoken");
require("dotenv").config();

function createToken(user) {
  const accessToken = sign(
    {
      _id: user._id,
    },
    process.env.SESSION_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = sign(
    {
      _id: user._id,
    },
    process.env.SESSION_SECRET
  );

  return { accessToken, refreshToken };
}

module.exports = createToken;
