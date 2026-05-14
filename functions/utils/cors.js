/**
 * Utilidad para manejar cabeceras CORS en Cloudflare Workers
 */
export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export function handleOptions(request) {
    if (request.method === "OPTIONS") {
        return new Response(null, {
            headers: corsHeaders,
        });
    }
    return null;
}
