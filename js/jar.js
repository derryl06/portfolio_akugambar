/**
 * Testimonial Jar Logic
 * Renders testimonials as tiny interactive notes inside a digital jar.
 */

// Define the override immediately so index.js can see it.
window.renderTestimonialsOverride = (list) => {
    const container = document.getElementById("jar-notes");
    const modal = document.getElementById("testi-modal");

    if (!container || !modal) return;

    const modalText = modal.querySelector(".testi-modal-text");
    const modalAuthor = modal.querySelector(".testi-modal-author strong");
    const modalRole = modal.querySelector(".testi-modal-author span");
    const modalClose = modal.querySelector(".testi-modal-close");
    const modalOverlay = modal.querySelector(".testi-modal-overlay");

    const openTesti = (item) => {
        if (modalText) modalText.textContent = `"${item.content}"`;
        if (modalAuthor) modalAuthor.textContent = item.name;
        if (modalRole) modalRole.textContent = item.role || "-";
        modal.classList.add("is-open");
    };

    const closeTesti = () => {
        modal.classList.remove("is-open");
    };

    if (!modal.dataset.eventsInit) {
        modalClose?.addEventListener("click", closeTesti);
        modalOverlay?.addEventListener("click", closeTesti);
        modal.dataset.eventsInit = "true";
    }

    // Clear existing notes
    container.innerHTML = "";

    list.forEach((item, index) => {
        const note = document.createElement("div");
        note.className = "jar-note";

        // Positioning logic within the jar boundaries
        const x = 20 + Math.random() * 190;
        const y = 60 + Math.random() * 240;
        const rotation = -30 + Math.random() * 60;

        note.style.left = `${x}px`;
        note.style.top = `${y}px`;
        note.style.transform = `rotate(${rotation}deg)`;

        // Appear animation
        note.style.opacity = "0";
        note.style.scale = "0.5";
        note.style.transition = "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)";
        note.style.transitionDelay = `${index * 0.15}s`;

        note.addEventListener("click", (e) => {
            e.stopPropagation();
            openTesti(item);
        });

        container.appendChild(note);

        // Force a reflow and then animate
        setTimeout(() => {
            note.style.opacity = "1";
            note.style.scale = "1";
        }, 50);
    });
};

// Also listen for DOMContentLoaded to handle any initial state if needed
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("jar-notes");
    if (container && container.children.length === 0) {
        container.innerHTML = `<div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:10px; opacity:0.3; font-weight:700; letter-spacing:1px;">MEMUAT...</div>`;
    }
});
