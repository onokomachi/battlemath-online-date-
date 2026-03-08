// Import the functions you need from the SDKs you need
// FIX: Use Firebase v9 compat libraries to support v8 syntax. The errors indicate
// that Firebase v9+ is installed, but the code uses the older, namespaced v8 API.
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

// Your web app's Firebase configuration from the screenshot
const firebaseConfig = {
  apiKey: "AIzaSyGW-cHwQBwgXFxdHyA",
  authDomain: "aicardbattle-online.firebaseapp.com",
  projectId: "aicardbattle-online",
  storageBucket: "aicardbattle-online.appspot.com",
  messagingSenderId: "891142351983",
  appId: "1:891142351983:web:b5bd260df8b3d4d97392a"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Get a reference to the Firestore database service and export it
export const db = firebase.firestore();