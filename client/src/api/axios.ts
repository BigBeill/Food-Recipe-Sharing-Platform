/*
example api call:

import axios from '../api/axios';

const response = await axios({
   method: 'get',
   url: 'user/id'
   data:{
      //anything you want included in the body
   }
});
*/


import axios from 'axios';

const axiosInstance =  axios.create({
   baseURL: 'https://localhost:4000',
   withCredentials: true
});

interface sendRequestProps {
   method: string;
   url: string;
   data?: { [key: string]: any };
}

export default async function sendRequest( configuration: sendRequestProps ) {
   return new Promise<any>(async (resolve, reject) => {

      // attempt to send request
      axiosInstance(configuration)
      .then((response) => {
         console.trace("RESPONSE FROM SERVER!", "\n url:", configuration.url, "\n response:", response);
         return resolve(response.data.payload);
      })
      .catch((error) => {
         // check if request was rejected due to accessToken
         if (error.status == 401) {
            //attempt to request a new access token
            console.log("accessToken rejected, requesting new accessToken");
            axiosInstance({ method: 'post', url: 'authentication/refresh' })
            .then(() => {
               // if new access token was successfully received, retry request
               console.log("accessToken refreshed, retrying request");
               axiosInstance(configuration)
               .then((response) => {
                  console.trace("RESPONSE FROM SERVER!", "\n url:", configuration.url, "\n response:", response);
                  return resolve(response.data.payload);
               })
               .catch((error) => {
                  // if request was rejected after refreshing accessToken, return error
                  console.error('issue processing request:', error);
                  if (error.response) { return reject(error.response.data); } 
                  else { return reject(error); }
               })
            })
            .catch((refreshError) => {
               // if request for new access token was rejected, return error
               console.error('issue refreshing token:', refreshError);
               console.error('issue processing request:', error);
               if (error.response) { return reject(error.response.data); } 
               else { return reject(error); }
            });
         }
         else {
            // if request was not rejected due to accessToken, return error
            console.error('issue processing request:', error);
            
            if (error.response) { return reject(error.response.data); } 
            else { return reject(error); }
         }
      });
   })
}