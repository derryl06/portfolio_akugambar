/**
 * Common JS for Social FAB and Navigation
 */

document.addEventListener("DOMContentLoaded", () => {
    // Social FAB Toggle
    const socialFab = document.querySelector(".social-fab");
    if (socialFab) {
        const fabBtn = socialFab.querySelector(".fab-main");
        if (fabBtn) {
            fabBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                socialFab.classList.toggle("is-active");
            });
        }

        // Close when clicking outside
        document.addEventListener("click", (e) => {
            if (!socialFab.contains(e.target)) {
                socialFab.classList.remove("is-active");
            }
        });
    }

    // Back to Top Logic
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
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }

    // Dynamic Ambient Logic
    const initDynamicAmbient = () => {
        const now = new Date();
        const hour = now.getHours();
        let greeting = "";
        let systemTheme = "light";

        // 1. Determine Greeting
        if (hour >= 5 && hour < 11) greeting = "Semangat Pagi";
        else if (hour >= 11 && hour < 15) greeting = "Selamat Siang";
        else if (hour >= 15 && hour < 18) greeting = "Selamat Sore";
        else {
            greeting = "Selamat Malam";
            systemTheme = "dark";
        }

        // 2. Auto-set theme if not manually set by user
        const hasManualTheme = localStorage.getItem("theme");
        if (!hasManualTheme) {
            document.body.dataset.theme = systemTheme;
            // Update toggle btn if exists (handled loosely since it might be in index.js)
            const toggleBtn = document.querySelector(".theme-toggle");
            if (toggleBtn) toggleBtn.setAttribute("aria-pressed", String(systemTheme === "dark"));
        }

        // 3. Inject Greeting into placeholder if exists
        const placeholder = document.getElementById("hero-ambient-placeholder");
        if (placeholder) {
            placeholder.innerHTML = `<span class="ambient-greeting">${greeting}</span>`;
        }
    };

    initDynamicAmbient();

    // PWA Service Worker Registration
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker
                .register("/sw.js")
                .then((reg) => console.log("SW Registered"))
                .catch((err) => console.log("SW Failed", err));
        });
    }
});
