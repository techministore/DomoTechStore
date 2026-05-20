export async function onRequest(context) {
    const { request, env } = context;

    try {
        const url = new URL(request.url);
        const keyword = url.searchParams.get("keyword") || "smart home";

        if (!keyword || keyword.trim().length < 2) {
            return json({ items: [], error: "Keyword too short" });
        }

        const result = await callAliExpressApi(keyword, env);
        return json(result);

    } catch (err) {
        return json({ items: [], error: "Internal Server Error", details: err.message }, 500);
    }
}

/**
 * Llama a la API de AliExpress con firma SHA256
 */
async function callAliExpressApi(keyword, env) {
    const endpoint = "https://api.aliexpress.com/sync";

    // 🔥 tracking_id añadido correctamente
    const baseParams = {
        page_size: "20",
        page_no: "1",
        keyword: keyword.trim(),
        tracking_id: env.ALI_TRACKING_ID
    };

    // 🔥 FIRMA ASÍNCRONA (corregido)
    const signedParams = await signParams(baseParams, env);

    const formBody = new URLSearchParams(signedParams).toString();

    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody
    });

    const data = await response.json();

    // Normalización de respuesta
    const items =
        data?.resp_result?.result?.products ||
        data?.resp_result?.result?.items ||
        [];

    return { items };
}

/**
 * Firma los parámetros con SHA256 (corregido con async/await)
 */
async function signParams(params, env) {
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

    // 🔥 ESTA ES LA CLAVE: esperar el hash
    const hash = await sha256(signBase);

    return { ...base, sign: hash.toUpperCase() };
}

/**
 * SHA256 helper (asíncrono)
 */
async function sha256(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

/**
 * Helper para respuestas JSON
 */
function json(obj, status = 200) {
    return new Response(JSON.stringify(obj), {
        status,
        headers: { "Content-Type": "application/json" }
    });
}
