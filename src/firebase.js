import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDrIJkzHOmP5YxiNeLMB_M3hK-lqs8qjTM",
  authDomain: "questionroom-445ae.firebaseapp.com",
  projectId: "questionroom-445ae",
  storageBucket: "questionroom-445ae.appspot.com",
  messagingSenderId: "738939710156",
  appId: "1:738939710156:web:e712542a15fb19c851f069",
  measurementId: "G-1Q8LP9YPG7",
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(app);

const signInAnonymously = async () => {
  try {
    const res = await auth.signInAnonymously();
    const user = res.user;
    return user;
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};

const registerWithEmailAndPassword = async (name, email, password) => {
  try {
    const res = await auth.createUserWithEmailAndPassword(email, password);
    const user = res.user;
    return user;
  } catch (err) {
    return err;
  }
};

const logInWithEmailAndPassword = async (email, password) => {
  try {
    return auth.signInWithEmailAndPassword(email, password);
  } catch (err) {
    return err;
  }
};

const logout = () => {
  auth.signOut();
};

export {
  auth,
  signInAnonymously,
  registerWithEmailAndPassword,
  logInWithEmailAndPassword,
  logout,
};
