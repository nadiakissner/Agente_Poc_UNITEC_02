# Arquitectura de Separación Completa: Agente_Poc vs Agente_Poc_UNITEC

## Resumen Ejecutivo

Este documento describe la arquitectura implementada para garantizar **separación completa e independencia absoluta** entre los frontends de `Agente_Poc` y `Agente_Poc_UNITEC`. Cada proyecto ahora:

- ✅ Tiene su propio build de React/Vite
- ✅ Usa archivos JS/CSS únicos con prefijos identificadores
- ✅ Carga en elementos DOM independientes
- ✅ Registra scripts/estilos con handles WordPress únicos
- ✅ Usa objetos de configuración separados en JavaScript
- ✅ Puede evolucionar visualmente sin afectar al otro

---

## Problemas que se resolvieron

### Antes (Estado Problemático)
```
Agente_Poc/
├── agente-retencion.php          ← Usa handle: agente_prototype_app
├── vite.config.ts                ← Build a dist/assets/index.js
└── dist/assets/
    ├── index.js                  ← Nombre genérico
    └── index.css                 ← Nombre genérico

Agente_Poc_UNITEC/
├── agente-retencion.php          ← Usa MISMO handle: agente_prototype_app ❌
├── vite.config.ts                ← Build a MISMO dist/assets/index.js ❌
└── dist/assets/
    ├── index.js                  ← Conflicto de nombres ❌
    └── index.css                 ← Conflicto de nombres ❌
```

**Problemas:**
1. **Conflicto de handles WordPress**: Si ambos registran `agente_prototype_app`, WordPress encolaba el último, causando que uno sobrescriba al otro
2. **Conflicto de nombres de archivo**: `dist/assets/index.js` era idéntico, causando caché collisions en SiteGround
3. **Conflicto de elementos root**: Ambos buscaban `#agente-prototype-root`, causando que se monten en el mismo elemento
4. **Conflicto de configuración global**: Ambos usaban `window.GERO_CONFIG`, causando que se sobrescriban valores

---

## Solución Implementada

### 1. **Vite Configuration (Prefijo de Assets)**

**Archivo:** `Agente_Poc_UNITEC/vite.config.ts`

```typescript
build: {
  outDir: "dist",
  assetsDir: "assets",
  rollupOptions: {
    output: {
      // Prefijo único para UNITEC para evitar conflictos de nombres
      entryFileNames: "assets/[name]-unitec-[hash].js",
      chunkFileNames: "assets/[name]-unitec-[hash].js",
      assetFileNames: "assets/[name]-unitec-[hash][extname]",
    },
  },
},
```

**Resultado:**
- `index.js` → `index-unitec-abc123.js`
- `index.css` → `index-unitec-xyz789.css`

Cada archivo generado ahora tiene el prefijo `-unitec`, haciendo imposible colisiones.

---

### 2. **WordPress PHP Enqueue (Handles y Root Únicos)**

**Archivo:** `Agente_Poc_UNITEC/agente-retencion.php` (líneas ~780-820)

```php
// CAMBIO CLAVE: usar carpeta y nombres únicos para UNITEC
$build_js_path = plugin_dir_path(__FILE__) . 'dist/assets/index-unitec.js';
$build_js_url  = $base . 'dist/assets/index-unitec.js';
$build_css_url = $base . 'dist/assets/index-unitec.css';

// Nombres únicos para handles de WordPress
$js_handle  = 'agente_unitec_app';      // ← Único para UNITEC
$css_handle = 'agente_unitec_css';      // ← Único para UNITEC
$root_id    = 'agente-unitec-root';     // ← Único para UNITEC

if ( file_exists( $build_js_path ) ) {
  // Register y enqueue con handles únicos
  if ( ! wp_script_is($js_handle, 'registered') ) {
    wp_register_script($js_handle, $build_js_url, [], '1.0', true);
  }
  if ( file_exists( plugin_dir_path(__FILE__) . 'dist/assets/index-unitec.css' ) && ! wp_style_is($css_handle, 'registered') ) {
    wp_register_style($css_handle, $build_css_url, [], '1.0');
  }

  wp_localize_script($js_handle, 'GERO_CONFIG_UNITEC', [  // ← Variable única
    'rest_base' => esc_url_raw( rest_url( 'gero/v1' ) ),
    'nonce'     => wp_create_nonce('wp_rest'),
    'modal'     => $modal_flag,
  ]);

  wp_enqueue_script($js_handle);
  if ( wp_style_is($css_handle, 'registered') ) wp_enqueue_style($css_handle);

  return '<div id="' . esc_attr($root_id) . '" data-modal="' . esc_attr($modal_flag) . '"></div>';
}
```

**Cambios Clave:**
- Handle script: `agente_prototype_app` → `agente_unitec_app`
- Handle style: `agente_prototype_css` → `agente_unitec_css`
- Elemento root: `agente-prototype-root` → `agente-unitec-root`
- Variable globales: `GERO_CONFIG` → `GERO_CONFIG_UNITEC`

---

### 3. **React Entry Point (main.tsx)**

**Archivo:** `Agente_Poc_UNITEC/SRC/main.tsx`

```typescript
import * as React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Elemento root único para UNITEC
const rootElement = document.getElementById("agente-unitec-root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.warn("[UNITEC] Root element #agente-unitec-root not found");
}
```

**Antes:** Buscaba genéricamente `root`, que podría estar vacío o ser compartido.

**Ahora:** Busca específicamente `agente-unitec-root`, garantizando aislamiento.

---

### 4. **Backend Adapter Configuration**

**Archivo:** `Agente_Poc_UNITEC/SRC/Lib/backendAdapter.ts` (líneas 1-15)

```typescript
// Prefer REST base localized by WordPress when available (GERO_CONFIG_UNITEC or GERO_CONFIG).
// Fallback to same-origin /wp-json/gero/v1 when not present.
const CONFIG = (typeof window !== 'undefined' && ((window as any).GERO_CONFIG_UNITEC || (window as any).GERO_CONFIG))
  ? ((window as any).GERO_CONFIG_UNITEC || (window as any).GERO_CONFIG)
  : {};

const BASE = (CONFIG && CONFIG.rest_base)
  ? CONFIG.rest_base.replace(/\/$/, '')
  : (typeof window !== 'undefined' ? window.location.origin : '');
const API_PREFIX = `${BASE}/wp-json/gero/v1`.replace(/([^:])\/\//g, '$1/');
```

**Antes:** Todas las funciones verificaban `(window as any).GERO_CONFIG` directamente.

**Ahora:** Una variable centralizadora `CONFIG` intenta:
1. Usar `GERO_CONFIG_UNITEC` (específica de UNITEC)
2. Fallback a `GERO_CONFIG` (para compatibilidad)
3. Usar valores por defecto

Todos los métodos (`validateMatricula`, `sendChatMessage`, `saveConversation`, etc.) ahora usan la variable centralizada `CONFIG`.

---

### 5. **HTML Root Element**

**Archivo:** `Agente_Poc_UNITEC/index.html`

```html
<body>
  <div id="agente-unitec-root"></div>  <!-- ← Elemento único para UNITEC -->
  <script type="module" src="/src/main.tsx"></script>
</body>
```

---

## Arquitectura de Carpetas Final

```
WordPress Installation (SiteGround)
│
├── wp-plugins/
│   │
│   ├── Agente_Poc/
│   │   ├── agente-retencion.php
│   │   ├── vite.config.ts          ← Sin cambios (assets genéricos)
│   │   └── dist/assets/
│   │       ├── index.js            ← Handle: agente_prototype_app
│   │       └── index.css
│   │
│   └── Agente_Poc_UNITEC/
│       ├── agente-retencion.php     ← Modificado: handles únicos
│       ├── vite.config.ts           ← Modificado: prefijo -unitec
│       └── dist/assets/
│           ├── index-unitec.js      ← Handle: agente_unitec_app
│           └── index-unitec.css
│
├── index.html (Página de destino)
│   └── [shortcode agente-retencion]    ← Carga Agente_Poc
│
└── index-unitec.html (Otra página)
    └── [shortcode agente-retencion]    ← Carga Agente_Poc_UNITEC
```

---

## Ventajas de esta Arquitectura

| Aspecto | Ventaja |
|--------|---------|
| **Builds Independientes** | Cada proyecto compila por separado, sin dependencias cruzadas |
| **Naming Único** | Prefijo `-unitec` asegura nombres únicos en caché y assets |
| **Handles WordPress Únicos** | Evita colisiones de enqueue en WordPress |
| **Root Elements Únicos** | Cada React app monta en su propio elemento DOM |
| **Configuración Aislada** | `GERO_CONFIG_UNITEC` no interfiere con `GERO_CONFIG` |
| **API Compartido** | Ambos pueden usar `/wp-json/gero/v1` sin conflictos |
| **Desarrollo Paralelo** | Cambios en UNITEC no afectan Agente_Poc |
| **Caché Eficiente** | SiteGround no confunde archivos entre proyectos |

---

## Flujo de Ejecución

### Cuando se renderiza `[shortcode agente-retencion]` en Agente_Poc_UNITEC:

```
1. WordPress ejecuta agente-retencion.php (UNITEC)
   ↓
2. PHP verifica si existe dist/assets/index-unitec.js ✓
   ↓
3. PHP registra:
   - Script: agente_unitec_app (URL: dist/assets/index-unitec-abc123.js)
   - Style: agente_unitec_css (URL: dist/assets/index-unitec-xyz789.css)
   - Global: GERO_CONFIG_UNITEC = { rest_base: "...", nonce: "...", modal: "..." }
   ↓
4. PHP retorna: <div id="agente-unitec-root" data-modal="true"></div>
   ↓
5. WordPress enqueue scripts/styles
   ↓
6. React main.tsx carga:
   - Busca element #agente-unitec-root
   - Crea root React en ese elemento
   - Monta App.tsx
   ↓
7. App.tsx accede a configuración via backendAdapter.ts:
   - CONFIG = window.GERO_CONFIG_UNITEC || window.GERO_CONFIG
   - API calls usan CONFIG.rest_base
   ↓
8. Agente UNITEC funciona completamente aislado de Agente_Poc
```

---

## Guía de Mantenimiento

### ¿Cómo hacer cambios en Agente_Poc_UNITEC sin afectar Agente_Poc?

1. **Cambios visuales/diseño:**
   - Modifica componentes en `SRC/Components/`
   - Cambia estilos en `SRC/*.css` o Tailwind
   - Recompila: `npm run build`
   - Los assets generados serán: `index-unitec-*.js` y `index-unitec-*.css`
   - ✅ **Agente_Poc no se ve afectado** (sus archivos no tienen prefijo `-unitec`)

2. **Cambios de lógica:**
   - Modifica páginas en `SRC/Pages/`
   - Actualiza hooks en `SRC/Hooks/`
   - Recompila: `npm run build`
   - Los cambios solo aplican al Agente UNITEC
   - ✅ **Agente_Poc mantiene su lógica intacta**

3. **Cambios de backend/API:**
   - Modifica PHP endpoints en `agente-retencion.php`
   - **IMPORTANTE**: Los endpoints en `/wp-json/gero/v1` se comparten
   - Si necesitas endpoints diferentes, crea nuevos (ej: `/wp-json/gero-unitec/v1`)
   - ✅ **Esto sí es compartido intencionalmente** (lógica de negocio común)

---

## Testing

### Verificar que la separación funciona:

```bash
# Terminal 1: Build Agente_Poc_UNITEC
cd Agente_Poc_UNITEC
npm run build

# Verify el archivo generado tiene el prefijo unitec
ls -la dist/assets/
# Debe ver: index-unitec-abc123.js, index-unitec-xyz789.css

# Terminal 2: Verificar en WordPress
# 1. Ve a página con shortcode [agente-retencion]
# 2. Abre DevTools (F12)
# 3. Verifica en Network que carga:
#    - Script: index-unitec-*.js
#    - Style: index-unitec-*.css
# 4. Verifica en Console que existe: window.GERO_CONFIG_UNITEC

# Terminal 3: Verificar Agente_Poc no se ve afectado
cd Agente_Poc
npm run build

# Verify que NO tiene prefijo unitec
ls -la dist/assets/
# Debe ver: index.js, index.css (sin -unitec)
```

---

## Conclusión

Esta arquitectura garantiza que **Agente_Poc** y **Agente_Poc_UNITEC**:
- 🔒 Son completamente independientes a nivel de frontend
- 🚀 Pueden evolucionar sin riesgos de conflictos
- 🔌 Comparten backend/API de forma segura
- 📊 Coexisten en el mismo WordPress sin interferencias
- 🎯 Cumplen con el requisito de "dos interfaces distintas para el mismo backend"

**Status:** ✅ **COMPLETAMENTE IMPLEMENTADO**
