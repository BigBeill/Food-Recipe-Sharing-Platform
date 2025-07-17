import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation, matchPath } from 'react-router-dom'

import axios from './api/axios';
import Layout from './Layout'
import Loading from './components/Loading'
import { routes } from './routes'

function App() {
   // userData is passed down to all children
   const [userId, setUserId] = useState<string | null>(null);
   const [loading, setLoading] = useState(true);

   // get necessary information for the database to run application
   useEffect(() => {
      axios({ method: 'get', url: `authentication/status` })
      .then((response) => { 
         setUserId(response);
         setLoading(false);
      })
      .catch(() => { 
         setUserId(null);
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
            <Route element={<Layout userId={userId} />}>
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