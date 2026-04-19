(function () {
  "use strict";

  var transformedUrlCache = {};

  function isCloudinaryUploadUrl(url) {
    return (
      typeof url === "string" &&
      url.indexOf("res.cloudinary.com") !== -1 &&
      url.indexOf("/upload/") !== -1
    );
  }

  function toCloudinaryThumb(url, width, height) {
    if (!isCloudinaryUploadUrl(url)) {
      return url;
    }

    var transform =
      "f_auto,q_auto,w_" +
      String(width) +
      ",h_" +
      String(height) +
      ",c_fill,g_auto,dpr_auto";

    return url.replace("/upload/", "/upload/" + transform + "/");
  }

  function getListThumbnail(url) {
    var source = String(url || "").trim();
    if (!source) return "";

    var key = "list::" + source;
    if (transformedUrlCache[key]) {
      return transformedUrlCache[key];
    }

    var transformed = toCloudinaryThumb(source, 160, 160);
    transformedUrlCache[key] = transformed;
    return transformed;
  }

  function getCardThumbnail(url) {
    var source = String(url || "").trim();
    if (!source) return "";

    var key = "card::" + source;
    if (transformedUrlCache[key]) {
      return transformedUrlCache[key];
    }

    var transformed = toCloudinaryThumb(source, 240, 240);
    transformedUrlCache[key] = transformed;
    return transformed;
  }

  function setLazyAttrs(img) {
    if (!img) return;
    img.loading = "lazy";
    img.decoding = "async";
    img.fetchPriority = "low";
  }

  window.AdminEfficiencyMedia = {
    getListThumbnail: getListThumbnail,
    getCardThumbnail: getCardThumbnail,
    setLazyAttrs: setLazyAttrs,
  };
})();
