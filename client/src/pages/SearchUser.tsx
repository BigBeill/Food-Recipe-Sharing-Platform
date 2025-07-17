import {useState, useEffect } from "react";
import { useSearchParams, useParams } from "react-router-dom";

import axios from "../api/axios.js";
import UserPin from "../components/UserPin.js";
import Folder from "../components/Folder.js";
import PaginationBar from "../components/PaginationBar.tsx";
import UserObject from "../interfaces/UserObject.ts";
import FolderObject from "../interfaces/FolderObject.ts";
import Loading from "../components/Loading.tsx";

export default function SearchUser() {
   // get all search params from the url
   const [searchParams, setSearchParams] = useSearchParams();
   const { category, folderId } = useParams<{ category: string, folderId?: string }>();
   const [_id, set_id] = useState<string | null>(searchParams.get("_id"));
   const [username, setUsername] = useState<string | null>(searchParams.get("username"));
   const [email, setEmail] = useState<string | null>(searchParams.get("email"));

   // save the page size and current page number
   const pageSize: number = 15;
   const currentPage: number = Number(searchParams.get("pageNumber")) || 1;

   // state variables for variables collected from the server
   const [folderList, setFolderList] = useState<FolderObject[]>([]);
   const [folderCount, setFolderCount] = useState<number>(0);
   const [userList, setUserList] = useState<UserObject[]>([]);
   const [userCount, setUserCount] = useState<number>(0);

   // useState to avoid unnecessary renders
   const [loadingPage, setLoadingPage] = useState<boolean>(true);

   function fetchObjectsFromDatabase() {
      // reset object variables
      setFolderList([]);
      setFolderCount(0);
      setUserList([]);
      setUserCount(0);

      // logic for collecting a list of user objects from the database
      // the function will be called after folderList has been fetched
      function fetchUsers(totalFolders: number, foldersGrabbed: number) {
         let url = '/user/find?';
         if (_id) { url += `_id=${_id}&`; }
         if (username) { url += `username=${username}&`; }
         if (email) { url += `email=${email}&`; }
         if (category) { url += `category=${category}&`; }
         const skip = (currentPage - 1) * pageSize - totalFolders;
         if (skip > 0) { url += `skip=${skip}&`; }
         url += `limit=${pageSize - foldersGrabbed}&count=true`
         axios({ method: 'get', url})
         .then((response) => {
            setUserList(response.userObjectList);
            setUserCount(response.count);
            setLoadingPage(false);
         });
      }

      // logic for collecting folders from the database if needed
      if (category == 'friends') {
         let initialFolderList: FolderObject[] = [];
         let initialFolderCount: number = 0;

         if (!folderId && currentPage == 1) {
            initialFolderList = [{ _id: 'requests', title: 'Friend Requests', content: [] }];
            initialFolderCount = 1;
         }
         axios({ method: 'get', url: `/user/folder?limit=${pageSize}&skip=${(currentPage - 1) * pageSize}&count=true` })
         .then((response) => {
            setFolderList([ ...initialFolderList, ...response.folders ]);
            setFolderCount( initialFolderCount + response.count);
            fetchUsers(response.count, response.folders.length);
         });
      }
      else { fetchUsers(0, 0); }
   }

   // handler for when the search button is clicked
   function submitSearch() {
      // scroll to the top of the page
      document.getElementById("root")?.scrollTo({ top: 0, behavior: "auto" });

      // update the search params in the url
      const newParams = new URLSearchParams();
      if (_id) { newParams.set("_id", _id); }
      if (username) { newParams.set("username", username); }
      if (email) { newParams.set("email", email); }

      setSearchParams(newParams);
      // the actual search will be done in useEffect if searchParams changes
   }

   // handler for when new page is requested by the pagination bar
   function requestNewPage(page: number) {
      // empty the current array of users
      setLoadingPage(true);
      setUserList([]);

      // update the page number in the url
      setSearchParams(searchParams => ({...searchParams, pageNumber: page}));
      // the actual search will be done in useEffect if searchParams changes
   }

   // use effect for handling url changes
   useEffect (() => {
      setLoadingPage(true);
      fetchObjectsFromDatabase();
   },[searchParams, category, folderId]);

   if (loadingPage) { return <Loading />; }

   return (
      <div>
         <div className="displayPinCollection">

            <div className="filterPanel">
               <h2>Filter Users - Public</h2>
               <div className="textInput">
                  <label htmlFor="searchId">user ID</label>
                  <input 
                  id="searchId" 
                  type="text"
                  placeholder="Search by ID (exact match)"
                  value={_id || ''}
                  onChange={(event) => set_id(event.target.value)}
                  onKeyDown={ (event) => { if(event.key == "Enter") submitSearch(); } }
                  />
               </div>
               <div className="textInput">
                  <label htmlFor="searchUsername">Username</label>
                  <input 
                  id="searchUsername" 
                  type="text"
                  placeholder="Search by username"
                  value={username || ''}
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
                  value={email || ''}
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

            { folderList.map((folder, index) => (
               <Folder key={index} folderDetails={folder} />
            ))}

            {/* create a user pin for each user given by the database */}
            { userList.map((userData, index) => (
               <UserPin key={index} userObject={userData} />
            ))}
         </div>

         <PaginationBar currentPage={currentPage} totalPages={Math.ceil((folderCount + userCount)/pageSize)} requestNewPage={requestNewPage} />
      </div>
   );
}