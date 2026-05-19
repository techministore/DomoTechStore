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

    // Parámetros comunes obligatorios exigidos por AliExpress
    const baseParams = {
        fields: "product_id,product_title,product_main_image_url,target_sale_price,target_original_price,evaluate_rate,product_detail_url",
        target_currency: "EUR",
        target_language: "es",
        country: "ES",
        page_size: "20",
        tracking_id: TRACKING_ID.toLowerCase().replace(/[^a-z0-9]/g, "")
    };

    let apiResponse;

    try {
        const method = hot
            ? "aliexpress.affiliate.hotproduct.query"
            : "aliexpress.affiliate.product.query";

        // Parámetros finales enviados a la API
        const params = {
            ...baseParams,
            keywords: keyword.trim()
        };

        apiResponse = await callAliExpressApi(method, params, env);

        // Validar que apiResponse existe
        if (!apiResponse) {
            throw new Error("No response from AliExpress API");
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

        // Si la API devuelve un error explícito
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

        // Limpieza de URLs y mapeo de campos
        const cleaned = items.map((p) => ({
            id: p.product_id,
            title: p.product_title,
            image: p.product_main_image_url,
            price: p.target_sale_price,
            original_price: p.target_original_price,
            rating: p.evaluate_rate,
            url: cleanAliUrl(p.product_detail_url)
        }));

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
