import { fetchBanggoodAPI } from "../utils.js";

export async function onRequest(context) {
    try {
        const { request, env } = context;
        const url = new URL(request.url);
        const page = url.searchParams.get("page") || 1;
        const pageSize = url.searchParams.get("pageSize") || 20;

        const APP_KEY = env.BANGGOOD_APP_KEY;
        const APP_SECRET = env.BANGGOOD_APP_SECRET;

        const params = {
            api: "product.search",
            app_key: APP_KEY,
            keywords: "discount",
            page,
            page_size: pageSize,
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
