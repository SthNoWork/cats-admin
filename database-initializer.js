// Sets a status message in the UI for initialization feedback
function setInitStatus(message) {
    var initStatus = document.getElementById("initStatus");
    if (initStatus) {
        initStatus.innerText = message;
    }
}

// Writes default categories to Firestore if they don't already exist
// This sets up the initial category options for the admin upload form
function initializeDefaultCategories() {
    // Only admins (logged-in users) can initialize categories
    if (typeof currentUser === "undefined" || !currentUser) {
        setInitStatus("Please login first.");
        return;
    }

    // Define the default category list
    var defaultCategories = [
        "Ministry of Cats",
        "Funny",
        "Cute",
        "Street",
        "Rescue"
    ];
    var categoryDoc = {};
    var i;

    // Build the Firestore document: {1: "Ministry of Cats", 2: "Funny", ...}
    for (i = 0; i < defaultCategories.length; i = i + 1) {
        categoryDoc[String(i + 1)] = defaultCategories[i];
    }

    // Add a server timestamp to track when categories were last updated
    categoryDoc.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

    setInitStatus("Writing default categories...");

    // Write to Firestore under config/categories
    // Using merge: true means it won't overwrite other fields if the document exists
    firestore.collection("config").doc("categories").set(categoryDoc, { merge: true })
        .then(function () {
            setInitStatus("Default categories are ready.");
            // Refresh the category dropdown in the admin form
            if (typeof loadCategories === "function") {
                loadCategories();
            }
        })
        .catch(function (error) {
            setInitStatus("Error: " + error.message);
        });
}
