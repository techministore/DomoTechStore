export async function onRequest(context) {
    try {
        const { request, env } = context;
        const url = new URL(request.url);

        const keyword = url.searchParams.get("q") || "";
        const page = url.searchParams.get("page") || 1;
        const pageSize = url.searchParams.get("pageSize") || 20;

        const APP_KEY = env.BANGGOOD_APP_KEY;
        const APP_SECRET = env.BANGGOOD_APP_SECRET;

        // Parámetros reales de la API de afiliados
        const params = {
            api_key: APP_KEY,
            keywords: keyword,
            page: page,
            pagesize: pageSize,
            currency: "EUR",
            warehouse: "CN"
        };

        // Ordenar parámetros
        const sortedKeys = Object.keys(params).sort();
        let signString = "";
        sortedKeys.forEach(key => {
            signString += key + params[key];
        });

        // Firma MD5
        const encoder = new TextEncoder();
        const data = encoder.encode(APP_SECRET + signString + APP_SECRET);
        const hashBuffer = await crypto.subtle.digest("MD5", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const sign = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

        const query = new URLSearchParams({
            ...params,
            sign
        });

        // ENDPOINT REAL DE AFILIADOS
        const apiUrl = `https://api.banggood.com/product/search?${query.toString()}`;

        const response = await fetch(apiUrl);
        const text = await response.text();

        let json;
        try {
            json = JSON.parse(text);
        } catch {
            return new Response(JSON.stringify({
                error: "Invalid JSON from Banggood",
                raw: text
            }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

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

