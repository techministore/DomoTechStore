import CryptoJS from "crypto-js";

export async function onRequest(context) {
    try {
        const { request, env } = context;
        const url = new URL(request.url);
        const keyword = url.searchParams.get("q") || "";
        const page = url.searchParams.get("page") || 1;
        const pageSize = url.searchParams.get("pageSize") || 20;

        const APP_KEY = env.BANGGOOD_APP_KEY;
        const APP_SECRET = env.BANGGOOD_APP_SECRET;

        const params = {
            api: "product.search",
            app_key: APP_KEY,
            keywords: keyword,
            page,
            page_size: pageSize,
            timestamp: Math.floor(Date.now() / 1000)
        };

        // Ordenar parámetros
        const sortedKeys = Object.keys(params).sort();
        let signString = "";
        sortedKeys.forEach(key => {
            signString += key + params[key];
        });

        // Firmar
        const sign = CryptoJS.MD5(APP_SECRET + signString + APP_SECRET).toString();

        // Construir query
        const query = new URLSearchParams({
            ...params,
            sign
        });

        const apiUrl = `https://api.banggood.com/api2/request.api?${query.toString()}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}