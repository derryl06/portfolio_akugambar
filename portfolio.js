const toggleBtn = document.querySelector(".theme-toggle");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.querySelector(".lightbox-img");
const lightboxClose = document.querySelector(".lightbox-close");
const lightboxPrev = document.querySelector(".lightbox-nav.prev");
const lightboxNext = document.querySelector(".lightbox-nav.next");
const portfolioGrid = document.getElementById("portfolio-grid");
const chips = document.querySelectorAll(".chip");
let lightboxImages = [];
let lightboxIndex = 0;

const CATEGORY_ORDER = ["branding", "poster", "logo", "ilustrasi"];
const CATEGORY_LABELS = {
  branding: "Branding",
  poster: "Poster",
  logo: "Logo",
  ilustrasi: "Ilustrasi",
};

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

if (portfolioGrid) {
  portfolioGrid.addEventListener("click", (event) => {
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
}

const buildCard = (item) => {
  const card = document.createElement("article");
  card.className = "portfolio-card work-card";
  const images = Array.isArray(item.image_urls) && item.image_urls.length
    ? item.image_urls
    : [item.image_url || "assets/works/work-1.svg"];
  card.setAttribute("data-full", images[0] || "");
  card.setAttribute("data-images", JSON.stringify(images));
  card.setAttribute("data-id", item.id);

  const img = document.createElement("img");
  img.className = "portfolio-thumb";
  img.src = images[0];
  img.alt = item.title || "Karya";
  img.loading = "lazy";
  img.classList.add("lazy");
  img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });

  const meta = document.createElement("div");
  meta.className = "portfolio-meta";

  const kicker = document.createElement("div");
  kicker.className = "kicker";
  kicker.textContent = CATEGORY_LABELS[item.category] || "Karya";

  const title = document.createElement("div");
  title.className = "portfolio-title";
  title.textContent = item.title || "Untitled";

  const desc = document.createElement("p");
  desc.textContent = item.description || "";

  meta.append(kicker, title, desc);
  card.append(img, meta);
  return card;
};

const loadPortfolio = async () => {
  if (!portfolioGrid) return;
  if (!window.supabaseClient || !window.isSupabaseConfigured) {
    portfolioGrid.innerHTML = "<p class=\"muted\">Hubungkan Supabase untuk menampilkan karya.</p>";
    return;
  }

  const { data, error } = await window.supabaseClient
    .from("portfolio_items")
    .select("id, title, category, description, image_url, image_urls, sort_order, created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Gagal mengambil data portofolio:", error.message);
    return;
  }

  portfolioGrid.innerHTML = "";
  if (!data.length) {
    portfolioGrid.innerHTML = "<p class=\"muted\">Belum ada karya.</p>";
    return;
  }

  data.forEach((item) => {
    const card = buildCard(item);
    const key = (item.category || "").toLowerCase();
    card.dataset.category = key;
    portfolioGrid.append(card);
  });

  // Default filter = all
  if (chips.length) {
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chips.forEach((btn) => btn.classList.remove("is-active"));
        chip.classList.add("is-active");
        const filter = chip.getAttribute("data-filter");

        Array.from(portfolioGrid.children).forEach((card) => {
          if (!card.classList.contains("portfolio-card")) return;
          const category = card.dataset.category || "";
          const visible = filter === "all" || category === filter;
          card.classList.toggle("is-hidden", !visible);
        });
      });
    });
  }
};

loadPortfolio();

const incrementViews = async (id) => {
  if (!window.supabaseClient) return;
  await window.supabaseClient.rpc("increment_view", { p_id: id });
};
