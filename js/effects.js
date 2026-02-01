/**
 * effects.js - Custom visual effects for akugambar.co & akujualan.co
 * Includes: Custom Cursor, Magnetic Buttons, and The Cursor Weave (Yarn Trail).
 */

document.addEventListener("DOMContentLoaded", () => {
    initCursor();
    initWeave();
});

/**
 * Aesthetic Custom Cursor Logic
 */
function initCursor() {
    const cursor = document.createElement("div");
    const cursorRing = document.createElement("div");
    const cursorLabel = document.createElement("span");

    cursor.className = "custom-cursor-dot";
    cursorRing.className = "custom-cursor-ring";
    cursorLabel.className = "custom-cursor-label";
    cursorLabel.innerText = "VIEW";

    document.body.appendChild(cursor);
    document.body.appendChild(cursorRing);
    cursorRing.appendChild(cursorLabel);

    let mouseX = 0;
    let mouseY = 0;
    let dotX = 0;
    let dotY = 0;
    let ringX = 0;
    let ringY = 0;

    window.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animate() {
        dotX += (mouseX - dotX) * 0.25;
        dotY += (mouseY - dotY) * 0.25;
        ringX += (mouseX - ringX) * 0.12;
        ringY += (mouseY - ringY) * 0.12;

        cursor.style.transform = `translate3d(${dotX}px, ${dotY}px, 0)`;
        cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;

        requestAnimationFrame(animate);
    }
    animate();

    const handleMouseEnter = (e) => {
        const el = e.currentTarget;
        document.body.classList.add("cursor-active");
        if (el.classList.contains("work-card") || el.classList.contains("portfolio-card") || el.classList.contains("bundle-card")) {
            document.body.classList.add("cursor-view-mode");
        }
    };

    const handleMouseLeave = () => {
        document.body.classList.remove("cursor-active", "cursor-view-mode");
    };

    const refreshListeners = () => {
        const interactables = document.querySelectorAll("a, button, .work-card, .portfolio-card, .bundle-card, .chip, .faq-question");
        interactables.forEach((el) => {
            el.removeEventListener("mouseenter", handleMouseEnter);
            el.removeEventListener("mouseleave", handleMouseLeave);
            el.addEventListener("mouseenter", handleMouseEnter);
            el.addEventListener("mouseleave", handleMouseLeave);
        });
    };

    refreshListeners();
    const observer = new MutationObserver(refreshListeners);
    const main = document.querySelector('main');
    if (main) observer.observe(main, { childList: true, subtree: true });
}

/**
 * The Cursor Weave - A yarn thread that follows the mouse with elastic physics.
 */
function initWeave() {
    const canvas = document.createElement('canvas');
    canvas.id = 'weaveCanvas';
    canvas.className = 'weave-canvas';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;

    const resize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const points = [];
    const numPoints = 25; // Length of the yarn

    for (let i = 0; i < numPoints; i++) {
        points.push({ x: mouse.x, y: mouse.y });
    }

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    function draw() {
        ctx.clearRect(0, 0, width, height);

        // Physics logic: First point follows mouse, others follow previous
        points[0].x += (mouse.x - points[0].x) * 0.3;
        points[0].y += (mouse.y - points[0].y) * 0.3;

        for (let i = 1; i < numPoints; i++) {
            const p = points[i];
            const prev = points[i - 1];

            // Add a little bit of "floaty" gravity/wave effect
            const wave = Math.sin(Date.now() * 0.002 + i * 0.3) * 1.2;

            p.x += (prev.x - p.x) * 0.35 + wave * 0.2;
            p.y += (prev.y - p.y) * 0.35 + Math.cos(Date.now() * 0.002 + i * 0.3) * 1.2;
        }

        // Draw the yarn
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#e63946';

        ctx.shadowBlur = 4;
        ctx.shadowColor = accentColor;
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < numPoints - 2; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }

        ctx.quadraticCurveTo(
            points[numPoints - 2].x,
            points[numPoints - 2].y,
            points[numPoints - 1].x,
            points[numPoints - 1].y
        );

        ctx.stroke();

        requestAnimationFrame(draw);
    }
    draw();
}
