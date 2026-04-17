var firebaseConfig = {
    apiKey: "AIzaSyB_3AUcdBPuc6U8QkmjRpWBKHZtEzP1ans",
    authDomain: "cats-299d4.firebaseapp.com",
    projectId: "cats-299d4",
    storageBucket: "cats-299d4.firebasestorage.app",
    messagingSenderId: "951863185464",
    appId: "1:951863185464:web:1dcda66724ecd09f7416cd"
};

firebase.initializeApp(firebaseConfig);

var auth = firebase.auth();
var googleProvider = new firebase.auth.GoogleAuthProvider();
var firestore = firebase.firestore();
