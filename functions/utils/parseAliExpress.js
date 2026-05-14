/**
 * Utilidad para normalizar los datos de la API de AliExpress
 */
export function parseAliExpressItem(item) {
    return {
        id: item.item_id,
        title: item.title,
        price: item.sale_price || item.price,
        image: item.image_url 
            || item.product_main_image_url 
            || item.image 
            || item.product_small_image_urls?.[0],
        link: item.promotion_link || item.product_url,
        shop: "AliExpress"
    };
}

/**
 * Utilidad para normalizar los datos de Amazon
 */
export function parseAmazonItem(item) {
    return {
        id: item.ASIN || item.id,
        title: item.Title || item.title,
        price: item.Price || item.price,
        image: item.ImageUrl || item.image,
        link: item.DetailPageURL || item.link,
        shop: "Amazon"
    };
}

/**
 * Utilidad para normalizar los datos de Banggood
 */
export function parseBanggoodItem(item) {
    return {
        id: item.product_id,
        title: item.product_name,
        price: item.price,
        image: item.product_image,
        link: item.product_url,
        shop: "Banggood"
    };
}
