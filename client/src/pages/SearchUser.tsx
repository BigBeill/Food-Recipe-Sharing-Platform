// external imports
import {useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

// internal imports
import axios from "../api/axios.js";
import UserPin from "../components/UserPin.js";
import PaginationBar from "../components/PaginationBar.tsx";
import UserObject from "../interfaces/UserObject.ts";

export default function SearchUser() {
   const [searchParams, setSearchParams] = useSearchParams();

   const pageSize: number = 15;
   const currentPage: number = Number(searchParams.get("pageNumber")) || 1;

   const [_id, set_id] = useState<string>(searchParams.get("_id") || "");
   const [username, setUsername] = useState<string>(searchParams.get("username") || "");
   const [email, setEmail] = useState<string>(searchParams.get("email") || "");

   const [users, setUsers] = useState<UserObject[]>([]);
   const [totalCount, setTotalCount] = useState<number>(0);

   function submitSearch() {
      document.getElementById("root")?.scrollTo({ top: 0, behavior: "auto" });
      let params: { _id?: string, username?: string, email?: string } = {};
      if (_id) params._id = _id;
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

   useEffect (() => {

      let url: string = `user/find?skip=${(currentPage - 1) * pageSize}&limit=${pageSize}`;

      // add username and password to url
      if (username) url += `&username=${username}`;
      if (email) url += `&email=${email}`;

      url += `&count=true`;
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
         <div className="displayUserInformationCards">

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

            { users.map((userData, index) => (
               <UserPin key={index} userData={userData} />
            ))}
         </div>

         <PaginationBar currentPage={currentPage} totalPages={Math.ceil(totalCount/pageSize)} requestNewPage={requestNewPage} />
      </div>
   );
}