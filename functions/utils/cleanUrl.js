/**
 * Utilidad simplificada para limpiar URLs de AliExpress
 */
export function cleanAliUrl(url) {
    if (!url) return "";
    return url
        .replace(/\.html.*/, ".html")
        .replace(/\?.*/, "")
        .replace(/\/\?.*/, "")
        .trim();
}
