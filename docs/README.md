# Big Beill's Greenhouse
*A showcase project demonstrating web-development, networking, and cybersecurity skills.*

Big Beill's Greenhouse is a personalized project created by Mackenzie Neill, a graduate of Trent University's Computer Science program. This project serves as a platform to explore and refine skill's in web-development, networking, and cybersecurity. As an experimental project, it's a continuous work in progress and isn't being actively monitored for security vulnerabilities. Consequently, data protection is limited, and users should exercise caution when using the application.

A live demo can be found at: [www.big-beills-greenhouse.ca](https://www.big-beills-greenhouse.ca)

## General Overview
Author: Mackenzie Neill <br>
Start date: December 15th, 2023

### Features
   - Create, read, update, and delete recipes
   - User authentication (JWT, bcrypt password hashing)
   - Responsive design (works on desktop + mobile)
   - RESTful API design

### Tech Stack
   - Frontend: React, Vite, TypeScript, SCSS
   - Backend: Node.js, Express.js, Javascript
   - Database: MongoDB, PostgreSQL
   - Authentication: JSON Web Tokens (JWT), bcrypt
   - Deployment: Vercel (frontend), Railway (backend)

### Security Features
- HTTPS connection (only on cloud deployment)
- HTTP-only cookies
- Sanitization of all data from clients (cookies, query, params, and body)
- Strict CORS policy
- Password requirements, masking and encryption

## Setting Up the Project
<ol>
	<li>Open the <code>run_website.txt</code> file in the root directory.</li>
	<li>Set the URL to the path where you saved this project.</li>
	<li>Save the file with a <code>.bat</code> extension (or respective file type if you're not using windows).</li>
	<li>Inside the <code>client</code> folder, create a <code>.env</code> file and add:</li>
	<pre><code>
		VITE_SERVER_LOCATION=http://localhost:4000
	</code></pre>
	<li>Inside the `server` folder, create a `.env` file and add:</li>
	<pre><code>
		SESSION_SECRET=
		LOCAL_ENVIRONMENT=true
	</code></pre>
	<li>Fill in a value for `SESSION_SECRET` (choose a strong secret).</li>
	<li>Run the `.bat` file (assuming your on windows)</li>
</ol>

### Setting up the databases
<ol>
	<li>Create your own MongoDB cluster online.</li>
	<li>Update the connection string in `server/config/connectMongo.js`.</li>
	<li>Add the following line to the server’s `.env` file:</li>
	<pre><code>
	MONGO_DB_PASSWORD=
	</code></pre>
	<li>Fill in your MongoDB password.</li>
	<li>Go to `/canadian-nutrient-file/DB_Setup.md` for instructions and code.</li>
</ol>