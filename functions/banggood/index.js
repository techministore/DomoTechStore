import { corsHeaders, handleOptions } from "../utils/cors.js";
import { parseBanggoodItem } from "../utils/parseAliExpress.js";

/**
 * Endpoint /api/banggood/index.js
 * Pendiente de configuración de API de Banggood
 */

export async function onRequest(context) {
    const { request } = context;
    const optionsResponse = handleOptions(request);
    if (optionsResponse) return optionsResponse;

    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword') || 'smart home';

    // NOTA: Banggood requiere AppKey y AppSecret específicos.
    
    return new Response(JSON.stringify({ 
        message: "Endpoint de Banggood listo. Se requiere configuración de API.",
        keyword_recibida: keyword,
        items: [] 
    }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
}
