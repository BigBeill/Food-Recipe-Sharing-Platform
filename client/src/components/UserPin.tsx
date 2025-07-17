import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan, faCheck, faUser, faUserPlus, faX } from '@fortawesome/free-solid-svg-icons';

import axios from '../api/axios';
import GrowingText from './GrowingText';
import UserObject from '../interfaces/UserObject';

interface UserPinProps {
   userObject: UserObject;
}

export default function UserPin({ userObject: parentUserObject }: UserPinProps) {
  
   const navigate = useNavigate();
   const titleRef = useRef(null);

   const [userObject, setUserObject] = useState<UserObject>(parentUserObject);
   const [iconsHidden, setIconsHidden] = useState<boolean>(false);

   // useEffect for handling new a userObject
   useEffect(() => {
      // make sure userObject has a relationship defined
      if(!userObject.relationship) {
         axios({ method: 'get', url: `user/defineRelationship/${userObject._id}` })
         .then((response) => { setUserObject((currentUserObject) => ({ ...currentUserObject, relationship: response })); });
      }
   }, [userObject]);

   // useEffect for handling changes in the relationship
   useEffect(() => { 
      setIconsHidden(false);
   }, [userObject.relationship]);
   
   function viewProfile() {
      navigate(`/profile/${userObject._id}`);
   }

   function sendFriendRequest () {
      setIconsHidden(true);
      axios({ method: 'post', url: 'user/sendFriendRequest', data: {targetId: userObject._id} })
      .then((response) => { setUserObject((currentUserObject) => ({ ...currentUserObject, relationship: { _id: response._id, target: userObject._id, type: "requestReceived" } })); });
   }
   
   function acceptFriendRequest () {
      if (!userObject.relationship) { return; }
      setIconsHidden(true);
      axios({ method: 'post', url: 'user/processFriendRequest', data: { requestId: userObject.relationship._id , accept: true } })
      .then((response) => { setUserObject((currentUserObject) => ({ ...currentUserObject, relationship: { _id: response._id, target: userObject._id, type: "friend" } })); });
   }

   function rejectFriendRequest () {
      if (!userObject.relationship) { return; }
      setIconsHidden(true);
      axios({ method: 'post', url: 'user/processFriendRequest', data: { requestId: userObject.relationship._id, accept: false } })
      .then(() => { setUserObject((currentUserObject) => ({ ...currentUserObject, relationship: { _id: '0', target: '0', type: "none" } })); });
   }

   return (
      <div className='userPin'>
         <div className="centredVertically" ref={titleRef} onClick={ () => { viewProfile() } }>
         <GrowingText text={userObject.username} parentDiv={titleRef} />
         </div>
         <div onClick={ () => { viewProfile() } }>
         <img src='/profile-photo.png' alt='profile picture' />
         </div>

         <div className='styleDiv'></div>

         <div className='contactInformation'>
         <p>email: {userObject.email}</p>
         <p>
            relationship: {
            !userObject.relationship ? 'none' :
            userObject.relationship.type == 'none' ? 'none' : 
            userObject.relationship.type == 'friend' ? 'friends' : 
            userObject.relationship.type == 'self' ? 'your account' : 
            'friendship pending'}
         </p>
         </div>
         <div className={`icons ${iconsHidden ? 'hidden' : ''}`}>
         { !userObject.relationship ? null 
         : userObject.relationship.type == 'none' ? (
            <FontAwesomeIcon icon={faUserPlus} onClick={() => { sendFriendRequest() } } />
         ) : userObject.relationship.type == 'friend' ? (
            <FontAwesomeIcon icon={faUser} onClick={ () => { viewProfile() } } />
         ) : userObject.relationship.type == 'requestReceived' ? (
            <FontAwesomeIcon icon={faBan} onClick={ () => { rejectFriendRequest() } } />
         ) : userObject.relationship.type == 'requestSent' ? (
            <>
               <FontAwesomeIcon icon={faCheck} onClick={ () => { acceptFriendRequest() } } />
               <FontAwesomeIcon icon={faX} onClick={ () => { rejectFriendRequest() } } />
            </>
         ) : userObject.relationship.type == 'self' ? (
            <FontAwesomeIcon icon={faUser} onClick={ () => { viewProfile() } } />
         ) : null }
         </div>
      </div>
   )
}