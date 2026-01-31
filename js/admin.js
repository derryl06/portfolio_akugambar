const toggleBtn = document.querySelector(".theme-toggle");
const loginForm = document.getElementById("login-form");
const loginStatus = document.getElementById("login-status");
const authPanel = document.getElementById("auth-panel");
const adminPanel = document.getElementById("admin-panel");
const logoutBtn = document.getElementById("logout-btn");
const itemForm = document.getElementById("item-form");
const itemStatus = document.getElementById("item-status");
const itemListAkugambar = document.getElementById("item-list-akugambar");
const itemListAkujualan = document.getElementById("item-list-akujualan");
const resetBtn = document.getElementById("reset-btn");
const configNotice = document.getElementById("config-notice");
const dropzone = document.getElementById("dropzone");
const imageInput = document.getElementById("item-image");
const previewGrid = document.getElementById("image-preview");
const saveOrderBtn = document.getElementById("save-order-btn");
const testiListAdmin = document.getElementById("testi-list-admin");
const testiStatusAdmin = document.getElementById("testi-status-admin");
const bulkCompressBtn = document.getElementById("bulk-compress-btn");
const slotStatusSelect = document.getElementById("slot-status");
const slotFilledInput = document.getElementById("slot-filled");
const slotTotalInput = document.getElementById("slot-total");
const saveSlotsBtn = document.getElementById("save-slots-btn");
const slotStatusMsg = document.getElementById("slot-status-msg");
const craftInput = document.getElementById("todays-craft-input");
const saveCraftBtn = document.getElementById("save-craft-btn");
const craftStatusMsg = document.getElementById("craft-status-msg");

const BUCKET_NAME = "portfolio";
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // Batas upload awal (10MB)
const COMPRESSION_TARGET = 500 * 1024; // Target kompresi (500KB)
const MAX_IMAGES = 5;
const MAX_DIMENSION = 1600; // Dikurangi sedikit untuk membantu kompresi
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
    .select("id, title, category, brand, description, image_url, image_path, image_urls, image_paths, sort_order, views, created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    showStatus(itemStatus, error.message, true);
    return;
  }

  if (itemListAkugambar) itemListAkugambar.innerHTML = "";
  if (itemListAkujualan) itemListAkujualan.innerHTML = "";

  data.forEach((item) => {
    const brand = item.brand || "akugambar";
    const targetList = brand === "akugambar" ? itemListAkugambar : itemListAkujualan;

    if (!targetList) return;

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
      <div class="admin-title">${item.title || "Untitled"} <small class="kicker" style="font-size: 10px; padding: 2px 6px; border: 1px solid var(--line); border-radius: 4px; margin-left: 8px;">${item.brand || "akugambar"}</small></div>
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
      itemForm.querySelector("#item-brand").value = item.brand || "akugambar";
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
    targetList.append(row);
  });
};

const fetchTestimonialsAdmin = async () => {
  if (!testiListAdmin) return;
  const { data, error } = await window.supabaseClient
    .from("testimonials")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    showStatus(testiStatusAdmin, error.message, true);
    return;
  }

  testiListAdmin.innerHTML = "";
  if (data.length === 0) {
    testiListAdmin.innerHTML = '<p class="muted">Belum ada testimoni.</p>';
    return;
  }

  data.forEach((item) => {
    const row = document.createElement("div");
    row.className = "admin-item";
    row.style.gridTemplateColumns = "1fr auto";

    const info = document.createElement("div");
    info.className = "admin-info";
    info.innerHTML = `
      <div class="admin-title">${item.name} 
        <small class="muted">(${item.role || "-"})</small>
        <span class="kicker" style="font-size: 10px; padding: 2px 6px; border: 1px solid var(--line); border-radius: 4px; margin-left: 8px;">${item.brand || "akugambar"}</span>
      </div>
      <div class="admin-meta" style="font-size: 14px; margin-top: 4px; color: var(--text); font-style: italic;">"${item.content}"</div>
    `;

    const actions = document.createElement("div");
    actions.className = "admin-actions";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn-danger";
    deleteBtn.textContent = "Hapus";
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("Yakin hapus testimoni ini?")) return;
      const { error: deleteError } = await window.supabaseClient
        .from("testimonials")
        .delete()
        .eq("id", item.id);

      if (deleteError) {
        showStatus(testiStatusAdmin, deleteError.message, true);
        return;
      }
      showStatus(testiStatusAdmin, "Testimoni dihapus.");
      fetchTestimonialsAdmin();
    });

    actions.append(deleteBtn);
    row.append(info, actions);
    testiListAdmin.append(row);
  });
};

const fetchAnalytics = async () => {
  if (!window.supabaseClient) return;

  const { data, error } = await window.supabaseClient
    .from("page_visits")
    .select("page_path, referrer");

  if (error || !data) return;

  // Total visits
  document.getElementById("stat-total-visits").textContent = data.length;

  // Top page
  const pageCounts = data.reduce((acc, curr) => {
    acc[curr.page_path] = (acc[curr.page_path] || 0) + 1;
    return acc;
  }, {});
  const topPage = Object.entries(pageCounts).sort((a, b) => b[1] - a[1])[0];
  if (topPage) {
    let pageName = topPage[0];
    if (pageName === "/" || pageName === "/index.html") {
      pageName = "Home (akujualan)";
    } else if (pageName.includes("/akugambar/")) {
      pageName = pageName.replace("/akugambar/", "akugambar/").replace(".html", "").replace("index", "Home");
    } else {
      pageName = pageName.replace("/", "").replace(".html", "");
    }
    document.getElementById("stat-top-page").textContent = pageName;
  }

  // Top referrer
  const refCounts = data.reduce((acc, curr) => {
    let ref = curr.referrer || "Direct";
    if (ref !== "Direct") {
      try {
        ref = new URL(ref).hostname;
      } catch (e) {
        // Not a valid absolute URL, keep as is or truncate
        if (ref.length > 30) ref = ref.substring(0, 27) + "...";
      }
    }
    acc[ref] = (acc[ref] || 0) + 1;
    return acc;
  }, {});
  const topRef = Object.entries(refCounts).sort((a, b) => b[1] - a[1])[0];
  if (topRef) {
    document.getElementById("stat-top-referrer").textContent = topRef[0];
  }
};

const fetchSlotsAdmin = async () => {
  if (!slotStatusSelect) return;
  const { data, error } = await window.supabaseClient
    .from("site_settings")
    .select("value")
    .eq("key", "akujualan_slots")
    .single();

  if (error || !data) return;
  const { total, filled, status } = data.value;
  slotStatusSelect.value = status || "open";
  slotFilledInput.value = filled || 0;
  slotTotalInput.value = total || 5;
};

if (saveSlotsBtn) {
  saveSlotsBtn.addEventListener("click", async () => {
    if (!ensureConfigured()) return;
    saveSlotsBtn.disabled = true;
    showStatus(slotStatusMsg, "Menyimpan...");

    const payload = {
      total: parseInt(slotTotalInput.value),
      filled: parseInt(slotFilledInput.value),
      status: slotStatusSelect.value
    };

    const { error } = await window.supabaseClient
      .from("site_settings")
      .upsert({ key: "akujualan_slots", value: payload });

    if (error) {
      showStatus(slotStatusMsg, error.message, true);
    } else {
      showStatus(slotStatusMsg, "Slot berhasil diperbarui.");
    }
    saveSlotsBtn.disabled = false;
  });
}

const fetchCraftAdmin = async () => {
  if (!craftInput) return;
  const { data, error } = await window.supabaseClient
    .from("site_settings")
    .select("value")
    .eq("key", "todays_craft")
    .single();

  if (error || !data) return;
  craftInput.value = data.value.text || "";
};

if (saveCraftBtn) {
  saveCraftBtn.addEventListener("click", async () => {
    if (!ensureConfigured()) return;
    saveCraftBtn.disabled = true;
    showStatus(craftStatusMsg, "Menyimpan...");

    const payload = { text: craftInput.value.trim() };

    const { error } = await window.supabaseClient
      .from("site_settings")
      .upsert({ key: "todays_craft", value: payload });

    if (error) {
      showStatus(craftStatusMsg, error.message, true);
    } else {
      showStatus(craftStatusMsg, "Status pengerjaan diperbarui.");
    }
    saveCraftBtn.disabled = false;
  });
}

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
  const brand = itemForm.querySelector("#item-brand").value;
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
      if (file.size > MAX_UPLOAD_SIZE) {
        showStatus(itemStatus, "File terlalu besar. Maksimal 10MB.", true);
        return;
      }

      const compressed = await compressImage(file);
      if (!compressed) {
        showStatus(itemStatus, "Gagal compress gambar.", true);
        return;
      }

      // Check final size after compression attempt
      if (compressed.size > COMPRESSION_TARGET * 1.5) { // Toleransi 50% jika memang susah dikompres lagi
        console.warn("Gambar masih cukup besar setelah kompresi:", compressed.size);
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
      const filePath = `${category}/${fileName}`;

      const { error: uploadError } = await window.supabaseClient.storage
        .from(BUCKET_NAME)
        .upload(filePath, compressed, { upsert: true, contentType: "image/webp" });

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
    brand,
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
    if (isAuthed) {
      fetchItems();
      fetchTestimonialsAdmin();
      fetchAnalytics();
      fetchSlotsAdmin();
      fetchCraftAdmin();
    }
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
          // Jika sudah di bawah target atau kualitas sudah terlalu rendah (0.1)
          if (blob.size <= COMPRESSION_TARGET || quality <= 0.1) {
            resolve(blob);
            return;
          }
          tryQuality(quality - 0.1);
        }, "image/webp", quality);
      };

      tryQuality(0.8);
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

bulkCompressBtn.addEventListener("click", async () => {
  if (!ensureConfigured()) return;
  if (!confirm("Fitur ini akan men-download, mengompres, dan meng-upload ulang SEMUA gambar portfolio yang ada. Ini mungkin memakan waktu beberapa menit jika gambar sangat banyak. Lanjutkan?")) return;

  bulkCompressBtn.disabled = true;
  bulkCompressBtn.textContent = "Memproses...";
  showStatus(itemStatus, "Memulai bulk kompresi...");

  try {
    const { data: items, error } = await window.supabaseClient
      .from("portfolio_items")
      .select("id, image_paths, image_path");

    if (error) throw error;

    let totalFixed = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const paths = item.image_paths || (item.image_path ? [item.image_path] : []);

      showStatus(itemStatus, `Memproses item ${i + 1}/${items.length}...`);

      for (const path of paths) {
        try {
          // Download image
          const { data: blob, error: dlError } = await window.supabaseClient.storage
            .from(BUCKET_NAME)
            .download(path);

          if (dlError) {
            console.error(`Gagal download ${path}:`, dlError);
            continue;
          }

          // Convert to File object for compressor
          const file = new File([blob], path.split('/').pop(), { type: blob.type });

          // Skip if already small (optional, but better to just re-compress)
          if (file.size <= COMPRESSION_TARGET) continue;

          const compressed = await compressImage(file);
          if (compressed) {
            // Upload back (upsert: true)
            const { error: ulError } = await window.supabaseClient.storage
              .from(BUCKET_NAME)
              .upload(path, compressed, { upsert: true, contentType: "image/webp" });

            if (ulError) {
              console.error(`Gagal upload ulang ${path}:`, ulError);
            } else {
              totalFixed++;
            }
          }
        } catch (e) {
          console.error(`Error processing ${path}:`, e);
        }
      }
    }

    showStatus(itemStatus, `Selesai! Berhasil mengompres ${totalFixed} gambar.`);
  } catch (err) {
    showStatus(itemStatus, `Gagal bulk kompres: ${err.message}`, true);
  } finally {
    bulkCompressBtn.disabled = false;
    bulkCompressBtn.textContent = "Bulk Kompres Semua";
    fetchItems();
  }
});
