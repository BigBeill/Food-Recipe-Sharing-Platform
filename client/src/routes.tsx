import React, { Suspense, lazy } from 'react'

const LandingPage = lazy(() => import('./pages/LandingPage.tsx'))
const AboutMe = lazy(() => import('./pages/AboutMe.tsx'))
const EditRecipe = lazy(() => import('./pages/EditRecipe.tsx'))
const Ingredients = lazy(() => import('./pages/Ingredients.tsx'))
const Login = lazy(() => import('./pages/Login.tsx'))
const Profile = lazy(() => import('./pages/Profile.tsx'))
const SearchRecipes = lazy(() => import('./pages/SearchRecipes.tsx'))
const Register = lazy(() => import('./pages/Register.tsx'))
const Recipe = lazy(() => import('./pages/Recipe.tsx'))
const SearchUser = lazy(() => import('./pages/SearchUser.tsx'))
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
    requireUser: false
  },
  {
    path: '/aboutMe',
    element: withSuspense(AboutMe),
    requireUser: false
  },
  {
    path: '/editRecipe/:recipeId?',
    element: withSuspense(EditRecipe),
    requireUser: true
  },
  {
    path: '/login',
    element: withSuspense(Login),
    requireUser: false
  },
  {
    path: '/profile/:targetId?',
    element: withSuspense(Profile),
    requireUser: true
  },
  {
    path: '/searchRecipes/:category',
    element: withSuspense(SearchRecipes),
    requireUser: false
  },
  {
    path: '/register',
    element: withSuspense(Register),
    requireUser: false
  },
  {
    path: '/recipe/:recipeId?',
    element: withSuspense(Recipe),
    requireUser: false
  },
  {
    path: 'searchUser/:category/:folderId?', // category can be 'friends', 'requests', or 'all'
    element: withSuspense(SearchUser),
    requireUser: false
  },
  {
    path: '/ingredients/:groupID?/:ingredientID?',
    element: withSuspense(Ingredients),
    requireUser: false
  },
  {
    path: '*',
    element: withSuspense(NotFound),
  },
]