(function registerAdminServiceWorker() {
  var supportsServiceWorker = "serviceWorker" in navigator;
  var isSecureContextLike =
    location.protocol === "https:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1";

  if (!supportsServiceWorker || !isSecureContextLike) {
    return;
  }

  window.addEventListener("load", function onLoad() {
    navigator.serviceWorker.register("./sw-admin.js").catch(function () {
      // Non-blocking: app should still run without SW.
    });
  });
})();
