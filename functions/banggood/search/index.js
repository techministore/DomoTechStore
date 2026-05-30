import { fetchBanggoodAPI } from "../utils.js";

export async function onRequest(context) {
    try {
        const { request, env } = context;
        const url = new URL(request.url);
        const keyword = url.searchParams.get("q") || "";
        const page = url.searchParams.get("page") || 1;
        const pageSize = url.searchParams.get("pageSize") || 20;

        console.log('-----------------------------------------------------');
        console.log('[BANGGOOD WORKER] Buscando para:', keyword);

        const APP_KEY = env.BANGGOOD_APP_KEY;
        const APP_SECRET = env.BANGGOOD_APP_SECRET;

        if (!APP_KEY) {
            console.error('[BANGGOOD WORKER] ERROR: BANGGOOD_APP_KEY no está configurada en las variables de entorno!');
            return new Response(JSON.stringify({ error: "BANGGOOD_APP_KEY no configurada" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }
        if (!APP_SECRET) {
            console.error('[BANGGOOD WORKER] ERROR: BANGGOOD_APP_SECRET no está configurada en las variables de entorno!');
            return new Response(JSON.stringify({ error: "BANGGOOD_APP_SECRET no configurada" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        const params = {
            api: "product.search",
            app_key: APP_KEY,
            keywords: keyword,
            page,
            page_size: pageSize,
            timestamp: Math.floor(Date.now() / 1000)
        };

        console.log('[BANGGOOD WORKER] Parámetros:', params);

        const data = await fetchBanggoodAPI(params, APP_KEY, APP_SECRET);
        
        console.log('[BANGGOOD WORKER] Respuesta de la API de Banggood:', JSON.stringify(data, null, 2));

        return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        console.error('[BANGGOOD WORKER] Error general:', err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
