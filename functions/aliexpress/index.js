import { callAliExpressApi } from "../utils/aliApi.js"; 
 import { cleanAliUrl } from "../utils/cleanUrl.js"; 
 
 export async function onRequest(context) { 
     const { request, env } = context; 
     const url = new URL(request.url); 
 
     const keyword = url.searchParams.get("keyword") || "smart home"; 
     const hot = url.searchParams.get("hot") === "true"; 
 
     console.log("────────────────────────────────────────────"); 
     console.log("[ALIEXPRESS] Nueva petición recibida"); 
     console.log("URL:", request.url); 
     console.log("Keyword:", keyword); 
     console.log("Hot products:", hot); 
 
     if (!keyword || keyword.trim().length === 0) { 
         console.log("[ERROR] Keyword vacío"); 
         return new Response( 
             JSON.stringify({ error: "El parámetro 'keyword' es obligatorio", items: [] }, null, 2), 
             { status: 400, headers: { "Content-Type": "application/json" } } 
         ); 
     } 
 
     const method = hot 
         ? "aliexpress.affiliate.hotproduct.query" 
         : "aliexpress.affiliate.product.query"; 
 
     const params = { 
         page_size: "20", 
         page_no: "1", 
         keyword: keyword.trim() 
     }; 
 
     console.log("[ALIEXPRESS] Método:", method); 
     console.log("[ALIEXPRESS] Parámetros enviados:", params); 
 
     try { 
         const apiResponse = await callAliExpressApi(method, params, env); 
 
         console.log("[ALIEXPRESS] Respuesta cruda recibida:"); 
         console.log(JSON.stringify(apiResponse, null, 2)); 
 
         if (!apiResponse) { 
             console.log("[ERROR] API devolvió null"); 
             throw new Error("No response from AliExpress API"); 
         } 
 
         if (apiResponse.error_response) { 
             console.log("[ALIEXPRESS] Error detectado en la API:"); 
             console.log(apiResponse.error_response); 
 
             return new Response( 
                 JSON.stringify({ 
                     error: apiResponse.error_response.msg || "Error en API AliExpress", 
                     details: apiResponse, 
                     items: [] 
                 }, null, 2), 
                 { status: 400, headers: { "Content-Type": "application/json" } } 
             ); 
         } 
 
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
             console.log("[ALIEXPRESS] Sin productos"); 
             return new Response(JSON.stringify({ items: [] }, null, 2), { 
                 status: 200, 
                 headers: { 
                     "Content-Type": "application/json", 
                     "Access-Control-Allow-Origin": "*" 
                 } 
             }); 
         } 
 
         const cleaned = items.map((p) => ({ 
             id: p.product_id || null, 
             title: p.product_title || "Sin título", 
             image: p.product_main_image_url || "", 
             price: p.target_sale_price || 0, 
             original_price: p.target_original_price || 0, 
             rating: p.evaluate_rate || 0, 
             url: cleanAliUrl(p.product_detail_url) 
         })).filter(item => item.id); 
 
         console.log("[ALIEXPRESS] Productos procesados:", cleaned.length); 
 
         return new Response(JSON.stringify({ items: cleaned }, null, 2), { 
             status: 200, 
             headers: { 
                 "Content-Type": "application/json", 
                 "Access-Control-Allow-Origin": "*" 
             } 
         }); 
 
     } catch (error) { 
         console.log("[ERROR] Excepción en la Function:", error); 
 
         return new Response( 
             JSON.stringify({ 
                 error: error.message || "Error processing request", 
                 items: [] 
             }, null, 2), 
             { status: 500, headers: { "Content-Type": "application/json" } } 
         ); 
     } 
 }