/**
 * Utilidad para normalizar los datos de la API de AliExpress
 * Maneja múltiples variantes de nombres de campos de la API de Portals
 */
export function parseAliExpressItem(item) {
    if (!item || typeof item !== 'object') {
        return null;
    }

    // 1. Extraer ID (campo crítico)
    const id = item.product_id || item.item_id || item.id || (item.product_detail_url ? item.product_detail_url.match(/(\d+)\.html/)?.[1] : null);

    if (!id) {
        return null; // Rechazar items sin ID
    }

    // 2. Extraer Título
    const title = item.product_title || item.title || 'Producto de AliExpress';

    // 3. Extraer Precios (convertir a número)
    const price = parseFloat(item.target_sale_price || item.sale_price || item.price || 0);
    const oldPrice = item.target_original_price || item.original_price || item.old_price ? parseFloat(item.target_original_price || item.original_price || item.old_price) : null;

    // 4. Extraer Imagen (múltiples fallbacks)
    const image = item.product_main_image_url || item.image_url || item.image || (item.product_small_image_urls && item.product_small_image_urls[0]) || '';

    // 5. Extraer Enlace
    const link = item.product_detail_url || item.promotion_link || item.product_url || item.link || '';

    return {
        id: String(id),
        title: String(title),
        price: isNaN(price) ? 0 : price,
        old_price: oldPrice && !isNaN(oldPrice) ? oldPrice : null,
        image: String(image),
        link: String(link),
        shop: 'AliExpress',
        rating: item.evaluate_rate || item.rating || null,
        sales: parseInt(item.last_thirty_days_relevant_shelf_commission || item.sales || 0, 10)
    };
}

/**
 * Utilidad para normalizar los datos de Amazon
 */
export function parseAmazonItem(item) {
    if (!item || typeof item !== 'object') {
        return null;
    }

    const finalPrice = item.Price || item.price;
    const finalImage = item.ImageUrl || item.image;
    const finalLink = item.DetailPageURL || item.link;

    return {
        id: item.ASIN || item.id,
        title: item.Title || item.title || 'Producto de Amazon',
        price: parseFloat(finalPrice || 0),
        image: finalImage || '',
        link: finalLink || '',
        shop: 'Amazon'
    };
}

/**
 * Utilidad para normalizar los datos de Banggood
 */
export function parseBanggoodItem(item) {
    if (!item || typeof item !== 'object') {
        return null;
    }

    const finalPrice = item.price;
    const finalImage = item.product_image || item.image;
    const finalLink = item.product_url || item.link;

    return {
        id: item.product_id || item.id,
        title: item.product_name || item.title || 'Producto de Banggood',
        price: parseFloat(finalPrice || 0),
        image: finalImage || '',
        link: finalLink || '',
        shop: 'Banggood'
    };
}
