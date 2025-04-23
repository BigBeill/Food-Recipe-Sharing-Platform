import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import './styles/displayData.scss';
import './styles/main.scss';
import './styles/login.scss';
import './styles/RecipeBook.scss';
import './styles/inputs.scss';

//remove before production
import './styles/testingStyles.scss';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
