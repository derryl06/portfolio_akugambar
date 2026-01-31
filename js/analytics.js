/**
 * Simple Analytics for akujualan & akugambar
 * Records page visits to Supabase
 */

(function () {
    const logVisit = async () => {
        // Wait for Supabase to be ready
        const checkSupabase = setInterval(async () => {
            if (window.supabaseClient) {
                clearInterval(checkSupabase);

                const pagePath = window.location.pathname;
                const referrer = document.referrer || "Direct";

                // Simple device detection
                const ua = navigator.userAgent;
                let device = "Desktop";
                if (/tablet|ipad|playbook|silk/i.test(ua)) {
                    device = "Tablet";
                } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Opera Mini/i.test(ua)) {
                    device = "Mobile";
                }

                // Simple browser detection
                let browser = "Other";
                if (ua.includes("Firefox")) browser = "Firefox";
                else if (ua.includes("SamsungBrowser")) browser = "Samsung";
                else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
                else if (ua.includes("Trident")) browser = "IE";
                else if (ua.includes("Edge")) browser = "Edge";
                else if (ua.includes("Chrome")) browser = "Chrome";
                else if (ua.includes("Safari")) browser = "Safari";

                try {
                    await window.supabaseClient.from("page_visits").insert({
                        page_path: pagePath,
                        referrer: referrer,
                        browser: browser,
                        device: device
                    });
                } catch (err) {
                    console.error("Analytics Error:", err);
                }
            }
        }, 500);

        // Stop checking after 10 seconds to avoid infinite loop if something is wrong
        setTimeout(() => clearInterval(checkSupabase), 10000);
    };

    if (document.readyState === "complete") {
        logVisit();
    } else {
        window.addEventListener("load", logVisit);
    }
})();
