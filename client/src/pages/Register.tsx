// external imports
import { useRef, useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';

import axios from '../api/axios';
import UserObject from '../interfaces/UserObject';

function Register() {
   const errorRef = useRef(null);
   const navigate = useNavigate();
   const { userData } = useOutletContext<{userData: UserObject}>();

   const [username, setUsername] = useState<string>("");
   const [email, setEmail] = useState<string>("");
   const [passwordOne, setPasswordOne] = useState<string>("");
   const [passwordTwo, setPasswordTwo] = useState<string>("");
   const [errorMessage, setErrorMessage] = useState<string>("");

   useEffect(() => {
      if (userData._id) { navigate('/profile'); }
      document.body.classList.add('loginBackground');
      return () => { document.body.classList.remove('loginBackground'); }
   }, [])

   useEffect(() => {
      setErrorMessage("")
   }, [username, email, passwordOne, passwordTwo]);

   function checkPasswordRequirements(password: string) {
      let regex: RegExp;

      if (password.length < 6) { return "Password must be at least 6 characters long."; }
      if (password.length > 45) { return "Password must be at most 45 characters long."; }

      regex = /[a-z]/; // check for lowercase letters
      if (!regex.test(password)) { return "Password must contain at least one lowercase letter."; }

      regex = /[A-Z]/; // check for uppercase letters
      if (!regex.test(password)) { return "Password must contain at least one uppercase letter."; }

      regex = /[0-9]/; // check for numbers
      if (!regex.test(password)) { return "Password must contain at least one number."; }

      regex = /[!@#$%^&*]/; // check for special characters
      if (!regex.test(password)) { return "Password must contain at least one special character."; }

      return null;
   }

   function attemptRegister() {

      if (!username) { return setErrorMessage("no username given"); }
      if (!email) { return setErrorMessage("no email given"); }
      if (!passwordOne) { return setErrorMessage("no password given"); }
      if (passwordOne != passwordTwo) { return setErrorMessage("passwords don't match"); }

      const missingPasswordRequirements: string | null = checkPasswordRequirements(passwordOne);
      if (missingPasswordRequirements) {
         setErrorMessage(missingPasswordRequirements);
         return;
      }

      const userData = { username, email, password:passwordOne };
      axios({ method:'post', url:'authentication/register', data: userData })
      .then(() => { 
         navigate('/');
         window.location.reload();
      })
      .catch(response => { 
         if (response.error) {
            if (typeof response.error == "string") { setErrorMessage(response.error); }
            else if (Array.isArray(response.error) && response.error[0].msg) { setErrorMessage(response.error[0].msg); }
         }
      });
   }

   return (
      <>
         {/* css for loginForm and registerForm will be the same */}
         <div className='loginForm' id="registerForm">
         <h1>Create Account</h1>

         <div className='textInput'>
            <input
               type="text"
               name="username"
               id="username"
               placeholder=' '
               value={username}
               onChange={(event) => setUsername(event.target.value)}
               onKeyDown={(event) => { if (event.key === 'Enter') { attemptRegister() } }}

            />
            <label htmlFor="username">Username</label>
         </div>

         <div className='textInput'>
            <input
               type="text"
               name="email"
               id="email"
               placeholder=' '
               value={email}
               onChange={(event) => setEmail(event.target.value)}
               onKeyDown={(event) => { if (event.key === 'Enter') { attemptRegister() } }}

            />
            <label htmlFor="email">Email</label>
         </div>

         <div className='textInput'>
            <input
               type="password"
               name="passwordOne"
               id="passwordOne"
               placeholder=' '
               value={passwordOne}
               onChange={(event) => setPasswordOne(event.target.value)}
               onKeyDown={(event) => { if (event.key === 'Enter') { attemptRegister() } }}
            />
            <label htmlFor="passwordOne">Password</label>
         </div>

         <div className='textInput'>
            <input
               type="password"
               name="passwordTwo"
               id="passwordTwo"
               placeholder=' '
               value={passwordTwo}
               onChange={(event) => setPasswordTwo(event.target.value)}
               onKeyDown={(event) => { if (event.key === 'Enter') { attemptRegister() } }}
            />
            <label htmlFor="passwordTwo">Confirm Password</label>
         </div>

         <button
            name="submit"
            id="submitButton"
            onClick={attemptRegister}
         > Create Account </button>

         <p ref={errorRef} className={errorMessage ? "error" : "hidden"} area-live="assertive">{errorMessage}</p>

         <p>Already have an account?</p>
         <a href='/login'>Login</a>

         </div>
      </>
   )
}

export default Register;