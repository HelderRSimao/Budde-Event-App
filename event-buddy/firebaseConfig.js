import firebase from "firebase";
import "firebase/auth";
import "firebase/firestore";





const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

 
if(!firebase.apps.length){
  firebase.initializeApp(firebaseConfig);
}

export const database = firebase.firestore();
export const auth = firebase.auth();

