export async function onRequest(context) {
    try {
        const { request, env } = context;
        const url = new URL(request.url);
        const productId = url.searchParams.get("productId") || url.searchParams.get("id") || "";

        if (!productId) {
            return new Response(JSON.stringify({ error: "productId required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const APP_KEY = env.BANGGOOD_APP_KEY;
        const APP_SECRET = env.BANGGOOD_APP_SECRET;

        const params = {
            api: "product.get",
            app_key: APP_KEY,
            id: productId,
            timestamp: Math.floor(Date.now() / 1000)
        };

        // Ordenar parámetros
        const sortedKeys = Object.keys(params).sort();
        let signString = "";
        sortedKeys.forEach(key => {
            signString += key + params[key];
        });

        // Firmar con MD5 usando crypto.subtle
        const encoder = new TextEncoder();
        const data = encoder.encode(APP_SECRET + signString + APP_SECRET);
        const hashBuffer = await crypto.subtle.digest("MD5", data);

        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const sign = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

        const query = new URLSearchParams({
            ...params,
            sign
        });

        const apiUrl = `https://api.banggood.com/api2/request.api?${query.toString()}`;

        const response = await fetch(apiUrl);
        const json = await response.json();

        return new Response(JSON.stringify(json), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
