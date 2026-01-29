const toggleBtn = document.querySelector(".theme-toggle");
const loginForm = document.getElementById("login-form");
const loginStatus = document.getElementById("login-status");
const authPanel = document.getElementById("auth-panel");
const adminPanel = document.getElementById("admin-panel");
const logoutBtn = document.getElementById("logout-btn");
const itemForm = document.getElementById("item-form");
const itemStatus = document.getElementById("item-status");
const itemList = document.getElementById("item-list");
const resetBtn = document.getElementById("reset-btn");
const configNotice = document.getElementById("config-notice");
const dropzone = document.getElementById("dropzone");
const imageInput = document.getElementById("item-image");
const previewGrid = document.getElementById("image-preview");
const saveOrderBtn = document.getElementById("save-order-btn");

const BUCKET_NAME = "portfolio";
const MAX_FILE_SIZE = 400 * 1024;
const MAX_IMAGES = 5;
const MAX_DIMENSION = 1920;
let selectedFiles = [];
let editingItem = null;

const applyTheme = (mode) => {
  document.body.dataset.theme = mode;
  const isDark = mode === "dark";
  toggleBtn.setAttribute("aria-pressed", String(isDark));
};

const saved = localStorage.getItem("theme");
applyTheme(saved || "light");

toggleBtn.addEventListener("click", () => {
  const next = document.body.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", next);
  applyTheme(next);
});

const showStatus = (el, message, isError = false) => {
  el.textContent = message;
  el.classList.toggle("is-error", isError);
};

const setPanelState = (isAuthed) => {
  authPanel.classList.toggle("is-hidden", isAuthed);
  adminPanel.classList.toggle("is-hidden", !isAuthed);
};

const resetForm = () => {
  itemForm.reset();
  editingItem = null;
  selectedFiles = [];
  renderPreviews([]);
  itemForm.querySelector("#item-title").focus();
  itemForm.querySelector("#submit-btn").textContent = "Simpan";
};

const ensureConfigured = () => {
  if (!window.supabase) {
    configNotice.classList.remove("is-hidden");
    showStatus(loginStatus, "Supabase JS belum ter-load. Cek koneksi internet.", true);
    return false;
  }
  if (!window.isSupabaseConfigured) {
    configNotice.classList.remove("is-hidden");
    showStatus(loginStatus, "Isi SUPABASE_URL dan SUPABASE_ANON_KEY dulu.", true);
    return false;
  }
  return true;
};

const fetchItems = async () => {
  const { data, error } = await window.supabaseClient
    .from("portfolio_items")
    .select("id, title, category, description, image_url, image_path, image_urls, image_paths, sort_order, views, created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    showStatus(itemStatus, error.message, true);
    return;
  }

  itemList.innerHTML = "";
  data.forEach((item) => {
    const row = document.createElement("div");
    row.className = "admin-item";
    row.setAttribute("draggable", "true");
    row.dataset.id = item.id;

    const handle = document.createElement("div");
    handle.className = "drag-handle";
    handle.textContent = "⋮⋮";

    const thumb = document.createElement("img");
    thumb.className = "admin-thumb";
    thumb.src = item.image_url || "assets/works/work-1.svg";
    thumb.alt = item.title || "Karya";

    const info = document.createElement("div");
    info.className = "admin-info";
    info.innerHTML = `
      <div class="admin-title">${item.title || "Untitled"}</div>
      <div class="admin-meta">${item.category || "-"}</div>
    `;

    const actions = document.createElement("div");
    actions.className = "admin-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn btn-outline";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
      if (!confirm("Edit karya ini? Form akan terisi data yang dipilih.")) return;
      editingItem = item;
      itemForm.querySelector("#item-title").value = item.title || "";
      itemForm.querySelector("#item-category").value = item.category || "branding";
      itemForm.querySelector("#item-description").value = item.description || "";
      selectedFiles = [];
      renderPreviews((item.image_urls || []).map((url) => ({
        name: url,
        preview: url,
        readonly: true,
      })));
      itemForm.querySelector("#submit-btn").textContent = "Update";
      itemForm.querySelector("#item-title").focus();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn-danger";
    deleteBtn.textContent = "Hapus";
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("Yakin hapus karya ini? Aksi ini tidak bisa dibatalkan.")) return;
      const { error: deleteError } = await window.supabaseClient
        .from("portfolio_items")
        .delete()
        .eq("id", item.id);

      if (deleteError) {
        showStatus(itemStatus, deleteError.message, true);
        return;
      }

      if (item.image_paths?.length) {
        await window.supabaseClient.storage.from(BUCKET_NAME).remove(item.image_paths);
      } else if (item.image_path) {
        await window.supabaseClient.storage.from(BUCKET_NAME).remove([item.image_path]);
      }
      fetchItems();
    });

    actions.append(editBtn, deleteBtn);
    row.append(handle, thumb, info, actions);
    itemList.append(row);
  });
};

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!ensureConfigured()) return;

  const email = loginForm.querySelector("#login-email").value.trim();
  const password = loginForm.querySelector("#login-password").value;

  const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    showStatus(loginStatus, error.message, true);
    return;
  }

  showStatus(loginStatus, "Login berhasil.");
});

logoutBtn.addEventListener("click", async () => {
  if (!ensureConfigured()) return;
  await window.supabaseClient.auth.signOut();
});

itemForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!ensureConfigured()) return;

  const title = itemForm.querySelector("#item-title").value.trim();
  const category = itemForm.querySelector("#item-category").value;
  const description = itemForm.querySelector("#item-description").value.trim();
  const imageFileList = selectedFiles;

  let imageUrl = editingItem?.image_url || "";
  let imagePath = editingItem?.image_path || "";
  let imageUrls = editingItem?.image_urls || [];
  let imagePaths = editingItem?.image_paths || [];

  if (imageFileList.length) {
    const uploadedUrls = [];
    const uploadedPaths = [];

    for (const file of imageFileList) {
      const compressed = await compressImage(file);
      if (!compressed) {
        showStatus(itemStatus, "Gagal compress gambar.", true);
        return;
      }

      if (compressed.size > MAX_FILE_SIZE) {
        showStatus(itemStatus, "Ukuran gambar maksimal 400KB.", true);
        return;
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const filePath = `${category}/${fileName}`;

      const { error: uploadError } = await window.supabaseClient.storage
        .from(BUCKET_NAME)
        .upload(filePath, compressed, { upsert: true, contentType: "image/jpeg" });

      if (uploadError) {
        showStatus(itemStatus, uploadError.message, true);
        return;
      }

      const { data: publicData } = window.supabaseClient.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      uploadedUrls.push(publicData.publicUrl);
      uploadedPaths.push(filePath);
    }

    if (editingItem?.image_paths?.length) {
      await window.supabaseClient.storage.from(BUCKET_NAME).remove(editingItem.image_paths);
    }

    imageUrls = uploadedUrls;
    imagePaths = uploadedPaths;
    imageUrl = uploadedUrls[0] || "";
    imagePath = uploadedPaths[0] || "";
  }

  const payload = {
    title,
    category,
    description,
    image_url: imageUrl,
    image_path: imagePath,
    image_urls: imageUrls,
    image_paths: imagePaths,
  };

  if (editingItem?.id) {
    const { error: updateError } = await window.supabaseClient
      .from("portfolio_items")
      .update(payload)
      .eq("id", editingItem.id);

    if (updateError) {
      showStatus(itemStatus, updateError.message, true);
      return;
    }
    showStatus(itemStatus, "Karya diperbarui.");
  } else {
    const { error: insertError } = await window.supabaseClient
      .from("portfolio_items")
      .insert(payload);

    if (insertError) {
      showStatus(itemStatus, insertError.message, true);
      return;
    }
    showStatus(itemStatus, "Karya ditambahkan.");
  }

  resetForm();
  fetchItems();
});

resetBtn.addEventListener("click", () => resetForm());

if (ensureConfigured()) {
  window.supabaseClient.auth.onAuthStateChange((_event, session) => {
    const isAuthed = Boolean(session);
    setPanelState(isAuthed);
    if (isAuthed) fetchItems();
  });
}

const renderPreviews = (items) => {
  previewGrid.innerHTML = "";
  items.forEach((item, index) => {
    const wrap = document.createElement("div");
    wrap.className = "preview-item";

    const img = document.createElement("img");
    img.src = item.preview;
    img.alt = item.name || `Preview ${index + 1}`;

    wrap.append(img);

    if (!item.readonly) {
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "preview-remove";
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", () => {
        selectedFiles = selectedFiles.filter((_, idx) => idx !== index);
        renderPreviews(selectedFiles.map((file) => ({
          name: file.name,
          preview: URL.createObjectURL(file),
        })));
      });
      wrap.append(removeBtn);
    }

    previewGrid.append(wrap);
  });
};

const compressImage = (file) =>
  new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;
      const maxDim = Math.max(width, height);
      if (maxDim > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / maxDim;
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const tryQuality = (quality) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          if (blob.size <= MAX_FILE_SIZE || quality <= 0.5) {
            resolve(blob);
            return;
          }
          tryQuality(quality - 0.1);
        }, "image/jpeg", quality);
      };

      tryQuality(0.9);
      URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });

const handleFiles = (files) => {
  const incoming = Array.from(files).slice(0, MAX_IMAGES - selectedFiles.length);
  selectedFiles = selectedFiles.concat(incoming).slice(0, MAX_IMAGES);

  renderPreviews(
    selectedFiles.map((file) => ({
      name: file.name,
      preview: URL.createObjectURL(file),
    }))
  );
};

dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("is-dragging");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("is-dragging");
});

dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropzone.classList.remove("is-dragging");
  handleFiles(event.dataTransfer.files);
});

imageInput.addEventListener("change", (event) => {
  handleFiles(event.target.files);
  imageInput.value = "";
});

let dragSrc = null;
itemList.addEventListener("dragstart", (event) => {
  const item = event.target.closest(".admin-item");
  if (!item) return;
  dragSrc = item;
  item.classList.add("is-dragging");
  event.dataTransfer.effectAllowed = "move";
});

itemList.addEventListener("dragend", () => {
  if (dragSrc) dragSrc.classList.remove("is-dragging");
  dragSrc = null;
});

itemList.addEventListener("dragover", (event) => {
  event.preventDefault();
  const item = event.target.closest(".admin-item");
  if (!item || item === dragSrc) return;
  const rect = item.getBoundingClientRect();
  const after = event.clientY > rect.top + rect.height / 2;
  itemList.insertBefore(dragSrc, after ? item.nextSibling : item);
});

saveOrderBtn.addEventListener("click", async () => {
  if (!ensureConfigured()) return;
  const items = Array.from(itemList.querySelectorAll(".admin-item"));
  const updates = items.map((row, index) => ({
    id: row.dataset.id,
    sort_order: index + 1,
  }));

  for (const update of updates) {
    const { error } = await window.supabaseClient
      .from("portfolio_items")
      .update({ sort_order: update.sort_order })
      .eq("id", update.id);
    if (error) {
      showStatus(itemStatus, error.message, true);
      return;
    }
  }

  showStatus(itemStatus, "Urutan disimpan.");
});
