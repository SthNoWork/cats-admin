(function () {
    "use strict";

    var state = {
        currentUser: null,
        editingCategoryId: null
    };

    function el(id) {
        return document.getElementById(id);
    }

    function appendLog(kind, message) {
        var log = el("processLog");
        if (!log) return;

        var time = new Date().toLocaleTimeString();
        var textClass = "text-tertiary";
        if (kind === "error") textClass = "text-error";
        if (kind === "success") textClass = "text-secondary-dim";

        var line = document.createElement("div");
        line.className = "text-xs " + textClass;
        line.textContent = "[" + time + "] " + message;
        log.prepend(line);

        while (log.children.length > 30) {
            log.removeChild(log.lastChild);
        }
    }

    function setStatus(message, kind) {
        var status = el("status");
        if (!status) return;

        status.textContent = message || "";
        status.classList.remove("text-error", "text-secondary-dim");
        if (kind === "error") status.classList.add("text-error");
        if (kind === "success") status.classList.add("text-secondary-dim");

        if (message) appendLog(kind || "info", message);
    }

    function logoutUser() {
        if (!confirm("Logout?")) return;
        auth.signOut().then(function () {
            window.location.href = "index.html";
        });
    }

    function resetForm() {
        el("catName").value = "";
        state.editingCategoryId = null;
        el("createCategoryBtn").innerText = "Create";
        el("cancelEditCategoryBtn").classList.add("hidden");
        setStatus("", "info");
    }

    function getNextCategoryId(data) {
        var maxId = 0;
        for (var key in data) {
            var id = parseInt(key, 10);
            if (!isNaN(id) && id > maxId) {
                maxId = id;
            }
        }
        return String(maxId + 1);
    }

    function saveCategory(name) {
        return firestore.collection("config").doc("categories").get().then(function (doc) {
            var data = doc.data() || {};

            if (state.editingCategoryId) {
                data[String(state.editingCategoryId)] = name;
                return firestore.collection("config").doc("categories").set(data, { merge: true });
            }

            var newId = getNextCategoryId(data);
            data[newId] = name;
            return firestore.collection("config").doc("categories").set(data, { merge: true });
        });
    }

    function createOrUpdateCategory() {
        if (!state.currentUser) {
            setStatus("Not logged in", "error");
            return;
        }

        var name = el("catName").value.trim();
        if (!name) {
            setStatus("Enter a category name", "error");
            return;
        }

        setStatus(state.editingCategoryId ? "Updating category..." : "Creating category...", "info");

        saveCategory(name)
            .then(function () {
                setStatus(state.editingCategoryId ? "✓ Category updated" : "✓ Category created", "success");
                resetForm();
                return loadCategories();
            })
            .catch(function (error) {
                setStatus("Error: " + error.message, "error");
            });
    }

    function deleteCategory(id) {
        if (!confirm("Delete this category?")) return;

        setStatus("Deleting category...", "info");

        firestore.collection("config").doc("categories").get()
            .then(function (doc) {
                var data = doc.data() || {};
                delete data[String(id)];
                return firestore.collection("config").doc("categories").set(data, { merge: true });
            })
            .then(function () {
                setStatus("✓ Category deleted", "success");
                return loadCategories();
            })
            .catch(function (error) {
                setStatus("Error: " + error.message, "error");
            });
    }

    function startEditCategory(id) {
        firestore.collection("config").doc("categories").get()
            .then(function (doc) {
                var data = doc.data() || {};
                var value = data[String(id)] || "";
                if (!value) {
                    setStatus("Category not found", "error");
                    return;
                }

                state.editingCategoryId = String(id);
                el("catName").value = value;
                el("createCategoryBtn").innerText = "Update";
                el("cancelEditCategoryBtn").classList.remove("hidden");
                var formColumn = el("categoryFormColumn");
                if (formColumn) {
                    formColumn.scrollIntoView({ behavior: "smooth", block: "start" });
                }
                setStatus("Editing category ID " + id, "info");
            })
            .catch(function (error) {
                setStatus("Error: " + error.message, "error");
            });
    }

    function calculateCategoryCounts() {
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

    function loadCategories() {
        if (!state.currentUser) return Promise.resolve();

        return firestore.collection("config").doc("categories").get()
            .then(function (doc) {
                if (!doc.exists || !doc.data()) {
                    var list = el("categoriesList");
                    list.innerHTML = "<div class='col-span-full text-center text-on-surface-variant py-12'><p>No categories yet. Create one to get started!</p></div>";
                    return;
                }

                return calculateCategoryCounts().then(function (counts) {
                    var list = el("categoriesList");
                    var data = doc.data();
                    var ids = [];

                    for (var key in data) {
                        if (!isNaN(parseInt(key, 10))) {
                            ids.push(key);
                        }
                    }

                    ids.sort(function (a, b) {
                        var countA = counts[a] || 0;
                        var countB = counts[b] || 0;
                        if (countB !== countA) {
                            return countB - countA;
                        }
                        return parseInt(a, 10) - parseInt(b, 10);
                    });

                    if (ids.length === 0) {
                        list.innerHTML = "<div class='col-span-full text-center text-on-surface-variant py-12'><p>No categories yet.</p></div>";
                        return;
                    }

                    var html = "";
                    ids.forEach(function (id) {
                        var name = data[id];
                        var count = counts[id] || 0;
                        html += "<div class='bg-surface-container-lowest rounded-xl p-6 ambient-shadow border border-outline-variant/20 group hover:-translate-y-1 hover:shadow-lg transition-all'>";
                        html += "<div class='flex justify-between items-start mb-3'>";
                        html += "<div>";
                        html += "<h4 class='text-lg font-bold text-on-surface'>" + name + "</h4>";
                        html += "<p class='text-xs text-tertiary mt-1'>ID: " + id + " • <span class='text-on-surface-variant'>Used " + count + (count === 1 ? " time" : " times") + "</span></p>";
                        html += "</div>";
                        html += "<div class='flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity'>";
                        html += "<button type='button' onclick='window.CategoriesManager.startEditCategory(\"" + id + "\")' class='p-2 text-on-surface-variant hover:text-primary hover:bg-primary-container/20 rounded-full transition-colors'>";
                        html += "<span class='material-symbols-outlined text-sm'>edit</span>";
                        html += "</button>";
                        html += "<button type='button' onclick='window.CategoriesManager.deleteCategory(\"" + id + "\")' class='p-2 text-on-surface-variant hover:text-error hover:bg-error-container/10 rounded-full transition-colors'>";
                        html += "<span class='material-symbols-outlined text-sm'>delete</span>";
                        html += "</button>";
                        html += "</div>";
                        html += "</div>";
                        html += "</div>";
                    });

                    list.innerHTML = html;
                });
            })
            .catch(function (error) {
                setStatus("Error loading categories: " + error.message, "error");
            });
    }

    function bindActions() {
        el("createCategoryBtn").addEventListener("click", createOrUpdateCategory);
        el("resetCategoryBtn").addEventListener("click", function () {
            resetForm();
            setStatus("Form reset", "info");
        });
        el("cancelEditCategoryBtn").addEventListener("click", function () {
            resetForm();
            setStatus("Edit canceled", "info");
        });
        el("reloadCategoriesBtn").addEventListener("click", function () {
            setStatus("Reloading categories...", "info");
            loadCategories().then(function () {
                setStatus("Categories refreshed", "success");
            });
        });
    }

    function init() {
        window.CategoriesManager = {
            startEditCategory: startEditCategory,
            deleteCategory: deleteCategory
        };

        window.logoutUser = logoutUser;
        bindActions();

        auth.onAuthStateChanged(function (user) {
            if (!user) {
                window.location.href = "index.html";
                return;
            }

            state.currentUser = user;
            el("userEmail").innerText = user.email || "Admin";
            loadCategories();
            appendLog("info", "Categories manager initialized");
        });
    }

    document.addEventListener("DOMContentLoaded", init);
})();
