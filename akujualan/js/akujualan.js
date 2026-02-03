const loadAkujualanPortfolio = async () => {
    const portfolioGrid = document.getElementById("akujualan-portfolio");
    const bundlingGrid = document.getElementById("akujualan-bundling");
    if (!portfolioGrid) return;

    // Fetch all items for akujualan
    const { data, error } = await window.supabaseClient
        .from("portfolio_items")
        .select("id, title, category, description, price, image_url, image_urls, sort_order, created_at")
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
        card.setAttribute("data-description", item.description || "");
        card.setAttribute("data-price", item.price || "");
        card.setAttribute("data-images", JSON.stringify(item.image_urls || [item.image_url]));

        const displayPrice = item.price ? (item.price.toLowerCase().includes("rp") ? item.price : `Rp ${item.price}`) : "";

        card.innerHTML = `
            <div class="portfolio-thumb-wrapper" style="width: 100%; height: 260px; border-radius: 12px; overflow: hidden; position: relative;">
                <img class="portfolio-thumb" src="${item.image_url}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s cubic-bezier(0.2, 1, 0.3, 1);">
                <div class="portfolio-overlay" style="position: absolute; inset: 0; background: rgba(45, 36, 30, 0.4); opacity: 0; transition: opacity 0.3s ease; display: flex; align-items: center; justify-content: center;">
                    <span style="color: #fff; font-weight: 700; font-size: 13px; letter-spacing: 1px; border: 1px solid rgba(255,255,255,0.4); padding: 8px 16px; border-radius: 99px; background: rgba(255,255,255,0.1); backdrop-filter: blur(4px);">LIHAT DETAIL</span>
                </div>
            </div>
            <div class="portfolio-info" style="margin-top: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <div class="kicker" style="font-size: 10px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px;">${item.category || "Crochet"}</div>
                        <h3 class="portfolio-title" style="font-size: 18px; font-weight: 700; color: var(--text);">${item.title}</h3>
                    </div>
                    ${displayPrice ? `<div class="price-tag" style="font-size: 13px; font-weight: 700; color: var(--accent); background: rgba(166,139,124,0.1); padding: 4px 10px; border-radius: 8px;">${displayPrice}</div>` : ""}
                </div>
            </div>
        `;

        card.addEventListener("click", () => {
            const images = JSON.parse(card.getAttribute("data-images"));
            const title = item.title || "";
            const desc = item.description || "";
            const price = item.price || "";
            const kicker = item.category || "Crochet";

            // Check if global openLightbox exists
            if (window.openLightbox) {
                window.openLightbox(images, 0, title, desc, price, kicker);
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
                card.style.cssText = "padding: 0; flex-direction: column; position: relative; overflow: hidden; background: #fff; border-radius: 24px; border: 1px solid var(--line); cursor: pointer;";

                const displayPrice = item.price ? (item.price.toLowerCase().includes("rp") ? item.price : `Rp ${item.price}`) : "";

                card.innerHTML = `
                    <div class="bundling-thumb-wrapper" style="width: 100%; height: 220px; overflow: hidden; position: relative;">
                        <img src="${item.image_url}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease;">
                        <div class="portfolio-overlay" style="position: absolute; inset: 0; background: rgba(45, 36, 30, 0.4); opacity: 0; transition: opacity 0.3s ease; display: flex; align-items: center; justify-content: center;">
                            <span style="color: #fff; font-weight: 700; font-size: 13px; letter-spacing: 1px; border: 1px solid rgba(255,255,255,0.4); padding: 8px 16px; border-radius: 99px; background: rgba(255,255,255,0.1); backdrop-filter: blur(4px);">LIHAT DETAIL</span>
                        </div>
                    </div>
                    <div style="padding: 24px; display: flex; flex-direction: column; gap: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div class="kicker" style="font-size: 12px;">Special Package</div>
                            ${displayPrice ? `<div style="font-weight: 800; color: var(--accent); font-size: 18px;">${displayPrice}</div>` : ""}
                        </div>
                        <h3 style="font-size: 20px; font-weight: 700; color: var(--text); line-height: 1.2;">${item.title}</h3>
                        <p style="font-size: 14px; color: var(--muted); line-height: 1.6; margin-bottom: 8px;">${item.description || "Hubungi kami untuk detail paket hemat ini."}</p>
                        <div style="display: flex; gap: 12px; margin-top: 8px;">
                            <a href="https://wa.me/6285700804186?text=Halo akujualan.co! 👋%0A%0ASaya tertarik dengan paket bundling:%0A🎁 *${item.title}*%0A💰 Harga: ${displayPrice || 'Tanya Harga'}%0A%0AApakah paket ini masih tersedia? Terima kasih! ✨" class="btn btn-outline" style="flex: 1; text-align: center; text-decoration: none;" onclick="event.stopPropagation()">Pesan Paket</a>
                        </div>
                    </div>
                `;

                card.addEventListener("click", () => {
                    const images = item.image_urls && item.image_urls.length ? item.image_urls : [item.image_url];
                    if (window.openLightbox) {
                        window.openLightbox(images, 0, item.title, item.description, item.price, item.category);
                    }
                });

                // Hover effects for the overlay
                card.addEventListener("mouseenter", () => {
                    const overlay = card.querySelector(".portfolio-overlay");
                    const img = card.querySelector("img");
                    if (overlay) overlay.style.opacity = "1";
                    if (img) img.style.transform = "scale(1.05)";
                });
                card.addEventListener("mouseleave", () => {
                    const overlay = card.querySelector(".portfolio-overlay");
                    const img = card.querySelector("img");
                    if (overlay) overlay.style.opacity = "0";
                    if (img) img.style.transform = "scale(1)";
                });

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

        let allCounter = 0;

        // Filter cards
        cards.forEach(card => {
            let visible = false;

            if (filter === "all") {
                // Limit to 9 items for "all" view
                if (allCounter < 9) {
                    visible = true;
                    allCounter++;
                }
            } else {
                // Show matches for specific categories
                if (card.dataset.category === filter) {
                    visible = true;
                }
            }

            if (visible) {
                card.style.display = "block";
                // Only animate if it was hidden or we want to refresh
                if (card.style.opacity !== "1") {
                    card.style.opacity = "0";
                    setTimeout(() => {
                        card.style.opacity = "1";
                        card.style.transition = "opacity 0.4s ease";
                    }, 10);
                }
            } else {
                card.style.display = "none";
                card.style.opacity = "0";
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
    loadSlotStatus();
    loadTodaysCraft();
};

const loadTodaysCraft = async () => {
    const container = document.getElementById("todays-craft-container");
    const textField = document.getElementById("todays-craft-text");
    if (!container || !textField || !window.supabaseClient) return;

    const { data, error } = await window.supabaseClient
        .from("site_settings")
        .select("value")
        .eq("key", "todays_craft")
        .single();

    if (error || !data || !data.value.text) return;

    textField.textContent = data.value.text;
    container.style.display = "block";
};

const loadSlotStatus = async () => {
    const slotTarget = document.getElementById("slot-indicator");
    if (!slotTarget || !window.supabaseClient) return;

    const { data, error } = await window.supabaseClient
        .from("site_settings")
        .select("value")
        .eq("key", "akujualan_slots")
        .single();

    if (error || !data) return;

    const { total, filled, status } = data.value;
    const remains = total - filled;

    let html = "";
    if (status === "closed") {
        html = `<span style="display:inline-flex; align-items:center; gap:8px; background:rgba(138, 126, 114, 0.1); color:var(--muted); padding:6px 16px; border-radius:99px; font-size:12px; font-weight:700;">
            <span style="width:8px; height:8px; background:var(--muted); border-radius:50%;"></span> ORDER DITUTUP SEMENTARA
        </span>`;
    } else if (remains <= 0) {
        html = `<span style="display:inline-flex; align-items:center; gap:8px; background:rgba(45, 36, 30, 0.05); color:var(--text); padding:6px 16px; border-radius:99px; font-size:12px; font-weight:700;">
            <span style="width:8px; height:8px; background:var(--accent); border-radius:50%;"></span> SLOT PENUH MINGGU INI
        </span>`;
    } else {
        const perc = (filled / total) * 100;
        html = `
        <div style="display:inline-flex; flex-direction:column; align-items:center; gap:10px;">
            <span style="display:inline-flex; align-items:center; gap:8px; background:rgba(166, 139, 124, 0.1); color:var(--accent); padding:6px 16px; border-radius:99px; font-size:12px; font-weight:800; letter-spacing:0.5px; border:1px solid rgba(166,139,124,0.2);">
                <span style="width:8px; height:8px; background:var(--accent); border-radius:50%; box-shadow:0 0 10px var(--accent);"></span> SLOT TERSEDIA: ${remains} / ${total}
            </span>
            <div style="width:140px; height:4px; background:var(--line); border-radius:99px; overflow:hidden;">
                <div style="width:${perc}%; height:100%; background:var(--accent); transition: width 1s ease-out;"></div>
            </div>
        </div>`;
    }

    slotTarget.innerHTML = html;
};

const checkSupabase = setInterval(() => {
    if (window.supabaseClient) {
        clearInterval(checkSupabase);
        loadAkujualanPortfolio();
    }
}, 100);
