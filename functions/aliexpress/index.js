export async function onRequest(context) {
    const { request, env } = context;

    // Obtener parámetros de la URL
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword") || "smart home";

    // Validación básica
    if (!keyword || keyword.trim().length < 2) {
        return new Response(JSON.stringify({ items: [], error: "Keyword too short" }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    // Llamada a la API de AliExpress
    const result = await callAliExpressApi(keyword, env);

    return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" }
    });
}

/**
 * Llama a la API de AliExpress con firma SHA256
 */
async function callAliExpressApi(keyword, env) {
    const endpoint = "https://api.aliexpress.com/sync";

    // 🔥 ESTA ES LA PARTE CRÍTICA: tracking_id añadido
    const baseParams = {
        page_size: "20",
        page_no: "1",
        keyword: keyword.trim(),
        tracking_id: env.ALI_TRACKING_ID   // ← AQUÍ ESTÁ LA CLAVE
    };

    const signedParams = signParams(baseParams, env);

    const formBody = new URLSearchParams(signedParams).toString();

    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody
    });

    const data = await response.json();

    // Normalizar respuesta
    const items =
        data?.resp_result?.result?.products ||
        data?.resp_result?.result?.items ||
        [];

    return { items };
}

/**
 * Firma los parámetros con SHA256
 */
function signParams(params, env) {
    const timestamp = Date.now().toString();

    const base = {
        app_key: env.ALI_APP_KEY,
        method: "aliexpress.affiliate.product.query",
        sign_method: "sha256",
        timestamp,
        v: "2.0",
        format: "json",
        ...params
    };

    const sorted = Object.keys(base)
        .sort()
        .map((k) => `${k}${base[k]}`)
        .join("");

    const signBase = env.ALI_APP_SECRET + sorted + env.ALI_APP_SECRET;

    const sign = sha256(signBase).toUpperCase();

    return { ...base, sign };
}

/**
 * SHA256 helper
 */
function sha256(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);

    return crypto.subtle.digest("SHA-256", data).then((hash) => {
        return Array.from(new Uint8Array(hash))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
    });
}
