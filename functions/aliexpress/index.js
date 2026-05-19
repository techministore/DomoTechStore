import { callAliExpressApi } from "../utils/aliApi.js"; 
 import { cleanAliUrl } from "../utils/cleanUrl.js"; 
 
 export async function onRequest(context) { 
     const { request, env } = context; 
     const url = new URL(request.url); 
 
     const keyword = url.searchParams.get("keyword") || "smart home"; 
     const hot = url.searchParams.get("hot") === "true"; 
 
     console.log("────────────────────────────────────────────"); 
     console.log("[ALIEXPRESS] Nueva petición"); 
     console.log("Keyword:", keyword); 
     console.log("Hot:", hot); 
 
     // 0) Configuración de Caché (Protegida para evitar 500)
     let cache;
     try {
         cache = caches.default;
     } catch (e) {
         console.log("[CACHE] Caches.default no está disponible en este entorno");
     }

     const cacheKey = new Request(url.toString()); // Usamos url.toString() para una key limpia

     // 1) Intentar leer desde caché
     if (cache) {
         try {
             let cached = await cache.match(cacheKey);
             if (cached) {
                 console.log("[CACHE] Respuesta servida desde caché");
                 return cached;
             }
         } catch (e) {
             console.log("[CACHE] Error leyendo de caché:", e.message);
         }
     }

     if (!keyword || keyword.trim().length === 0) { 
         return new Response( 
             JSON.stringify({ error: "El parámetro 'keyword' es obligatorio", items: [] }, null, 2), 
             { status: 400, headers: { "Content-Type": "application/json" } } 
         ); 
     } 
 
     const baseParams = { 
         page_size: "20", 
         page_no: "1", 
         keyword: keyword.trim() 
     }; 
 
     // Métodos oficiales Portals IOP 
     const METHOD_HOT = "aliexpress.affiliate.hotproduct.query"; 
     const METHOD_NORMAL = "aliexpress.affiliate.product.query"; 
 
     // 1) Intento principal 
     const primaryMethod = hot ? METHOD_HOT : METHOD_NORMAL; 
     console.log("[ALIEXPRESS] Método primario:", primaryMethod); 
 
     let apiResponse = await callAliExpressApi(primaryMethod, baseParams, env); 
 
     console.log("[ALIEXPRESS] Respuesta primario:"); 
     console.log(JSON.stringify(apiResponse, null, 2)); 
 
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
         console.log("[FALLBACK] Hot Products falló. Intentando búsqueda normal…"); 
 
         apiResponse = await callAliExpressApi(METHOD_NORMAL, baseParams, env); 
 
         console.log("[ALIEXPRESS] Respuesta fallback:"); 
         console.log(JSON.stringify(apiResponse, null, 2)); 
     } 
 
     // Si sigue fallando → devolver vacío sin romper 
     if (!apiResponse || apiResponse.error_response) { 
         console.log("[ALIEXPRESS] Error final. Devolviendo lista vacía."); 
         return new Response(JSON.stringify({ items: [] }, null, 2), { 
             status: 200, 
             headers: { 
                 "Content-Type": "application/json", 
                 "Access-Control-Allow-Origin": "*" 
             } 
         }); 
     } 
 
     // Extraer productos 
     const responseData = 
         apiResponse.aliexpress_affiliate_product_query_response || 
         apiResponse.aliexpress_affiliate_hotproduct_query_response || 
         apiResponse; 
 
     const items = 
         responseData?.resp_result?.result?.products || 
         responseData?.result?.products || 
         []; 
 
     console.log("[ALIEXPRESS] Productos encontrados:", items.length); 
 
     if (!Array.isArray(items) || items.length === 0) { 
         return new Response(JSON.stringify({ items: [] }, null, 2), { 
             status: 200, 
             headers: { 
                 "Content-Type": "application/json", 
                 "Access-Control-Allow-Origin": "*" 
             } 
         }); 
     } 
 
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
 
     console.log("[ALIEXPRESS] Productos procesados:", cleaned.length); 
 
     const response = new Response(JSON.stringify({ items: cleaned }, null, 2), { 
         status: 200, 
         headers: { 
             "Content-Type": "application/json", 
             "Access-Control-Allow-Origin": "*",
             "Cache-Control": "public, max-age=600"
         } 
     }); 

     // 2) Guardar en caché (Protegido)
     if (cache) {
         try {
             context.waitUntil(cache.put(cacheKey, response.clone()));
         } catch (e) {
             console.log("[CACHE] Error guardando en caché:", e.message);
         }
     }

     return response;
 }