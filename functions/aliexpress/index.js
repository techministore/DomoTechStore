export async function onRequest(context) {
    try {
        console.log("=== ALIEXPRESS IOP WORKER STARTING ===");

        const { request, env } = context;
        const url = new URL(request.url);

        const keyword = url.searchParams.get("q") || "";
        const page = url.searchParams.get("page") || 1;
        const pageSize = url.searchParams.get("pageSize") || 20;

        const APP_KEY = env.ALI_APP_KEY;
        const APP_SECRET = env.ALI_APP_SECRET;
        const TRACKING_ID = env.ALI_TRACKING_ID;

        console.log("KEYS CHECK:");
        console.log("- APP_KEY exists:", !!APP_KEY);
        console.log("- APP_SECRET exists:", !!APP_SECRET);
        console.log("- TRACKING_ID exists:", !!TRACKING_ID);
        console.log("- Keyword:", keyword);

        // Parámetros oficiales de IOP
        const params = {
            app_key: APP_KEY,
            method: "aliexpress.affiliate.product.query",
            timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
            sign_method: "md5",
            format: "json",
            v: "2.0",
            fields: "product_id,product_title,product_main_image_url,product_small_image_urls,product_detail_url,sale_price,discount",
            keywords: keyword,
            page_no: page,
            page_size: pageSize,
            tracking_id: TRACKING_ID
        };

        // Ordenar parámetros alfabéticamente
        const sortedKeys = Object.keys(params).sort();
        let signString = "";
        sortedKeys.forEach(key => {
            signString += key + params[key];
        });

        console.log("Concatenate string (signString):", signString);

        // Firmar con MD5 usando crypto.subtle
        const encoder = new TextEncoder();
        const data = encoder.encode(APP_SECRET + signString + APP_SECRET);
        const hashBuffer = await crypto.subtle.digest("MD5", data);

        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const sign = hashArray.map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();

        console.log("Generated sign:", sign);

        const query = new URLSearchParams({
            ...params,
            sign
        });

        // ENDPOINT OFICIAL IOP
        const apiUrl = `https://api.aliexpress.com/sync?${query.toString()}`;
        console.log("Calling AliExpress API:", apiUrl);

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
