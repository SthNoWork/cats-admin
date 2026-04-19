(function () {
  "use strict";

  function el(id) {
    return document.getElementById(id);
  }

  function loginWithGoogle() {
    var loginBtn = el("loginBtn");
    var statusMsg = el("statusMessage");

    loginBtn.classList.add("loading");
    statusMsg.innerText = "Signing in...";
    statusMsg.className = "text-center text-sm text-on-surface-variant";

    auth
      .signInWithPopup(googleProvider)
      .then(function () {
        statusMsg.innerText = "✓ Welcome! Redirecting...";
        statusMsg.className = "text-center text-sm text-secondary font-bold";

        setTimeout(function () {
          window.location.href = "admin.html";
        }, 800);
      })
      .catch(function (error) {
        loginBtn.classList.remove("loading");
        statusMsg.innerText = "Login failed: " + error.message;
        statusMsg.className = "text-center text-sm text-error";
      });
  }

  function initAuthRedirect() {
    auth.onAuthStateChanged(function (user) {
      if (user) {
        window.location.href = "admin.html";
      }
    });
  }

  function init() {
    window.loginWithGoogle = loginWithGoogle;
    initAuthRedirect();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
