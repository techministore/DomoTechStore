export async function onRequest(context) {
    try {
        console.log("=== BANGGOOD WORKER STARTING ===");

        const { request, env } = context;
        const url = new URL(request.url);

        const keyword = url.searchParams.get("q") || "";
        const page = url.searchParams.get("page") || 1;
        const pageSize = url.searchParams.get("pageSize") || 20;

        const APP_KEY = env.BANGGOOD_APP_KEY;
        const APP_SECRET = env.BANGGOOD_APP_SECRET;

        console.log("KEYS CHECK:");
        console.log("- APP_KEY exists:", !!APP_KEY);
        console.log("- APP_SECRET exists:", !!APP_SECRET);
        console.log("- Keyword:", keyword);

        // Parámetros correctos de la API nueva
        const params = {
            api_key: APP_KEY,
            keywords: keyword,
            page,
            page_size: pageSize,
            language: "en",
            timestamp: Math.floor(Date.now() / 1000)
        };

        // Ordenar parámetros alfabéticamente
        const sortedKeys = Object.keys(params).sort();
        let signString = "";
        sortedKeys.forEach(key => {
            signString += key + params[key];
        });

        console.log("Sign string:", signString);

        // Firmar con MD5 usando crypto.subtle
        const encoder = new TextEncoder();
        const data = encoder.encode(APP_SECRET + signString + APP_SECRET);
        const hashBuffer = await crypto.subtle.digest("MD5", data);

        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const sign = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

        console.log("Generated sign:", sign);

        const query = new URLSearchParams({
            ...params,
            sign
        });

        // ENDPOINT NUEVO Y CORRECTO
        const apiUrl = `https://api.banggood.com/api2/product/search?${query.toString()}`;
        console.log("Calling Banggood API:", apiUrl.replace(APP_SECRET, "***"));

        const response = await fetch(apiUrl);
        console.log("Banggood response status:", response.status);

        const responseText = await response.text();
        console.log("Banggood response text:", responseText);

        let json;
        try {
            json = JSON.parse(responseText);
        } catch (e) {
            console.error("Failed to parse JSON from Banggood:", e);
            return new Response(JSON.stringify({ 
                error: "Invalid JSON from Banggood", 
                raw: responseText 
            }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        console.log("Banggood response JSON:", json);

        return new Response(JSON.stringify(json), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        console.error("WORKER ERROR:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
