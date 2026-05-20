import { callAliExpressApi } from "../utils/aliApi.js";
import { cleanAliUrl } from "../utils/cleanUrl.js";

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    const keyword = url.searchParams.get("keyword") || "smart home";
    const hot = url.searchParams.get("hot") === "true";

    console.log("────────────────────────────────────────────");
    console.log("[ALIEXPRESS] Nueva petición");
    console.log("Keyword:", keyword);
    console.log("Hot:", hot);

    // 0) Configuración de caché
    let cache;
    try {
        cache = caches.default;
    } catch (e) {
        console.log("[CACHE] Caches.default no disponible:", e.message);
    }

    const cacheKey = new Request(url.toString());

    // 1) Intentar leer desde caché
    if (cache) {
        try {
            const cached = await cache.match(cacheKey);
            if (cached) {
                console.log("[CACHE] Respuesta servida desde caché");
                return cached;
            }
        } catch (e) {
            console.log("[CACHE] Error leyendo caché:", e.message);
        }
    }

    if (!keyword || keyword.trim().length === 0) {
        return new Response(
            JSON.stringify({ error: "El parámetro 'keyword' es obligatorio", items: [] }, null, 2),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    const baseParams = {
        page_size: "20",
        page_no: "1",
        keyword: keyword.trim()
    };

    const METHOD_HOT = "aliexpress.affiliate.hotproduct.query";
    const METHOD_NORMAL = "aliexpress.affiliate.product.query";

    const primaryMethod = hot ? METHOD_HOT : METHOD_NORMAL;
    console.log("[ALIEXPRESS] Método primario:", primaryMethod);

    let apiResponse;

    // 2) Llamada principal protegida
    try {
        apiResponse = await callAliExpressApi(primaryMethod, baseParams, env);
    } catch (e) {
        console.log("[ALIEXPRESS] EXCEPCIÓN en llamada principal:", e.message);
        return new Response(JSON.stringify({ items: [] }, null, 2), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });
    }

    console.log("[ALIEXPRESS] Respuesta primario:");
    console.log(JSON.stringify(apiResponse, null, 2));

    const hasError =
        !apiResponse ||
        apiResponse.error_response ||
        !(
            apiResponse.aliexpress_affiliate_hotproduct_query_response ||
            apiResponse.aliexpress_affiliate_product_query_response
        );

    // 3) Fallback protegido
    if (hasError && hot) {
        console.log("[FALLBACK] Hot falló. Probando búsqueda normal…");

        try {
            apiResponse = await callAliExpressApi(METHOD_NORMAL, baseParams, env);
        } catch (e) {
            console.log("[ALIEXPRESS] EXCEPCIÓN en fallback:", e.message);
            return new Response(JSON.stringify({ items: [] }, null, 2), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            });
        }

        console.log("[ALIEXPRESS] Respuesta fallback:");
        console.log(JSON.stringify(apiResponse, null, 2));
    }

    // 4) Si sigue fallando → devolver vacío
    if (!apiResponse || apiResponse.error_response) {
        console.log("[ALIEXPRESS] Error final. Devolviendo vacío.");
        return new Response(JSON.stringify({ items: [] }, null, 2), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });
    }

    // 5) Extraer productos de forma segura
    const responseData =
        apiResponse.aliexpress_affiliate_product_query_response ||
        apiResponse.aliexpress_affiliate_hotproduct_query_response ||
        apiResponse;

    const items =
        responseData?.resp_result?.result?.products ||
        responseData?.result?.products ||
        [];

    console.log("[ALIEXPRESS] Productos encontrados:", items.length);

    if (!Array.isArray(items) || items.length === 0) {
        return new Response(JSON.stringify({ items: [] }, null, 2), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });
    }

    const cleaned = items
        .map((p) => ({
            id: p.product_id || null,
            title: p.product_title || "Sin título",
            image: p.product_main_image_url || "",
            price: p.target_sale_price || 0,
            original_price: p.target_original_price || 0,
            rating: p.evaluate_rate || 0,
            url: cleanAliUrl(p.product_detail_url)
        }))
        .filter((item) => item.id);

    console.log("[ALIEXPRESS] Productos procesados:", cleaned.length);

    const response = new Response(JSON.stringify({ items: cleaned }, null, 2), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=600"
        }
    });

    // 6) Guardar en caché
    if (cache) {
        try {
            context.waitUntil(cache.put(cacheKey, response.clone()));
        } catch (e) {
            console.log("[CACHE] Error guardando en caché:", e.message);
        }
    }

    return response;
}
