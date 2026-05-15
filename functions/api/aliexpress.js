import { corsHeaders, handleOptions } from "../utils/cors.js";
import { parseAliExpressItem } from "../utils/parseAliExpress.js";
import { callAliExpressApi } from "../utils/aliApi.js";

/**
 * Limpia URLs de AliExpress para obtener SIEMPRE la URL REAL del producto
 */
function cleanAliUrl(url) {
    if (!url) return "";
    
    // 1) Soporte para URLs acortadas o redirecciones (intentamos extraer el ID si está presente)
    const idMatch = url.match(/\/item\/(\d+)\.html/) || 
                    url.match(/_object_id%3A(\d+)/) || 
                    url.match(/_object_id=(\d+)/) ||
                    url.match(/[?&]productId=(\d+)/);
                    
    if (idMatch && idMatch[1]) {
        return `https://www.aliexpress.com/item/${idMatch[1]}.html`;
    }

    // 2) Si es una URL de s.click.aliexpress.com o similar, no podemos limpiarla fácilmente sin fetch
    if (url.includes('s.click.aliexpress.com')) return url;

    // 3) Último recurso: quitar parámetros de tracking pero mantener la base
    try {
        const urlObj = new URL(url);
        return `${urlObj.origin}${urlObj.pathname}`;
    } catch (e) {
        return url.split("?")[0];
    }
}

/**
 * Añade parámetros de tracking a una URL de AliExpress de forma segura
 */
function appendTrackingParams(url, trackingId) {
    if (!url) return "";
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}aff_id=${trackingId}&aff_fcid=default&aff_platform=portals-tool&sk=${trackingId}`;
}

/**
 * Endpoint /api/aliexpress
 * API oficial de AliExpress Affiliates (Portals)
 */
export async function onRequest(context) {
    const { request, env } = context;

    // Manejar preflight CORS
    const optionsResponse = handleOptions(request);
    if (optionsResponse) return optionsResponse;

    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword") || "smart home";
    const isHot = url.searchParams.get("hot") === "true";

    // Priorizar Tracking ID de entorno, fallback al hardcoded
    const TRACKING_ID = env.ALI_TRACKING_ID || "Domotech_2026";

    console.log(`%c[ALIEXPRESS API] Buscando: ${keyword}...`, "color: #4ea1ff; font-weight: bold;");

    try {
        let items = [];

        // 1) Hot Products (Alta comisión y calidad)
        if (isHot) {
            const hotRes = await callAliExpressApi(
                "aliexpress.affiliate.hotproduct.query",
                {
                    keywords: keyword,
                    tracking_id: TRACKING_ID,
                    platform_product_all: "true",
                    page_size: "20",
                },
                env
            );

            const result = hotRes.aliexpress_affiliate_hotproduct_query_response?.resp_result?.result;

            if (result?.products) {
                items = result.products.map((p) => ({
                    item_id: p.product_id,
                    title: p.product_title,
                    price: p.target_sale_price || p.target_original_price,
                    sale_price: p.target_sale_price,
                    original_price: p.target_original_price,
                    image_url: p.product_main_image_url,
                    product_url: cleanAliUrl(p.promotion_link || p.product_detail_url),
                    rating: p.evaluate_rate,
                    sales: p.last_thirty_days_relevant_shelf_commission || 0,
                    commission: p.commission_rate,
                    is_hot: true,
                }));
            }
        }

        // 2) Búsqueda estándar (Filtrada por calidad)
        if (items.length === 0) {
            const searchRes = await callAliExpressApi(
                "aliexpress.affiliate.product.query",
                {
                    keywords: keyword,
                    tracking_id: TRACKING_ID,
                    page_size: "20",
                    sort: "LAST_VOLUME_DESC",
                    min_item_price: '5', // ~5.00 USD/EUR (Evitar morralla extrema)
                    delivery_days: '10'    // Priorizar envío rápido
                },
                env
            );

            const result = searchRes.aliexpress_affiliate_product_query_response?.resp_result?.result;

            if (result?.products) {
                // Filtrar por rating mínimo de 4.0 para asegurar "Mejor Calidad"
                items = result.products
                    .filter(p => !p.evaluate_rate || parseFloat(p.evaluate_rate) >= 4.0)
                    .map((p) => ({
                        item_id: p.product_id,
                        title: p.product_title,
                        price: p.target_sale_price || p.target_original_price,
                        sale_price: p.target_sale_price,
                        original_price: p.target_original_price,
                        image_url: p.product_main_image_url,
                        product_url: cleanAliUrl(p.product_detail_url),
                        rating: p.evaluate_rate,
                        sales: p.last_thirty_days_relevant_shelf_commission || 0,
                        commission: p.commission_rate,
                    }));
            }
        }

        // 3) Generar enlaces oficiales con tracking Portals
        if (items.length > 0) {
            const productUrls = items.map((item) => item.product_url).join(",");

            try {
                const linkRes = await callAliExpressApi(
                    "aliexpress.affiliate.link.generate",
                    {
                        promotion_link_type: "0",
                        source_values: productUrls,
                        tracking_id: TRACKING_ID,
                    },
                    env
                );

                const promotionLinks = linkRes.aliexpress_affiliate_link_generate_response?.resp_result?.result?.promotion_links?.promotion_link;

                items = items.map((item, index) => {
                    const officialLink = promotionLinks?.[index]?.promotion_link;
                    // Si no hay link oficial, usamos fallback manual
                    item.promotion_link = officialLink || appendTrackingParams(item.product_url, TRACKING_ID);
                    return parseAliExpressItem(item);
                });
            } catch (err) {
                console.error("Error generando enlaces oficiales:", err);
                items = items.map((item) => {
                    item.promotion_link = appendTrackingParams(item.product_url, TRACKING_ID);
                    return parseAliExpressItem(item);
                });
            }
        }

        console.log(`%c[ALIEXPRESS API] Éxito: ${items.length} productos procesados ✔`, "color: #00c853; font-weight: bold;");

        return new Response(JSON.stringify({ result: { items } }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error en AliExpress API:", error);

        return new Response(
            JSON.stringify({
                error: "Error en AliExpress Official API",
                details: error.message,
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
}
