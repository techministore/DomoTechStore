/**
 * DomoTechStore - Banggood Affiliate API Worker (CORREGIDO)
 * ✅ Implementación según documentación oficial de Banggood
 * 
 * ENDPOINTS:
 * - https://affapi.banggood.com/getAccessToken
 * - https://affapi.banggood.com/product/list
 * - https://affapi.banggood.com/coupon/list
 * - https://affapi.banggood.com/product/detail
 * - https://affapi.banggood.com/newproduct/list
 * - https://affapi.banggood.com/countries/list
 * 
 * FIRMA CORRECTA:
 * 1. Ordenar SOLO parámetros enviados (api_key, noncestr, timestamp)
 * 2. queryString = key1=val1&key2=val2...
 * 3. fullString = queryString + "&api_secret=" + api_secret
 * 4. signature = MD5(fullString)
 */

// ============================================================================
// 🔐 UTILIDADES DE FIRMA (MD5 REAL)
// ============================================================================

async function md5(str) {
    const data = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest("MD5", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Genera firma para autenticación de Banggood
 */
async function generateBanggoodSignature(params, apiSecret) {
    try {
        // 1. Ordenar SOLO los parámetros enviados
        const sortedKeys = Object.keys(params).sort();

        // 2. Construir query string
        const queryString = sortedKeys
            .map(key => `${key}=${params[key]}`)
            .join("&");

        // 3. Agregar api_secret al final (NO se ordena)
        const fullString = `${queryString}&api_secret=${apiSecret}`;

        const signature = await md5(fullString);

        console.log("[SIGNATURE] String:", fullString);
        console.log("[SIGNATURE] MD5:", signature);

        return signature;
    } catch (e) {
        console.error("[SIGNATURE] Error:", e);
        return null;
    }
}

// ============================================================================
// 🔐 OBTENER ACCESS TOKEN
// ============================================================================

async function getAccessToken(apiKey, apiSecret) {
    try {
        console.log("[AUTH] Obteniendo access token...");

        const params = {
            api_key: apiKey,
            noncestr: Math.random().toString(36).substring(2, 15),
            timestamp: Math.floor(Date.now() / 1000)
        };

        const signature = await generateBanggoodSignature(params, apiSecret);
        if (!signature) throw new Error("Error generando firma");

        params.signature = signature;

        const query = new URLSearchParams(params);
        const url = `https://affapi.banggood.com/getAccessToken?${query.toString()}`;

        console.log("[AUTH] URL:", url);

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "User-Agent": "DomoTechStore/2.0"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.code === 200 && data.result?.access_token) {
            console.log("[AUTH] ✅ Token obtenido:", data.result.access_token.substring(0, 10) + "...");
            return {
                token: data.result.access_token,
                expiresIn: data.result.expires_in,
                code: data.code
            };
        } else {
            console.error("[AUTH] Error:", data);
            return null;
        }
    } catch (e) {
        console.error("[AUTH] Error:", e);
        return null;
    }
}

// ============================================================================
// 🔍 PRODUCTOS
// ============================================================================

async function searchProducts(accessToken, keyword, options = {}) {
    try {
        console.log("[SEARCH] Buscando:", keyword);

        const params = {
            keyword: keyword,
            category_id: options.category_id || 0,
            page: options.page || 1,
            lang: options.lang || "es-ES",
            currency: options.currency || "EUR",
            warehouse: options.warehouse || "CN"
        };

        const query = new URLSearchParams(params);
        const url = `https://affapi.banggood.com/product/list?${query.toString()}`;

        console.log("[SEARCH] URL:", url);

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "access-token": accessToken,
                "User-Agent": "DomoTechStore/2.0"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.code === 0 && data.data?.product_list) {
            console.log("[SEARCH] ✅ Productos encontrados:", data.data.product_list.length);
            return {
                products: data.data.product_list,
                pageTotal: data.data.page_total,
                code: data.code
            };
        } else {
            console.warn("[SEARCH] No hay resultados:", data);
            return {
                products: [],
                pageTotal: 0,
                code: data.code || -1
            };
        }
    } catch (e) {
        console.error("[SEARCH] Error:", e);
        return {
            products: [],
            pageTotal: 0,
            error: e.message
        };
    }
}

// ============================================================================
// 🎟️ CUPONES
// ============================================================================

async function getCoupons(accessToken, options = {}) {
    try {
        console.log("[COUPONS] Obteniendo lista de cupones...");

        const params = {
            category_id: options.category_id || 0,
            type: options.type || 2,
            page: options.page || 1,
            lang: options.lang || "es-ES"
        };

        const query = new URLSearchParams(params);
        const url = `https://affapi.banggood.com/coupon/list?${query.toString()}`;

        console.log("[COUPONS] URL:", url);

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "access-token": accessToken,
                "User-Agent": "DomoTechStore/2.0"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.code === 0 && data.data?.coupon_list) {
            console.log("[COUPONS] ✅ Cupones encontrados:", data.data.coupon_list.length);
            return {
                coupons: data.data.coupon_list,
                pageTotal: data.data.page_total,
                code: data.code
            };
        } else {
            console.warn("[COUPONS] No hay cupones:", data);
            return {
                coupons: [],
                pageTotal: 0,
                code: data.code || -1
            };
        }
    } catch (e) {
        console.error("[COUPONS] Error:", e);
        return {
            coupons: [],
            pageTotal: 0,
            error: e.message
        };
    }
}

// ============================================================================
// 📦 DETALLE PRODUCTO
// ============================================================================

async function getProductDetail(accessToken, productId, options = {}) {
    try {
        console.log("[DETAIL] Obteniendo detalles del producto:", productId);

        const params = {
            product_id: productId,
            lang: options.lang || "es-ES",
            currency: options.currency || "EUR"
        };

        const query = new URLSearchParams(params);
        const url = `https://affapi.banggood.com/product/detail?${query.toString()}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "access-token": accessToken,
                "User-Agent": "DomoTechStore/2.0"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.code === 0) {
            console.log("[DETAIL] ✅ Detalles obtenidos");
            return {
                product: data.data,
                code: data.code
            };
        } else {
            console.warn("[DETAIL] Error:", data);
            return {
                product: null,
                code: data.code || -1
            };
        }
    } catch (e) {
        console.error("[DETAIL] Error:", e);
        return {
            product: null,
            error: e.message
        };
    }
}

// ============================================================================
// 🌐 CLOUDFLARE WORKER HANDLER
// ============================================================================

export async function onRequest(context) {
    try {
        const { request, env } = context;
        const url = new URL(request.url);
        const action = url.searchParams.get("action") || "search";

        const APP_KEY = env.BANGGOOD_APP_KEY;
        const APP_SECRET = env.BANGGOOD_APP_SECRET;

        if (!APP_KEY || !APP_SECRET) {
            return new Response(JSON.stringify({
                code: -1,
                error: "Missing credentials",
                message: "BANGGOOD_APP_KEY or BANGGOOD_APP_SECRET not configured"
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        console.log("[WORKER] Action:", action);
        console.log("[WORKER] API Key:", APP_KEY.substring(0, 5) + "...");

        // 1️⃣ Obtener token
        const authResult = await getAccessToken(APP_KEY, APP_SECRET);
        if (!authResult || !authResult.token) {
            return new Response(JSON.stringify({
                code: -1,
                error: "Authentication failed",
                message: "Could not obtain access token from Banggood"
            }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
            });
        }

        const accessToken = authResult.token;
        console.log("[WORKER] ✅ Token obtenido, durará", authResult.expiresIn, "segundos");

        // 2️⃣ Ejecutar acción
        let result;

        if (action === "search") {
            const keyword = url.searchParams.get("q") || "smart home";
            const page = url.searchParams.get("page") || 1;

            result = await searchProducts(accessToken, keyword, {
                page: page,
                category_id: url.searchParams.get("category_id"),
                lang: url.searchParams.get("lang") || "es-ES",
                currency: url.searchParams.get("currency") || "EUR"
            });

        } else if (action === "coupons") {
            result = await getCoupons(accessToken, {
                category_id: url.searchParams.get("category_id"),
                type: url.searchParams.get("type") || 2,
                page: url.searchParams.get("page") || 1
            });

        } else if (action === "detail") {
            const productId = url.searchParams.get("product_id");
            if (!productId) {
                return new Response(JSON.stringify({
                    code: -1,
                    error: "Missing product_id parameter"
                }), {
                    status: 400,
                    headers: { "Content-Type": "application/json" }
                });
            }

            result = await getProductDetail(accessToken, productId);

        } else {
            return new Response(JSON.stringify({
                code: -1,
                error: "Unknown action",
                message: "Use action=search, action=coupons, or action=detail"
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify(result), {
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=3600"
            }
        });

    } catch (err) {
        console.error("[WORKER] Error:", err);
        return new Response(JSON.stringify({
            code: -1,
            error: err.message,
            message: "Worker error"
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
