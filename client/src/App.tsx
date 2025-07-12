import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation, matchPath } from 'react-router-dom'

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

   function RouteWrapper () {
      const location = useLocation();
      const route = routes.find((route) => { matchPath(route.path, location.pathname) });

      const requireUser = route?.requireUser

      if (loading && requireUser) {
         return <Loading />
      }

      return (
         <Routes>
            <Route element={<Layout userData={userData} />}>
               {routes.map((route) => (
                  <Route key={route.path} path={route.path} element={route.element} />
               ))}
            </Route>
         </Routes>
      )
   }

   return (
      <BrowserRouter>
         <RouteWrapper />
      </BrowserRouter>
   )
}

export default App