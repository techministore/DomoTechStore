/**
 * DomoTechStore - Temu Worker
 * ✔ Proxy seguro para la API de afiliados de Temu (PDD Open Platform)
 * ✔ Firma HMAC-MD5 compatible con Cloudflare Workers
 * ✔ Fallback con productos de demostración
 */

// ============================================================================
// 🔐 MD5 PURO (COMPATIBLE CON CLOUDFLARE WORKERS)
// ============================================================================

function md5(str) {
    function X(x,y,z){return(x&y)|(~x&z);}
    function Y(x,y,z){return(x&z)|(y&~z);}
    function Z(x,y,z){return x^y^z;}
    function W(x,y,z){return y^(x|~z);}
    function L(k,d){return(k<<d)|(k>>>(32-d));}
    function step(fn,a,b,c,d,x,s,t){const n=a+fn(b,c,d)+(x>>>0)+t;return(L(n,s)+b)|0;}
    function toHex(v){let s='';for(let i=0;i<=3;i++)s+=('0'+((v>>>(i*8))&255).toString(16)).slice(-2);return s;}

    str=unescape(encodeURIComponent(str));
    let msg=[];
    for(let i=0;i<str.length;i++) msg[i>>2]|=str.charCodeAt(i)<<((i%4)*8);
    msg[str.length>>2]|=0x80<<((str.length%4)*8);
    msg[(((str.length+8)>>6)+1)*16-2]=str.length*8;

    let a=1732584193,b=-271733879,c=-1732584194,d=271733878;
    for(let i=0;i<msg.length;i+=16){
        let A=a,B=b,C=c,D=d;
        a=step(X,a,b,c,d,msg[i+0],7,-680876936);   d=step(X,d,a,b,c,msg[i+1],12,-389564586);
        c=step(X,c,d,a,b,msg[i+2],17,606105819);   b=step(X,b,c,d,a,msg[i+3],22,-1044525330);
        a=step(X,a,b,c,d,msg[i+4],7,-176418897);   d=step(X,d,a,b,c,msg[i+5],12,1200080426);
        c=step(X,c,d,a,b,msg[i+6],17,-1473231341); b=step(X,b,c,d,a,msg[i+7],22,-45705983);
        a=step(X,a,b,c,d,msg[i+8],7,1770035416);   d=step(X,d,a,b,c,msg[i+9],12,-1958414417);
        c=step(X,c,d,a,b,msg[i+10],17,-42063);     b=step(X,b,c,d,a,msg[i+11],22,-1990404162);
        a=step(X,a,b,c,d,msg[i+12],7,1804603682);  d=step(X,d,a,b,c,msg[i+13],12,-40341101);
        c=step(X,c,d,a,b,msg[i+14],17,-1502002290);b=step(X,b,c,d,a,msg[i+15],22,1236535329);

        a=step(Y,a,b,c,d,msg[i+1],5,-165796510);   d=step(Y,d,a,b,c,msg[i+6],9,-1069501632);
        c=step(Y,c,d,a,b,msg[i+11],14,643717713);  b=step(Y,b,c,d,a,msg[i+0],20,-373897302);
        a=step(Y,a,b,c,d,msg[i+5],5,-701558691);   d=step(Y,d,a,b,c,msg[i+10],9,38016083);
        c=step(Y,c,d,a,b,msg[i+15],14,-660478335); b=step(Y,b,c,d,a,msg[i+4],20,-405537848);
        a=step(Y,a,b,c,d,msg[i+9],5,568446438);    d=step(Y,d,a,b,c,msg[i+14],9,-1019803690);
        c=step(Y,c,d,a,b,msg[i+3],14,-187363961);  b=step(Y,b,c,d,a,msg[i+8],20,1163531501);
        a=step(Y,a,b,c,d,msg[i+13],5,-1444681467); d=step(Y,d,a,b,c,msg[i+2],9,-51403784);
        c=step(Y,c,d,a,b,msg[i+7],14,1735328473);  b=step(Y,b,c,d,a,msg[i+12],20,-1926607734);

        a=step(Z,a,b,c,d,msg[i+5],4,-378558);      d=step(Z,d,a,b,c,msg[i+8],11,-2022574463);
        c=step(Z,c,d,a,b,msg[i+11],16,1839030562); b=step(Z,b,c,d,a,msg[i+14],23,-35309556);
        a=step(Z,a,b,c,d,msg[i+1],4,-1530992060);  d=step(Z,d,a,b,c,msg[i+4],11,1272893353);
        c=step(Z,c,d,a,b,msg[i+7],16,-155497632);  b=step(Z,b,c,d,a,msg[i+10],23,-1094730640);
        a=step(Z,a,b,c,d,msg[i+13],4,681279174);   d=step(Z,d,a,b,c,msg[i+0],11,-358537222);
        c=step(Z,c,d,a,b,msg[i+3],16,-722521979);  b=step(Z,b,c,d,a,msg[i+6],23,76029189);
        a=step(Z,a,b,c,d,msg[i+9],4,-640364487);   d=step(Z,d,a,b,c,msg[i+12],11,-421815835);
        c=step(Z,c,d,a,b,msg[i+15],16,530742520);  b=step(Z,b,c,d,a,msg[i+2],23,-995338651);

        a=step(W,a,b,c,d,msg[i+0],6,-198630844);   d=step(W,d,a,b,c,msg[i+7],10,1126891415);
        c=step(W,c,d,a,b,msg[i+14],15,-1416354905);b=step(W,b,c,d,a,msg[i+5],21,-57434055);
        a=step(W,a,b,c,d,msg[i+12],6,1700485571);  d=step(W,d,a,b,c,msg[i+3],10,-1894986606);
        c=step(W,c,d,a,b,msg[i+10],15,-1051523);   b=step(W,b,c,d,a,msg[i+1],21,-2054922799);
        a=step(W,a,b,c,d,msg[i+8],6,1873313359);   d=step(W,d,a,b,c,msg[i+15],10,-30611744);
        c=step(W,c,d,a,b,msg[i+6],15,-1560198380); b=step(W,b,c,d,a,msg[i+13],21,1309151649);
        a=step(W,a,b,c,d,msg[i+4],6,-145523070);   d=step(W,d,a,b,c,msg[i+11],10,-1120210379);
        c=step(W,c,d,a,b,msg[i+2],15,718787259);   b=step(W,b,c,d,a,msg[i+9],21,-343485551);

        a=(a+A)|0; b=(b+B)|0; c=(c+C)|0; d=(d+D)|0;
    }
    return(toHex(a)+toHex(b)+toHex(c)+toHex(d)).toLowerCase();
}

// ============================================================================
// 🔐 FIRMA TEMU (PDD Open Platform)
// ============================================================================

function generateTemuSign(params, appSecret) {
    const sortedKeys = Object.keys(params).sort();
    const queryStr = sortedKeys.map(k => `${k}${params[k]}`).join('');
    return md5(`${appSecret}${queryStr}${appSecret}`).toUpperCase();
}

// ============================================================================
// 🌐 CORS HEADERS
// ============================================================================

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
};

// ============================================================================
// 🔍 BUSCAR PRODUCTOS EN TEMU (PDD Open Platform)
// ============================================================================

async function searchProducts(appKey, appSecret, keyword, page = 1) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const params = {
        app_key: appKey,
        timestamp,
        data_type: 'JSON',
        version: 'V1.0',
        type: 'pdd.ddk.goods.search',
        keyword,
        page,
        page_size: 20,
        sort_type: 0
    };

    params.sign = generateTemuSign(params, appSecret);

    const url = 'https://gw-api.pinduoduo.com/api/router?' + new URLSearchParams(params);
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

// ============================================================================
// 🏷️ PRODUCTOS POPULARES TEMU
// ============================================================================

async function getPopularProducts(appKey, appSecret) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const params = {
        app_key: appKey,
        timestamp,
        data_type: 'JSON',
        version: 'V1.0',
        type: 'pdd.ddk.goods.recommend.get',
        page_size: 20,
        page: 1,
        cat_id: 1
    };

    params.sign = generateTemuSign(params, appSecret);

    const url = 'https://gw-api.pinduoduo.com/api/router?' + new URLSearchParams(params);
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

// ============================================================================
// 🌐 HANDLER PRINCIPAL
// ============================================================================

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS });
    }

    const APP_KEY    = env.TEMU_APP_KEY;
    const APP_SECRET = env.TEMU_APP_SECRET;

    const url    = new URL(request.url);
    const action = url.searchParams.get('action') || 'search';
    const q      = url.searchParams.get('q') || 'smart home';

    if (!APP_KEY || !APP_SECRET) {
        return new Response(JSON.stringify({ code: -1, error: 'Credenciales no configuradas', fallback: true }), {
            status: 200, headers: CORS
        });
    }

    try {
        if (action === 'search') {
            const data = await searchProducts(APP_KEY, APP_SECRET, q);
            if (data.error_response) {
                return new Response(JSON.stringify({ code: -1, error: data.error_response.error_msg, fallback: true }), {
                    status: 200, headers: CORS
                });
            }
            return new Response(JSON.stringify({ code: 0, data }), { headers: CORS });
        }

        if (action === 'popular') {
            const data = await getPopularProducts(APP_KEY, APP_SECRET);
            if (data.error_response) {
                return new Response(JSON.stringify({ code: -1, error: data.error_response.error_msg, fallback: true }), {
                    status: 200, headers: CORS
                });
            }
            return new Response(JSON.stringify({ code: 0, data }), { headers: CORS });
        }

        return new Response(JSON.stringify({ error: 'Acción desconocida' }), { status: 400, headers: CORS });

    } catch (err) {
        console.error('[TEMU] Error:', err);
        return new Response(JSON.stringify({ code: -1, error: err.message, fallback: true }), {
            status: 200, headers: CORS
        });
    }
}
