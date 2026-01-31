const loadAkujualanPortfolio = async () => {
    const portfolioGrid = document.getElementById("akujualan-portfolio");
    if (!portfolioGrid) return;

    // Fetch all items for akujualan
    const { data, error } = await window.supabaseClient
        .from("portfolio_items")
        .select("id, title, category, description, image_url, image_urls, sort_order, created_at")
        .eq("brand", "akujualan")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error loading portfolio:", error);
        portfolioGrid.innerHTML = `<p class="muted">Gagal memuat karya: ${error.message}</p>`;
        return;
    }

    if (!data || data.length === 0) {
        portfolioGrid.innerHTML = `<p class="muted">Belum ada karya untuk ditampilkan.</p>`;
        return;
    }

    portfolioGrid.innerHTML = "";

    // Create grid container using existing styles
    const gridDiv = document.createElement("div");
    gridDiv.className = "portfolio-grid";

    data.forEach(item => {
        const card = document.createElement("div");
        card.className = "portfolio-card reveal";
        card.dataset.category = item.category || "other";
        card.setAttribute("data-title", item.title || "");
        card.setAttribute("data-description", item.description || "");
        card.setAttribute("data-images", JSON.stringify(item.image_urls || [item.image_url]));

        card.innerHTML = `
            <div class="portfolio-thumb-wrapper" style="width: 100%; height: 260px; border-radius: 12px; overflow: hidden; position: relative;">
                <img class="portfolio-thumb" src="${item.image_url}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s cubic-bezier(0.2, 1, 0.3, 1);">
                <div class="portfolio-overlay" style="position: absolute; inset: 0; background: rgba(45, 36, 30, 0.4); opacity: 0; transition: opacity 0.3s ease; display: flex; align-items: center; justify-content: center;">
                    <span style="color: #fff; font-weight: 700; font-size: 13px; letter-spacing: 1px; border: 1px solid rgba(255,255,255,0.4); padding: 8px 16px; border-radius: 99px; background: rgba(255,255,255,0.1); backdrop-filter: blur(4px);">LIHAT DETAIL</span>
                </div>
            </div>
            <div class="portfolio-info" style="margin-top: 16px;">
                <div class="kicker" style="font-size: 10px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px;">${item.category || "Crochet"}</div>
                <h3 class="portfolio-title" style="font-size: 18px; font-weight: 700; color: var(--text);">${item.title}</h3>
            </div>
        `;

        // Interaction for lightbox
        card.addEventListener("click", () => {
            const images = JSON.parse(card.getAttribute("data-images"));
            if (window.openLightbox) {
                window.openLightbox(images, 0, item.title, item.description);
            }
        });

        // Hover effect logic (via JS for precision)
        card.addEventListener("mouseenter", () => {
            const img = card.querySelector(".portfolio-thumb");
            const overlay = card.querySelector(".portfolio-overlay");
            if (img) img.style.transform = "scale(1.08)";
            if (overlay) overlay.style.opacity = "1";
        });
        card.addEventListener("mouseleave", () => {
            const img = card.querySelector(".portfolio-thumb");
            const overlay = card.querySelector(".portfolio-overlay");
            if (img) img.style.transform = "scale(1)";
            if (overlay) overlay.style.opacity = "0";
        });

        gridDiv.appendChild(card);
    });

    portfolioGrid.appendChild(gridDiv);

    // Logic for filtering
    const chips = document.querySelectorAll(".chip");
    const cards = gridDiv.querySelectorAll(".portfolio-card");

    chips.forEach(chip => {
        chip.addEventListener("click", () => {
            chips.forEach(c => c.classList.remove("is-active"));
            chip.classList.add("is-active");

            const filter = chip.dataset.filter;

            cards.forEach(card => {
                if (filter === "all" || card.dataset.category === filter) {
                    card.style.display = "block";
                    card.classList.add("reveal");
                } else {
                    card.style.display = "none";
                }
            });
        });
    });

    if (window.initReveal) window.initReveal();
};

const checkSupabase = setInterval(() => {
    if (window.supabaseClient) {
        clearInterval(checkSupabase);
        loadAkujualanPortfolio();
    }
}, 100);
