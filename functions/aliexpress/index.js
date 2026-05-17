import { callAliExpressApi } from "../../utils/aliApi.js";
import { cleanAliUrl } from "../../utils/cleanUrl.js";

/**
 * Endpoint /aliexpress/index.js (Cloudflare Functions)
 * Versión optimizada y corregida según requerimientos de Portals
 */
export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    const keyword = url.searchParams.get("keyword") || "smart home";
    const hot = url.searchParams.get("hot") === "true";

    const TRACKING_ID = env.ALI_TRACKING_ID || "Domotech_2026";

    // Parámetros comunes obligatorios exigidos por AliExpress
    const baseParams = {
        category_id: "0",
        fields: "product_id,product_title,product_main_image_url,target_sale_price,target_original_price,evaluate_rate,last_thirty_days_relevant_shelf_commission,commission_rate,product_detail_url",
        target_currency: "EUR",
        target_language: "es",
        country: "ES",
        page_size: "20",
        tracking_id: TRACKING_ID
    };

    let apiResponse;

    try {
        if (hot) {
            apiResponse = await callAliExpressApi(
                "aliexpress.affiliate.hotproduct.query",
                {
                    ...baseParams,
                    keywords: keyword,
                    platform_product_all: "true"
                },
                env
            );
        } else {
            apiResponse = await callAliExpressApi(
                "aliexpress.affiliate.product.query",
                {
                    ...baseParams,
                    keywords: keyword,
                    sort: "LAST_VOLUME_DESC"
                },
                env
            );
        }

        // Navegar por la estructura de respuesta de AliExpress
        const responseData = apiResponse?.aliexpress_affiliate_hotproduct_query_response || apiResponse?.aliexpress_affiliate_product_query_response;
        const items = responseData?.resp_result?.result?.products || [];

        // Limpieza de URLs y mapeo de campos
        const cleaned = items.map(p => ({
            id: p.product_id,
            title: p.product_title,
            image: p.product_main_image_url,
            price: p.target_sale_price,
            original_price: p.target_original_price,
            rating: p.evaluate_rate,
            commission: p.commission_rate,
            url: cleanAliUrl(p.product_detail_url)
        }));

        return new Response(JSON.stringify({ items: cleaned }, null, 2), {
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message, items: [] }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
