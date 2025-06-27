// external imports
import { useState, useEffect, useRef} from 'react'

// internal imports
import '../styles/componentSpecific/nav.scss'
import { NavLink, useNavigate } from "react-router-dom";

import UserObject from '../interfaces/UserObject'


interface NavProps {
    userData: UserObject | null;
}

function Nav({userData}: NavProps) {
    const [open, setOpen] = useState<boolean>(false);
    const navRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    
    // open/close the nav bar whenever the handle on the side of the nav panel is clicked
    function openNav() {
        setOpen(!open);
    }

    // close the nav bar whenever the user clicks outside of it
    function handleOutsideClick(event: MouseEvent) {
        if (navRef.current && !navRef.current.contains(event.target as Node)) {
            setOpen(false);
        }
    }

    // detect a click outside the nav bar
    useEffect(() => {
        document.addEventListener("mousedown", handleOutsideClick);
        return () => { document.removeEventListener("mousedown", handleOutsideClick); }
    }, []);

    return(
        <>
        <nav ref={navRef} className={`navBar ${open ? 'open' : ''}`} id="navBar">

            <img className="logo" src="/BigBeill-logo_black.png" alt="Beill Greenhouse Logo" onClick={() => {navigate('/')}}/>


            <h3>Find Recipes</h3>
            <NavLink className="navLink" to="/publicRecipes" onClick={() => setOpen(false)}>Public</NavLink>
            <NavLink className="navLink" to="/index" onClick={() => setOpen(false)}>Friends</NavLink>

            {   
                userData ?
                <>

                <h3>Your Recipes</h3>
                <NavLink className="navLink" to="/recipeBook" onClick={() => setOpen(false)}>Personal</NavLink>
                <NavLink className="navLink" to="/index" onClick={() => setOpen(false)}>Saved</NavLink>
                <NavLink className="navLink" to="/editRecipe" onClick={() => setOpen(false)}>New Recipe</NavLink>

                <h3>Social</h3>
                <NavLink className="navLink" to="/friendsList" onClick={() => setOpen(false)}>Friends</NavLink>
                <NavLink className="navLink" to="/searchUser" onClick={() => setOpen(false)}>Search Users</NavLink>

                <h3>Account</h3>
                <NavLink className="navLink" to="/profile" onClick={() => setOpen(false)}>Profile</NavLink>
                
                </> : <>
                
                <h3>Account</h3>
                <NavLink className="navLink" to="/login" onClick={() => setOpen(false)}>Login</NavLink>
                <NavLink className="navLink" to="/register" onClick={() => setOpen(false)}>Create Account</NavLink>
                
                </>
            }

            <h3>Info</h3>
            <NavLink className="navLink" to="/ingredients" onClick={() => setOpen(false)}>Ingredients List</NavLink>

            <div className='navButton' onClick={openNav}/>

        </nav>
        </>
    )
}

export default Nav