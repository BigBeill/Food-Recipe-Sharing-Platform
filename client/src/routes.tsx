import React from 'react';

// internal imports
import Home from './pages/Home.tsx'
import EditRecipe from "./pages/EditRecipe.tsx"
import FriendsList from './pages/FriendsList.tsx'
import Ingredients from './pages/Ingredients.tsx'
import Login from './pages/Login.tsx'
import Profile from './pages/Profile.tsx'
import Register from './pages/Register.tsx'
import SearchUser from './pages/SearchUser.tsx'
import Admin from './pages/Admin.tsx'

import TestPage from './pages/TestingCode.tsx'

import NotFound from './pages/NotFound.tsx'

export const routes = [
  {
    path:'/',
    element:<Home />,
  },
  {
    path:'/home',
    element:<Home />,
  },
  {
    path:'/editRecipe',
    element:<EditRecipe />,
  },
  {
    path:'/friendsList/:folderId?',
    element:<FriendsList />,
  },
  {
    path:'/login',
    element:<Login />,
  },
  {
    path:'/profile/:_id?',
    element:<Profile />,
  },
  {
    path:'/register',
    element:<Register />,
  },
  {
    path:'searchUser',
    element:<SearchUser />,
  },
  {
    path: '/ingredients/:groupID?/:ingredientID?',
    element: <Ingredients />
  },
  {
    path: '/admin',
    element: <Admin />
  },
  {
    path:'/test',
    element:<TestPage />,
  },
  {
    path:'*',
    element:<NotFound />,
  }
]