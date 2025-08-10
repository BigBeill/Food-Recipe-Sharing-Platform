export default function LandingPage() {
   return (
      <>
         <div className="landingPage">
            <h1>Welcome to Beill's Greenhouse</h1>
            <p>
               My name is Mackenzie Neill, I graduated from computer science at trent university.
               This is a personal project I have been working on to practice my web-development, networking, and cyber security skills.
               Because this is an experimental project, Its not being monitored regularly and that limits how much I can protect your data.
               So with that in mind, here are some general tips to keep your data safe:
            </p>
            <ul>
               <li>Use a unique password for this site. DO NOT REUSE PASSWORDS!</li>
               <li>Do not reveal any personal information you don't want being public.</li>
               <li>Do not use this site to store sensitive information.</li>
               <li>Do not use this site to store any information you do not want to be public.</li>
               <li>*several other bullet points about not sharing sensitive information*</li>
            </ul>
            <p>The person I made that list for knows who they are</p>
            <p>please enjoy, and if your interested in understanding how any of this is done check out https://github.com/BigBeill/food-website</p>

            <ul>
               <li><a href="/publicRecipes" className="button">Explore Recipes</a></li>
               <li><a href="/login" className="button">Login</a></li>
               <li><a href="/register" className="button">Register</a></li>
               <li><a href="/aboutMe" className="button">Learn About Me</a></li>
            </ul>
         </div>
      </>
   );
}