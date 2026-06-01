export async function onRequest(context) {
    try {
        console.log("=== ALIEXPRESS WORKER STARTING ===");

        const { request, env } = context;
        const url = new URL(request.url);

        const keyword = url.searchParams.get("q") || "";
        const page = url.searchParams.get("page") || 1;
        const pageSize = url.searchParams.get("pageSize") || 20;

        const APP_KEY = env.ALIEXPRESS_APP_KEY;
        const APP_SECRET = env.ALIEXPRESS_APP_SECRET;

        console.log("KEYS CHECK:");
        console.log("- APP_KEY exists:", !!APP_KEY);
        console.log("- APP_SECRET exists:", !!APP_SECRET);
        console.log("- Keyword:", keyword);

        // Parámetros correctos de la API de AliExpress
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

        // ENDPOINT DE ALIEXPRESS
        const apiUrl = `https://api.aliexpress.com/v2/product/search?${query.toString()}`;
        console.log("Calling AliExpress API:", apiUrl.replace(APP_SECRET, "***"));

        const response = await fetch(apiUrl);
        console.log("AliExpress response status:", response.status);

        const responseText = await response.text();
        console.log("AliExpress response text:", responseText);

        let json;
        try {
            json = JSON.parse(responseText);
        } catch (e) {
            console.error("Failed to parse JSON from AliExpress:", e);
            return new Response(JSON.stringify({ 
                error: "Invalid JSON from AliExpress", 
                raw: responseText 
            }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        console.log("AliExpress response JSON:", json);

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
