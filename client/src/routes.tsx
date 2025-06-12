import LandingPage from './pages/LandingPage.tsx'
import PublicRecipes from './pages/PublicRecipes.tsx'
import EditRecipe from "./pages/EditRecipe.tsx"
import FriendsList from './pages/FriendsList.tsx'
import Ingredients from './pages/Ingredients.tsx'
import Login from './pages/Login.tsx'
import Profile from './pages/Profile.tsx'
import Register from './pages/Register.tsx'
import Recipe from './pages/Recipe.tsx'
import SearchUser from './pages/SearchUser.tsx'
import Admin from './pages/Admin.tsx'

import NotFound from './pages/NotFound.tsx'

export const routes = [
  {
    path:'/',
    element:<LandingPage />,
  },
  {
    path:'/publicRecipes',
    element:<PublicRecipes />,
  },
  {
    path:'/editRecipe/:recipeId?',
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
    path:'/profile/:userId?',
    element:<Profile />,
  },
  {
    path:'/register',
    element:<Register />,
  },
  {
    path: '/recipe/:recipeId?',
    element: <Recipe />
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
    path:'*',
    element:<NotFound />,
  }
]