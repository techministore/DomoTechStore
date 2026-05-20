import { callAliExpressApi } from "../utils/aliApi.js"; 
 import { cleanAliUrl } from "../utils/cleanUrl.js"; 
 import { handleOptions, corsHeaders } from "../utils/cors.js";

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
 
     const baseParams = { 
         page_size: "20", 
         page_no: "1", 
         keyword: keyword.trim() 
     }; 
 
     const METHOD_HOT = "aliexpress.affiliate.hotproduct.query"; 
     const METHOD_NORMAL = "aliexpress.affiliate.product.query"; 
 
     // 1) Intento principal 
     const primaryMethod = hot ? METHOD_HOT : METHOD_NORMAL; 
     console.log("[ALIEXPRESS] Llamando método:", primaryMethod); 
 
     let apiResponse = await callAliExpressApi(primaryMethod, baseParams, env); 
 
     // Detectar error en primario 
     const hasError = 
         !apiResponse || 
         apiResponse.error_response || 
         !( 
             apiResponse.aliexpress_affiliate_hotproduct_query_response || 
             apiResponse.aliexpress_affiliate_product_query_response 
         ); 
 
     // 2) FALLBACK INTELIGENTE 
     if (hasError && hot) { 
         console.log("[FALLBACK] Hot Products falló. Intentando búsqueda normal..."); 
         apiResponse = await callAliExpressApi(METHOD_NORMAL, baseParams, env); 
     } 
 
     // 3) Procesar Respuesta Final
     if (!apiResponse || apiResponse.error_response) { 
         console.error("[ALIEXPRESS] Error final:", apiResponse?.error_response); 
         return new Response(JSON.stringify({ items: [], details: apiResponse }), { 
             status: 200, // Devolvemos 200 con lista vacía para no romper el front
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
         []; 
 
     const cleaned = items 
         .map((p) => ({ 
             id: p.product_id || null, 
             title: p.product_title || "Sin título", 
             image: p.product_main_image_url || "", 
             price: p.target_sale_price || 0, 
             original_price: p.target_original_price || 0, 
             rating: p.evaluate_rate || 0, 
             url: cleanAliUrl(p.product_detail_url) 
         })) 
         .filter((item) => item.id); 
 
     console.log("[ALIEXPRESS] Productos encontrados:", cleaned.length); 
 
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