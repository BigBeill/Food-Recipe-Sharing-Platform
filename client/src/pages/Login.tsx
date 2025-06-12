import { useRef, useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom';

import axios from '../api/axios';
import UserObject from '../interfaces/UserObject';

function Login() {
   const errorRef = useRef(null);
   const navigate = useNavigate();
   const { userData } = useOutletContext<{userData: UserObject}>();

   const [username, setUsername] = useState<string>("");
   const [password, setPassword] = useState<string>("");
   const [rememberMe, setRememberMe] = useState<boolean>(false);
   const [errorMessage, setErrorMessage] = useState<string>("");

   useEffect(() => {
      if (userData) navigate('/profile');
      document.body.classList.add('loginBackground');
      return () => { document.body.classList.remove('loginBackground'); }
   }, []);

   useEffect(() => {
      setErrorMessage("");
   }, [username, password]);

   function attemptLogin() {

      if (!username) return setErrorMessage("no username given");
      if (!password) return setErrorMessage("no password given");

      const userData = { username, password, rememberMe };
      axios({method: 'post', url: 'authentication/login', data: userData})
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
         <div className="loginForm" id="loginForm">
         <h1>Login</h1>
         <div className="textInput">
            <input
               type="text"
               name="username"
               id="username"
               placeholder=' '
               value={username}
               onChange={(event) => setUsername(event.target.value)}
               onKeyDown={(event) => { if (event.key === 'Enter') { attemptLogin() } }}
            />
            <label htmlFor="username">Username</label>
         </div>

         <div className="textInput">
            <input
               type="password"
               name="password"
               id="password"
               placeholder=' '
               value={password}
               onChange={(event) => setPassword(event.target.value)}
               onKeyDown={(event) => { if (event.key === 'Enter') { attemptLogin() } }}
            />
            <label htmlFor="password">Password</label>
         </div>

         <div className="splitSpace">
            <div className="checkboxInput">
               <input type="checkbox"
               name="remember me"
               id="remember"
               value="1" 
               checked={rememberMe}
               onChange={(event) => setRememberMe(event.target.checked)}
               />
               <label htmlFor="remember">Remember Me</label>
            </div>
         </div>

         <button
            name="Submit"
            type="submit"
            id="submitButton"
            onClick={attemptLogin}
         > Login </button>
         <p ref={errorRef} className={errorMessage ? "error" : "hidden"} area-live="assertive">{errorMessage}</p>
         <p>Don&apos;t have an account?</p>
         <a href='/register'>create account</a>

         </div>
      </>
   )
}

export default Login