/**
 * Utilidad para normalizar los datos de la API de AliExpress
 * Maneja múltiples variantes de nombres de campos de la API de Portals
 */
export function parseAliExpressItem(item) {
    if (!item) return null;

    // 1. Extraer ID (campo crítico)
    const id = item.product_id || item.item_id || item.id || (item.product_detail_url ? item.product_detail_url.match(/(\d+)\.html/)?.[1] : null);

    // 2. Extraer Título
    const title = item.product_title || item.title || "Producto de AliExpress";

    // 3. Extraer Precios (con fallback a 0)
    const price = item.target_sale_price || item.sale_price || item.price || 0;
    const oldPrice = item.target_original_price || item.original_price || item.old_price || null;

    // 4. Extraer Imagen (múltiples fallbacks)
    const image = item.product_main_image_url || item.image_url || item.image || (item.product_small_image_urls && item.product_small_image_urls[0]) || "";

    // 5. Extraer Enlace
    const link = item.product_detail_url || item.promotion_link || item.product_url || item.link || "";

    return {
        id,
        title,
        price,
        old_price: oldPrice,
        image,
        link,
        shop: "AliExpress",
        rating: item.evaluate_rate || item.rating || null,
        sales: item.last_thirty_days_relevant_shelf_commission || item.sales || 0
    };
}

/**
 * Utilidad para normalizar los datos de Amazon
 */
export function parseAmazonItem(item) {
    const finalPrice = item.Price || item.price;
    const finalImage = item.ImageUrl || item.image;
    const finalLink = item.DetailPageURL || item.link;

    return {
        id: item.ASIN || item.id,
        title: item.Title || item.title,
        price: finalPrice,
        image: finalImage,
        link: finalLink,
        shop: "Amazon"
    };
}

/**
 * Utilidad para normalizar los datos de Banggood
 */
export function parseBanggoodItem(item) {
    const finalPrice = item.price;
    const finalImage = item.product_image || item.image;
    const finalLink = item.product_url || item.link;

    return {
        id: item.product_id || item.id,
        title: item.product_name || item.title,
        price: finalPrice,
        image: finalImage,
        link: finalLink,
        shop: "Banggood"
    };
}
