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

const openLightbox = (images, index = 0) => {
  if (!lightbox) return;
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
    openLightbox(images, 0);
    const id = card.getAttribute("data-id");
    if (id) incrementViews(id);
  });
}

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
  try {
    await window.supabaseClient.rpc("increment_view", { p_id: id });
  } catch (e) { }
};

const testimonialContainer = document.getElementById("testimonial-container");
const testimonialForm = document.getElementById("testimonial-form");
const testimonialStatus = document.getElementById("testi-status");

const loadTestimonials = async () => {
  if (!window.supabaseClient || !testimonialContainer) return;

  const { data, error } = await window.supabaseClient
    .from("testimonials")
    .select("*")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error || !data || data.length === 0) {
    // If no data or error, show dummy data
    const dummy = [
      { name: "Andi Wijaya", role: "Owner Coffee Shop", content: "Hasil desainnya sangat memuaskan dan minimalis sesuai dengan keinginan saya. Proses pengerjaannya juga sangat profesional." },
      { name: "Sari Pertiwi", role: "Fashion Blogger", content: "Logo yang dibuat benar-benar mewakili karakter brand saya. Komunikasi selama proses desain sangat lancar." },
      { name: "Budi Santoso", role: "Startup Founder", content: "Cepat, rapi, dan hasilnya sangat estetik. Sangat direkomendasikan untuk yang mencari desain dengan sentuhan modern." }
    ];
    renderTestimonials(dummy);
    return;
  }

  renderTestimonials(data);
};

const renderTestimonials = (list) => {
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

    const submitBtn = document.getElementById("testi-submit");
    const name = document.getElementById("testi-name").value.trim();
    const role = document.getElementById("testi-role").value.trim();
    const content = document.getElementById("testi-content").value.trim();

    submitBtn.disabled = true;
    testimonialStatus.textContent = "Mengirim...";
    testimonialStatus.classList.remove("is-error");

    const { error } = await window.supabaseClient
      .from("testimonials")
      .insert([{ name, role, content, is_approved: true }]); // Langsung approved agar pengunjung senang

    if (error) {
      testimonialStatus.textContent = "Gagal mengirim: " + error.message;
      testimonialStatus.classList.add("is-error");
    } else {
      testimonialStatus.textContent = "Terima kasih! Testimoni Anda telah ditambahkan.";
      testimonialForm.reset();
      loadTestimonials(); // Refresh
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

// Back to Top
const backToTop = document.getElementById("backToTop");
if (backToTop) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      backToTop.classList.add("is-visible");
    } else {
      backToTop.classList.remove("is-visible");
    }
  });

  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

