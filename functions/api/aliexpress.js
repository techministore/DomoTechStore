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
                sort: 'LAST_VOLUME_DESC', // Priorizar los más vendidos
                min_item_price: '300', // Evitar morralla/accesorios baratos si buscamos productos reales (centavos)
                delivery_days: '10' // Priorizar entrega rápida si es posible
            }, env);

            const result = searchRes.aliexpress_affiliate_product_query_response?.resp_result?.result;
            if (result && result.products) {
                // Filtrar productos con rating bajo (menor a 4.0) para asegurar calidad
                items = result.products
                    .filter(p => !p.evaluate_rate || parseFloat(p.evaluate_rate) >= 4.0)
                    .map(p => ({
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
            // Limpiamos las URLs antes de enviarlas a la API de generación de links
            const productUrls = items.map(item => cleanAliUrl(item.product_url)).join(',');
            
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
                        const cleanUrl = cleanAliUrl(item.product_url);
                        item.promotion_link = `${cleanUrl}?aff_id=${TRACKING_ID}&aff_fcid=default`;
                        return parseAliExpressItem(item);
                    });
                }
            } catch (linkErr) {
                console.error("Error generando enlaces oficiales:", linkErr);
                // Fallback manual
                items = items.map(item => {
                    const cleanUrl = cleanAliUrl(item.product_url);
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

/**
 * Limpia la URL de AliExpress para asegurar que sea válida para la API de afiliados
 */
function cleanAliUrl(url) {
    if (!url) return "";
    
    // 1) Si ya es una URL de producto, la dejamos limpia
    const match = url.match(/\/item\/(\d+)\.html/);
    if (match) {
        return `https://www.aliexpress.com/item/${match[1]}.html`;
    }
    
    // 2) Si la URL contiene _object_id=ID, lo extraemos
    const idMatch = url.match(/_object_id%3A(\d+)/) || url.match(/_object_id=(\d+)/);
    if (idMatch) {
        return `https://www.aliexpress.com/item/${idMatch[1]}.html`;
    }
    
    // 3) Último recurso: quitar parámetros
    return url.split('?')[0];
}
