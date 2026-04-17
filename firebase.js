// Firebase configuration for the admin upload app
// These credentials are safe to expose (public-only app, auth is via Google)
var firebaseConfig = {
    apiKey: "AIzaSyB_3AUcdBPuc6U8QkmjRpWBKHZtEzP1ans",
    authDomain: "cats-299d4.firebaseapp.com",
    projectId: "cats-299d4",
    messagingSenderId: "951863185464",
    appId: "1:951863185464:web:1dcda66724ecd09f7416cd"
};

// Initialize Firebase app
firebase.initializeApp(firebaseConfig);

// Get references needed for admin functionality
var auth = firebase.auth();                          // For Google sign-in
var googleProvider = new firebase.auth.GoogleAuthProvider();  // Google auth provider
var firestore = firebase.firestore();                // For reading/writing cat data
