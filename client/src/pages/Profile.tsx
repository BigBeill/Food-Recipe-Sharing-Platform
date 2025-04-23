import { useEffect, useState, useRef } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';

import axios from '../api/axios';
import GrowingText from '../components/GrowingText';
import Loading from '../components/Loading';
import UserObject from '../interfaces/UserObject';
import RelationshipObject from '../interfaces/RelationshipObject';

export default function Profile() {
   const titleParent = useRef(null);
   const navigate = useNavigate();
   const {userData} = useOutletContext<{userData: UserObject}>();
   const { _id } = useParams();

   const [userObject, setUserObject] = useState<UserObject>();
   const [relationship, setRelationship] = useState<RelationshipObject>();
   const [editMode, setEditMode] = useState<boolean>(false);

   const [buttonSafety, setButtonSafety] = useState<boolean>(true);

   useEffect(() => {
      setEditMode(false);
      
      if (!_id){
         if (!userData) { navigate('/login'); }

         axios({ method: 'get', url: `user/info/${userData._id}` })
         .then((response) => { setUserObject(response); });
         setRelationship({ _id: "0", target: userData._id, type: 4 });
      }
      else {
         axios({ method: 'get', url: `user/info/${_id}` })
         .then((response) => { setUserObject(response); });
         axios({ method: 'get', url: `user/defineRelationship/${_id}` })
         .then((response) => { setRelationship(response); });
      }

   }, [_id]);

   function exitEditMode(saveChanges: boolean) {
      if (!userObject) { return; }
      if (saveChanges) {
         const requestData = {
            username: userObject.username,
            email: userObject.email,
            bio: userObject.bio
         }
         axios({ method: 'post', url: 'user/updateAccount', data: requestData })
      }
      else {
         let url;
         if (!_id) { url = `user/info/${userData._id}`; }
         else { url = `user/info/${_id}`; }
         axios({ method: 'get', url })
         .then((response) => { setUserObject(response); });
      }
      setEditMode(false);
   }

   function sendFriendRequest () {
      if (!userObject) { return; }
      axios({ method: 'post', url: 'user/sendFriendRequest', data: {userId: userObject._id} })
      .then((response) => { setRelationship({ _id: response._id, target: userObject._id, type: 3}); });
   }

   function processFriendRequest(accept: boolean) {
      if (!userObject || !relationship) { return; }
      if (accept) {
         axios({ method: 'post', url: 'user/processFriendRequest', data: { requestId: relationship._id, accept: true } })
         .then((response) => { setRelationship({ _id: response._id, target: userObject._id, type: 2 }); });
      }
      else {
         axios({ method: 'post', url: 'user/processFriendRequest', data: { requestId: relationship._id, accept: false } })
         .then(() => { setRelationship({ _id: '0', target: userObject._id, type: 0 }); });
      }
   }

   function removeFriend() {
      if (!userObject || !relationship) { return; }
      if (buttonSafety) {
         setButtonSafety(false);
         return;
      }
      axios({ method: 'post', url: 'user/deleteFriend', data: { relationshipId: relationship._id } })
      .then(() => { setRelationship({ _id: '0', target: userObject._id, type: 0 }); });
   }

   // handle logout function
   function handleLogout() {
      axios({ method: 'post', url: 'authentication/logout' })
      .then(() => { location.assign('/') })
   }

   // don'd load page until data is fetched
   if (!userObject || !relationship) { return <Loading /> }

   return (
      <div className='displayUserData'>
         <div ref={titleParent} className='centredVertically'>
            <GrowingText text={userObject.username} parentDiv={titleParent} />
         </div>
         <div>
            <img className="consumeSpace" src="../../public/profile-photo.png" alt='profile picture' />
         </div>

         <div> {/* styleDiv, should not contain anything */} </div>

         <div>
            <p>_id: {userObject._id}</p>
            <p>username: {userObject.username}</p>
            <p>email: {userObject.email}</p>
         </div>
         <div className='textInputParent bottomPadding'>
            { editMode ? (
               <>
                  <label htmlFor="bio">Personal Bio</label>
                  <textarea id="bio "value={userObject.bio} onChange={ (event) => { setUserObject({ ...userObject, bio: event.target.value }); } } />
               </> 
            ) : (
               <>
                  <h4>Personal Bio</h4>
                  { userObject.bio ? <p>{userObject.bio}</p> : <p>No bio available</p> }
               </>
            )}

         </div>

         <div> {/* styleDiv, should not contain anything */} </div>

         {/* display the appropriate set of two buttons */}
         <div className="splitSpace smallerGap">
            { editMode ? (
               <>
                  <button onClick={ () => { exitEditMode(true); } }>Save Changes</button>
                  <button onClick={ () => { exitEditMode(false); } }>Delete Changes</button>
               </>
            ) : relationship.type == 0 ? (
               <>
                  <div></div>
                  <button onClick={ () => { sendFriendRequest(); } }>Send friend request</button>
               </>
            ) : relationship.type == 1 ? (
               <>
                  <div></div>
                  <div className='devisableButton'>
                     <button onClick={() => { removeFriend(); }}>Remove friend</button>
                     <button className={buttonSafety ? 'hideButton' : 'showButton'} onClick={() => { setButtonSafety(true); }} >Cancel</button>
                  </div>
               </>
            ) : relationship.type == 2 ? (
               <>
                  <button onClick={ () => { processFriendRequest(true); } }>Accept friend request</button>
                  <button onClick={ () => { processFriendRequest(false); } }>Reject friend request</button>
               </>
            ) : relationship.type == 3 ? (
               <>
                  <div></div>
                  <button onClick={ () => { processFriendRequest(false); } }>Cancel friend request</button>
               </>
            ) : relationship.type == 4 ? (
               <>
                  <button onClick={ () => { setEditMode(true); } }> edit account </button>
                  <button onClick={ () => { handleLogout(); } }> logout </button>
               </>
            ) : null }
         </div>

      </div >
   )
}