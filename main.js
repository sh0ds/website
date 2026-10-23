document.addEventListener("DOMContentLoaded", () => {
    // -- STATS FETCHER --
    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    // fills a meter's bar: value between lo and hi, "hot" past warn
    const setMeter = (id, value, lo, hi, warn) => {
        const el = document.getElementById(id);
        if (!el || Number.isNaN(value)) return;
        const pct = Math.max(0, Math.min(1, (value - lo) / (hi - lo))) * 100;
        el.style.setProperty("--fill", `${pct.toFixed(1)}%`);
        el.classList.toggle("hot", value >= warn);
    };

    let lastSample = 0;
    const showAge = () => {
        if (!lastSample) return;
        const s = Math.round((Date.now() - lastSample) / 1000);
        setText("stat-age", s < 2 ? "last sample just now" : `last sample ${s} s ago`);
    };

    const setState = (text, ok) => {
        const el = document.getElementById("stat-state");
        if (!el) return;
        el.textContent = text;
        el.classList.toggle("down", !ok);
    };

    const updateStats = () => {
        // absolute path, so it also works from pages under /blog/
        fetch(`/ramdisk/pistats.json?t=${Date.now()}`)
            .then(response => {
                if (!response.ok) throw new Error(response.status);
                return response.json();
            })
            .then(data => {
                setText("stat-temp", data.temp);
                setText("stat-load", data.cpu_load);
                setText("stat-uptime", data.uptime);
                setText("stat-mem", data.ram_usage);
                setMeter("meter-temp", parseFloat(data.temp), 30, 85, 70);
                setMeter("meter-load", parseFloat(data.cpu_load), 0, 100, 80);
                setMeter("meter-mem", parseFloat(data.ram_usage), 0, 100, 85);
                lastSample = Date.now();
                showAge();
                setState("online", true);
            })
            .catch(() => setState("no data", false));
    };

    if (document.getElementById("stat-temp")) {
        updateStats();
        setInterval(updateStats, 10000);
        setInterval(showAge, 1000);
    }

    // -- REQUEST TIMING (homepage pipeline) --
    const timing = document.getElementById("req-timing");
    const nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
    if (timing && nav && nav.responseStart > 0) {
        const ttfb = Math.round(nav.responseStart - nav.requestStart);
        const kb = nav.transferSize ? `, ${(nav.transferSize / 1024).toFixed(1)} kB` : "";
        timing.textContent = `HTTPS, TTFB ${ttfb} ms${kb}`;
    }
});
