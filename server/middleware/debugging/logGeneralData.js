function logGeneralData (req, res, next) {
  res.locals.user = req.user;

  const now = new Date();
  const offset = -4;
  const gmt4Time = new Date(now.getTime() + offset * 60 * 60 * 1000);
  const formattedTime = gmt4Time.toISOString().replace('T', ' ').substring(0, 19);

  // log some general information to console for debugging
  console.log("\n" + "\x1b[31m%s\x1b[0m", "CALL TO SERVER RECEIVED!");
  console.log();
  console.log("time of request: "+ "\x1b[35m%s\x1b[0m", formattedTime);
  console.log("active user:", !!req.user);
  if (req.user) { 
    console.log("        _id = " + "\x1b[32m%s\x1b[0m", req.user._id);
  }
  console.log("requested url: " + "\x1b[36m%s\x1b[0m", req.url);
  console.log("requested method: "+ "\x1b[36m%s\x1b[0m", req.method);
  console.log();

  next();
}

module.exports = logGeneralData;