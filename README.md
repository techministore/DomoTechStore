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

### 1. Cloudflare Pages Functions (Producción)
Configura las variables de entorno en el dashboard de Cloudflare Pages:
- `BANGGOOD_APP_KEY`: `aff6a1a99947bda`
- `BANGGOOD_APP_SECRET`: Tu App Secret completo (ver tu panel de Banggood)
- `BANGGOOD_AFFILIATE_ID`: (Opcional) Tu ID de afiliado

### 2. Desarrollo Local
Copia los archivos de ejemplo y configura tus keys:
```bash
cp wrangler.toml.example wrangler.toml
cp .dev.vars.example .dev.vars
# Edita los archivos con tus credenciales
```

Luego ejecuta:
```bash
npx wrangler pages dev .
```

## 📁 Páginas Principales
- `/`: Inicio con ofertas del día
- `/features.html`: Demo de todas las características avanzadas
- `/dashboard.html`: Panel de analíticas

## 🛠️ Tecnologías
- Vanilla JavaScript
- CSS3 (Dark Theme)
- Cloudflare Pages Functions
- localStorage (persistencia)

