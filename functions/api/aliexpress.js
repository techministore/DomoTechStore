/**
 * AliExpress API Proxy para Cloudflare Pages Functions
 * Maneja la firma (sign) y oculta el app_secret del cliente.
 */

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword') || 'smart home';

    // CONFIGURACIÓN (Mantenemos tus datos de forma segura aquí)
    const APP_KEY = "534120";
    const APP_SECRET = "iyAwX4NpupyrVHI36esNEys1nvLG0Aig";
    const TRACKING_ID = "domotech2026";

    // 1. Preparar parámetros para AliExpress (Siguiendo el estándar IOP)
    // El timestamp debe ser exacto o en milisegundos según la versión de la API
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

    // 2. Generar la Firma (SIGN)
    const sign = await generateAliExpressSign(params, APP_SECRET);
    params.sign = sign;

    // 3. Llamar a la API de AliExpress desde el Servidor
    // Usamos el endpoint proporcionado en tu script base
    const apiEndpoint = "https://api.aliexpress.com/item_search";
    const query = new URLSearchParams(params).toString();
    
    try {
        const response = await fetch(`${apiEndpoint}?${query}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });
        
        const data = await response.json();
        
        // Devolver los resultados con cabeceras de seguridad
        return new Response(JSON.stringify(data), {
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=3600" // Caché de 1 hora para no saturar la API
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Error en el Proxy", details: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

/**
 * Algoritmo de firma oficial de AliExpress (IOP)
 */
async function generateAliExpressSign(params, secret) {
    // 1. Ordenar parámetros alfabéticamente por nombre de clave
    const sortedKeys = Object.keys(params).sort();
    
    // 2. Concatenar Secret + Key1Value1Key2Value2... + Secret
    let signStr = secret;
    for (const key of sortedKeys) {
        signStr += key + params[key];
    }
    signStr += secret;

    // 3. Generar MD5 usando la Web Crypto API nativa de Cloudflare (más rápido y seguro)
    const msgUint8 = new TextEncoder().encode(signStr);
    const hashBuffer = await crypto.subtle.digest('MD5', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex.toUpperCase();
}