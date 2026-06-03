/**
 * Utilidad para limpiar URLs de AliExpress
 * @param {string} url - URL a limpiar
 * @returns {string} URL limpia o cadena vacía
 */
export function cleanAliUrl(url) {
    if (!url || typeof url !== 'string') {
        return '';
    }
    return url
        .replace(/\.html.*/, '.html')
        .replace(/\?.*/, '')
        .replace(/\/\?.*/, '')
        .trim();
}
