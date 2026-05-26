import { corsHeaders, handleOptions } from "../utils/cors.js";
import { callBanggoodApi } from "../utils/banggoodApi.js";
import { parseBanggoodItem } from "../utils/parseAliExpress.js";

/**
 * Cloudflare Pages Function: /api/banggood
 * Busca productos en Banggood con API simplificada
 */
export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    // 0. Manejo de preflight (CORS)
    const optionsResponse = handleOptions(request);
    if (optionsResponse) return optionsResponse;

    const keyword = url.searchParams.get('keyword') || 'smart home';

    if (!keyword || keyword.trim().length === 0) {
        return new Response(JSON.stringify({ error: "Keyword requerido", items: [] }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    console.log('────────────────────────────────────────────');
    console.log('[BANGGOOD] Búsqueda:', keyword);

    // Caché simple
    let cache;
    try { cache = caches.default; } catch (e) {}
    const cacheKey = new Request(url.toString());

    if (cache) {
        try {
            const cached = await cache.match(cacheKey);
            if (cached) {
                console.log('[CACHE] Hit Banggood!');
                return cached;
            }
        } catch (e) {}
    }

    try {
        // Llamar a la API de Banggood
        const rawData = await callBanggoodApi(keyword, env);
        
        // Parsear productos
        const items = (rawData.data || rawData.items || [])
            .map(item => parseBanggoodItem(item))
            .filter(item => item && item.id)
            .slice(0, 20);

        console.log('[BANGGOOD] Éxito:', items.length, 'productos');

        const response = new Response(JSON.stringify({ items }), {
            status: 200,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=600'
            }
        });

        if (cache) context.waitUntil(cache.put(cacheKey, response.clone()));
        return response;

    } catch (err) {
        console.error('[ERROR] Banggood:', err.message);
        return new Response(JSON.stringify({ error: err.message, items: [] }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
