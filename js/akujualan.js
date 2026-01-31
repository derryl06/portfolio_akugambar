const loadAkujualanPortfolio = async () => {
    const portfolioGrid = document.getElementById("akujualan-portfolio");
    const bundlingGrid = document.getElementById("akujualan-bundling");
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
        if (bundlingGrid) bundlingGrid.innerHTML = `<p class="muted" style="grid-column: 1/-1; text-align: center;">Belum ada paket bundling.</p>`;
        return;
    }

    // Separate Bundling items from regular Portfolio
    const bundlingItems = data.filter(item => item.category === "bundling");
    const generalItems = data.filter(item => item.category !== "bundling");

    // RENDER PORTFOLIO SECTION
    portfolioGrid.innerHTML = "";
    const gridDiv = document.createElement("div");
    gridDiv.className = "portfolio-grid";

    generalItems.forEach(item => {
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

        card.addEventListener("click", () => {
            const images = JSON.parse(card.getAttribute("data-images"));
            const title = item.title || "";
            const desc = item.description || "";

            // Check if global openLightbox exists
            if (window.openLightbox) {
                window.openLightbox(images, 0, title, desc);
            } else {
                console.warn("Lightbox function not found");
            }
        });

        gridDiv.appendChild(card);
    });
    portfolioGrid.appendChild(gridDiv);

    // RENDER BUNDLING SECTION
    if (bundlingGrid) {
        bundlingGrid.innerHTML = "";
        if (bundlingItems.length === 0) {
            bundlingGrid.innerHTML = `<p class="muted" style="grid-column: 1/-1; text-align: center;">Belum ada paket bundling yang tersedia.</p>`;
        } else {
            bundlingItems.forEach(item => {
                const card = document.createElement("div");
                card.className = "card reveal";
                card.style.cssText = "padding: 0; flex-direction: column; position: relative; overflow: hidden; background: #fff; border-radius: 24px; border: 1px solid var(--line);";

                card.innerHTML = `
                    <div style="width: 100%; height: 220px; overflow: hidden;">
                        <img src="${item.image_url}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div style="padding: 24px; display: flex; flex-direction: column; gap: 12px;">
                        <div class="kicker" style="font-size: 12px;">Special Package</div>
                        <h3 style="font-size: 20px; font-weight: 700; color: var(--text); line-height: 1.2;">${item.title}</h3>
                        <p style="font-size: 14px; color: var(--muted);">${item.description || "Hubungi kami untuk detail paket hemat ini."}</p>
                        <a href="https://wa.me/6285700804186?text=Halo%20akujualan.co%2C%20saya%20tertarik%20dengan%20paket%20${encodeURIComponent(item.title)}" class="btn btn-outline" style="text-align: center; text-decoration: none; margin-top: 8px;">Pesan Paket</a>
                    </div>
                `;
                bundlingGrid.appendChild(card);
            });
        }
    }

    // Logic for filtering
    const chips = document.querySelectorAll(".chip");
    const cards = gridDiv.querySelectorAll(".portfolio-card");

    const filterItems = (filter) => {
        // Update active chip UI
        chips.forEach(c => {
            if (c.dataset.filter === filter) c.classList.add("is-active");
            else c.classList.remove("is-active");
        });

        // Filter cards
        cards.forEach(card => {
            if (filter === "all" || card.dataset.category === filter) {
                card.style.display = "block";
                card.style.opacity = "0";
                setTimeout(() => {
                    card.style.opacity = "1";
                    card.style.transition = "opacity 0.4s ease";
                }, 10);
            } else {
                card.style.display = "none";
            }
        });
    };

    chips.forEach(chip => {
        chip.addEventListener("click", () => {
            filterItems(chip.dataset.filter);
        });
    });

    // Handle initial filter if needed
    filterItems("all");

    if (window.initReveal) window.initReveal();
};

const checkSupabase = setInterval(() => {
    if (window.supabaseClient) {
        clearInterval(checkSupabase);
        loadAkujualanPortfolio();
    }
}, 100);
