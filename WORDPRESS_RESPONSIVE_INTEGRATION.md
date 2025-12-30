# 🔌 WordPress Integration Guide - Responsive Build

## Overview

Guía para integrar el build responsive de Agente_Poc_UNITEC en WordPress de forma que funcione correctamente en todos los dispositivos.

---

## 🚀 Deployment Steps

### 1. Build la aplicación
```bash
npm run build
```

Genera carpeta `dist/` con:
- `index.html`
- `assets/index-unitec-[hash].js`
- `assets/index-unitec-[hash].css`
- Otros assets

### 2. Verifica archivos generados
```bash
ls -la dist/assets/
```

Debe ver:
```
index-unitec-abc123.js
index-unitec-def456.css
```

**Importante:** Los archivos tienen sufijo `-unitec` para evitar conflictos

### 3. Upload a WordPress
1. Via SFTP (SiteGround):
   - Conecta a tu servidor
   - Navega a `/public_html/wp-content/plugins/gero-agente-unitec/`
   - Sube contenido de `/dist` a carpeta `build/`

2. Via cPanel:
   - File Manager → wp-content/plugins/gero-agente-unitec/
   - Upload archivos desde local

---

## 🔧 PHP Enqueue Configuration

### Ubicación
[agente-retencion.php](agente-retencion.php) líneas 788-808

### Verificar configuración
```php
// Línea ~790
wp_register_script(
  'agente_unitec_app',  // Handle único
  plugins_url('build/index-unitec-[hash].js', __FILE__),
  [],
  '1.0',
  true  // En footer
);

wp_localize_script(
  'agente_unitec_app',
  'GERO_CONFIG_UNITEC',  // Variable única
  [...]
);

wp_enqueue_script('agente_unitec_app');
```

### Variables Verificadas
- ✅ Handle: `agente_unitec_app` (no `agente_prototype_app`)
- ✅ Variable JS: `GERO_CONFIG_UNITEC` (no `GERO_CONFIG`)
- ✅ Root element: `#agente-unitec-root` (no `#agente-prototype-root`)

---

## 📱 Responsive Features in WordPress

### 1. Viewport Meta Tag
```html
<!-- En theme header.php o plugin -->
<meta name="viewport" content="width=device-width, initial-scale=1">
```

**WordPress:** Generalmente incluido por defecto en themes modernos

### 2. CSS Media Queries
Todas incluidas en build CSS:
```css
/* Mobile first */
.px-responsive { padding: 12px; }

/* Tablet */
@media (min-width: 640px) {
  .px-responsive { padding: 16px; }
}

/* Desktop */
@media (min-width: 768px) {
  .px-responsive { padding: 24px; }
}
```

### 3. Mobile-Optimized JS
- No heavy computations on mobile
- Lazy loading de recursos
- Event delegation para touch

---

## 🎯 Testing en WordPress

### Local Testing
```bash
# En carpeta del plugin
php -S localhost:8000

# O con XAMPP/MAMP
# Accede a http://localhost/wordpress
```

### Pasos de Verificación
1. [ ] Abre `/wp-admin/` y verifica plugin activo
2. [ ] Navega a página donde está embed GERO
3. [ ] Abre DevTools (F12)
4. [ ] Verifica:
   - [ ] `GERO_CONFIG_UNITEC` en console
   - [ ] React mounted en `#agente-unitec-root`
   - [ ] CSS loaded (Styles tab)
   - [ ] No 404 errors

### Responsive Testing en WordPress
1. DevTools → Device Mode (Ctrl+Shift+M)
2. Selecciona dispositivo
3. Recarga página
4. Verifica:
   - [ ] Sin scroll horizontal
   - [ ] Texto legible
   - [ ] Botones clickeables
   - [ ] Contenedor responsivo

---

## 🔍 Troubleshooting

### Problema: CSS no se ve responsive
**Causa:** Viewport meta tag no presente
**Solución:**
```php
// En agente-retencion.php
add_action('wp_head', function() {
  echo '<meta name="viewport" content="width=device-width, initial-scale=1">';
});
```

### Problema: Horizontal scroll en mobile
**Causa:** Contenedor sin max-width o padding incorrecto
**Solución:** Verifica [Agent.tsx](SRC/Pages/Agent.tsx#L148)
```tsx
// ✅ Correcto
className="w-full px-3 sm:px-4 md:px-6"

// ❌ Incorrecto
className="w-screen px-2"
```

### Problema: Botones muy pequeños
**Causa:** Altura menor a 44px
**Solución:** Verifica todos los botones tienen:
```tsx
className="... min-h-10 sm:min-h-11 md:min-h-12 ..."
```

### Problema: Texto muy pequeño en mobile
**Causa:** Font-size por debajo de 16px
**Solución:** Base styles deben ser:
```tsx
className="text-xs sm:text-sm md:text-base"
// En mobile: 12px (min para UI), inputs: 16px
```

### Problema: Plugin de Agente_Poc y UNITEC compiten
**Causa:** Handles/IDs duplicados
**Solución:** Ambos plugins deben tener sufijos únicos:
- Agente_Poc: `agente_prototype_app`, `#agente-prototype-root`
- UNITEC: `agente_unitec_app`, `#agente-unitec-root` ✅

---

## 📊 Performance Optimization

### CSS Delivery
```php
// En agente-retencion.php
wp_register_style(
  'agente_unitec_css',
  plugins_url('build/index-unitec-[hash].css', __FILE__),
  [],
  '1.0'
);

// Critical CSS inline (optional)
wp_enqueue_style('agente_unitec_css');
```

### JS Delivery
```php
wp_register_script(
  'agente_unitec_app',
  plugins_url('build/index-unitec-[hash].js', __FILE__),
  [],
  '1.0',
  true  // ← Footer (defer loading)
);
```

### Asset Versioning
El hash en nombre de archivo (`index-unitec-abc123.js`) asegura:
- ✅ Cache busting automático
- ✅ No versión duplicada en browser
- ✅ Actualización inmediata en deployment

---

## 🌐 Multi-Domain Setup (Si aplica)

### Mismo servidor, dominios diferentes
```php
// En agente-retencion.php
$plugin_url = plugins_url('build/', __FILE__);

wp_register_script(
  'agente_unitec_app',
  $plugin_url . 'index-unitec-[hash].js'
);
```

**WordPress maneja automáticamente** los diferentes dominios

### Subdirectorios
```php
// Si WordPress está en /blog/ directorio
// WordPress ajusta automáticamente los paths

$plugin_url = plugins_url('build/', __FILE__);
// Se convierte a: /blog/wp-content/plugins/.../build/
```

---

## 🔐 Security Considerations

### WordPress Nonce para API Calls
```php
// En PHP
wp_create_nonce('gero_api_nonce')

// En JS (ya configurado en backendAdapter.ts)
fetch('/wp-json/gero/v1/endpoint', {
  headers: {
    'X-WP-Nonce': geroNonce
  }
})
```

### Content Security Policy
Si tu tema usa CSP, asegura:
```php
// script-src incluye inline styles y ejecutables
// style-src permite estilos inline (Tailwind)
```

---

## 📈 Analytics Integration

### Tracking en páginas responsivas
```jsx
// En useEffect, track page views
useEffect(() => {
  // Google Analytics / Hotjar / etc
  window.gtag?.('event', 'page_view', {
    page_title: 'Agent Page',
    page_path: '/agent'
  });
}, []);
```

### Mobile-specific events
```jsx
// Track breakpoint detection
const isMobile = useMediaQuery('(max-width: 640px)');
if (isMobile) {
  track('mobile_view');
}
```

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Build ejecutado exitosamente
- [ ] Assets generados con sufijo `-unitec`
- [ ] PHP configuración verificada
- [ ] No conflictos con Agente_Poc
- [ ] Responsive testing completado

### Deployment
- [ ] Archivos uploadados a `/build/`
- [ ] Permisos archivo correctos (644)
- [ ] Plugin activado en WordPress
- [ ] Cache limpiado (si aplica)

### Post-Deployment
- [ ] Verificar en producción
- [ ] Mobile testing en sitio vivo
- [ ] Monitor console errors
- [ ] Verificar API calls funciona
- [ ] Check performance metrics

### Rollback (si necesario)
```bash
# Restaurar versión anterior
mv build/index-unitec-old.js build/index-unitec-[hash].js
# Limpiar cache WordPress
# Verificar en navegador
```

---

## 📞 Common Deployment Issues

### Issue: 404 en assets
```
GET /wp-content/plugins/.../build/index-unitec-abc.js 404
```
**Fix:** Verifica path en PHP matches ubicación real de archivos

### Issue: CORS errors en API
```
CORS error: Access-Control-Allow-Origin missing
```
**Fix:** API endpoint debe permitir mismo origen
```php
register_rest_route('gero/v1', '/endpoint', [
  'methods' => 'GET',
  'callback' => 'callback_function',
  'permission_callback' => '__return_true'
]);
```

### Issue: Cache viejo persiste
```
Veo cambios viejos después de deploy
```
**Fix:**
1. Limpiar cache WordPress
2. Limpiar cache browser (Ctrl+Shift+Del)
3. Forzar refresh (Ctrl+Shift+R)
4. Verificar en incógnito

---

## 📱 Mobile-First In Production

### Monitoring Metrics
Track en Google Analytics:
- % Mobile vs Desktop traffic
- Mobile bounce rate
- Device types usados
- Screen resolutions

### Responsive Image Optimization
```jsx
// Usar srcSet para responsivo
<img 
  src="image-sm.jpg"
  srcSet="image-md.jpg 640w, image-lg.jpg 1024w"
  sizes="(max-width: 640px) 100vw, 80vw"
  alt="Descripción"
/>
```

### Future Enhancements
- [ ] Service Worker para offline support
- [ ] Progressive Web App (PWA) manifest
- [ ] Touch optimized gestures
- [ ] Dark mode support

---

## ✅ Validation Checklist

```
Responsiveness ✅
- [ ] Mobile (360px): OK
- [ ] Tablet (768px): OK
- [ ] Desktop (1440px): OK
- [ ] No horizontal scroll: OK

Performance ✅
- [ ] First Contentful Paint < 2s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Lighthouse Mobile > 80

Functionality ✅
- [ ] Formularios funcionan
- [ ] APIs responden
- [ ] Chat funciona
- [ ] Navegación OK

Compatibility ✅
- [ ] iOS Safari OK
- [ ] Chrome Android OK
- [ ] Firefox OK
- [ ] Edge OK
```

---

## 📚 Resources

- [WordPress Plugin Development](https://developer.wordpress.org/plugins/)
- [Responsive Web Design](https://www.responsivedesign.is/)
- [Mobile-First Approach](https://www.nngroup.com/articles/mobile-first-web-design/)
- [Tailwind Responsive](https://tailwindcss.com/docs/responsive-design)

---

**Status:** ✅ Deployment Ready  
**Last Updated:** 2024  
**Version:** 1.0
