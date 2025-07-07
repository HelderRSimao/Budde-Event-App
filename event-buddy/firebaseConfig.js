import firebase from "firebase";
import "firebase/auth";
import "firebase/firestore";





const firebaseConfig = {
  apiKey: "AIzaSyA1RbOo8qip11EFAR17AgWShTUM8s0SKRg",
  authDomain: "testdb-f2fa6.firebaseapp.com",
  projectId: "testdb-f2fa6",
  storageBucket: "testdb-f2fa6.firebasestorage.app",
  messagingSenderId: "160410285858",
  appId: "1:160410285858:web:c658524cadbb26f9abd77b"
};

 
if(!firebase.apps.length){
  firebase.initializeApp(firebaseConfig);
}

export const database = firebase.firestore();
export const auth = firebase.auth();

