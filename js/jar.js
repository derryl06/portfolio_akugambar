/**
 * Testimonial Jar Logic
 * Renders testimonials as tiny interactive notes inside a digital jar.
 */

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("jar-notes");
    const modal = document.getElementById("testi-modal");
    const modalText = modal?.querySelector(".testi-modal-text");
    const modalAuthor = modal?.querySelector(".testi-modal-author strong");
    const modalRole = modal?.querySelector(".testi-modal-author span");
    const modalClose = modal?.querySelector(".testi-modal-close");
    const modalOverlay = modal?.querySelector(".testi-modal-overlay");

    if (!container || !modal) return;

    const openTesti = (item) => {
        modalText.textContent = `"${item.content}"`;
        modalAuthor.textContent = item.name;
        modalRole.textContent = item.role || "-";
        modal.classList.add("is-open");
    };

    const closeTesti = () => {
        modal.classList.remove("is-open");
    };

    modalClose.addEventListener("click", closeTesti);
    modalOverlay.addEventListener("click", closeTesti);

    // Define the override for index.js to use
    window.renderTestimonialsOverride = (list) => {
        container.innerHTML = "";

        list.forEach((item, index) => {
            const note = document.createElement("div");
            note.className = "jar-note";

            // Random position inside jar boundaries (relative to .the-jar)
            const x = 20 + Math.random() * 200;
            const y = 80 + Math.random() * 230;
            const rotation = -30 + Math.random() * 60;

            note.style.left = `${x}px`;
            note.style.top = `${y}px`;
            note.style.transform = `rotate(${rotation}deg)`;

            // Add delay for pop-in effect
            note.style.opacity = "0";
            note.style.transitionDelay = `${index * 0.1}s`;

            note.addEventListener("click", (e) => {
                e.stopPropagation();
                openTesti(item);
            });

            container.appendChild(note);

            // Trigger animation
            setTimeout(() => {
                note.style.opacity = "1";
            }, 50);
        });
    };
});
