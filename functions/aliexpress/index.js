import { callAliExpressApi } from "../utils/aliApi.js"; 
 import { cleanAliUrl } from "../utils/cleanUrl.js"; 
 import { handleOptions, corsHeaders } from "../utils/cors.js";
 import { parseAliExpressItem } from "../utils/parseAliExpress.js";

 /**
  * Cloudflare Pages Function: /aliexpress
  * Maneja la búsqueda de productos en AliExpress con caché y generación de enlaces de afiliados directos.
  */
 export async function onRequest(context) { 
     const { request, env } = context; 
     const url = new URL(request.url); 
 
     // Manejo de preflight (CORS)
     const optionsResponse = handleOptions(request);
     if (optionsResponse) return optionsResponse;

     const keyword = url.searchParams.get("keyword") || "smart home"; 
     const hot = url.searchParams.get("hot") === "true"; 
     const linkOnly = url.searchParams.get("linkOnly") === "true";
     const productId = url.searchParams.get("productId");

     console.log("────────────────────────────────────────────"); 
     
     // 1) MODO GENERACIÓN DE ENLACE DIRECTO (S.CLICK)
     if (linkOnly && productId) {
        console.log("[ALIEXPRESS] Generando enlace de afiliado para ID:", productId);
        try {
            const productUrl = `https://www.aliexpress.com/item/${productId}.html`;
            const businessParams = {
                tracking_id: env.ALI_TRACKING_ID || "Domotech_2026",
                promotion_link_type: "0", // 0 para s.click
                source_values: productUrl
            };

            const linkRes = await callAliExpressApi("aliexpress.affiliate.link.generate", businessParams, env);
            const promotionLink = linkRes?.aliexpress_affiliate_link_generate_response?.resp_result?.result?.promotion_links?.promotion_link?.[0]?.promotion_link;

            if (promotionLink) {
                return new Response(JSON.stringify({ promotion_link: promotionLink }), {
                    status: 200,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }
            throw new Error("No se pudo generar el enlace de promoción");
        } catch (err) {
            console.error("[ERROR] Fallo al generar link:", err.message);
            return new Response(JSON.stringify({ error: err.message }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }
     }

     console.log("[ALIEXPRESS] Nueva búsqueda:", keyword, "(Hot:", hot, ")"); 
 
     // 0) Configuración de Caché
     let cache;
     try {
         cache = caches.default;
     } catch (e) {
         console.warn("[CACHE] No disponible");
     }

     const cacheKey = new Request(url.toString());

     // 1) Intentar leer desde caché
     if (cache) {
         try {
             let cached = await cache.match(cacheKey);
             if (cached) {
                 console.log("[CACHE] Hit!");
                 return cached;
             }
         } catch (e) {
             console.error("[CACHE] Error lectura:", e.message);
         }
     }

     if (!keyword || keyword.trim().length === 0) { 
         return new Response( 
             JSON.stringify({ error: "Keyword obligatorio", items: [] }), 
             { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } } 
         ); 
     } 
 
     // Optimización de la Keyword
     const cleanKeyword = keyword
         .trim()
         .replace(/[^\w\s]/gi, '')
         .split(/\s+/)
         .slice(0, 5)
         .join(' ');

     // Parámetros de negocio
     const businessParams = { 
         page_size: "20", 
         page_no: "1", 
         keyword: cleanKeyword,
         tracking_id: env.ALI_TRACKING_ID || "Domotech_2026"
     }; 
 
     const METHOD_HOT = "aliexpress.affiliate.hotproduct.query"; 
     const METHOD_NORMAL = "aliexpress.affiliate.product.query"; 
 
     // 1) Intento principal 
     const primaryMethod = hot ? METHOD_HOT : METHOD_NORMAL; 
     console.log("[ALIEXPRESS] Llamando método:", primaryMethod); 
 
     let apiResponse = await callAliExpressApi(primaryMethod, businessParams, env); 
 
     // 2) FALLBACK INTELIGENTE 
     const hasError = 
         !apiResponse || 
         apiResponse.error_response || 
         !( 
             apiResponse.aliexpress_affiliate_hotproduct_query_response || 
             apiResponse.aliexpress_affiliate_product_query_response 
         ); 
 
     if (hasError && hot) { 
         console.log("[FALLBACK] Hot Products falló o vacío. Intentando búsqueda normal..."); 
         apiResponse = await callAliExpressApi(METHOD_NORMAL, businessParams, env); 
     } 
 
     // 3) Procesar Respuesta Final
     if (!apiResponse || apiResponse.error_response) { 
         console.error("[ALIEXPRESS] Error final:", apiResponse?.error_response); 
         return new Response(JSON.stringify({ items: [], details: apiResponse }), { 
             status: 200, 
             headers: { ...corsHeaders, "Content-Type": "application/json" } 
         }); 
     } 
 
     const responseData = 
         apiResponse.aliexpress_affiliate_product_query_response || 
         apiResponse.aliexpress_affiliate_hotproduct_query_response || 
         apiResponse; 
 
     const items = 
         responseData?.resp_result?.result?.products || 
         responseData?.result?.products || 
         responseData?.resp_result?.result?.items ||
         []; 
 
     // Normalización robusta
     const cleaned = items 
         .map((item) => parseAliExpressItem(item)) 
         .filter((item) => item.id); 
 
     console.log("[ALIEXPRESS] Productos procesados:", cleaned.length); 
 
     const response = new Response(JSON.stringify({ items: cleaned }, null, 2), { 
         status: 200, 
         headers: { 
             ...corsHeaders,
             "Content-Type": "application/json", 
             "Cache-Control": "public, max-age=600"
         } 
     }); 
 
     // Guardar en caché (Protegido)
     if (cache) {
         try {
             context.waitUntil(cache.put(cacheKey, response.clone()));
         } catch (e) {
             console.error("[CACHE] Error escritura:", e.message);
         }
     }
 
     return response; 
 }