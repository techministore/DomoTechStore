import { corsHeaders, handleOptions } from "../utils/cors.js";
import { parseAliExpressItem } from "../utils/parseAliExpress.js";

/**
 * Endpoint /api/aliexpress/index.js
 * Encargado de gestionar la búsqueda y firma de AliExpress
 */

export async function onRequest(context) {
    const { request, env } = context;
    
    // Manejar preflight CORS
    const optionsResponse = handleOptions(request);
    if (optionsResponse) return optionsResponse;

    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword') || 'smart home';

    // CONFIGURACIÓN (Usando tu variable secreta de Cloudflare)
    const RAPIDAPI_KEY = env.RAPIDAPI_KEY;
    const TRACKING_ID = "domotech2026";

    if (!RAPIDAPI_KEY) {
        return new Response(JSON.stringify({ error: "Falta RAPIDAPI_KEY en la configuración de Cloudflare" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    try {
        // 1. Llamada a AliExpress vía RapidAPI (Búsqueda de productos)
        // Usamos un endpoint estándar de RapidAPI para AliExpress
        const apiRes = await fetch(`https://aliexpress-data-service.p.rapidapi.com/product/search?query=${encodeURIComponent(keyword)}&page=1`, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': 'aliexpress-data-service.p.rapidapi.com'
            }
        });

        const data = await apiRes.json();
        let items = [];

        // 2. Normalizar los resultados según el formato de RapidAPI
        // Adaptamos esto según la respuesta típica (puedes ajustarlo si usas otra API específica)
        if (data && data.data && data.data.products) {
            items = data.data.products.map(p => ({
                item_id: p.product_id,
                title: p.product_title,
                price: p.product_price,
                sale_price: p.product_price, // RapidAPI suele dar el precio final
                image_url: p.product_main_image_url || p.product_small_image_urls?.[0],
                product_url: p.product_detail_url
            }));
        }

        // 3. Generar Deep Links si hay resultados (Opcional si RapidAPI ya los da)
        // Para asegurar comisiones, inyectamos tu Tracking ID
        const finalItems = items.map(item => {
            const separator = item.product_url.includes('?') ? '&' : '?';
            item.promotion_link = `${item.product_url}${separator}aff_id=${TRACKING_ID}`;
            return parseAliExpressItem(item);
        });

        return new Response(JSON.stringify({ result: { items: finalItems } }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: "Error en RapidAPI", details: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
}
