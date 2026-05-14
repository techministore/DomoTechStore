/**
 * Utilidad para normalizar los datos de la API de AliExpress
 */
export function parseAliExpressItem(item) {
    const finalPrice = item.sale_price || item.price;
    const finalImage = item.image_url || item.product_main_image_url || item.image || item.product_small_image_urls?.[0];
    const finalLink = item.promotion_link || item.product_url || item.link;

    return {
        id: item.item_id || item.id,
        title: item.title,
        price: finalPrice,
        image: finalImage,
        link: finalLink,
        shop: "AliExpress"
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
