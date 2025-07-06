import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD5B0Jw0A5XyZ6U2YFnwU8lnAu-jKzU0Rw",
  authDomain: "upvote-app-35ab1.firebaseapp.com",
  databaseURL: "https://upvote-app-35ab1-default-rtdb.firebaseio.com",
  projectId: "upvote-app-35ab1",
  storageBucket: "upvote-app-35ab1.firebasestorage.app",
  messagingSenderId: "423165386457",
  appId: "1:423165386457:web:f7d28bbaa1c031aacde8c8",
  measurementId: "G-DKR21K8GQ5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db }; 