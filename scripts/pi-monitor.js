document.addEventListener("DOMContentLoaded", () => {
                const pistats = "/ramdisk/pistats.json";
                const monitorCard = document.querySelector(".pi-monitor-card");
                const footer = document.querySelector(".site-footer");

                // -- FETCH & DISPLAY STATS --
                const updateStats = () => {
                    fetch(`${pistats}?t=${Date.now()}`)
                        .then((response) => response.json())
                        .then(data => {
                            const degTemp = data.temp.replace(/'+/, '°');
                            const shortUptime = data.uptime
                                .replace(/\s*weeks?/g, 'w')
                                .replace(/\s*days?/g, 'd')
                                .replace(/\s*hours?/g, 'h')
                                .replace(/\s*minutes?/g, 'm');

                            const statsElement = document.getElementById("pi-stats");
                            statsElement.innerHTML = `
                                <strong>Pi5 Status:</strong> Running...<br>
                                CPU Load: <span class="stats-val">${data.cpu_load}</span><br>
                                CPU Temp: <span class="stats-val">${degTemp}</span><br>
                                RAM Usage: <span class="stats-val">${data.ram_usage}</span><br>
                                Uptime: <span class="stats-val">${shortUptime}</span>
                            `;
                        })
                        .catch(err => console.error("Could not load stats:", err));
                };

                updateStats();

                setInterval(updateStats, 3000);

                // -- FLOATING CARD SCROLL --
                if (monitorCard && footer) {
                    const adjustPosition = () => {
                        const footerRect = footer.getBoundingClientRect();
                        const windowHeight = window.innerHeight;

                        // Calculates how many pixels the visible footer has pushed up into the viewport
                        const visibleFooterHeight = windowHeight - footerRect.top;
                    
                        // If the footer is visible on screen...
                        if (visibleFooterHeight > 0) {
                            // Push the card up by the footer's intrusion amount, plus a 20px gap cushion
                            monitorCard.style.bottom = `${visibleFooterHeight + 20}px`;
                        } else {
                            // Footer is off screen, lock it back to the default 20px floor
                            monitorCard.style.bottom = "20px";
                        }
                    };

        // Attach to scroll and resize events (passive makes it perform highly without stutter)
                    window.addEventListener("scroll", adjustPosition, { passive: true });
                    window.addEventListener("resize", adjustPosition, { passive: true });
        
        
                    adjustPosition();
                }

});