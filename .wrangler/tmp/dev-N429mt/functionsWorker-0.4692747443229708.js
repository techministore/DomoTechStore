var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/pages-mcgaK1/functionsWorker-0.4692747443229708.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
async function onRequest() {
  try {
    const categories = [
      {
        id: 1,
        name: "Iluminaci\xF3n Inteligente",
        nameEn: "Smart Lighting",
        slug: "lighting",
        icon: "\u{1F4A1}"
      },
      {
        id: 2,
        name: "Seguridad y Vigilancia",
        nameEn: "Security & Surveillance",
        slug: "security",
        icon: "\u{1F4F7}"
      },
      {
        id: 3,
        name: "Enchufes y Energ\xEDa",
        nameEn: "Plugs & Energy",
        slug: "plugs",
        icon: "\u{1F50C}"
      },
      {
        id: 4,
        name: "C\xE1maras WiFi",
        nameEn: "WiFi Cameras",
        slug: "cameras",
        icon: "\u{1F3A5}"
      },
      {
        id: 5,
        name: "Sensores y Automatizaci\xF3n",
        nameEn: "Sensors & Automation",
        slug: "sensors",
        icon: "\u{1F6E0}\uFE0F"
      },
      {
        id: 6,
        name: "Gaming y Setup",
        nameEn: "Gaming & Setup",
        slug: "gaming",
        icon: "\u{1F3AE}"
      },
      {
        id: 7,
        name: "Limpieza Inteligente",
        nameEn: "Smart Cleaning",
        slug: "cleaning",
        icon: "\u{1F9F9}"
      },
      {
        id: 8,
        name: "Cocina Inteligente",
        nameEn: "Smart Kitchen",
        slug: "kitchen",
        icon: "\u{1F373}"
      },
      {
        id: 9,
        name: "Climatizaci\xF3n Inteligente",
        nameEn: "Smart Climate",
        slug: "climate",
        icon: "\u2744\uFE0F"
      },
      {
        id: 10,
        name: "Electr\xF3nica y Gadgets",
        nameEn: "Electronics & Gadgets",
        slug: "electronics",
        icon: "\u{1F4F1}"
      }
    ];
    return new Response(JSON.stringify({ code: 0, data: { categories } }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequest, "onRequest");
__name2(onRequest, "onRequest");
function md5cycle(x, k) {
  let a = x[0], b = x[1], c = x[2], d = x[3];
  a = ff(a, b, c, d, k[0], 7, -680876936);
  d = ff(d, a, b, c, k[1], 12, -389564586);
  c = ff(c, d, a, b, k[2], 17, 606105819);
  b = ff(b, c, d, a, k[3], 22, -1044525330);
  a = ff(a, b, c, d, k[4], 7, -176418897);
  d = ff(d, a, b, c, k[5], 12, 1200080426);
  c = ff(c, d, a, b, k[6], 17, -1473231341);
  b = ff(b, c, d, a, k[7], 22, -45705983);
  a = ff(a, b, c, d, k[8], 7, 1770035416);
  d = ff(d, a, b, c, k[9], 12, -1958414417);
  c = ff(c, d, a, b, k[10], 17, -42063);
  b = ff(b, c, d, a, k[11], 22, -1990404162);
  a = ff(a, b, c, d, k[12], 7, 1804603682);
  d = ff(d, a, b, c, k[13], 12, -40341101);
  c = ff(c, d, a, b, k[14], 17, -1502002290);
  b = ff(b, c, d, a, k[15], 22, 1236535329);
  a = gg(a, b, c, d, k[1], 5, -165796510);
  d = gg(d, a, b, c, k[6], 9, -1069501632);
  c = gg(c, d, a, b, k[11], 14, 643717713);
  b = gg(b, c, d, a, k[0], 20, -373897302);
  a = gg(a, b, c, d, k[5], 5, -701558691);
  d = gg(d, a, b, c, k[10], 9, 38016083);
  c = gg(c, d, a, b, k[15], 14, -660478335);
  b = gg(b, c, d, a, k[4], 20, -405537848);
  a = gg(a, b, c, d, k[9], 5, 568446438);
  d = gg(d, a, b, c, k[14], 9, -1019803690);
  c = gg(c, d, a, b, k[3], 14, -187363961);
  b = gg(b, c, d, a, k[8], 20, 1163531501);
  a = gg(a, b, c, d, k[13], 5, -1444681467);
  d = gg(d, a, b, c, k[2], 9, -51403784);
  c = gg(c, d, a, b, k[7], 14, 1735328473);
  b = gg(b, c, d, a, k[12], 20, -1926607734);
  a = hh(a, b, c, d, k[5], 4, -378558);
  d = hh(d, a, b, c, k[8], 11, -2022574463);
  c = hh(c, d, a, b, k[11], 16, 1839030562);
  b = hh(b, c, d, a, k[14], 23, -35309556);
  a = hh(a, b, c, d, k[1], 4, -1530992060);
  d = hh(d, a, b, c, k[4], 11, 1272893353);
  c = hh(c, d, a, b, k[7], 16, -155497632);
  b = hh(b, c, d, a, k[10], 23, -1094730640);
  a = hh(a, b, c, d, k[13], 4, 681279174);
  d = hh(d, a, b, c, k[0], 11, -358537222);
  c = hh(c, d, a, b, k[3], 16, -722521979);
  b = hh(b, c, d, a, k[6], 23, 76029189);
  a = hh(a, b, c, d, k[9], 4, -640364487);
  d = hh(d, a, b, c, k[12], 11, -421815835);
  c = hh(c, d, a, b, k[15], 16, 530742520);
  b = hh(b, c, d, a, k[2], 23, -995338651);
  a = ii(a, b, c, d, k[0], 6, -198630844);
  d = ii(d, a, b, c, k[7], 10, 1126891415);
  c = ii(c, d, a, b, k[14], 15, -1416354905);
  b = ii(b, c, d, a, k[5], 21, -57434055);
  a = ii(a, b, c, d, k[12], 6, 1700485571);
  d = ii(d, a, b, c, k[3], 10, -1894986606);
  c = ii(c, d, a, b, k[10], 15, -23365528);
  b = ii(b, c, d, a, k[1], 21, 1804556229);
  a = ii(a, b, c, d, k[8], 6, -369533020);
  d = ii(d, a, b, c, k[15], 10, -66157429);
  c = ii(c, d, a, b, k[6], 15, -2080380878);
  b = ii(b, c, d, a, k[13], 21, 1120210379);
  a = ii(a, b, c, d, k[4], 6, -145523070);
  d = ii(d, a, b, c, k[11], 10, -1120285631);
  c = ii(c, d, a, b, k[2], 15, 1395380690);
  b = ii(b, c, d, a, k[9], 21, -1492968290);
  x[0] = add32(a, x[0]);
  x[1] = add32(b, x[1]);
  x[2] = add32(c, x[2]);
  x[3] = add32(d, x[3]);
}
__name(md5cycle, "md5cycle");
__name2(md5cycle, "md5cycle");
function cmn(q, a, b, x, s, t) {
  a = add32(add32(a, q), add32(x, t));
  return add32(a << s | a >>> 32 - s, b);
}
__name(cmn, "cmn");
__name2(cmn, "cmn");
function ff(a, b, c, d, x, s, t) {
  return cmn(b & c | ~b & d, a, b, x, s, t);
}
__name(ff, "ff");
__name2(ff, "ff");
function gg(a, b, c, d, x, s, t) {
  return cmn(b & d | c & ~d, a, b, x, s, t);
}
__name(gg, "gg");
__name2(gg, "gg");
function hh(a, b, c, d, x, s, t) {
  return cmn(b ^ c ^ d, a, b, x, s, t);
}
__name(hh, "hh");
__name2(hh, "hh");
function ii(a, b, c, d, x, s, t) {
  return cmn(c ^ (b | ~d), a, b, x, s, t);
}
__name(ii, "ii");
__name2(ii, "ii");
function md51(s) {
  const txt = "";
  const n = s.length;
  const state = [1732584193, -271733879, -1732584194, 271733878];
  let i;
  for (i = 64; i <= s.length; i += 64) {
    md5cycle(state, md5blk(s.substring(i - 64, i)));
  }
  s = s.substring(i - 64);
  const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (i = 0; i < s.length; i++)
    tail[i >> 2] |= s.charCodeAt(i) << (i % 4 << 3);
  tail[i >> 2] |= 128 << (i % 4 << 3);
  if (i > 55) {
    md5cycle(state, tail);
    for (i = 0; i < 16; i++) tail[i] = 0;
  }
  tail[14] = n * 8;
  md5cycle(state, tail);
  return state;
}
__name(md51, "md51");
__name2(md51, "md51");
function md5blk(s) {
  const md5blks = [];
  for (let i = 0; i < 64; i += 4) {
    md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
  }
  return md5blks;
}
__name(md5blk, "md5blk");
__name2(md5blk, "md5blk");
var hex_chr = "0123456789abcdef".split("");
function rhex(n) {
  let s = "", j = 0;
  for (; j < 4; j++)
    s += hex_chr[n >> j * 8 + 4 & 15] + hex_chr[n >> j * 8 & 15];
  return s;
}
__name(rhex, "rhex");
__name2(rhex, "rhex");
function hex(x) {
  for (let i = 0; i < x.length; i++)
    x[i] = rhex(x[i]);
  return x.join("");
}
__name(hex, "hex");
__name2(hex, "hex");
function md5(s) {
  return hex(md51(s));
}
__name(md5, "md5");
__name2(md5, "md5");
function add32(a, b) {
  return a + b & 4294967295;
}
__name(add32, "add32");
__name2(add32, "add32");
function signBanggoodRequest(params, appSecret) {
  const sortedKeys = Object.keys(params).sort();
  let signString = "";
  sortedKeys.forEach((key) => {
    signString += key + params[key];
  });
  return md5(appSecret + signString + appSecret);
}
__name(signBanggoodRequest, "signBanggoodRequest");
__name2(signBanggoodRequest, "signBanggoodRequest");
async function fetchBanggoodAPI(params, appKey, appSecret) {
  const sign = signBanggoodRequest(params, appSecret);
  const query = new URLSearchParams({
    ...params,
    sign
  });
  const apiUrl = `https://api.banggood.com/api2/request.api?${query.toString()}`;
  const response = await fetch(apiUrl);
  return response.json();
}
__name(fetchBanggoodAPI, "fetchBanggoodAPI");
__name2(fetchBanggoodAPI, "fetchBanggoodAPI");
async function onRequest2(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const productId = url.searchParams.get("productId") || url.searchParams.get("id") || "";
    if (!productId) {
      return new Response(JSON.stringify({ error: "productId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const APP_KEY = env.BANGGOOD_APP_KEY;
    const APP_SECRET = env.BANGGOOD_APP_SECRET;
    const params = {
      api: "product.get",
      app_key: APP_KEY,
      id: productId,
      timestamp: Math.floor(Date.now() / 1e3)
    };
    const data = await fetchBanggoodAPI(params, APP_KEY, APP_SECRET);
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequest2, "onRequest2");
__name2(onRequest2, "onRequest");
async function onRequest3(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const page = url.searchParams.get("page") || 1;
    const pageSize = url.searchParams.get("pageSize") || 20;
    const APP_KEY = env.BANGGOOD_APP_KEY;
    const APP_SECRET = env.BANGGOOD_APP_SECRET;
    const params = {
      api: "product.search",
      app_key: APP_KEY,
      keywords: "discount",
      page,
      page_size: pageSize,
      timestamp: Math.floor(Date.now() / 1e3)
    };
    const data = await fetchBanggoodAPI(params, APP_KEY, APP_SECRET);
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequest3, "onRequest3");
__name2(onRequest3, "onRequest");
async function onRequest4(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const keyword = url.searchParams.get("q") || "";
    const page = url.searchParams.get("page") || 1;
    const pageSize = url.searchParams.get("pageSize") || 20;
    const APP_KEY = env.BANGGOOD_APP_KEY;
    const APP_SECRET = env.BANGGOOD_APP_SECRET;
    const params = {
      api: "product.search",
      app_key: APP_KEY,
      keywords: keyword,
      page,
      page_size: pageSize,
      timestamp: Math.floor(Date.now() / 1e3)
    };
    const sortedKeys = Object.keys(params).sort();
    let signString = "";
    sortedKeys.forEach((key) => {
      signString += key + params[key];
    });
    const encoder = new TextEncoder();
    const data = encoder.encode(APP_SECRET + signString + APP_SECRET);
    const hashBuffer = await crypto.subtle.digest("MD5", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sign = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    const query = new URLSearchParams({
      ...params,
      sign
    });
    const apiUrl = `https://api.banggood.com/api2/request.api?${query.toString()}`;
    const response = await fetch(apiUrl);
    const json = await response.json();
    return new Response(JSON.stringify(json), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequest4, "onRequest4");
__name2(onRequest4, "onRequest");
async function signRequest(params, secret) {
  if (!params || typeof params !== "object") throw new Error("signRequest: params debe ser un objeto");
  if (!secret) throw new Error("signRequest: secret es obligatorio");
  const sortedKeys = Object.keys(params).sort();
  let basestring = "";
  for (const key of sortedKeys) {
    basestring += key + params[key];
  }
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(basestring);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}
__name(signRequest, "signRequest");
__name2(signRequest, "signRequest");
async function callAliExpressApi(method, businessParams, env) {
  const APP_KEY = env.ALI_APP_KEY;
  const APP_SECRET = env.ALI_APP_SECRET;
  if (!APP_KEY || !APP_SECRET) {
    throw new Error("Faltan credenciales ALI_APP_KEY o ALI_APP_SECRET.");
  }
  const API_URL = "https://api-sg.aliexpress.com/sync/portal/affiliate";
  const timestamp = Date.now().toString();
  const commonParams = {
    app_key: APP_KEY,
    format: "json",
    method,
    sign_method: "sha256",
    timestamp,
    v: "2.0"
  };
  const sign = await signRequest(commonParams, APP_SECRET);
  const bodyParts = [];
  const sortedCommonKeys = Object.keys(commonParams).sort();
  for (const key of sortedCommonKeys) {
    bodyParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(commonParams[key])}`);
  }
  for (const key of Object.keys(businessParams)) {
    const value = typeof businessParams[key] === "object" ? JSON.stringify(businessParams[key]) : businessParams[key];
    bodyParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }
  bodyParts.push(`sign=${encodeURIComponent(sign)}`);
  const body = bodyParts.join("&");
  const fullUrl = API_URL + "?" + body;
  console.log("FULL_REQUEST_URL:", fullUrl);
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("[ALIEXPRESS] Error parseando JSON:", text.substring(0, 500));
      return {
        error_response: {
          msg: "Respuesta de la API no v\xE1lida",
          code: response.status,
          raw: text.substring(0, 200)
        }
      };
    }
  } catch (fetchError) {
    console.error("[ALIEXPRESS] Error de red:", fetchError);
    return {
      error_response: {
        msg: "Error de red al conectar con AliExpress",
        details: fetchError.message
      }
    };
  }
}
__name(callAliExpressApi, "callAliExpressApi");
__name2(callAliExpressApi, "callAliExpressApi");
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400"
};
function handleOptions(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  return null;
}
__name(handleOptions, "handleOptions");
__name2(handleOptions, "handleOptions");
function parseAliExpressItem(item) {
  if (!item || typeof item !== "object") {
    return null;
  }
  const id = item.product_id || item.item_id || item.id || (item.product_detail_url ? item.product_detail_url.match(/(\d+)\.html/)?.[1] : null);
  if (!id) {
    return null;
  }
  const title = item.product_title || item.title || "Producto de AliExpress";
  const price = parseFloat(item.target_sale_price || item.sale_price || item.price || 0);
  const oldPrice = item.target_original_price || item.original_price || item.old_price ? parseFloat(item.target_original_price || item.original_price || item.old_price) : null;
  const image = item.product_main_image_url || item.image_url || item.image || item.product_small_image_urls && item.product_small_image_urls[0] || "";
  const link = item.product_detail_url || item.promotion_link || item.product_url || item.link || "";
  return {
    id: String(id),
    title: String(title),
    price: isNaN(price) ? 0 : price,
    old_price: oldPrice && !isNaN(oldPrice) ? oldPrice : null,
    image: String(image),
    link: String(link),
    shop: "AliExpress",
    rating: item.evaluate_rate || item.rating || null,
    sales: parseInt(item.last_thirty_days_relevant_shelf_commission || item.sales || 0, 10)
  };
}
__name(parseAliExpressItem, "parseAliExpressItem");
__name2(parseAliExpressItem, "parseAliExpressItem");
function logAliExpressRequest(method, params, endpoint) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const requestInfo = {
    timestamp,
    method,
    endpoint,
    params: {
      keyword: params.keyword || "N/A",
      page_size: params.page_size || "N/A",
      page_no: params.page_no || "N/A",
      tracking_id: params.tracking_id || "N/A",
      promotion_link_type: params.promotion_link_type || "N/A"
    }
  };
  console.log("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
  console.log("\u{1F4E4} REQUEST_TO_ALIEXPRESS");
  console.log("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
  console.log(`\u23F0 Timestamp: ${requestInfo.timestamp}`);
  console.log(`\u{1F517} Endpoint: ${requestInfo.endpoint}`);
  console.log(`\u{1F4CB} M\xE9todo: ${requestInfo.method}`);
  console.log("\u{1F4E6} Par\xE1metros:");
  console.log(JSON.stringify(requestInfo.params, null, 2));
  console.log("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
  return requestInfo;
}
__name(logAliExpressRequest, "logAliExpressRequest");
__name2(logAliExpressRequest, "logAliExpressRequest");
async function onRequest5(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const optionsResponse = handleOptions(request);
  if (optionsResponse) return optionsResponse;
  const keyword = url.searchParams.get("keyword") || "smart home";
  const hot = url.searchParams.get("hot") === "true";
  const linkOnly = url.searchParams.get("linkOnly") === "true";
  const productId = url.searchParams.get("productId");
  console.log("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
  if (linkOnly && productId) {
    console.log("[ALIEXPRESS] Modo: Generar Link Directo para ID:", productId);
    try {
      const bizParams = {
        tracking_id: env.ALI_TRACKING_ID || "Domotech_2026",
        promotion_link_type: "0",
        source_values: `https://www.aliexpress.com/item/${productId}.html`
      };
      const endpoint = env.ALI_API_ENDPOINT || "aliexpress.affiliate.link.generate";
      logAliExpressRequest("aliexpress.affiliate.link.generate", bizParams, endpoint);
      const linkRes = await callAliExpressApi("aliexpress.affiliate.link.generate", bizParams, env);
      const promotionLink = linkRes?.aliexpress_affiliate_link_generate_response?.resp_result?.result?.promotion_links?.promotion_link?.[0]?.promotion_link;
      if (promotionLink) {
        return new Response(JSON.stringify({ promotion_link: promotionLink }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error("API no devolvi\xF3 un promotion_link");
    } catch (err) {
      console.error("[ERROR] Generaci\xF3n link:", err.message);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
  console.log("[ALIEXPRESS] Modo: B\xFAsqueda:", keyword, "(Hot:", hot, ")");
  let cache;
  try {
    cache = caches.default;
  } catch (e) {
  }
  const cacheKey = new Request(url.toString());
  if (cache) {
    try {
      const cached = await cache.match(cacheKey);
      if (cached) {
        console.log("[CACHE] Hit!");
        return cached;
      }
    } catch (e) {
    }
  }
  const cleanKeyword = keyword.trim().replace(/[^\w\s]/gi, "").split(/\s+/).slice(0, 5).join(" ");
  const businessParams = {
    keyword: cleanKeyword,
    page_size: 20,
    page_no: 1,
    tracking_id: env.ALI_TRACKING_ID || "Domotech_2026"
  };
  const METHOD_HOT = "aliexpress.affiliate.hotproduct.query";
  const METHOD_NORMAL = "aliexpress.affiliate.product.query";
  try {
    const method = hot ? METHOD_HOT : METHOD_NORMAL;
    const endpoint = env.ALI_API_ENDPOINT || "https://api.aliexpress.com/";
    logAliExpressRequest(method, businessParams, endpoint);
    let apiResponse = await callAliExpressApi(method, businessParams, env);
    const hasError = !apiResponse || apiResponse.error_response || !(apiResponse.aliexpress_affiliate_hotproduct_query_response || apiResponse.aliexpress_affiliate_product_query_response);
    if (hasError && hot) {
      console.log("[FALLBACK] Hot fall\xF3, intentando normal...");
      logAliExpressRequest(METHOD_NORMAL, businessParams, endpoint);
      apiResponse = await callAliExpressApi(METHOD_NORMAL, businessParams, env);
    }
    const responseData = apiResponse?.aliexpress_affiliate_product_query_response || apiResponse?.aliexpress_affiliate_hotproduct_query_response || apiResponse;
    const rawItems = responseData?.resp_result?.result?.products || responseData?.result?.products || responseData?.resp_result?.result?.items || [];
    const cleaned = rawItems.map((item) => parseAliExpressItem(item)).filter((item) => item && item.id);
    console.log("[ALIEXPRESS] \xC9xito:", cleaned.length, "productos");
    const response = new Response(JSON.stringify({ items: cleaned }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=600"
      }
    });
    if (cache) context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (err) {
    console.error("[ERROR] Excepci\xF3n b\xFAsqueda:", err.message);
    return new Response(JSON.stringify({ error: err.message, items: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
__name(onRequest5, "onRequest5");
__name2(onRequest5, "onRequest");
async function onRequest6(context) {
  const { request } = context;
  const optionsResponse = handleOptions(request);
  if (optionsResponse) return optionsResponse;
  const url = new URL(request.url);
  const keyword = url.searchParams.get("keyword") || "smart home";
  return new Response(JSON.stringify({
    message: "Endpoint de Amazon listo. Se requiere configuraci\xF3n de PA-API.",
    keyword_recibida: keyword,
    items: []
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
__name(onRequest6, "onRequest6");
__name2(onRequest6, "onRequest");
async function onRequest7(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const keyword = url.searchParams.get("q") || "";
    const page = url.searchParams.get("page") || 1;
    const pageSize = url.searchParams.get("pageSize") || 20;
    const APP_KEY = env.BANGGOOD_APP_KEY;
    const APP_SECRET = env.BANGGOOD_APP_SECRET;
    const params = {
      api: "product.search",
      app_key: APP_KEY,
      keywords: keyword,
      page,
      page_size: pageSize,
      timestamp: Math.floor(Date.now() / 1e3)
    };
    const sortedKeys = Object.keys(params).sort();
    let signString = "";
    sortedKeys.forEach((key) => {
      signString += key + params[key];
    });
    const encoder = new TextEncoder();
    const data = encoder.encode(APP_SECRET + signString + APP_SECRET);
    const hashBuffer = await crypto.subtle.digest("MD5", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sign = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    const query = new URLSearchParams({
      ...params,
      sign
    });
    const apiUrl = `https://api.banggood.com/api2/request.api?${query.toString()}`;
    const response = await fetch(apiUrl);
    const json = await response.json();
    return new Response(JSON.stringify(json), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequest7, "onRequest7");
__name2(onRequest7, "onRequest");
var routes = [
  {
    routePath: "/banggood/categories",
    mountPath: "/banggood/categories",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/banggood/details",
    mountPath: "/banggood/details",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/banggood/offers",
    mountPath: "/banggood/offers",
    method: "",
    middlewares: [],
    modules: [onRequest3]
  },
  {
    routePath: "/banggood/search",
    mountPath: "/banggood/search",
    method: "",
    middlewares: [],
    modules: [onRequest4]
  },
  {
    routePath: "/aliexpress",
    mountPath: "/aliexpress",
    method: "",
    middlewares: [],
    modules: [onRequest5]
  },
  {
    routePath: "/amazon",
    mountPath: "/amazon",
    method: "",
    middlewares: [],
    modules: [onRequest6]
  },
  {
    routePath: "/banggood",
    mountPath: "/banggood",
    method: "",
    middlewares: [],
    modules: [onRequest7]
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-051Oih/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-051Oih/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.4692747443229708.js.map
