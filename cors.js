/**
 * Utilidad para manejar cabeceras CORS en Cloudflare Workers
 */
export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
};

/**
 * Manejo de preflight CORS (OPTIONS)
 * @param {Request} request - Request del navegador
 * @returns {Response|null} Respuesta al preflight o null si no es OPTIONS
 */
export function handleOptions(request) {
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: corsHeaders
        });
    }
    return null;
}
