/*
type:
   0: no relationship
   1: friends
   2: received friend requests
   3: sent friend requests
   4: self
*/
export default interface RelationshipObject {
   _id: string;
   target: string;
   type: "none" | "friend" | "requestReceived" | "requestSent" | "self";
}