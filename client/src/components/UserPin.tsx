import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan, faCheck, faUser, faUserPlus, faX } from '@fortawesome/free-solid-svg-icons';

import axios from '../api/axios';
import GrowingText from './GrowingText';
import UserObject from '../interfaces/UserObject';
import RelationshipObject from '../interfaces/RelationshipObject';

interface UserPinProps {
   userObject: UserObject;
}

export default function UserPin({ userObject }: UserPinProps) {
  
   const navigate = useNavigate();
   const titleRef = useRef(null);

   const [iconsHidden, setIconsHidden] = useState<boolean>(false);
   const [relationship, setRelationship] = useState<RelationshipObject>({ _id: '0', target: '0', type: 0 });

   // useEffect for handling new a userObject
   useEffect(() => {
      // check if relationship is already defined in the userObject
      if (userObject.relationship) { setRelationship(userObject.relationship); }
      else {
         // if not, get the relationship from the server
         axios({ method: 'get', url: `user/defineRelationship/${userObject._id}` })
         .then((response) => { setRelationship(response); });
      }
   }, [userObject]);

   // useEffect for handling changes in the relationship
   useEffect(() => { 
      setIconsHidden(false);
   }, [relationship]);
   

   function viewProfile() {
      navigate(`/profile/${userObject._id}`);
   }

   function sendFriendRequest () {
      setIconsHidden(true);
      axios({ method: 'post', url: 'user/sendFriendRequest', data: {receiverId: userObject._id} })
      .then((response) => {
         setRelationship({ _id: response._id, target: userObject._id, type: 2 });
      });
   }
   
   function acceptFriendRequest () {
      setIconsHidden(true);
      axios({ method: 'post', url: 'user/processFriendRequest', data: { requestId: relationship._id, accept: true } })
      .then((response) => {
         setRelationship({ _id: response._id, target: userObject._id, type: 1 });
      });
   }

   function rejectFriendRequest () {
      setIconsHidden(true);
      axios({ method: 'post', url: 'user/processFriendRequest', data: { requestId: relationship._id, accept: false } })
      .then(() => {
         setRelationship({ _id: '0', target: '0', type: 0 });
      });
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
            relationship.type == 0 ? 'none' : 
            relationship.type == 1 ? 'friends' : 
            relationship.type == 4 ? 'your account' : 
            'friendship pending'}
         </p>
         </div>
         <div className={`icons ${iconsHidden ? 'hidden' : ''}`}>
         { relationship.type == 0 ? (
            <FontAwesomeIcon icon={faUserPlus} onClick={() => { sendFriendRequest() } } />
         ) : relationship.type == 1 ? (
            <FontAwesomeIcon icon={faUser} onClick={ () => { viewProfile() } } />
         ) : relationship.type == 2 ? (
            <FontAwesomeIcon icon={faBan} onClick={ () => { rejectFriendRequest() } } />
         ) : relationship.type == 3 ? (
            <>
               <FontAwesomeIcon icon={faCheck} onClick={ () => { acceptFriendRequest() } } />
               <FontAwesomeIcon icon={faX} onClick={ () => { rejectFriendRequest() } } />
            </>
         ) : relationship.type == 4 ? (
            <FontAwesomeIcon icon={faUser} onClick={ () => { viewProfile() } } />
         ) : null }
         </div>
      </div>
   )
}