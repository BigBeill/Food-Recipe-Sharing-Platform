import {useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import axios from "../api/axios.js";
import UserPin from "../components/UserPin.js";
import PaginationBar from "../components/PaginationBar.tsx";
import UserObject from "../interfaces/UserObject.ts";

export default function SearchUser() {
   const [searchParams, setSearchParams] = useSearchParams();

   const pageSize: number = 15;
   const currentPage: number = Number(searchParams.get("pageNumber")) || 1;

   // get the search params from the url
   const [_id, set_id] = useState<string>(searchParams.get("_id") || "");
   const [username, setUsername] = useState<string>(searchParams.get("username") || "");
   const [email, setEmail] = useState<string>(searchParams.get("email") || "");

   // get users from the server
   const [users, setUsers] = useState<UserObject[]>([]);
   const [totalCount, setTotalCount] = useState<number>(0);

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
      // scroll to the top of the page
      document.getElementById("root")?.scrollTo({ top: 0, behavior: "auto" });

      // empty the current array of users
      setUsers([]);

      // update the page number in the url
      setSearchParams(searchParams => ({...searchParams, pageNumber: page}));
      // the actual search will be done in useEffect if searchParams changes
   }

   // use effect for handling url changes
   useEffect (() => {

      // create the url for the axios call (skip users already displayed in earlier pages)
      let url: string = `user/find?skip=${(currentPage - 1) * pageSize}&limit=${pageSize}&count=true`;

      // add username and email fields to url
      if (username) { url += `&username=${username}`; }
      if (email) { url += `&email=${email}`; }

      // make axios call
      axios({
         method: 'get',
         url
      })
      .then((response) => {
         setUsers(response.users);
         setTotalCount(response.count);
      })
   },[searchParams]);

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
                  value={_id}
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

            {/* create a user pin for each user given by the database */}
            { users.map((userData, index) => (
               <UserPin key={index} userObject={userData} />
            ))}
         </div>

         <PaginationBar currentPage={currentPage} totalPages={Math.ceil(totalCount/pageSize)} requestNewPage={requestNewPage} />
      </div>
   );
}