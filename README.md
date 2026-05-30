# DomoTechStore
Web de domótica inteligente con comparativas y guías de productos de **AliExpress** y **Banggood**

## 🚀 Características
- Búsqueda fusionada en ambas tiendas
- Ofertas reales basadas en historial de precios
- Productos en tendencia
- Recomendaciones personalizadas
- Dashboard de analíticas
- Alertas de bajada de precio

## 🔑 Configuración de API Keys

### Banggood (100% Frontend)
La API de Banggood está directamente integrada en el navegador, sin necesidad de backend.
- APP_KEY ya está configurada en `assets/js/main.js`
- Para añadir tu ID de afiliado: edita `BANGGOOD_CONFIG.AFFILIATE_ID` en `assets/js/main.js`

### AliExpress (Opcional)
Si quieres usar la API de AliExpress, configura las credenciales en Cloudflare Pages o usa el fallback integrado.

## 📁 Páginas Principales
- `/`: Inicio con ofertas del día
- `/features.html`: Demo de todas las características avanzadas
- `/dashboard.html`: Panel de analíticas

## 🛠️ Tecnologías
- Vanilla JavaScript (100% Frontend)
- CSS3 (Dark Theme)
- localStorage (persistencia)
- API directa de Banggood (sin CORS)

## ▶️ Cómo Empezar
Abre `index.html` directamente en tu navegador o usa cualquier servidor web estático. No hace falta compilar ni build steps!

