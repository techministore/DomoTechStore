import { callAliExpressApi } from "../utils/aliApi.js";
import { cleanAliUrl } from "../utils/cleanUrl.js";

/**
 * Endpoint /aliexpress/index.js (Cloudflare Functions)
 * Versión optimizada y corregida según requerimientos de Portals
 */
export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    const keyword = url.searchParams.get("keyword") || "smart home";
    const hot = url.searchParams.get("hot") === "true";

    // Validación de keyword
    if (!keyword || keyword.trim().length === 0) {
        return new Response(
            JSON.stringify({
                error: "El parámetro 'keyword' es obligatorio",
                items: []
            }, null, 2),
            {
                status: 400,
                headers: { "Content-Type": "application/json" }
            }
        );
    }

    const TRACKING_ID = env.ALI_TRACKING_ID || "Domotech_2026";

    // Parámetros mínimos requeridos por AliExpress Portals IOP
    const baseParams = {
        page_size: "20",
        page_no: "1"
    };

    let apiResponse;

    try {
        const method = hot ? "aliexpress.affiliate.hotproduct.query" : "aliexpress.affiliate.product.query";
        
        if (hot) {
            apiResponse = await callAliExpressApi(
                method,
                {
                    ...baseParams,
                    keyword: keyword.trim(),
                    platform_product_all: "true"
                },
                env
            );
        } else {
            apiResponse = await callAliExpressApi(
                method,
                {
                    ...baseParams,
                    keyword: keyword.trim(),
                    sort: "LAST_VOLUME_DESC"
                },
                env
            );
        }

        // Validar que apiResponse existe
        if (!apiResponse) {
            throw new Error("No response from AliExpress API");
        }

        // Si la API devuelve un error explícito (validación temprana)
        if (apiResponse?.error_response?.msg || apiResponse?.code === 20000) {
            console.error("AliExpress API Error:", apiResponse);
            return new Response(
                JSON.stringify(
                    {
                        error:
                            apiResponse?.error_response?.msg ||
                            apiResponse?.msg ||
                            "Error en API AliExpress",
                        details: apiResponse,
                        items: []
                    },
                    null,
                    2
                ),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        // Navegar por la estructura de respuesta de AliExpress
        const responseData =
            apiResponse?.aliexpress_affiliate_hotproduct_query_response ||
            apiResponse?.aliexpress_affiliate_product_query_response ||
            apiResponse;

        const items =
            responseData?.resp_result?.result?.products ||
            responseData?.result?.products ||
            responseData?.products ||
            apiResponse?.items ||
            [];

        // Validar que items es un array válido
        if (!Array.isArray(items) || items.length === 0) {
            return new Response(
                JSON.stringify({ items: [] }, null, 2),
                {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                }
            );
        }

        // Limpieza de URLs y mapeo de campos con validación
        const cleaned = items.map((p) => ({
            id: p.product_id || null,
            title: p.product_title || "Sin título",
            image: p.product_main_image_url || "",
            price: p.target_sale_price || 0,
            original_price: p.target_original_price || 0,
            rating: p.evaluate_rate || 0,
            url: cleanAliUrl(p.product_detail_url)
        })).filter(item => item.id); // Filtrar items sin ID válido

        return new Response(JSON.stringify({ items: cleaned }, null, 2), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });
    } catch (error) {
        console.error("Function error:", error);
        return new Response(
            JSON.stringify({
                error: error.message || "Error processing request",
                items: []
            }, null, 2),
            {
                status: 500,
                headers: { "Content-Type": "application/json" }
            }
        );
    }
}
