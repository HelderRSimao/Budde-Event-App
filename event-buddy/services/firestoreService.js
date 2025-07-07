//firestoreService.js
import { firestore, auth } from "../firebaseConfig";

// References to Firestore collections
const eventsRef = firestore.collection("events");
const usersRef = firestore.collection("users");

//  Fetch all events ordered by date/time
export const getEvents = () =>
  eventsRef.orderBy("datetime").get();

//  Fetch a single event by its ID
export const getEventById = (id) =>
  eventsRef.doc(id).get();

// Toggle user's participation in an event
export const toggleParticipation = async (eventId, userId) => {
  const eventDoc = eventsRef.doc(eventId);
  const userDoc = usersRef.doc(userId);

  const eventSnap = await eventDoc.get();
  const userSnap = await userDoc.get();

  const participants = eventSnap.data().participants || [];
  const userData = userSnap.exists ? userSnap.data() : {};

  const isParticipating = participants.includes(userId);

  if (isParticipating) {
    //  User is already participating, remove participation
    await eventDoc.update({
      participants: firebase.firestore.FieldValue.arrayRemove(userId)
    });
    await userDoc.update({
      participations: firebase.firestore.FieldValue.arrayRemove(eventId)
    });
  } else {
    //  User is not participating, add participation
    await eventDoc.update({
      participants: firebase.firestore.FieldValue.arrayUnion(userId)
    });
    await userDoc.update({
      participations: firebase.firestore.FieldValue.arrayUnion(eventId)
    });
  }
};

// Toggle favorite status of an event for the user
export const toggleFavorite = async (eventId, userId) => {
  const userDoc = usersRef.doc(userId);
  const userSnap = await userDoc.get();

  const favorites = userSnap.exists && userSnap.data().favorites
    ? userSnap.data().favorites
    : [];

  const isFavorite = favorites.includes(eventId);

  if (isFavorite) {
    //  Remove from favorites
    await userDoc.update({
      favorites: firebase.firestore.FieldValue.arrayRemove(eventId)
    });
  } else {
    //  Add to favorites
    await userDoc.update({
      favorites: firebase.firestore.FieldValue.arrayUnion(eventId)
    });
  }
};

//  Get all favorite events for a user
export const getFavoriteEvents = async (userId) => {
  const userSnap = await usersRef.doc(userId).get();
  const favorites = userSnap.exists && userSnap.data().favorites
    ? userSnap.data().favorites
    : [];

  if (favorites.length === 0) return [];

  // Fetch all event documents whose IDs are in the user's favorites list
  const eventsQuery = await eventsRef
    .where(firebase.firestore.FieldPath.documentId(), "in", favorites)
    .get();

  // Return an array of event objects with their ID included
  return eventsQuery.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};
