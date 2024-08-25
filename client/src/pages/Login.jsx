/* eslint-disable react/no-unknown-property */
import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios'

function Login() {
  const errorRef = useRef()
  const navigate = useNavigate();

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    document.body.classList.add('loginBackground')
    return () => { document.body.classList.remove('loginBackground') }
  }, [])

  useEffect(() => {
    setErrorMessage("");
  }, [username, password])


  function attemptLogin() {

    if (!username) return setErrorMessage("no username given");
    if (!password) return setErrorMessage("no password given");

    const userData = { username, password };
    axios({method: 'post', url: 'user/login', data: userData})
    .then(() => { navigate('/'); })
    .catch(response => { setErrorMessage(response.error) });
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
              value="1" />
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