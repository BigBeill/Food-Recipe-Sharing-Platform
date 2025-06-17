import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import axios from './api/axios';
import Layout from './Layout'
import Loading from './components/Loading'
import { routes } from './routes'

import UserObject from './interfaces/UserObject';

function App() {
   // userData is passed down to all children
   const [userData, setUserData] = useState<UserObject | null>(null);
   const [loading, setLoading] = useState(true);

   // get necessary information for the database to run application
   useEffect(() => {
      axios({ method: 'get', url: `user/getObject` })
      .then((response) => { 
         setUserData(response);
         setLoading(false);
      })
      .catch(() => { 
         setUserData(null);
         setLoading(false);
      });
   }, []);

   //don't load the main page until session startup has been complete
   if (loading) { return <Loading /> }

   return (
      <BrowserRouter>
         <Routes>
         <Route element={<Layout userData={userData} />}>
            {routes.map((route) => (
               <Route key={route.path} path={route.path} element={route.element} />
            ))}
         </Route>
         </Routes>
      </BrowserRouter>
   )
}

export default App