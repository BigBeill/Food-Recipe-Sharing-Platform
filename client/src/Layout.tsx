// external imports
import {Outlet} from 'react-router-dom'

// internal imports
import Nav from './components/Nav'

import UserObject from './interfaces/UserObject'

interface LayoutProps {
  userData: UserObject | null;
}

export default function Layout({userData}: LayoutProps) {
  return(
    <>
      <header />
      <Nav userData={userData}/>
      <main>
        <Outlet context={{ userData }}/>
      </main>
    </>
  )
}
