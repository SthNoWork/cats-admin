(function () {
    "use strict";

    var state = {
        currentUser: null,
        mode: "create",
        editingCatId: null,
        categoryMap: {},
        mediaItems: [],
        selectedMediaId: null
    };

    function el(id) {
        return document.getElementById(id);
    }

    function uid(prefix) {
        return prefix + "_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function appendLog(kind, message) {
        var log = el("processLog");
        if (!log) return;

        var time = new Date().toLocaleTimeString();
        var textClass = "text-tertiary";
        if (kind === "error") textClass = "text-error";
        if (kind === "success") textClass = "text-secondary-dim";

        var entry = document.createElement("div");
        entry.className = "text-xs " + textClass;
        entry.textContent = "[" + time + "] " + message;
        log.prepend(entry);

        while (log.children.length > 30) {
            log.removeChild(log.lastChild);
        }
    }

    function setStatus(message, kind) {
        var status = el("uploadStatus");
        if (!status) return;

        status.textContent = message || "";
        status.classList.remove("text-error", "text-secondary-dim");
        if (kind === "error") status.classList.add("text-error");
        if (kind === "success") status.classList.add("text-secondary-dim");

        if (message) appendLog(kind || "info", message);
    }

    function isVideoUrl(url) {
        return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url || "");
    }

    function getMediaPreviewUrl(item) {
        if (item.kind === "url") return item.url;
        if (item.kind === "file") {
            if (!item.previewUrl) {
                item.previewUrl = URL.createObjectURL(item.file);
            }
            return item.previewUrl;
        }
        return "";
    }

    function cleanupObjectUrls() {
        state.mediaItems.forEach(function (item) {
            if (item.kind === "file" && item.previewUrl) {
                URL.revokeObjectURL(item.previewUrl);
                item.previewUrl = null;
            }
        });
    }

    function resetMediaState() {
        cleanupObjectUrls();
        state.mediaItems = [];
        state.selectedMediaId = null;
        var mediaInput = el("media");
        if (mediaInput) mediaInput.value = "";
        renderMediaPreview();
    }

    function ensureSelectedMedia() {
        if (!state.mediaItems.length) {
            state.selectedMediaId = null;
            return;
        }
        var exists = state.mediaItems.some(function (item) {
            return item.id === state.selectedMediaId;
        });
        if (!exists) {
            state.selectedMediaId = state.mediaItems[0].id;
        }
    }

    function addUrlMedia(url) {
        var clean = (url || "").trim();
        if (!clean) {
            setStatus("Enter a media URL first", "error");
            return;
        }
        if (!/^https?:\/\//i.test(clean)) {
            setStatus("URL must start with http:// or https://", "error");
            return;
        }

        state.mediaItems.push({
            id: uid("url"),
            kind: "url",
            url: clean,
            mediaType: isVideoUrl(clean) ? "video" : "image"
        });
        ensureSelectedMedia();
        renderMediaPreview();
        el("mediaUrlInput").value = "";
        setStatus("Added URL media", "info");
    }

    function addFileMedia(files) {
        if (!files || !files.length) return;

        Array.prototype.forEach.call(files, function (file) {
            state.mediaItems.push({
                id: uid("file"),
                kind: "file",
                file: file,
                previewUrl: null,
                mediaType: file.type && file.type.indexOf("video/") === 0 ? "video" : "image"
            });
        });

        ensureSelectedMedia();
        renderMediaPreview();
        setStatus(files.length + " file" + (files.length > 1 ? "s" : "") + " added", "info");
    }

    function removeMediaItem(itemId) {
        var index = state.mediaItems.findIndex(function (item) {
            return item.id === itemId;
        });
        if (index === -1) return;

        var item = state.mediaItems[index];
        if (item.kind === "file" && item.previewUrl) {
            URL.revokeObjectURL(item.previewUrl);
        }

        state.mediaItems.splice(index, 1);
        ensureSelectedMedia();
        renderMediaPreview();
        setStatus("Removed media item", "info");
    }

    function selectMediaItem(itemId) {
        state.selectedMediaId = itemId;
        renderMediaPreview();
        setStatus("Thumbnail updated", "info");
    }

    function renderMediaPreview() {
        var container = el("previewContainer");
        var grid = el("previewGrid");
        var fileCount = el("fileCount");

        if (!container || !grid || !fileCount) return;

        ensureSelectedMedia();

        if (!state.mediaItems.length) {
            container.classList.add("hidden");
            grid.innerHTML = "";
            fileCount.textContent = "";
            return;
        }

        container.classList.remove("hidden");
        grid.innerHTML = "";

        state.mediaItems.forEach(function (item, index) {
            var card = document.createElement("div");
            card.className = "preview-thumb relative aspect-square rounded-lg overflow-hidden bg-surface-container group";
            if (item.id === state.selectedMediaId) {
                card.classList.add("selected");
            }

            if (item.mediaType === "video") {
                var iconWrap = document.createElement("div");
                iconWrap.className = "w-full h-full flex items-center justify-center";
                iconWrap.innerHTML = '<span class="material-symbols-outlined text-tertiary text-4xl">videocam</span>';
                card.appendChild(iconWrap);
            } else {
                var img = document.createElement("img");
                img.src = getMediaPreviewUrl(item);
                img.className = "w-full h-full object-cover";
                card.appendChild(img);
            }

            var controls = document.createElement("div");
            controls.className = "absolute inset-x-1 top-1 flex items-center justify-between";

            var thumbBtn = document.createElement("button");
            thumbBtn.type = "button";
            thumbBtn.className = "bg-surface-container-lowest/90 text-on-surface rounded-full px-2 py-0.5 text-[10px] font-bold";
            thumbBtn.textContent = item.id === state.selectedMediaId ? "Thumbnail" : "Set thumb";
            thumbBtn.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                selectMediaItem(item.id);
            });

            var removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "bg-error-container/90 text-on-error-container rounded-full w-6 h-6 flex items-center justify-center";
            removeBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px;line-height:1;">close</span>';
            removeBtn.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                removeMediaItem(item.id);
            });

            controls.appendChild(thumbBtn);
            controls.appendChild(removeBtn);
            card.appendChild(controls);

            card.addEventListener("click", function () {
                selectMediaItem(item.id);
            });

            grid.appendChild(card);
        });

        var selectedIndex = state.mediaItems.findIndex(function (item) {
            return item.id === state.selectedMediaId;
        });
        fileCount.textContent = state.mediaItems.length + " media item" + (state.mediaItems.length > 1 ? "s" : "") + " • Thumbnail: " + (selectedIndex + 1);
    }

    function getSelectedCategories() {
        var buttons = document.querySelectorAll(".category-btn.bg-primary-fixed");
        var selected = [];
        buttons.forEach(function (btn) {
            selected.push(btn.getAttribute("data-id"));
        });
        return selected;
    }

    function setSelectedCategories(catIds) {
        var selectedSet = new Set(catIds || []);
        var allButtons = document.querySelectorAll(".category-btn");
        allButtons.forEach(function (btn) {
            var isSelected = selectedSet.has(btn.getAttribute("data-id"));
            btn.classList.toggle("bg-primary-fixed", isSelected);
            btn.classList.toggle("text-on-primary-container", isSelected);
            btn.classList.toggle("border-primary", isSelected);
        });
    }

    function loadCategories() {
        if (!state.currentUser) return Promise.resolve();

        return firestore.collection("config").doc("categories").get().then(function (doc) {
            var container = el("categoriesContainer");
            container.innerHTML = "";
            state.categoryMap = {};

            if (!doc.exists || !doc.data()) {
                container.innerHTML = "<p class='text-sm text-on-surface-variant'>No categories available</p>";
                return;
            }

            var data = doc.data();
            var ids = [];

            for (var key in data) {
                if (!isNaN(parseInt(key, 10))) {
                    ids.push(key);
                    state.categoryMap[key] = data[key];
                }
            }

            return calculateCategoryUsage().then(function (counts) {
                ids.sort(function (a, b) {
                    var countA = counts[a] || 0;
                    var countB = counts[b] || 0;
                    if (countB !== countA) {
                        return countB - countA;
                    }
                    return parseInt(a, 10) - parseInt(b, 10);
                });

                ids.forEach(function (id) {
                    var btn = document.createElement("button");
                    btn.type = "button";
                    var count = counts[id] || 0;
                    btn.className = "category-btn px-3 py-1.5 rounded-full text-sm font-medium border border-outline-variant bg-surface-container text-on-surface hover:bg-surface-container-high transition-all";
                    btn.innerHTML = data[id] + " <span class='text-xs opacity-75'>" + count + "</span>";
                    btn.setAttribute("data-id", id);
                    btn.addEventListener("click", function (event) {
                        event.preventDefault();
                        btn.classList.toggle("bg-primary-fixed");
                        btn.classList.toggle("text-on-primary-container");
                        btn.classList.toggle("border-primary");
                    });
                    container.appendChild(btn);
                });
            });
        }).catch(function (error) {
            setStatus("Failed to load categories: " + error.message, "error");
        });
    }

    function calculateCategoryUsage() {
        return firestore.collection("cats").get().then(function (snapshot) {
            var counts = {};

            snapshot.forEach(function (doc) {
                var data = doc.data();
                var categoryStr = data.categories || "";
                var categoryIds = categoryStr.split(",").map(function (id) {
                    return id.trim();
                }).filter(function (id) {
                    return id.length > 0;
                });

                categoryIds.forEach(function (id) {
                    counts[id] = (counts[id] || 0) + 1;
                });
            });

            return counts;
        });
    }

    function getNextCatId() {
        return firestore.collection("cats").get().then(function (snapshot) {
            var maxId = 0;
            snapshot.forEach(function (doc) {
                var id = parseInt(doc.id, 10);
                if (!isNaN(id) && id > maxId) maxId = id;
            });
            return String(maxId + 1);
        });
    }

    function uploadFileItems(fileItems) {
        var results = {};
        var index = 0;

        return new Promise(function (resolve, reject) {
            function next() {
                if (index >= fileItems.length) {
                    resolve(results);
                    return;
                }

                var item = fileItems[index];
                setStatus("Uploading media " + (index + 1) + " of " + fileItems.length + "...", "info");

                uploadToCloudinary(item.file, function (error, url) {
                    if (error) {
                        reject(new Error(String(error)));
                        return;
                    }
                    results[item.id] = url;
                    index += 1;
                    next();
                });
            }

            if (!fileItems.length) {
                resolve(results);
                return;
            }

            next();
        });
    }

    function buildFinalMediaUrls(uploadedMap) {
        var allUrls = state.mediaItems.map(function (item) {
            if (item.kind === "url") return item.url;
            return uploadedMap[item.id] || "";
        }).filter(function (url) { return !!url; });

        var selectedItem = state.mediaItems.find(function (item) {
            return item.id === state.selectedMediaId;
        });

        var thumbnailUrl = null;
        if (selectedItem) {
            thumbnailUrl = selectedItem.kind === "url" ? selectedItem.url : (uploadedMap[selectedItem.id] || null);
        }
        if (!thumbnailUrl && allUrls.length) {
            thumbnailUrl = allUrls[0];
        }

        return {
            allUrls: allUrls,
            thumbnailUrl: thumbnailUrl
        };
    }

    function createOrUpdateCat() {
        if (!state.currentUser) {
            setStatus("Not logged in", "error");
            return;
        }

        var title = el("title").value.trim();
        if (!title) {
            setStatus("Enter a title", "error");
            return;
        }

        var cats = getSelectedCategories();
        if (!cats.length) {
            setStatus("Select at least one category", "error");
            return;
        }

        var description = el("description").value.trim();

        if (!state.mediaItems.length && state.mode === "create") {
            setStatus("Add at least one media item (upload or URL)", "error");
            return;
        }

        var fileItems = state.mediaItems.filter(function (item) {
            return item.kind === "file";
        });

        setStatus("Preparing changes...", "info");

        uploadFileItems(fileItems)
            .then(function (uploadedMap) {
                var media = buildFinalMediaUrls(uploadedMap);
                var payload = {
                    title: title,
                    description: description || null,
                    categories: cats.join(","),
                    thumbnail: media.thumbnailUrl,
                    medias: media.allUrls.length ? media.allUrls : null
                };

                if (state.mode === "edit" && state.editingCatId) {
                    setStatus("Updating entry...", "info");
                    return firestore.collection("cats").doc(state.editingCatId).update(payload);
                }

                setStatus("Creating entry...", "info");
                return getNextCatId().then(function (nextId) {
                    payload.addedAt = firebase.firestore.FieldValue.serverTimestamp();
                    return firestore.collection("cats").doc(nextId).set(payload);
                });
            })
            .then(function () {
                var successMsg = state.mode === "edit" ? "Update complete" : "Upload complete";
                setStatus("✓ " + successMsg, "success");
                resetForm();
                return loadCats();
            })
            .catch(function (error) {
                setStatus("Error: " + error.message, "error");
            });
    }

    function resetForm() {
        el("title").value = "";
        el("description").value = "";
        setSelectedCategories([]);
        resetMediaState();

        state.mode = "create";
        state.editingCatId = null;

        el("uploadBtn").innerText = "Upload";
        el("cancelEditBtn").classList.add("hidden");
        setStatus("", "info");
    }

    function startEdit(catId) {
        firestore.collection("cats").doc(catId).get().then(function (doc) {
            if (!doc.exists) {
                setStatus("Cat not found", "error");
                return;
            }

            var data = doc.data();
            state.mode = "edit";
            state.editingCatId = catId;

            el("title").value = data.title || "";
            el("description").value = data.description || "";

            var catIds = (data.categories || "").split(",").filter(function (x) { return !!x; });
            setSelectedCategories(catIds);

            resetMediaState();
            var existingUrls = Array.isArray(data.medias) && data.medias.length ? data.medias.slice() : [];
            if (!existingUrls.length && data.thumbnail) {
                existingUrls.push(data.thumbnail);
            }

            state.mediaItems = existingUrls.map(function (url) {
                return {
                    id: uid("url"),
                    kind: "url",
                    url: url,
                    mediaType: isVideoUrl(url) ? "video" : "image"
                };
            });

            if (data.thumbnail) {
                var selected = state.mediaItems.find(function (item) {
                    return item.url === data.thumbnail;
                });
                state.selectedMediaId = selected ? selected.id : null;
            } else {
                state.selectedMediaId = null;
            }

            ensureSelectedMedia();
            renderMediaPreview();

            el("uploadBtn").innerText = "Update";
            el("cancelEditBtn").classList.remove("hidden");
            var formColumn = el("entryFormColumn");
            if (formColumn) {
                formColumn.scrollIntoView({ behavior: "smooth", block: "start" });
            }
            setStatus("Editing: " + (data.title || "Untitled"), "info");
        }).catch(function (error) {
            setStatus("Error loading entry: " + error.message, "error");
        });
    }

    function deleteCat(catId) {
        if (!confirm("Delete this cat?")) return;
        firestore.collection("cats").doc(catId).delete().then(function () {
            setStatus("Entry deleted", "success");
            return loadCats();
        }).catch(function (error) {
            setStatus("Error deleting entry: " + error.message, "error");
        });
    }

    function loadCats() {
        if (!state.currentUser) return Promise.resolve();

        return firestore.collection("cats").orderBy("addedAt", "desc").get().then(function (snapshot) {
            var html = "";

            if (snapshot.empty) {
                html = "<p class='text-center text-on-surface-variant py-12'>No cats yet</p>";
            } else {
                snapshot.forEach(function (doc) {
                    var data = doc.data();
                    var date = data.addedAt ? data.addedAt.toDate().toLocaleDateString() : "?";
                    var thumb = data.thumbnail || "";
                    var title = escapeHtml(data.title || "Untitled");
                    var catIds = (data.categories || "").split(",").filter(function (x) { return !!x; });
                    var catNames = catIds.map(function (id) { return state.categoryMap[id] || "Unknown"; });

                    html += "<div class='flex gap-3 p-3 rounded-lg hover:bg-surface-container transition-colors group'>";
                    if (thumb) {
                        html += "<img src='" + escapeHtml(thumb) + "' alt='" + title + "' class='w-16 h-16 rounded-lg object-cover flex-shrink-0' />";
                    } else {
                        html += "<div class='w-16 h-16 rounded-lg bg-surface-container flex items-center justify-center text-tertiary'><span class='material-symbols-outlined'>image</span></div>";
                    }
                    html += "<div class='flex-1 min-w-0'>";
                    html += "<p class='font-bold text-on-surface truncate'>" + title + "</p>";
                    html += "<p class='text-xs text-tertiary mb-2'>" + escapeHtml(date) + "</p>";
                    if (catNames.length > 0) {
                        html += "<div class='flex flex-wrap gap-1'>";
                        catNames.forEach(function (name) {
                            html += "<span class='text-xs bg-secondary-fixed-dim text-secondary-dim px-2 py-0.5 rounded-full'>" + escapeHtml(name) + "</span>";
                        });
                        html += "</div>";
                    }
                    html += "</div>";
                    html += "<button type='button' onclick='window.CatsManager.startEdit(\"" + doc.id + "\")' class='flex-shrink-0 p-2 text-tertiary hover:text-primary opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all'><span class='material-symbols-outlined'>edit</span></button>";
                    html += "<button type='button' onclick='window.CatsManager.deleteCat(\"" + doc.id + "\")' class='flex-shrink-0 p-2 text-tertiary hover:text-error opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all'><span class='material-symbols-outlined'>delete</span></button>";
                    html += "</div>";
                });
            }

            el("catsList").innerHTML = html;
        }).catch(function (error) {
            setStatus("Failed to load cats: " + error.message, "error");
        });
    }

    function setupDropzone() {
        var dropZone = el("fileDropZone");
        var mediaInput = el("media");

        dropZone.addEventListener("click", function () {
            mediaInput.click();
        });

        mediaInput.addEventListener("change", function (event) {
            addFileMedia(event.target.files);
            mediaInput.value = "";
        });

        dropZone.addEventListener("dragover", function (event) {
            event.preventDefault();
            dropZone.style.borderColor = "#924d00";
            dropZone.style.backgroundColor = "#f6eed5";
        });

        dropZone.addEventListener("dragleave", function (event) {
            event.preventDefault();
            dropZone.style.borderColor = "rgba(185, 178, 150, 0.3)";
            dropZone.style.backgroundColor = "#f0e8cc";
        });

        dropZone.addEventListener("drop", function (event) {
            event.preventDefault();
            dropZone.style.borderColor = "rgba(185, 178, 150, 0.3)";
            dropZone.style.backgroundColor = "#f0e8cc";
            addFileMedia(event.dataTransfer.files);
        });
    }

    function setupSearch() {
        el("searchInput").addEventListener("keyup", function () {
            var query = this.value.toLowerCase();
            var items = document.querySelectorAll("#catsList > div");
            items.forEach(function (item) {
                var text = item.innerText.toLowerCase();
                item.style.display = text.indexOf(query) >= 0 ? "" : "none";
            });
        });
    }

    function setupActions() {
        el("uploadBtn").addEventListener("click", createOrUpdateCat);
        el("cancelEditBtn").addEventListener("click", function () {
            resetForm();
            setStatus("Edit canceled", "info");
        });
        el("resetBtn").addEventListener("click", function () {
            resetForm();
            setStatus("Form reset", "info");
        });
        el("reloadCatsBtn").addEventListener("click", function () {
            setStatus("Reloading cats...", "info");
            loadCats().then(function () {
                setStatus("Cats list refreshed", "success");
            });
        });

        el("addMediaUrlBtn").addEventListener("click", function () {
            addUrlMedia(el("mediaUrlInput").value);
        });

        el("mediaUrlInput").addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                addUrlMedia(el("mediaUrlInput").value);
            }
        });
    }

    function logoutUser() {
        if (!confirm("Logout?")) return;
        auth.signOut().then(function () {
            window.location.href = "index.html";
        });
    }

    function initAuthFlow() {
        auth.onAuthStateChanged(function (user) {
            if (!user) {
                window.location.href = "index.html";
                return;
            }

            state.currentUser = user;
            el("userEmail").innerText = user.email || "Admin";

            loadCategories().then(function () {
                return loadCats();
            });
        });
    }

    function init() {
        window.CatsManager = {
            startEdit: startEdit,
            deleteCat: deleteCat,
            resetForm: resetForm
        };

        window.logoutUser = logoutUser;

        setupDropzone();
        setupSearch();
        setupActions();
        initAuthFlow();
        appendLog("info", "Cats manager initialized");
    }

    document.addEventListener("DOMContentLoaded", init);
})();
