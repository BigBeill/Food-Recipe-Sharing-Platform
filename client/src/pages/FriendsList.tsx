// external imports
import { useState, useEffect } from 'react';
import { useSearchParams, useParams } from "react-router-dom";

//internal imports
import axios from '../api/axios';
import UserPin from '../components/UserPin';
import Folder from '../components/Folder';

import FolderObject from '../interfaces/FolderObject';
import UserObject from '../interfaces/UserObject';
import PaginationBar from '../components/PaginationBar';

export default function FriendsList() {
   const [searchParams, setSearchParams] = useSearchParams();
   const { folderId } = useParams<{folderId: string}>();

   const pageSize: number = 15;
   const pageNumber: number = Number(searchParams.get('pageNumber')) || 1;

   const [username, setUsername] = useState(searchParams.get('username') || '');
   const [email, setEmail] = useState(searchParams.get('email') || '');

   const [folders, setFolders] = useState<FolderObject[]>([]);
   const [folderCount, setFolderCount] = useState<number>(0);
   const [users, setUsers] = useState<UserObject[]>([]);
   const [usersCount, setUsersCount] = useState<number>(0);

   function submitSearch() {
      let params: { username?: string; email?: string; } = {};
      if (username) params.username = username;
      if (email) params.email = email;
      setSearchParams(params);
      // the actual search will be done in useEffect if searchParams changes
   }

   function requestNewPage(page: number) {
      setUsers([]);
      document.getElementById("root")?.scrollTo({ top: 0, behavior: "auto" });
      setSearchParams(searchParams => ({...searchParams, pageNumber: page}));
      // the actual search will be done in useEffect if searchParams changes
   }

   // function for requesting folders from the server
   function findFolders(): Promise<number> {
      return new Promise<number>((resolve, reject) => {
         let url: string = `/user/folder?limit=${pageSize}&skip=${(pageNumber - 1) * pageSize}&count=true`;

         if (folderId && folderId != 'requests') { url += `&folderId=${folderId}`; }

         axios({
            method: 'get',
            url
         })
         .then((response) => {
            if (!folderId) {
               if (pageNumber == 1) { setFolders([ {_id: 'requests', content: [] }, ...response.folders ]); }
               else { setFolders(response.folders); }
               setFolderCount(response.count + 1);
               resolve(response.count + 1);
            }
            else {
               setFolders(response.folders);
               setFolderCount(response.count);
               resolve(response.count);
            }
         })
         .catch((error) => { 
            console.log(error); 
            reject();
         });
      });
   }

   // function for requesting users from the server
   // assumes the the number of folders being displayed has already been updated
   function findUsers(skipSpaces: number): Promise<void> {
      return new Promise<void>((resolve, reject) => {
         let url: string;

         // the program is only supposed to display {pageSize} number of users at a time
         // foldersVisible is a calculation of how many folders are visible on the current page
         const foldersVisible: number = skipSpaces - (pageSize * (pageNumber - 1));
         // if there are folders visible, the program will request {pageSize - foldersVisible} number of users
         if (foldersVisible >= pageSize) {
            setUsers([]);
            return;
         }
         else if (foldersVisible > 0) { url = `/user/find?limit=${pageSize - foldersVisible}`; }
         else { url = `/user/find?limit=${pageSize}`; }

         // calculate the number of users (if any) that should be skipped (pageSize * pageNumber - skipSpaces)
         if (pageNumber != 1 && foldersVisible <= 0) { url += `&skip=${((pageNumber - 1) * pageSize) - skipSpaces}`; }

         // figure out what group of users to display (friends, requests, or users in a folder)
         if (!folderId) { url += `&relationship=1`; }
         else if (folderId == "requests") { url += `&relationship=2`; }
         else { url += `&folderId=${folderId}`; }

         // add the search parameters to the url
         if (username) { url += `&username=${username}`; }
         if (email) { url += `&email=${email}`; }

         // add the count parameter to the url
         url += `&count=true`;
         
         axios({ method: 'get', url })
         .then((response) => {
            setUsers(response.users);
            setUsersCount(response.count);
            resolve();
         })
         .catch((error) => { 
            console.log(error);
            reject();
         });

      });
   }

   useEffect(() => {
      findFolders()
      .then((skipSpaces: number) => findUsers(skipSpaces));
   }, [searchParams, folderId]);

   return (
      <div>
         <div className='displayPinCollection'>
            <div className='filterPanel'>
               <h2>Filter Users - Friends</h2>
               <div className="textInput">
                  <label htmlFor="searchUsername">Username</label>
                  <input 
                  id="searchUsername" 
                  type="text"
                  placeholder="Search by username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  onKeyDown={ (event) => { if(event.key == "Enter") submitSearch(); } }
                  />
               </div>
               <div className="textInput">
                  <label htmlFor="searchEmail">Email</label>
                  <input 
                  id="searchEmail" 
                  type="text"
                  placeholder="Search by email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onKeyDown={ (event) => { if(event.key == "Enter") submitSearch(); } }
                  />
               </div>
               <button 
               className="moveToBottom"
               onClick={() => submitSearch()}
               >
                  Search
               </button>
            </div>

            {folders.map((folder, index) => ( 
               <Folder key={index} folderDetails={folder} />
            ))}

            { users.map((userData, index) => (
            <UserPin key={index} userObject={userData} /> 
            ))}

         </div>
         <PaginationBar currentPage={pageNumber} totalPages={Math.ceil((usersCount + folderCount) / pageSize)} requestNewPage={requestNewPage} />
      </div>
   );
}
 