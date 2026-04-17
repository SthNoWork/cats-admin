var CLOUDINARY_CONFIG = {
    cloudName: "dxfdeunvs",
    folder: "cats",
    uploadPreset: "cats_unsigned"
};

function uploadToCloudinary(file, callback) {
    var formData = new FormData();
    
    formData.append("file", file);
    formData.append("folder", CLOUDINARY_CONFIG.folder);
    formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);

    var xhr = new XMLHttpRequest();
    var uploadUrl = "https://api.cloudinary.com/v1_1/" + CLOUDINARY_CONFIG.cloudName + "/image/upload";

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
