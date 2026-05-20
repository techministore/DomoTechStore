import { callAliExpressApi } from "../utils/aliApi.js"; 
 import { cleanAliUrl } from "../utils/cleanUrl.js"; 
 import { handleOptions, corsHeaders } from "../utils/cors.js";
 import { parseAliExpressItem } from "../utils/parseAliExpress.js";

 /**
  * Cloudflare Pages Function: /aliexpress
  * Maneja la búsqueda de productos en AliExpress con caché y fallback.
  */
 export async function onRequest(context) { 
     const { request, env } = context; 
     const url = new URL(request.url); 
 
     // Manejo de preflight (CORS)
     const optionsResponse = handleOptions(request);
     if (optionsResponse) return optionsResponse;

     const keyword = url.searchParams.get("keyword") || "smart home"; 
     const hot = url.searchParams.get("hot") === "true"; 
 
     console.log("────────────────────────────────────────────"); 
     console.log("[ALIEXPRESS] Nueva petición:", keyword, "(Hot:", hot, ")"); 
 
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
 
     // Optimización de la Keyword: Limpiar y limitar longitud para evitar errores de API
     const cleanKeyword = keyword
         .trim()
         .replace(/[^\w\s]/gi, '') // Eliminar caracteres especiales
         .split(/\s+/)
         .slice(0, 5) // Limitar a las primeras 5 palabras para mayor precisión
         .join(' ');

     // Parámetros de negocio (Incluyendo tracking_id para afiliados)
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
     console.log("[ALIEXPRESS] Raw Response:", JSON.stringify(apiResponse, null, 2));

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
 
     // Normalización robusta usando parseAliExpressItem
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