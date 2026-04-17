function setInitStatus(message) {
    var initStatus = document.getElementById("initStatus");
    if (initStatus) {
        initStatus.innerText = message;
    }
}

function initializeDefaultCategories() {
    if (typeof currentUser === "undefined" || !currentUser) {
        setInitStatus("Please login first.");
        return;
    }

    var defaultCategories = [
        "Ministry of Cats",
        "Funny",
        "Cute",
        "Street",
        "Rescue"
    ];
    var categoryDoc = {};
    var i;

    for (i = 0; i < defaultCategories.length; i = i + 1) {
        categoryDoc[String(i + 1)] = defaultCategories[i];
    }

    categoryDoc.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

    setInitStatus("Writing default categories...");

    firestore.collection("config").doc("categories").set(categoryDoc, { merge: true })
        .then(function () {
            setInitStatus("Default categories are ready.");
            if (typeof loadCategories === "function") {
                loadCategories();
            }
        })
        .catch(function (error) {
            setInitStatus("Error: " + error.message);
        });
}
