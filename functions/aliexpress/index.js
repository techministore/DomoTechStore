import { corsHeaders, handleOptions } from "../utils/cors.js";
import { parseAliExpressItem } from "../utils/parseAliExpress.js";

/**
 * Endpoint /api/aliexpress/index.js
 * Encargado de gestionar la búsqueda y firma de AliExpress
 */

export async function onRequest(context) {
    const { request } = context;
    
    // Manejar preflight CORS
    const optionsResponse = handleOptions(request);
    if (optionsResponse) return optionsResponse;

    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword') || 'smart home';

    // CONFIGURACIÓN (Segura en el servidor)
    const APP_KEY = "534120";
    const APP_SECRET = "iyAwX4NpupyrVHI36esNEys1nvLG0Aig";
    const TRACKING_ID = "domotech2026";

    // 1. Preparar parámetros de búsqueda
    const params = {
        app_key: APP_KEY,
        timestamp: Date.now().toString(),
        keywords: keyword,
        fields: "item_id,title,price,image_url,sale_price,product_url",
        tracking_id: TRACKING_ID,
        method: 'aliexpress.affiliate.product.query',
        v: '2.0',
        sign_method: 'md5',
        format: 'json'
    };

    // 2. Generar Firma
    const sign = await generateAliExpressSign(params, APP_SECRET);
    params.sign = sign;

    try {
        // 3. Buscar productos
        const apiRes = await fetch(`https://api.aliexpress.com/item_search?${new URLSearchParams(params)}`);
        const data = await apiRes.json();

        // 4. Generar Deep Links si hay resultados
        if (data.result && data.result.items && data.result.items.length > 0) {
            const urls = data.result.items.map(i => i.product_url).join(',');
            
            const linkParams = {
                app_key: APP_KEY,
                timestamp: Date.now().toString(),
                method: 'aliexpress.affiliate.link.generate',
                v: '2.0',
                sign_method: 'md5',
                format: 'json',
                source_values: urls,
                tracking_id: TRACKING_ID
            };

            const linkSign = await generateAliExpressSign(linkParams, APP_SECRET);
            linkParams.sign = linkSign;

            const linkRes = await fetch(`https://api.aliexpress.com/affiliate_link_generate?${new URLSearchParams(linkParams)}`);
            const linkData = await linkRes.json();

            // Combinar datos y parsear
            if (linkData.result && linkData.result.links) {
                data.result.items = data.result.items.map((item, idx) => {
                    if (linkData.result.links[idx]) {
                        item.promotion_link = linkData.result.links[idx].promotion_link;
                    }
                    return parseAliExpressItem(item);
                });
            }
        }

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
}

async function generateAliExpressSign(params, secret) {
    const sortedKeys = Object.keys(params).sort();
    let signStr = secret;
    for (const key of sortedKeys) {
        signStr += key + params[key];
    }
    signStr += secret;

    const msgUint8 = new TextEncoder().encode(signStr);
    const hashBuffer = await crypto.subtle.digest('MD5', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}
