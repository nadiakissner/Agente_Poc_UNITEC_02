# Guía de Implementación: Separación de Frontends

## 🚀 Pasos de Implementación en SiteGround

### Fase 1: Preparación Local

#### 1.1 Compilar Agente_Poc_UNITEC

```bash
cd Agente_Poc_UNITEC

# Instalar dependencias (si es primera vez)
npm install

# Compilar el proyecto
npm run build

# Verificar que se generaron archivos con prefijo -unitec
ls -la dist/assets/
# Debería mostrar:
# index-unitec-xxxxx.js
# index-unitec-xxxxx.css
```

#### 1.2 Verificar estructura de archivos

```
Agente_Poc_UNITEC/
├── agente-retencion.php       ✓ (modificado con handles únicos)
├── vite.config.ts             ✓ (modificado con prefijo -unitec)
├── SRC/
│   ├── main.tsx              ✓ (modificado para buscar agente-unitec-root)
│   ├── Lib/
│   │   └── backendAdapter.ts ✓ (modificado para GERO_CONFIG_UNITEC)
│   └── ...
├── index.html                ✓ (modificado con agente-unitec-root)
└── dist/
    └── assets/
        ├── index-unitec-*.js
        └── index-unitec-*.css
```

---

### Fase 2: Despliegue en SiteGround

#### 2.1 Acceso a SiteGround

```
1. Ir a: https://www.siteground.com/login
2. Ingresar credenciales
3. Ir a: File Manager → WordPress Root
4. Navegar a: wp-content/plugins/
```

#### 2.2 Subir archivos modificados (Opción A: Manual)

```
1. Crear carpeta: wp-content/plugins/Agente_Poc_UNITEC/
   (si no existe)

2. Subir archivo actualizado:
   agente-retencion.php

3. Subir carpeta completa:
   dist/ (con los archivos compilados)

4. Subir archivos modificados:
   - index.html
   - vite.config.ts
   - SRC/main.tsx
   - SRC/Lib/backendAdapter.ts
```

#### 2.2 Subir archivos modificados (Opción B: FTP/SFTP)

```bash
# Usando sftp (recomendado)
sftp username@siteground-ftp-server

cd wp-content/plugins/

# Navegar a Agente_Poc_UNITEC
cd Agente_Poc_UNITEC

# Subir los cambios principales
put agente-retencion.php

# Subir directorio dist completo (con caché limpiado)
put -r dist/

# Subir archivos de configuración
put index.html
put vite.config.ts
put SRC/main.tsx
put SRC/Lib/backendAdapter.ts
```

#### 2.3 Limpiar caché en SiteGround

```
1. En SiteGround Panel:
   - Ir a: Tools → Cloudflare Cache
   - Hacer click en "Purge Cache"
   
2. Si usan cache de PHP:
   - Ir a: Tools → PHP Info
   - Reiniciar PHP si es posible

3. En WordPress:
   - Plugins → WP Super Cache (si está instalado)
   - Click en "Delete Cache"
```

#### 2.4 Verificar en WordPress

```
1. En WordPress admin:
   - Plugins → Buscar "Agente_Poc_UNITEC"
   - Verificar que está activado

2. Crear/editar página con shortcode:
   [agente-retencion]
   
3. Publicar página
```

---

### Fase 3: Verificación en Navegador

#### 3.1 Abrir Developer Tools

```
1. Ir a página con [shortcode agente-retencion]
2. Presionar: F12 (o Ctrl+Shift+I)
3. Ir a pestaña: Network
```

#### 3.2 Verificar Scripts/Styles

```
En Network tab, buscar:
✓ index-unitec-*.js     (nombre con prefijo UNITEC)
✓ index-unitec-*.css    (nombre con prefijo UNITEC)

❌ NUNCA debería cargar:
❌ index.js (sin prefijo)
❌ index.css (sin prefijo)

Si ve los incorrectos:
- Ir a Developer Tools → Application → Cache
- Clear All Site Data
- Recargar página (Ctrl+Shift+R para hard refresh)
```

#### 3.3 Verificar Variables Globales

```
En Console (F12 → Console):

// Debería existir:
window.GERO_CONFIG_UNITEC
{rest_base: "https://...", nonce: "...", modal: "true"}

// También puede existir (de otro agente):
window.GERO_CONFIG
{rest_base: "https://...", nonce: "...", modal: "true"}

// Pero SIN interferencias - son objetos separados
```

#### 3.4 Verificar Elemento Root

```
En Console:
document.getElementById("agente-unitec-root")
// Debería retornar: <div id="agente-unitec-root" data-modal="true"></div>

// NUNCA debería retornar:
document.getElementById("agente-prototype-root")
// (ese es para Agente_Poc)
```

#### 3.5 Prueba Funcional

```
1. Ingresa una matrícula válida en el agente
2. Completa el cuestionario
3. Inicia chat con el agente
4. Envía mensaje
5. Verifica en Console: Network → XHR
   - Las peticiones van a: /wp-json/gero/v1/*
   - Status 200 OK
   - Response valida (JSON)
```

---

### Fase 4: Validación de Independencia

#### 4.1 Comparar ambos agentes

```
1. Abrir en un navegador:
   - Tab 1: Página con Agente_Poc
   - Tab 2: Página con Agente_Poc_UNITEC

2. En cada tab, abrir Console:

Tab 1 (Agente_Poc):
- window.GERO_CONFIG = {...}
- document.getElementById("agente-prototype-root") = <div>

Tab 2 (Agente_Poc_UNITEC):
- window.GERO_CONFIG_UNITEC = {...}
- document.getElementById("agente-unitec-root") = <div>

3. Verificar que son DIFERENTES y NO interfieren
```

#### 4.2 Prueba de Diseño Independiente

```
1. En Console (Tab 2 - UNITEC):
   - Buscar elemento de clase CSS específica
   - Cambiar su background color

2. Volver a Tab 1 (Agente_Poc):
   - Ese elemento NO debería haber cambiado
   - Confirma que CSS están aislados
```

---

## 🔧 Troubleshooting

### Problema: Se cargan archivos sin prefijo -unitec

**Causa:** Cache viejo o build incorrecto

**Solución:**
```bash
# En local:
cd Agente_Poc_UNITEC
rm -rf dist/
npm run build

# Verificar archivos generados
ls dist/assets/
# Debería tener -unitec en los nombres

# Subir nuevamente a SiteGround
# Limpiar caché de SiteGround (ver Fase 3.1)
```

### Problema: No aparece el agente en la página

**Causa:** Elemento root incorrecto o script no cargó

**Solución:**
```javascript
// En Console, verificar:
console.log(document.getElementById("agente-unitec-root"));
// Si retorna null → el div no existe en el HTML

// Verificar si el script cargó:
console.log(window.GERO_CONFIG_UNITEC);
// Si retorna undefined → el script PHP no se ejecutó

// Ver errores en Console
// Buscar mensajes rojos de error
```

### Problema: Conflictos con Agente_Poc

**Causa:** Ambos agentes están cargando en la misma página

**Solución:**
```
1. Verificar que en cada página solo hay UN shortcode:
   [agente-retencion]
   
2. Si necesitas ambos en la misma página:
   - Editar agente-retencion.php
   - Usar parámetro: [agente-retencion agente="unitec"]
   - Implementar lógica condicional en PHP
   
3. Idealmente, cada agente en página separada:
   - /pagina-agente-poc → [shortcode agente-retencion]
   - /pagina-agente-unitec → [shortcode agente-retencion]
```

### Problema: API retorna error 404

**Causa:** Ruta base incorrecta en GERO_CONFIG_UNITEC

**Solución:**
```php
// En agente-retencion.php, verificar:
wp_localize_script($js_handle, 'GERO_CONFIG_UNITEC', [
  'rest_base' => esc_url_raw( rest_url( 'gero/v1' ) ),  // ← Debe ser correcto
  // ...
]);

// En Console, verificar:
console.log(window.GERO_CONFIG_UNITEC.rest_base);
// Debería ser: https://tudominio.com/wp-json/gero/v1

// Si es incorrecto, editar agente-retencion.php y resubir
```

---

## 📋 Checklist de Implementación

- [ ] Compilar localmente: `npm run build`
- [ ] Verificar prefijo -unitec en archivos generados
- [ ] Subir archivos a SiteGround (FTP/File Manager)
- [ ] Limpiar caché de SiteGround
- [ ] Limpiar caché local del navegador (Ctrl+Shift+Del)
- [ ] Crear página con shortcode `[agente-retencion]`
- [ ] Abrir en navegador y F12 (DevTools)
- [ ] Verificar carga de index-unitec-*.js
- [ ] Verificar carga de index-unitec-*.css
- [ ] Verificar GERO_CONFIG_UNITEC en Console
- [ ] Verificar elemento #agente-unitec-root en Console
- [ ] Probar funcionalidad: matricula → cuestionario → chat
- [ ] Comparar con Agente_Poc en otra tab
- [ ] Confirmar que Agente_Poc NO se vio afectado
- [ ] Documentar cualquier cambio en SiteGround

---

## 🎯 Próximos Pasos

### Después de la separación completa:

1. **Desarrollar interfaces independientes:**
   - Agente_Poc: mantener look & feel actual
   - Agente_Poc_UNITEC: implementar diseño específico UNITEC

2. **Compartir backend si es necesario:**
   - APIs en `/wp-json/gero/v1` funcionan para ambos
   - Base de datos centralizada en WordPress

3. **Monitoreo de cambios:**
   - Si cambias algo en Agente_Poc, verifica que no afecte UNITEC
   - Si cambias algo en UNITEC, verifica que no afecte Agente_Poc

4. **Testing de integración:**
   - Crear script de testing que verifique separación
   - Automatizar verificación de conflictos

---

## 📞 Soporte

Si necesitas ayuda:

1. **Verificar logs de WordPress:**
   - wp-admin → Tools → Site Health
   - Buscar mensajes de error

2. **Verificar logs de PHP:**
   - En SiteGround → Tools → PHP Info
   - Buscar error_log

3. **Verificar console del navegador:**
   - F12 → Console
   - Buscar mensajes rojo/amarillo

4. **Documentar el problema:**
   - Screenshot de DevTools
   - URL de página donde ocurre
   - Navegador/versión utilizado
