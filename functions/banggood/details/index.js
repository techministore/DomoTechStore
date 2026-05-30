import { fetchBanggoodAPI } from "../utils.js";

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

        const data = await fetchBanggoodAPI(params, APP_KEY, APP_SECRET);

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
