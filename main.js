document.addEventListener("DOMContentLoaded", () => {
    // -- STATS FETCHER --
    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    const updateStats = () => {
        fetch(`ramdisk/pistats.json?t=${Date.now()}`)
            .then(response => response.json())
            .then(data => {
                setText("stat-temp", data.temp);
                setText("stat-load", data.cpu_load);
                setText("stat-uptime", data.uptime);
                setText("stat-mem", data.ram_usage);
            })
            .catch(() => console.error("Could not load stats"));
    };

    updateStats();
    setInterval(updateStats, 10000);

    // -- SYNTAX HIGHLIGHTING --
    if (typeof window.hljs !== "undefined") {
        hljs.highlightAll();
    }

    // -- BRAND HOVER EFFECT --
    const brand = document.querySelector(".brand");
    if (brand) {
        const user = brand.firstChild;
        const host = brand.querySelector("span");
        if (user && host) {
            const original = user.data + host.textContent;
            let frame;

            function bitflip() {
                if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
        }
    }
});
