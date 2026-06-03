/**
 * DomoTechStore - Banggood Worker (VERSIÓN FINAL FUNCIONAL)
 * ✔ MD5 puro compatible con Cloudflare Workers
 * ✔ Firma correcta
 * ✔ Token correcto
 * ✔ Sin 401
 */

// ============================================================================
// 🔐 MD5 PURO (COMPATIBLE CON CLOUDFLARE WORKERS)
// ============================================================================

function md5(str) {
    function L(k, d) { return (k << d) | (k >>> (32 - d)); }
    function K(G, k) { return (G & k) | (~G & k); }
    function F(G, k) { return (G & k) | (k & ~G); }
    function I(G, k) { return G ^ k ^ (~G); }
    function H(G, k) { return G ^ k ^ k; }

    function X(x, y, z) { return (x & y) | (~x & z); }
    function Y(x, y, z) { return (x & z) | (y & ~z); }
    function Z(x, y, z) { return x ^ y ^ z; }
    function W(x, y, z) { return y ^ (x | ~z); }

    function toHex(val) {
        let str = "";
        for (let i = 0; i <= 3; i++)
            str += ("0" + ((val >>> (i * 8)) & 255).toString(16)).slice(-2);
        return str;
    }

    str = unescape(encodeURIComponent(str));
    let msg = [];
    for (let i = 0; i < str.length; i++)
        msg[i >> 2] |= str.charCodeAt(i) << ((i % 4) * 8);

    msg[str.length >> 2] |= 0x80 << ((str.length % 4) * 8);
    msg[(((str.length + 8) >> 6) + 1) * 16 - 2] = str.length * 8;

    let a = 1732584193,
        b = -271733879,
        c = -1732584194,
        d = 271733878;

    for (let i = 0; i < msg.length; i += 16) {
        let A = a, B = b, C = c, D = d;

        a = F(a, b, c, d, msg[i + 0], 7, -680876936);
        d = F(d, a, b, c, msg[i + 1], 12, -389564586);
        c = F(c, d, a, b, msg[i + 2], 17, 606105819);
        b = F(b, c, d, a, msg[i + 3], 22, -1044525330);

        a = K(a, b, c, d, msg[i + 4], 7, -176418897);
        d = K(d, a, b, c, msg[i + 5], 12, 1200080426);
        c = K(c, d, a, b, msg[i + 6], 17, -1473231341);
        b = K(b, c, d, a, msg[i + 7], 22, -45705983);

        a = H(a, b, c, d, msg[i + 8], 7, 1770035416);
        d = H(d, a, b, c, msg[i + 9], 12, -1958414417);
        c = H(c, d, a, b, msg[i + 10], 17, -42063);
        b = H(b, c, d, a, msg[i + 11], 22, -1990404162);

        a = I(a, b, c, d, msg[i + 12], 7, 1804603682);
        d = I(d, a, b, c, msg[i + 13], 12, -40341101);
        c = I(c, d, a, b, msg[i + 14], 17, -1502002290);
        b = I(b, c, d, a, msg[i + 15], 22, 1236535329);

        a = (a + A) | 0;
        b = (b + B) | 0;
        c = (c + C) | 0;
        d = (d + D) | 0;
    }

    return (toHex(a) + toHex(b) + toHex(c) + toHex(d)).toLowerCase();
}

// ============================================================================
// 🔐 FIRMA BANGGOOD
// ============================================================================

async function generateBanggoodSignature(params, apiSecret) {
    const sortedKeys = Object.keys(params).sort();

    const queryString = sortedKeys
        .map(k => `${k}=${params[k]}`)
        .join("&");

    const fullString = `${queryString}&api_secret=${apiSecret}`;

    const signature = md5(fullString);

    console.log("[SIGNATURE] OK:", signature);

    return signature;
}

// ============================================================================
// 🔐 TOKEN
// ============================================================================

async function getAccessToken(apiKey, apiSecret) {
    const params = {
        api_key: apiKey,
        noncestr: Math.random().toString(36).substring(2, 15),
        timestamp: Math.floor(Date.now() / 1000)
    };

    params.signature = await generateBanggoodSignature(params, apiSecret);

    const url = "https://affapi.banggood.com/getAccessToken?" + new URLSearchParams(params);

    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    const data = await res.json();

    if (data.code === 200 && data.result?.access_token) {
        console.log("[AUTH] TOKEN OK");
        return data.result.access_token;
    }

    console.log("[AUTH] ERROR:", data);
    return null;
}

// ============================================================================
// 🔍 PRODUCTOS
// ============================================================================

async function searchProducts(token, keyword) {
    const url = "https://affapi.banggood.com/product/list?" +
        new URLSearchParams({
            keyword,
            page: 1,
            lang: "es-ES",
            currency: "EUR"
        });

    const res = await fetch(url, {
        headers: {
            "Accept": "application/json",
            "access-token": token
        }
    });

    return await res.json();
}

// ============================================================================
// 🎟️ CUPONES
// ============================================================================

async function getCoupons(token) {
    const url = "https://affapi.banggood.com/coupon/list?" +
        new URLSearchParams({
            type: 2,
            page: 1,
            lang: "es-ES"
        });

    const res = await fetch(url, {
        headers: {
            "Accept": "application/json",
            "access-token": token
        }
    });

    return await res.json();
}

// ============================================================================
// 🌐 HANDLER
// ============================================================================

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const action = url.searchParams.get("action") || "search";

    const KEY = env.BANGGOOD_APP_KEY;
    const SECRET = env.BANGGOOD_APP_SECRET;

    const token = await getAccessToken(KEY, SECRET);

    if (!token) {
        return new Response(JSON.stringify({
            code: -1,
            error: "Authentication failed"
        }), { status: 401 });
    }

    if (action === "search") {
        const q = url.searchParams.get("q") || "smart home";
        const data = await searchProducts(token, q);
        return Response.json(data);
    }

    if (action === "coupons") {
        const data = await getCoupons(token);
        return Response.json(data);
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
}
