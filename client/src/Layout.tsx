// external imports
import {Outlet} from 'react-router-dom'

// internal imports
import Nav from './components/Nav'

interface LayoutProps {
  userId: string | null;
}

export default function Layout({userId}: LayoutProps) {
  return(
    <>
      <header />
      <Nav userId={userId}/>
      <main>
        <Outlet context={{ userId }}/>
      </main>
    </>
  )
}
