const toggleBtn = document.querySelector(".theme-toggle");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.querySelector(".lightbox-img");
const lightboxClose = document.querySelector(".lightbox-close");
const lightboxPrev = document.querySelector(".lightbox-nav.prev");
const lightboxNext = document.querySelector(".lightbox-nav.next");
const cardGrid = document.getElementById("latest-works-grid");
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
  document.body.classList.remove("lightbox-active");
};

if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
if (lightbox) {
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
}

const showLightboxImage = () => {
  if (!lightboxImages.length || !lightboxImg) return;
  lightboxImg.src = lightboxImages[lightboxIndex];
};

const openLightbox = (images, index = 0, title = "", desc = "") => {
  if (!lightbox) return;
  lightboxImages = images;
  lightboxIndex = index;

  const titleEl = lightbox.querySelector(".lightbox-title");
  const descEl = lightbox.querySelector(".lightbox-desc");
  if (titleEl) titleEl.textContent = title;
  if (descEl) descEl.textContent = desc;

  showLightboxImage();
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-active");
};

window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;

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

if (cardGrid) {
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

    const title = card.getAttribute("data-title") || "";
    const desc = card.getAttribute("data-description") || "";

    openLightbox(images, 0, title, desc);
    const id = card.getAttribute("data-id");
    if (id) incrementViews(id);
  });
}

const loadLatestWorks = async () => {
  if (!cardGrid || !window.supabaseClient || !window.isSupabaseConfigured) return;

  const { data, error } = await window.supabaseClient
    .from("portfolio_items")
    .select("id, title, image_url, image_urls, sort_order, created_at")
    .eq("brand", "akugambar")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(9);

  if (error) {
    console.warn("Gagal mengambil data portofolio:", error.message);
    return;
  }

  // Clear container and rebuild to handle exact count (3x3 grid)
  cardGrid.innerHTML = "";
  const cardRow = document.createElement("div");
  cardRow.className = "card-row reveal-stagger";
  cardRow.style.display = "grid";
  cardRow.style.gridTemplateColumns = "repeat(3, 1fr)";
  cardRow.style.gap = "16px";

  data.forEach((item, index) => {
    const images = Array.isArray(item.image_urls) && item.image_urls.length
      ? item.image_urls
      : [item.image_url];
    const src = images[0];

    const card = document.createElement("div");
    card.className = "card work-card";
    card.setAttribute("data-full", src);
    card.setAttribute("data-images", JSON.stringify(images));
    card.setAttribute("data-id", item.id);
    card.setAttribute("data-title", item.title || "");
    card.setAttribute("data-description", item.description || "");
    card.style.minHeight = "200px";

    const img = document.createElement("img");
    img.className = "card-thumb";
    img.src = src;
    img.alt = item.title || `Karya ${index + 1}`;
    img.loading = "lazy";

    card.appendChild(img);
    cardRow.appendChild(card);
  });

  cardGrid.appendChild(cardRow);
  if (window.initReveal) window.initReveal(); // Re-trigger reveal for new elements
};

loadLatestWorks();

const incrementViews = async (id) => {
  if (!window.supabaseClient) return;
  try {
    await window.supabaseClient.rpc("increment_view", { p_id: id });
  } catch (e) { }
};

const testimonialContainer = document.getElementById("testimonial-container");
if (testimonialContainer) {
  testimonialContainer.innerHTML = ""; // Prepare it
}
const testimonialForm = document.getElementById("testimonial-form");
const testimonialStatus = document.getElementById("testi-status");

const loadTestimonials = async () => {
  if (!window.supabaseClient || !testimonialContainer) return;

  const currentBrand = window.location.pathname.includes("akugambar") ? "akugambar" : "akujualan";

  const { data, error } = await window.supabaseClient
    .from("testimonials")
    .select("*")
    .eq("is_approved", true)
    .eq("brand", currentBrand)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error || !data || data.length === 0) {
    // Brand-specific dummy data
    const dummyAkugambar = [
      { name: "Andi Wijaya", role: "Owner Coffee Shop", content: "Hasil desainnya sangat memuaskan dan minimalis sesuai dengan keinginan saya. Proses pengerjaannya juga sangat profesional." },
      { name: "Sari Pertiwi", role: "Fashion Blogger", content: "Logo yang dibuat benar-benar mewakili karakter brand saya. Komunikasi selama proses desain sangat lancar." },
      { name: "Budi Santoso", role: "Startup Founder", content: "Cepat, rapi, dan hasilnya sangat estetik. Sangat direkomendasikan untuk yang mencari desain dengan sentuhan modern." }
    ];
    const dummyAkujualan = [
      { name: "Rina Kusuma", role: "Ibu Rumah Tangga", content: "Tas rajutnya rapi sekali dan warnanya persis seperti yang saya mau. Benangnya juga lembut, sangat puas!" },
      { name: "Deni Pratama", role: "Kolektor Amigurumi", content: "Boneka rajut (amigurumi) buatannya sangat detail dan lucu. Cocok banget buat kado spesial." },
      { name: "Maya Sari", role: "Interior Stylist", content: "Coaster dan dekorasi rajutannya memberikan sentuhan hangat di ruangan. Kualitas hand-crafted yang luar biasa." }
    ];

    renderTestimonials(currentBrand === "akugambar" ? dummyAkugambar : dummyAkujualan);
    return;
  }

  renderTestimonials(data);
};

const renderTestimonials = (list) => {
  if (!testimonialContainer) return;

  testimonialContainer.innerHTML = "";
  list.forEach(item => {
    const card = document.createElement("div");
    card.className = "testimonial-card";
    card.innerHTML = `
      <p class="testimonial-text">"${item.content}"</p>
      <div class="testimonial-author">
        <div class="author-info">
          <strong>${item.name}</strong>
          <span>${item.role || "-"}</span>
        </div>
      </div>
    `;
    testimonialContainer.appendChild(card);
  });
};

if (testimonialForm) {
  testimonialForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!window.supabaseClient) {
      testimonialStatus.textContent = "Supabase tidak terhubung.";
      testimonialStatus.classList.add("is-error");
      return;
    }

    const currentBrand = window.location.pathname.includes("akugambar") ? "akugambar" : "akujualan";
    const submitBtn = document.getElementById("testi-submit");
    const name = document.getElementById("testi-name").value.trim();
    const role = document.getElementById("testi-role").value.trim();
    const content = document.getElementById("testi-content").value.trim();

    submitBtn.disabled = true;
    testimonialStatus.textContent = "Mengirim...";
    testimonialStatus.classList.remove("is-error");

    const { error } = await window.supabaseClient
      .from("testimonials")
      .insert([{ name, role, content, brand: currentBrand, is_approved: true }]);

    if (error) {
      testimonialStatus.textContent = "Gagal mengirim: " + error.message;
      testimonialStatus.classList.add("is-error");
    } else {
      testimonialStatus.textContent = "Terima kasih! Testimoni Anda telah ditambahkan.";
      testimonialForm.reset();
      loadTestimonials();
    }
    submitBtn.disabled = false;
  });
}

loadTestimonials();

// FAQ Accordion
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".faq-question");
  if (!btn) return;

  const item = btn.closest(".faq-item");
  const isOpen = item.classList.contains("is-open");

  // Close all other FAQ items (optional, comment out if you want multiple open)
  document.querySelectorAll(".faq-item").forEach((other) => {
    other.classList.remove("is-open");
  });

  if (!isOpen) {
    item.classList.add("is-open");
  }
});

// Scroll reveal observer
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("active");
    } else {
      // Remove this if you only want it to animate once
      entry.target.classList.remove("active");
    }
  });
}, {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px"
});

const observedElements = new WeakSet();

const initReveal = () => {
  const reveals = document.querySelectorAll(".reveal, .reveal-stagger");
  reveals.forEach(el => {
    if (!observedElements.has(el)) {
      revealObserver.observe(el);
      observedElements.add(el);
    }
  });
};

window.initReveal = initReveal;

// Also handle dynamic content (like testimonials or portfolio items)
const observeMutation = new MutationObserver(() => {
  initReveal();
});

const mainElement = document.querySelector('main');
if (mainElement) {
  observeMutation.observe(mainElement, { childList: true, subtree: true });
}

// Hero Parallax Effect with requestAnimationFrame for performance
const heroImage = document.querySelector(".hero-image");
if (heroImage) {
  let ticking = false;
  let mouseX = 0;
  let mouseY = 0;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!ticking) {
      window.requestAnimationFrame(() => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const moveX = (mouseX - centerX) / 50;
        const moveY = (mouseY - centerY) / 50;

        heroImage.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
        ticking = false;
      });
      ticking = true;
    }
  });
}

document.addEventListener("keydown", (e) => {
  if (e.shiftKey && e.key === "A") {
    const isSubDir = window.location.pathname.includes("/akugambar/");
    window.location.href = isSubDir ? "../admin.html" : "admin.html";
  }
});

document.addEventListener("DOMContentLoaded", initReveal);
initReveal(); // Run once immediately
