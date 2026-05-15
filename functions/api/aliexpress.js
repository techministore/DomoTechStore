import { corsHeaders, handleOptions } from "../utils/cors.js";
import { parseAliExpressItem } from "../utils/parseAliExpress.js";
import { callAliExpressApi } from "../utils/aliApi.js";

/**
 * Endpoint /api/aliexpress
 * Migrado a la API oficial de AliExpress Affiliates (Portals)
 */

export async function onRequest(context) {
    const { request, env } = context;
    
    // Manejar preflight CORS
    const optionsResponse = handleOptions(request);
    if (optionsResponse) return optionsResponse;

    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword') || 'smart home';
    const isHot = url.searchParams.get('hot') === 'true'; // Para forzar productos de alta comisión

    const TRACKING_ID = "Domotech_2026";

    try {
        let items = [];
        
        if (isHot) {
            // 1. OPCIÓN A: Buscar "Hot Products" (Alta Comisión - Requiere Advanced API)
            const hotRes = await callAliExpressApi("aliexpress.affiliate.hotproduct.query", {
                keywords: keyword,
                tracking_id: TRACKING_ID,
                platform_product_all: 'true',
                page_size: '20'
            }, env);

            const result = hotRes.aliexpress_affiliate_hotproduct_query_response?.resp_result?.result;
            if (result && result.products) {
                items = result.products.map(p => ({
                    item_id: p.product_id,
                    title: p.product_title,
                    price: p.target_sale_price || p.target_original_price,
                    image_url: p.product_main_image_url,
                    product_url: p.promotion_link, // El hot product ya suele venir con el link de promo
                    rating: p.evaluate_rate,
                    sales: p.last_thirty_days_relevant_shelf_commission || 0,
                    commission: p.commission_rate,
                    is_hot: true
                }));
            }
        }

        // 2. OPCIÓN B: Búsqueda Estándar (Si no hay hot products o no se solicitó)
        if (items.length === 0) {
            const searchRes = await callAliExpressApi("aliexpress.affiliate.product.query", {
                keywords: keyword,
                tracking_id: TRACKING_ID,
                page_size: '20',
                sort: 'LAST_VOLUME_DESC' // Priorizar los más vendidos
            }, env);

            const result = searchRes.aliexpress_affiliate_product_query_response?.resp_result?.result;
            if (result && result.products) {
                items = result.products.map(p => ({
                    item_id: p.product_id,
                    title: p.product_title,
                    price: p.target_sale_price || p.target_original_price,
                    image_url: p.product_main_image_url,
                    product_url: p.product_detail_url,
                    rating: p.evaluate_rate,
                    sales: p.last_thirty_days_relevant_shelf_commission || 0,
                    commission: p.commission_rate
                }));
            }
        }

        // 3. Generar enlaces de seguimiento OFICIALES usando aliexpress.affiliate.link.generate
        if (items.length > 0) {
            const productUrls = items.map(item => item.product_url).join(',');
            
            try {
                const linkRes = await callAliExpressApi("aliexpress.affiliate.link.generate", {
                    promotion_link_type: '0', // 0 para enlaces de producto
                    source_values: productUrls,
                    tracking_id: TRACKING_ID
                }, env);

                const promotionLinks = linkRes.aliexpress_affiliate_link_generate_response?.resp_result?.result?.promotion_links?.promotion_link;
                
                if (promotionLinks && promotionLinks.length > 0) {
                    items = items.map((item, index) => {
                        const officialLink = promotionLinks[index]?.promotion_link;
                        item.promotion_link = officialLink || item.product_url;
                        return parseAliExpressItem(item);
                    });
                } else {
                    // Fallback manual si falla la generación oficial (mejor que nada)
                    items = items.map(item => {
                        const cleanUrl = item.product_url.split('?')[0];
                        item.promotion_link = `${cleanUrl}?aff_id=${TRACKING_ID}&aff_fcid=default`;
                        return parseAliExpressItem(item);
                    });
                }
            } catch (linkErr) {
                console.error("Error generando enlaces oficiales:", linkErr);
                // Fallback manual
                items = items.map(item => {
                    const cleanUrl = item.product_url.split('?')[0];
                    item.promotion_link = `${cleanUrl}?aff_id=${TRACKING_ID}&aff_fcid=default`;
                    return parseAliExpressItem(item);
                });
            }
        }

        return new Response(JSON.stringify({ result: { items } }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: "Error en AliExpress Official API", details: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
}
