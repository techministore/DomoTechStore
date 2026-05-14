import { corsHeaders, handleOptions } from "../utils/cors.js";
import { parseAmazonItem } from "../utils/parseAliExpress.js";

/**
 * Endpoint /api/amazon/index.js
 * Pendiente de configuración de PA-API de Amazon
 */

export async function onRequest(context) {
    const { request } = context;
    const optionsResponse = handleOptions(request);
    if (optionsResponse) return optionsResponse;

    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword') || 'smart home';

    // NOTA: Amazon requiere llaves de acceso de PA-API (Partner API)
    // Dejamos la estructura lista para cuando tengas las llaves.
    
    return new Response(JSON.stringify({ 
        message: "Endpoint de Amazon listo. Se requiere configuración de PA-API.",
        keyword_recibida: keyword,
        items: [] 
    }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
}
