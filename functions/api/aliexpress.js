import { corsHeaders, handleOptions } from "../utils/cors.js";
import { parseAliExpressItem } from "../utils/parseAliExpress.js";

/**
 * Endpoint /api/aliexpress
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
        if (data && data.data && data.data.products) {
            items = data.data.products.map(p => ({
                item_id: p.product_id,
                title: p.product_title,
                price: p.product_price,
                sale_price: p.product_price,
                image_url: p.product_main_image_url || p.product_small_image_urls?.[0],
                product_url: p.product_detail_url,
                rating: p.evaluate_rate || p.evaluate_score || null,
                sales: p.sales_count || p.volume || 0,
                shipping: p.shipping_fee === 0 || p.is_free_shipping ? "Gratis" : (p.shipping_fee || null)
            }));
        }

        // 3. Generar Deep Links e inyectar Tracking ID
        // Usamos el formato oficial de afiliación por parámetros para asegurar comisiones
        const finalItems = items.map(item => {
            const baseUrl = item.product_url.split('?')[0];
            item.promotion_link = `${baseUrl}?aff_id=${TRACKING_ID}&aff_platform=api-new&sk=domotech_auto&aff_trace_key=domotech_${Date.now()}`;
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
