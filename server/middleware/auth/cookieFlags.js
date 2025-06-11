// Middleware to set global cookie flags
function setCookieFlags(req, res, next) {
   // Intercepting the 'Set-Cookie' header
   const originalSetCookie = res.cookie;
 
   // Override the res.cookie method
   res.cookie = function (name, value, options = {}) {
     // Set security-related cookie flags globally
     options = {
       httpOnly: true,            // Prevent access from JavaScript (XSS protection)
       //secure: true,              // Only over HTTPS in production
       sameSite: 'Strict',        // Prevent CSRF attacks
       ...options,                // Keep any custom options passed by route handlers
     };
 
     // Call the original res.cookie to actually set the cookie
     originalSetCookie.call(res, name, value, options);
   };
 
   next(); // Move to the next middleware/route
}
 
module.exports = setCookieFlags;