const toggleBtn = document.querySelector(".theme-toggle");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.querySelector(".lightbox-img");
const lightboxClose = document.querySelector(".lightbox-close");
const lightboxPrev = document.querySelector(".lightbox-nav.prev");
const lightboxNext = document.querySelector(".lightbox-nav.next");
const cardGrid = document.querySelector(".card-grid");
let lightboxImages = [];
let lightboxIndex = 0;

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

const closeLightbox = () => {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImg.src = "";
};

lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

const showLightboxImage = () => {
  if (!lightboxImages.length) return;
  lightboxImg.src = lightboxImages[lightboxIndex];
};

const openLightbox = (images, index = 0) => {
  lightboxImages = images;
  lightboxIndex = index;
  showLightboxImage();
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
};

if (lightboxPrev) {
  lightboxPrev.addEventListener("click", () => {
    if (!lightboxImages.length) return;
    lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
    showLightboxImage();
  });
}

if (lightboxNext) {
  lightboxNext.addEventListener("click", () => {
    if (!lightboxImages.length) return;
    lightboxIndex = (lightboxIndex + 1) % lightboxImages.length;
    showLightboxImage();
  });
}

cardGrid.addEventListener("click", (event) => {
  const card = event.target.closest(".work-card");
  if (!card) return;
  let images = [];
  try {
    images = JSON.parse(card.getAttribute("data-images") || "[]");
  } catch {
    images = [];
  }
  if (!images.length) {
    const fallback = card.getAttribute("data-full");
    if (fallback) images = [fallback];
  }
  if (!images.length) return;
  openLightbox(images, 0);
  const id = card.getAttribute("data-id");
  if (id) incrementViews(id);
});

const loadLatestWorks = async () => {
  const cards = Array.from(document.querySelectorAll(".work-card"));
  if (!cards.length || !window.supabaseClient || !window.isSupabaseConfigured) return;

  const { data, error } = await window.supabaseClient
    .from("portfolio_items")
    .select("id, title, image_url, image_urls, sort_order, created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(cards.length);

  if (error) {
    console.warn("Gagal mengambil data portofolio:", error.message);
    return;
  }

  cards.forEach((card, index) => {
    const item = data[index];
    if (!item) {
      card.classList.add("is-hidden");
      return;
    }
    const img = card.querySelector("img");
    const images = Array.isArray(item.image_urls) && item.image_urls.length
      ? item.image_urls
      : [item.image_url || img.getAttribute("src")];
    const src = images[0];
    img.src = src;
    img.alt = item.title || `Karya ${index + 1}`;
    img.loading = "lazy";
    img.classList.add("lazy");
    img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });
    card.setAttribute("data-full", src);
    card.setAttribute("data-images", JSON.stringify(images));
    card.setAttribute("data-id", item.id);
    card.classList.remove("is-hidden");
  });
};

loadLatestWorks();

const incrementViews = async (id) => {
  if (!window.supabaseClient) return;
  await window.supabaseClient.rpc("increment_view", { p_id: id });
};
