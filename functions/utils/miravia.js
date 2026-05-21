/**
 * Utilidad para el manejo de enlaces de Miravia y afiliación vía Awin
 */

// Configuración de Awin (IDs temporales hasta aprobación)
const AWIN_CONFIG = {
    MIRAVIA_MID: "30521", // ID real de Miravia en Awin España (ejemplo común)
    AFFID: "1636287"      // Tu ID de afiliado (ejemplo, cámbialo cuando tengas el tuyo)
};

/**
 * Limpia las URLs de Miravia eliminando parámetros innecesarios
 */
export function normalizeMiraviaUrl(url) {
    if (!url) return "";
    try {
        const u = new URL(url);
        // Mantener solo el path limpio
        return `${u.origin}${u.pathname}`;
    } catch (e) {
        return url;
    }
}

/**
 * Genera un enlace de afiliado de Awin para una URL de Miravia
 */
export function generateMiraviaAffiliateLink(url) {
    if (!url) return "";
    
    const cleanUrl = normalizeMiraviaUrl(url);
    
    // Formato de enlace profundo (Deep Link) de Awin
    // Estructura: https://www.awin1.com/cread.php?awinmid={MID}&awinaffid={AFFID}&ued={URL_DESTINO}
    return `https://www.awin1.com/cread.php?awinmid=${AWIN_CONFIG.MIRAVIA_MID}&awinaffid=${AWIN_CONFIG.AFFID}&ued=${encodeURIComponent(cleanUrl)}`;
}

/**
 * Genera una URL de búsqueda en Miravia
 */
export function getMiraviaSearchUrl(keyword) {
    if (!keyword) return "https://www.miravia.es/";
    return `https://www.miravia.es/search?q=${encodeURIComponent(keyword)}`;
}
