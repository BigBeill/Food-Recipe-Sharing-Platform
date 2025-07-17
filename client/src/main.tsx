import React from 'react';
import ReactDOM from 'react-dom/client';

const localEnvironment: string = import.meta.env.VITE_LOCAL_ENVIRONMENT;

import App from './App';
import './styles/displayData.scss';
import './styles/main.scss';
import './styles/login.scss';
import './styles/inputs.scss';
import './styles/animations.scss';

ReactDOM.createRoot(document.getElementById('root')!).render(
  localEnvironment == "true" ? (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  ) : (
    <App />
  )
)
