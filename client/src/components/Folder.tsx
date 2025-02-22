import {useEffect, useState} from "react"
import { useNavigate } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder } from '@fortawesome/free-solid-svg-icons';

import axios from "../api/axios"
import UserPin from "./UserPin"

import FolderObject from "../interfaces/FolderObject";
import UserObject from "../interfaces/UserObject";

interface FolderProps {
   folderDetails: FolderObject
}

export default function Folder({ folderDetails }: FolderProps) {

   const navigate = useNavigate();

   const [displayUsers, setDisplayUsers] = useState<UserObject[]>([])

   useEffect(() => {
      // fetch the first 3 users in the folder from server
      if (folderDetails._id == "requests") {
         axios({ method: 'get', url: `/user/find?limit=3&relationship=2` })
         .then((response) => { setDisplayUsers(response.users) })
         .catch((error) => { console.error(error) });
      }
      else {
         folderDetails.content.slice(0, 3).forEach((userId) => {
            axios({ method: 'get', url: `/user/info/${userId}` })
            .then((response) => { setDisplayUsers((prev) => [...prev, response]) })
            .catch((error) => { console.error(error) });
         });
      }
   }, []);

   function openFolder() {
      navigate(`/friendsList/${folderDetails._id}`);
   }
   
   return (
      <div className="displayFolder">

         <div className="userCards shielded">
         { displayUsers[2] ? (
            <div className="cardContainer">
               <UserPin userData={displayUsers[2]} />
            </div>
         ) : <div style={ {display: 'none'} }></div>}
         { displayUsers[0] ? (
            <div className="cardContainer">
               <UserPin userData={displayUsers[0]} />
            </div>
         ) : <div style={ {display: 'none'} }></div> }
         { displayUsers[1] ? (
            <div className="cardContainer">
               <UserPin userData={displayUsers[1]} />
            </div>
         ) : <div style={ {display: 'none'} }></div> }

         </div>
         
         <FontAwesomeIcon 
         className="folder" 
         icon={faFolder}
         onClick={ () => { openFolder() } }
         />

         <p className="folderCover"> Friend Requests </p>

      </div>
   )
}