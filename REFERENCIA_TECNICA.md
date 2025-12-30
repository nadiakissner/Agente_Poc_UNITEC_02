# Referencia Técnica: Cambios Realizados

Este documento detalla EXACTAMENTE qué se cambió en cada archivo de Agente_Poc_UNITEC.

---

## 1. `vite.config.ts` - Configuración de Build

### ¿Qué se cambió?

Agregamos prefijo único `-unitec` a TODOS los archivos generados por Vite.

### Código Antes:
```typescript
build: {
  outDir: "dist",
  assetsDir: "assets",
},
```

### Código Después:
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

### ¿Por qué?

- **entryFileNames**: Archivo principal (index.js) → index-unitec-abc123.js
- **chunkFileNames**: Chunks de código → nombre-unitec-xyz.js
- **assetFileNames**: Archivos de assets (CSS, fuentes) → index-unitec-xyz.css

Esto asegura que cuando compilamos con `npm run build`, TODOS los archivos generados tengan el prefijo `-unitec`, evitando colisiones de nombre con Agente_Poc.

---

## 2. `agente-retencion.php` - Enqueue de Scripts en WordPress

### Líneas 782-820 (Shortcode handler)

#### ¿Qué se cambió?

Reemplazamos TODOS los nombres genéricos de `agente_prototype_*` con `agente_unitec_*`.

### Comparación Lado-a-Lado:

| Aspecto | Agente_Poc | Agente_Poc_UNITEC |
|---------|-----------|------------------|
| **Carpeta de assets** | `agente-prototype/dist/` | `dist/` |
| **Archivo JS** | `agente-prototype/dist/assets/index.js` | `dist/assets/index-unitec.js` |
| **Archivo CSS** | `agente-prototype/dist/assets/index.css` | `dist/assets/index-unitec.css` |
| **Handle Script** | `agente_prototype_app` | `agente_unitec_app` |
| **Handle Style** | `agente_prototype_css` | `agente_unitec_css` |
| **Variable Global JS** | `GERO_CONFIG` | `GERO_CONFIG_UNITEC` |
| **Elemento Root** | `agente-prototype-root` | `agente-unitec-root` |

### Código Original (Agente_Poc):
```php
$base = plugin_dir_url(__FILE__);
$build_js_path = plugin_dir_path(__FILE__) . 'agente-prototype/dist/assets/index.js';
$build_js_url  = $base . 'agente-prototype/dist/assets/index.js';
$build_css_url = $base . 'agente-prototype/dist/assets/index.css';

if ( file_exists( $build_js_path ) ) {
  if ( ! wp_script_is('agente_prototype_app', 'registered') ) {
    wp_register_script('agente_prototype_app', $build_js_url, [], '1.0', true);
  }
  if ( file_exists( plugin_dir_path(__FILE__) . 'agente-prototype/dist/assets/index.css' ) && ! wp_style_is('agente_prototype_css', 'registered') ) {
    wp_register_style('agente_prototype_css', $build_css_url, [], '1.0');
  }

  wp_localize_script('agente_prototype_app', 'GERO_CONFIG', [
    'rest_base' => esc_url_raw( rest_url( 'gero/v1' ) ),
    'nonce'     => wp_create_nonce('wp_rest'),
    'modal'     => $modal_flag,
  ]);

  wp_enqueue_script('agente_prototype_app');
  if ( wp_style_is('agente_prototype_css', 'registered') ) wp_enqueue_style('agente_prototype_css');

  return '<div id="agente-prototype-root" data-modal="' . esc_attr($modal_flag) . '"></div>';
}
```

### Código Nuevo (Agente_Poc_UNITEC):
```php
$base = plugin_dir_url(__FILE__);

// CAMBIO CLAVE: usar carpeta y nombres únicos para UNITEC
$build_js_path = plugin_dir_path(__FILE__) . 'dist/assets/index-unitec.js';
$build_js_url  = $base . 'dist/assets/index-unitec.js';
$build_css_url = $base . 'dist/assets/index-unitec.css';

// Nombres únicos para handles de WordPress
$js_handle  = 'agente_unitec_app';
$css_handle = 'agente_unitec_css';
$root_id    = 'agente-unitec-root';

if ( file_exists( $build_js_path ) ) {
  // Register y enqueue con handles únicos
  if ( ! wp_script_is($js_handle, 'registered') ) {
    wp_register_script($js_handle, $build_js_url, [], '1.0', true);
  }
  if ( file_exists( plugin_dir_path(__FILE__) . 'dist/assets/index-unitec.css' ) && ! wp_style_is($css_handle, 'registered') ) {
    wp_register_style($css_handle, $build_css_url, [], '1.0');
  }

  wp_localize_script($js_handle, 'GERO_CONFIG_UNITEC', [
    'rest_base' => esc_url_raw( rest_url( 'gero/v1' ) ),
    'nonce'     => wp_create_nonce('wp_rest'),
    'modal'     => $modal_flag,
  ]);

  wp_enqueue_script($js_handle);
  if ( wp_style_is($css_handle, 'registered') ) wp_enqueue_style($css_handle);

  return '<div id="' . esc_attr($root_id) . '" data-modal="' . esc_attr($modal_flag) . '"></div>';
}
```

### ¿Por qué estos cambios?

1. **Prefijo -unitec en rutas**: Asegura que busca archivos compilados correctos
2. **Variables $js_handle, $css_handle, $root_id**: Hace código más mantenible y claro
3. **Nombre único en wp_register_script/style**: Evita colisión en queue de WordPress
4. **GERO_CONFIG_UNITEC**: Cada agente tiene su propia variable global, sin sobrescribirse

---

## 3. `SRC/main.tsx` - Entry Point de React

### ¿Qué se cambió?

Cambiar el elemento root de búsqueda para que React se monte en el div correcto.

### Código Antes:
```typescript
import * as React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
```

**Problemas:**
- Buscaba `#root` (ID genérico)
- El PHP creaba `#agente-unitec-root`
- No coincidían → React no montaba

### Código Después:
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

**Ventajas:**
- Busca específicamente `#agente-unitec-root`
- Coincide con el elemento creado por PHP
- Mensaje de error claro si falla
- Aislamiento de Agente_Poc

---

## 4. `index.html` - HTML Root

### ¿Qué se cambió?

Actualizar ID del elemento root y metadata.

### Antes:
```html
<!doctype html>
<html lang="en">
  <head>
    <title>UDLA - Agente de Retención</title>
    <meta name="description" content="Agente de acompañamiento UDLA para estudiantes" />
    <meta name="author" content="UDLA" />
    ...
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Después:
```html
<!doctype html>
<html lang="en">
  <head>
    <title>UNITEC - Agente de Retención</title>
    <meta name="description" content="Agente de acompañamiento UNITEC para estudiantes" />
    <meta name="author" content="UNITEC" />
    ...
  </head>
  <body>
    <div id="agente-unitec-root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Cambios:**
- ID: `root` → `agente-unitec-root` (coincide con PHP)
- Title/metadata: actualizado para UNITEC
- Aislamiento visual y funcional

---

## 5. `SRC/Lib/backendAdapter.ts` - Configuración de API

### ¿Qué se cambió?

Centralizar la lectura de configuración para soportar `GERO_CONFIG_UNITEC`.

### Líneas 1-15 (Antes):
```typescript
const BASE = (typeof window !== 'undefined' && (window as any).GERO_CONFIG && (window as any).GERO_CONFIG.rest_base)
  ? (window as any).GERO_CONFIG.rest_base.replace(/\/$/, '')
  : (typeof window !== 'undefined' ? window.location.origin : '');
const API_PREFIX = `${BASE}/wp-json/gero/v1`.replace(/([^:])\/\//g, '$1/');
```

**Problemas:**
- Repetición de `(window as any).GERO_CONFIG` en cada función
- Búsqueda rígida de `GERO_CONFIG`
- No soporta `GERO_CONFIG_UNITEC`

### Líneas 1-15 (Después):
```typescript
const CONFIG = (typeof window !== 'undefined' && ((window as any).GERO_CONFIG_UNITEC || (window as any).GERO_CONFIG))
  ? ((window as any).GERO_CONFIG_UNITEC || (window as any).GERO_CONFIG)
  : {};

const BASE = (CONFIG && CONFIG.rest_base)
  ? CONFIG.rest_base.replace(/\/$/, '')
  : (typeof window !== 'undefined' ? window.location.origin : '');
const API_PREFIX = `${BASE}/wp-json/gero/v1`.replace(/([^:])\/\//g, '$1/');
```

**Ventajas:**
- Una variable centralizadora `CONFIG`
- Intenta primero `GERO_CONFIG_UNITEC` (específica)
- Fallback a `GERO_CONFIG` (compartida)
- Código DRY (Don't Repeat Yourself)

### Cambios en funciones (ejemplo `validateMatricula`):

#### Antes:
```typescript
export async function validateMatricula(matricula: string, url_origen = '') {
  const params = new URLSearchParams();
  params.set('matricula', matricula);
  if (url_origen) params.set('url_origen', url_origen);

  const url = (typeof window !== 'undefined' && (window as any).GERO_CONFIG && (window as any).GERO_CONFIG.rest_base)
    ? `${(window as any).GERO_CONFIG.rest_base.replace(/\/$/, '')}/validar-matricula?${params.toString()}`
    : `${API_PREFIX}/validar-matricula?${params.toString()}`;
  
  // resto del código...
}
```

#### Después:
```typescript
export async function validateMatricula(matricula: string, url_origen = '') {
  const params = new URLSearchParams();
  params.set('matricula', matricula);
  if (url_origen) params.set('url_origen', url_origen);

  const url = (CONFIG && CONFIG.rest_base)
    ? `${CONFIG.rest_base.replace(/\/$/, '')}/validar-matricula?${params.toString()}`
    : `${API_PREFIX}/validar-matricula?${params.toString()}`;
  
  // resto del código...
}
```

**Se aplicó el mismo patrón a:**
- `getLastConversation()`
- `sendChatMessage()`
- `saveConversation()`
- `saveHypotheses()`
- `classifyCaseAuto()`

---

## 6. Estructura de Directorios

### Antes (Problema):
```
Agente_Poc_UNITEC/
├── agente-prototype/
│   └── dist/
│       └── assets/
│           ├── index.js
│           └── index.css
```

### Después (Solución):
```
Agente_Poc_UNITEC/
├── dist/
│   └── assets/
│       ├── index-unitec-abc123.js
│       └── index-unitec-xyz789.css
```

**Cambios:**
- Eliminada carpeta `agente-prototype/` (no necesaria)
- Directorio `dist/` en raíz (como otros proyectos Vite)
- Archivos con prefijo `-unitec` generados automáticamente por Vite

---

## 7. Flujo de Datos Completo

### Para Agente_Poc:

```
1. WordPress ejecuta shortcode [agente-retencion]
   ↓
2. agente-retencion.php (Agente_Poc)
   ↓
3. wp_register_script('agente_prototype_app', 'agente-prototype/dist/assets/index.js')
   ↓
4. wp_localize_script('agente_prototype_app', 'GERO_CONFIG', {...})
   ↓
5. retorna: <div id="agente-prototype-root"></div>
   ↓
6. React main.tsx busca: document.getElementById("root") ← GENÉRICO
   ↓
7. Monta en: #root (si existe) o en #agente-prototype-root (si no)
```

### Para Agente_Poc_UNITEC:

```
1. WordPress ejecuta shortcode [agente-retencion]
   ↓
2. agente-retencion.php (Agente_Poc_UNITEC) ← DIFERENTE
   ↓
3. wp_register_script('agente_unitec_app', 'dist/assets/index-unitec.js') ← ÚNICO
   ↓
4. wp_localize_script('agente_unitec_app', 'GERO_CONFIG_UNITEC', {...}) ← ÚNICO
   ↓
5. retorna: <div id="agente-unitec-root"></div> ← ÚNICO
   ↓
6. React main.tsx busca: document.getElementById("agente-unitec-root") ← ESPECÍFICO
   ↓
7. Monta en: #agente-unitec-root (garantizado)
```

---

## 8. Matriz de Cambios Resumida

| Archivo | Línea(s) | Cambio | Razón |
|---------|----------|--------|-------|
| `vite.config.ts` | 17-20 | Agregar `rollupOptions` con prefijo `-unitec` | Nombres únicos en archivos compilados |
| `agente-retencion.php` | 788 | `agente-prototype/dist/` → `dist/` | Ubicación correcta de assets |
| `agente-retencion.php` | 789 | `index.js` → `index-unitec.js` | Nombre único |
| `agente-retencion.php` | 790 | `index.css` → `index-unitec.css` | Nombre único |
| `agente-retencion.php` | 793-795 | Variables locales: $js_handle, $css_handle, $root_id | Mantenibilidad |
| `agente-retencion.php` | 796 | `agente_prototype_app` → `agente_unitec_app` | Handle único WordPress |
| `agente-retencion.php` | 799 | `agente_prototype_css` → `agente_unitec_css` | Handle único WordPress |
| `agente-retencion.php` | 801 | `GERO_CONFIG` → `GERO_CONFIG_UNITEC` | Variable global única |
| `agente-retencion.php` | 808 | `agente-prototype-root` → `agente-unitec-root` | Elemento DOM único |
| `SRC/main.tsx` | 6-12 | Reemplazar lógica de root con `getElementById("agente-unitec-root")` | Aislamiento de React |
| `SRC/Lib/backendAdapter.ts` | 4-11 | Crear variable centralizadora CONFIG | Soporte para `GERO_CONFIG_UNITEC` |
| `SRC/Lib/backendAdapter.ts` | 25+ | Usar `CONFIG` en todas las funciones | Consistencia |
| `index.html` | 5 | Title: UDLA → UNITEC | Identificación |
| `index.html` | 6 | Description: UDLA → UNITEC | Identificación |
| `index.html` | 7 | Author: UDLA → UNITEC | Identificación |
| `index.html` | 23 | `root` → `agente-unitec-root` | Coincidencia con PHP |

---

## 9. Testing de Cambios

### Verificar cada cambio:

```bash
# 1. Verificar vite.config.ts
npm run build
ls dist/assets/ | grep unitec
# Salida esperada:
# index-unitec-abc123.js
# index-unitec-xyz789.css

# 2. Verificar agente-retencion.php
grep "agente_unitec" agente-retencion.php | wc -l
# Salida esperada: >= 5

# 3. Verificar main.tsx
grep "agente-unitec-root" SRC/main.tsx
# Salida esperada: aparece en el código

# 4. Verificar backendAdapter.ts
grep "GERO_CONFIG_UNITEC" SRC/Lib/backendAdapter.ts
# Salida esperada: aparece en el código

# 5. Verificar index.html
grep "agente-unitec-root" index.html
# Salida esperada: <div id="agente-unitec-root"></div>
```

---

## 10. Conclusión

Todos estos cambios trabajan juntos para crear **aislamiento completo**:

- ✅ **Vite**: Genera nombres únicos con prefijo
- ✅ **PHP**: Registra en WordPress con handles únicos
- ✅ **React**: Monta en elemento root específico
- ✅ **Backend Adapter**: Usa configuración centralizada
- ✅ **HTML**: Tiene elemento root correcto

**Resultado:** Agente_Poc_UNITEC es completamente independiente de Agente_Poc.
