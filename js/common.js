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
});
