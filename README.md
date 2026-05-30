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

### Banggood (Recomendado: Worker Cloudflare)
1. **Desarrollo local**:
   - Copia `.dev.vars.example` → `.dev.vars`
   - Completa `BANGGOOD_APP_SECRET` con tu clave completa
   - Instala dependencias: `npm install`
   - Inicia el dev server: `npx wrangler pages dev .`

2. **Producción (Cloudflare Pages)**:
   - Ve al dashboard de Cloudflare Pages
   - Configura las variables de entorno:
     - `BANGGOOD_APP_KEY`: `aff6a1a99947bda`
     - `BANGGOOD_APP_SECRET`: Tu App Secret completo
     - `BANGGOOD_AFFILIATE_ID`: Tu ID de afiliado (opcional)
   - Deploy!

3. **Fallback 100% Frontend**:
   - Si no puedes usar el Worker, el sistema usa un fallback con productos de demostración
   - El fallback está integrado en `assets/js/main.js`

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
- Cloudflare Pages Functions (para la API de Banggood)
- crypto-js (para firmar las peticiones de la API)

## ▶️ Cómo Empezar

### Opción 1: Con el Worker de Cloudflare (Recomendado)
1. Instala dependencias: `npm install`
2. Configura variables: Copia `.dev.vars.example` → `.dev.vars` y completa
3. Inicia el dev server: `npx wrangler pages dev .`

### Opción 2: Solo Frontend (Fallback)
Abre `index.html` directamente en tu navegador o usa cualquier servidor web estático. El sistema usa productos de demostración si la API no está disponible.

