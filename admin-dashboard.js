(function () {
  "use strict";

  var currentUser = null;

  function el(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getOptimizedThumbnail(url) {
    var thumb = String(url || "").trim();
    if (!thumb) return "";

    if (
      window.AdminEfficiencyMedia &&
      typeof window.AdminEfficiencyMedia.getListThumbnail === "function"
    ) {
      return window.AdminEfficiencyMedia.getListThumbnail(thumb);
    }

    return thumb;
  }

  function logoutUser() {
    if (!confirm("Logout?")) return;
    auth.signOut().then(function () {
      window.location.href = "index.html";
    });
  }

  function loadStats() {
    if (!currentUser) return;

    firestore
      .collection("cats")
      .get()
      .then(function (snapshot) {
        el("statCats").innerText = snapshot.size;
      });

    firestore
      .collection("config")
      .doc("categories")
      .get()
      .then(function (doc) {
        if (!doc.exists) {
          el("statCategories").innerText = "0";
          return;
        }

        var data = doc.data();
        var count = 0;

        for (var key in data) {
          if (!isNaN(parseInt(key, 10))) {
            count += 1;
          }
        }

        el("statCategories").innerText = count;
      });

    var sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    firestore
      .collection("cats")
      .where(
        "addedAt",
        ">=",
        firebase.firestore.Timestamp.fromDate(sevenDaysAgo),
      )
      .get()
      .then(function (snapshot) {
        el("statRecent").innerText = snapshot.size;
      });
  }

  function loadRecentEntries() {
    if (!currentUser) return;

    firestore
      .collection("cats")
      .orderBy("addedAt", "desc")
      .limit(10)
      .get()
      .then(function (snapshot) {
        var html = "";

        if (snapshot.empty) {
          html =
            "<p class='text-center text-on-surface-variant py-8'>No entries yet</p>";
        } else {
          snapshot.forEach(function (doc) {
            var data = doc.data();
            var date = data.addedAt
              ? data.addedAt.toDate().toLocaleDateString()
              : "Unknown";
            var thumb = data.thumbnail || "";
            var optimizedThumb = getOptimizedThumbnail(thumb);
            var title = data.title || "Untitled";

            html +=
              "<div class='flex gap-3 pb-3 border-b border-outline-variant/20 last:border-b-0'>";
            if (thumb) {
              html +=
                "<img src='" +
                escapeHtml(optimizedThumb) +
                "' loading='lazy' decoding='async' alt='" +
                escapeHtml(title) +
                "' class='w-12 h-12 rounded-lg object-cover flex-shrink-0' />";
            } else {
              html +=
                "<div class='w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-tertiary'><span class='material-symbols-outlined text-lg'>image</span></div>";
            }
            html +=
              "<div class='flex-1 min-w-0'><p class='font-bold text-on-surface text-sm truncate'>" +
              escapeHtml(title) +
              "</p><p class='text-xs text-tertiary'>" +
              escapeHtml(date) +
              "</p></div></div>";
          });
        }

        el("recentList").innerHTML = html;
      });
  }

  function initAuthFlow() {
    auth.onAuthStateChanged(function (user) {
      if (!user) {
        window.location.href = "index.html";
        return;
      }

      currentUser = user;
      el("userEmail").innerText = user.email || "Admin";
      el("accEmail").innerText = user.email || "--";
      el("accUID").innerText = user.uid || "--";
      el("accLastLogin").innerText = new Date(
        user.metadata.lastSignInTime,
      ).toLocaleDateString();

      loadStats();
      loadRecentEntries();
    });
  }

  function init() {
    window.logoutUser = logoutUser;
    initAuthFlow();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
