import React, { Suspense, lazy } from 'react'

const LandingPage = lazy(() => import('./pages/LandingPage.tsx'))
const PublicRecipes = lazy(() => import('./pages/PublicRecipes.tsx'))
const EditRecipe = lazy(() => import('./pages/EditRecipe.tsx'))
const FriendsList = lazy(() => import('./pages/FriendsList.tsx'))
const Ingredients = lazy(() => import('./pages/Ingredients.tsx'))
const Login = lazy(() => import('./pages/Login.tsx'))
const Profile = lazy(() => import('./pages/Profile.tsx'))
const Register = lazy(() => import('./pages/Register.tsx'))
const Recipe = lazy(() => import('./pages/Recipe.tsx'))
const SearchUser = lazy(() => import('./pages/SearchUser.tsx'))
const Admin = lazy(() => import('./pages/Admin.tsx'))
const NotFound = lazy(() => import('./pages/NotFound.tsx'))

import Loading from './components/Loading.tsx'

const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => (
  <Suspense fallback={<Loading />}>
    <Component />
  </Suspense>
)

export const routes = [
  {
    path: '/',
    element: withSuspense(LandingPage),
  },
  {
    path: '/publicRecipes',
    element: withSuspense(PublicRecipes),
  },
  {
    path: '/editRecipe/:recipeId?',
    element: withSuspense(EditRecipe),
  },
  {
    path: '/friendsList/:folderId?',
    element: withSuspense(FriendsList),
  },
  {
    path: '/login',
    element: withSuspense(Login),
  },
  {
    path: '/profile/:userId?',
    element: withSuspense(Profile),
  },
  {
    path: '/register',
    element: withSuspense(Register),
  },
  {
    path: '/recipe/:recipeId?',
    element: withSuspense(Recipe),
  },
  {
    path: 'searchUser',
    element: withSuspense(SearchUser),
  },
  {
    path: '/ingredients/:groupID?/:ingredientID?',
    element: withSuspense(Ingredients),
  },
  {
    path: '/admin',
    element: withSuspense(Admin),
  },
  {
    path: '*',
    element: withSuspense(NotFound),
  },
]