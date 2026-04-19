var CLOUDINARY_CONFIG = {
    cloudName: "dxfdeunvs",
    apiKey: "653335462726977",
    apiSecret: "SaGZNM8u41JWYSJDJjj2vRyvPEg",
    uploadPreset: "cats-signed"
};

// Generates a SHA-1 signature to verify the upload request with Cloudinary.
// Cloudinary will verify this signature before accepting the upload.
// The signature is created by concatenating all params in alphabetical order,
// then appending the API secret, and computing the SHA-1 hash.
function generateSignature(params, apiSecret) {
    var keys = Object.keys(params).sort();
    var signParts = [];
    var signString = '';
    var i;

    // Build the string to sign: key1=value1&key2=value2... + apiSecret
    for (i = 0; i < keys.length; i = i + 1) {
        signParts.push(keys[i] + '=' + params[keys[i]]);
    }

    signString = signParts.join('&') + apiSecret;

    return CryptoJS.SHA1(signString).toString();
}

// Checks if the file is a video based on MIME type
function isVideoFile(file) {
    var videoMimeTypes = [
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "video/x-msvideo"
    ];
    var i;

    if (file.type) {
        for (i = 0; i < videoMimeTypes.length; i = i + 1) {
            // Check if the file's MIME type matches one of our supported video types
            if (file.type.indexOf(videoMimeTypes[i]) === 0) {
                return true;
            }
        }
    }

    return false;
}

// Uploads a single file to Cloudinary using signed authentication
function uploadToCloudinary(file, callback) {
    var formData = new FormData();
    var firebaseTimestamp = firebase.firestore.Timestamp.now();
    var timestamp = String(firebaseTimestamp.seconds);

    // Signed uploads require a timestamp.
    // Use Firebase's built-in timestamp utility to keep time handling consistent.
    var paramsToSign = {
        timestamp: timestamp,
        upload_preset: CLOUDINARY_CONFIG.uploadPreset
    };
    var signature = generateSignature(paramsToSign, CLOUDINARY_CONFIG.apiSecret);

    // Determine endpoint: /image/upload for images, /video/upload for videos
    var resourceType = isVideoFile(file) ? "video" : "image";

    formData.append("file", file);
    formData.append("timestamp", timestamp);
    formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
    formData.append("api_key", CLOUDINARY_CONFIG.apiKey);
    formData.append("signature", signature);

    var xhr = new XMLHttpRequest();
    var uploadUrl = "https://api.cloudinary.com/v1_1/" + CLOUDINARY_CONFIG.cloudName + "/" + resourceType + "/upload";

    xhr.open("POST", uploadUrl, true);

    xhr.onload = function () {
        var response;

        if (xhr.status === 200) {
            try {
                response = JSON.parse(xhr.responseText);
                callback(null, response.secure_url);
            } catch (e) {
                callback("Failed to parse response", null);
            }
        } else {
            try {
                response = JSON.parse(xhr.responseText);
                callback(response.error.message, null);
            } catch (e) {
                callback("Upload failed with status " + xhr.status, null);
            }
        }
    };

    xhr.onerror = function () {
        callback("Network error", null);
    };

    xhr.send(formData);
}
