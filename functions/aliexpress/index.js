import { callAliExpressApi } from '../utils/aliApi.js';
import { handleOptions, corsHeaders } from '../utils/cors.js';
import { parseAliExpressItem } from '../utils/parseAliExpress.js';

/**
 * Registra información enviada a AliExpress
 */
function logAliExpressRequest(method, params, endpoint) {
    const timestamp = new Date().toISOString();
    const requestInfo = {
        timestamp,
        method,
        endpoint,
        params: {
            keyword: params.keyword || 'N/A',
            page_size: params.page_size || 'N/A',
            page_no: params.page_no || 'N/A',
            tracking_id: params.tracking_id || 'N/A',
            promotion_link_type: params.promotion_link_type || 'N/A'
        }
    };
    
    // Log en consola con formato claro
    console.log('═══════════════════════════════════════════════════');
    console.log('📤 REQUEST_TO_ALIEXPRESS');
    console.log('═══════════════════════════════════════════════════');
    console.log(`⏰ Timestamp: ${requestInfo.timestamp}`);
    console.log(`🔗 Endpoint: ${requestInfo.endpoint}`);
    console.log(`📋 Método: ${requestInfo.method}`);
    console.log('📦 Parámetros:');
    console.log(JSON.stringify(requestInfo.params, null, 2));
    console.log('═══════════════════════════════════════════════════');
    
    return requestInfo;
}

/**
 * Cloudflare Pages Function: /aliexpress
 * Maneja búsquedas de productos y generación de enlaces s.click
 */
export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    // 0. Manejo de preflight (CORS)
    const optionsResponse = handleOptions(request);
    if (optionsResponse) return optionsResponse;

    const keyword = url.searchParams.get('keyword') || 'smart home';
    const hot = url.searchParams.get('hot') === 'true';
    const linkOnly = url.searchParams.get('linkOnly') === 'true';
    const productId = url.searchParams.get('productId');

    console.log('────────────────────────────────────────────');

    // 1. MODO GENERACIÓN DE ENLACE (s.click)
    if (linkOnly && productId) {
        console.log('[ALIEXPRESS] Modo: Generar Link Directo para ID:', productId);
        try {
            const bizParams = {
                tracking_id: env.ALI_TRACKING_ID || 'Domotech_2026',
                promotion_link_type: '0', // s.click
                source_values: `https://www.aliexpress.com/item/${productId}.html`
            };

            // 📤 Registrar información enviada a AliExpress
            const endpoint = env.ALI_API_ENDPOINT || 'aliexpress.affiliate.link.generate';
            logAliExpressRequest('aliexpress.affiliate.link.generate', bizParams, endpoint);

            const linkRes = await callAliExpressApi('aliexpress.affiliate.link.generate', bizParams, env);
            const promotionLink = linkRes?.aliexpress_affiliate_link_generate_response?.resp_result?.result?.promotion_links?.promotion_link?.[0]?.promotion_link;

            if (promotionLink) {
                return new Response(JSON.stringify({ promotion_link: promotionLink }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            throw new Error('API no devolvió un promotion_link');
        } catch (err) {
            console.error('[ERROR] Generación link:', err.message);
            return new Response(JSON.stringify({ error: err.message }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }

    // 2. MODO BÚSQUEDA NORMAL / HOT
    console.log('[ALIEXPRESS] Modo: Búsqueda:', keyword, '(Hot:', hot, ')');

    // Caché (opcional en Functions, pero recomendado)
    let cache;
    try { cache = caches.default; } catch (e) {}
    const cacheKey = new Request(url.toString());

    if (cache) {
        try {
            const cached = await cache.match(cacheKey);
            if (cached) {
                console.log('[CACHE] Hit!');
                return cached;
            }
        } catch (e) {}
    }

    // Limpiar keyword
    const cleanKeyword = keyword
        .trim()
        .replace(/[^\w\s]/gi, '')
        .split(/\s+/)
        .slice(0, 5)
        .join(' ');

    const businessParams = {
        keyword: cleanKeyword,
        page_size: 20,
        page_no: 1,
        tracking_id: env.ALI_TRACKING_ID || 'Domotech_2026'
    };

    const METHOD_HOT = 'aliexpress.affiliate.hotproduct.query';
    const METHOD_NORMAL = 'aliexpress.affiliate.product.query';

    try {
        // Intento principal
        const method = hot ? METHOD_HOT : METHOD_NORMAL;
        
        // 📤 Registrar información enviada a AliExpress
        const endpoint = env.ALI_API_ENDPOINT || 'https://api.aliexpress.com/';
        logAliExpressRequest(method, businessParams, endpoint);

        let apiResponse = await callAliExpressApi(method, businessParams, env);

        // Fallback inteligente
        const hasError = !apiResponse || apiResponse.error_response || 
            !(apiResponse.aliexpress_affiliate_hotproduct_query_response || apiResponse.aliexpress_affiliate_product_query_response);

        if (hasError && hot) {
            console.log('[FALLBACK] Hot falló, intentando normal...');
            // 📤 Registrar intento de fallback
            logAliExpressRequest(METHOD_NORMAL, businessParams, endpoint);
            apiResponse = await callAliExpressApi(METHOD_NORMAL, businessParams, env);
        }

        // Procesar productos
        const responseData = apiResponse?.aliexpress_affiliate_product_query_response || 
                             apiResponse?.aliexpress_affiliate_hotproduct_query_response || 
                             apiResponse;

        const rawItems = responseData?.resp_result?.result?.products || 
                         responseData?.result?.products || 
                         responseData?.resp_result?.result?.items || [];

        const cleaned = rawItems
            .map(item => parseAliExpressItem(item))
            .filter(item => item && item.id);

        console.log('[ALIEXPRESS] Éxito:', cleaned.length, 'productos');

        const response = new Response(JSON.stringify({ items: cleaned }), {
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
        console.error('[ERROR] Excepción búsqueda:', err.message);
        return new Response(JSON.stringify({ error: err.message, items: [] }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
