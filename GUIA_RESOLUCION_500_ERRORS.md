# 🔧 Guía de Resolución de Errores 500 en Staging

## 📊 Resumen del Problema

```
GET https://staging2.geroeducacion.com/agente-unitec-02/ → 500
GET https://staging2.geroeducacao.com/favicon.ico → 500
```

El error 500 indica un error interno del servidor (backend), no un problema de frontend.

---

## 🔍 PASO 1: Verificar Acceso al Servidor

### Via SSH (Recomendado)

```bash
# Conectar al servidor
ssh usuario@staging2.geroeducacion.com

# Navegar a la raíz de WordPress
cd /var/www/agente-unitec-02
# O donde esté alojado WordPress

# Listar archivos
ls -la

# Ver si existe el archivo de error log
tail -50 wp-content/debug.log
```

### Si no tienes acceso SSH

1. Sube los 2 archivos de diagnóstico a la raíz de WordPress:
   - `DIAGNOSTICO_SIMPLE.php` (no requiere WordPress)
   - `DIAGNOSTICO.php` (requiere WordPress)

2. Accede a: `https://staging2.geroeducacion.com/DIAGNOSTICO_SIMPLE.php`

3. Comparte la salida conmigo

---

## 🔍 PASO 2: Diagnosticar El Problema

### 2.1 Verificar que WordPress está activo

```bash
# Revisa que wp-config.php existe
ls -la wp-config.php

# Verifica valores clave
grep -E "DB_NAME|DB_USER|DB_HOST" wp-config.php
```

### 2.2 Revisar el error log de PHP

```bash
# WordPress debug.log
tail -100 wp-content/debug.log | grep -i error

# Logs del sistema (si tienes acceso root)
tail -100 /var/log/apache2/error.log
# O para Nginx:
tail -100 /var/log/nginx/error.log
```

### 2.3 Verificar la carpeta del plugin

```bash
# ¿Dónde está el plugin?
find . -name "agente-retencion-unitec-02.php" 2>/dev/null

# Debería estar en uno de estos lugares:
ls -la wp-content/plugins/agente-retencion-unitec-02.php
ls -la wp-content/plugins/agente-retencion-unitec-02/agente-retencion-unitec-02.php
```

### 2.4 Validar sintaxis PHP

```bash
# Verifica sintaxis del plugin
php -l wp-content/plugins/agente-retencion-unitec-02.php

# Si hay error, mostrará "Parse error"
```

### 2.5 Verificar permisos

```bash
# Los permisos deben ser 644 para archivos, 755 para directorios
ls -la wp-content/plugins/ | grep agente
chmod 644 wp-content/plugins/agente-retencion-unitec-02.php
chmod 755 wp-content/plugins/agente-retencion-unitec-02/
```

---

## 🔍 PASO 3: Soluciones Comunes

### Problema: "Class 'WP_REST_Request' not found"

**Causa:** El plugin se está cargando en WP-CLI o contexto sin WordPress cargado

**Solución:** En el archivo PHP, al inicio después del header del plugin:

```php
<?php
/*
Plugin Name: Agente de retención - UNITEC 02
...
*/

// Verificar que WordPress está disponible
if ( ! defined( 'ABSPATH' ) ) {
    // Si no está disponible, salir silenciosamente
    die( 'Direct access to this file is not allowed.' );
}
```

✅ **YA EXISTE** en línea 13-15 del archivo

---

### Problema: "Fatal error: Undefined constant 'GERO_RISK_CATEGORIES'"

**Causa:** El plugin no se está cargando correctamente

**Solución:** Verifica el archivo con:

```bash
php -l agente-retencion-unitec-02.php

# Si hay errores de sintaxis, muéstralos aquí
```

---

### Problema: REST API no disponible

**Causa:** WordPress REST API deshabilitado o plugin no activado

**Solución:**

```bash
# Desde wp-cli (si está disponible):
wp plugin list
wp plugin activate agente-retencion-unitec-02

# O via dashboard:
# 1. Admin -> Plugins
# 2. Busca "Agente de retención"
# 3. Haz clic en "Activate"
```

---

### Problema: favicon.ico 500

**Causa:** Dos posibles razones:

1. **El servidor intenta procesarlo como PHP**
   ```nginx
   # nginx: añade esta línea al config
   location = /favicon.ico {
       access_log off;
       log_not_found off;
       # No procesar como PHP, servir como archivo estático
   }
   ```

2. **El archivo no existe**
   - Verifica que existe: `/public/favicon.svg`
   - O sube un `favicon.ico` tradicional

---

## 📋 CHECKLIST DE DESPLIEGUE

- [ ] WordPress 5.0+ está activo
- [ ] PHP 7.4+ está disponible
- [ ] Plugin `agente-retencion-unitec-02.php` está en `wp-content/plugins/`
- [ ] Plugin está **activado** en el dashboard
- [ ] `wp-content/debug.log` no muestra errores del plugin
- [ ] Tabla `wp_gero_crisis_states` se creó automáticamente
- [ ] REST API está habilitado: `GET /wp-json/` devuelve 200
- [ ] Permisos son correctos: `644` archivos, `755` directorios
- [ ] favicon.svg existe en `/public/`
- [ ] `/favicon.ico` está configurado para servirse estático (no como PHP)

---

## 🔧 INSTALACIÓN MANUAL DEL PLUGIN

Si el plugin no está activado:

```bash
# 1. Copiar el archivo
cp agente-retencion-unitec-02.php /var/www/staging/wp-content/plugins/

# 2. Cambiar permisos
chmod 644 /var/www/staging/wp-content/plugins/agente-retencion-unitec-02.php

# 3. Activar via WP-CLI
wp plugin activate agente-retencion-unitec-02 --allow-root

# 4. Verificar que está activo
wp plugin list --allow-root | grep gero
```

---

## 🧪 Test de Endpoints

Una vez que el plugin esté activado, prueba estos endpoints:

```bash
# Test 1: REST API Base (debe devolver 200)
curl -I https://staging2.geroeducacion.com/wp-json/

# Test 2: Nuestro endpoint de guardar crisis (debe devolver 200, aunque rechace POST sin parámetros)
curl -X POST https://staging2.geroeducacion.com/wp-json/gero/v1/guardar-conversation-state \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "conversation_state": "test"}'

# Test 3: Frontend
curl -I https://staging2.geroeducacion.com/agente-unitec-02/
```

---

## 📞 Información a Proporcionar

Cuando contactes con el soporte del hosting, proporciona:

1. **Salida de DIAGNOSTICO_SIMPLE.php**
2. **Últimas 50 líneas de wp-content/debug.log**
3. **Salida de:**
   ```bash
   php -l agente-retencion-unitec-02.php
   wp plugin list
   wp plugin activate agente-retencion-unitec-02
   ```
4. **Versión de PHP**
5. **Versión de WordPress**
6. **Server Software (Apache o Nginx)**

---

## ✅ Una Vez Resuelto

Cuando hayas arreglado el servidor:

1. Prueba cargar: `https://staging2.geroeducacion.com/agente-unitec-02/`
2. Debe mostrar la página inicial del agente
3. Completa el flujo del cuestionario
4. Verifica que no hay errores de consola (F12)
5. Confirma que el favicon.svg carga (debes ver la "U" en la pestaña)

---

## 📚 Recursos Útiles

- [WordPress REST API Docs](https://developer.wordpress.org/rest-api/)
- [Debug en WordPress](https://wordpress.org/support/article/debugging-in-wordpress/)
- [WP-CLI Reference](https://developer.wordpress.org/cli/commands/)

