hljs.highlightAll();

// brand hover: a band of 0s and 1s runs through sh0ds@devblog
const brand = document.querySelector(".brand");
const user = brand.firstChild;
const host = brand.querySelector("span");
const original = user.data + host.textContent;
let frame;

function bitflip() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    cancelAnimationFrame(frame);
    const start = performance.now();
    let last = 0;

    (function tick(now) {
        const p = Math.min((now - start) / 650, 1);
        if (now - last > 30 || p === 1) {
            last = now;
            const band = p * (original.length + 6) - 3;
            const text = [...original].map((c, i) =>
                p < 1 && Math.abs(i - band) < 2.5 ? (Math.random() < .5 ? "0" : "1") : c
            ).join("");
            user.data = text.slice(0, user.data.length);
            host.textContent = text.slice(user.data.length);
        }
        if (p < 1) frame = requestAnimationFrame(tick);
    })(start);
}

brand.addEventListener("mouseenter", bitflip);
brand.addEventListener("focus", bitflip);
