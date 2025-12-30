# 🚀 SOLUCIÓN ERROR 500 - SiteGround

**Error:** `GET https://staging2.geroeducacion.com/agente-unitec-02/ → 500 (Internal Server Error)`

---

## ⚡ SOLUCIÓN RÁPIDA (3 pasos)

### Paso 1: Activar el Plugin (CRÍTICO)
```bash
# SSH a SiteGround
ssh usuario@staging2.geroeducacion.com

# Navegar a WordPress
cd /home/tu-cuenta/public_html/

# Activar el plugin (ESTO ES LO MÁS IMPORTANTE)
wp plugin activate agente-retencion-unitec-02 --allow-root

# Verificar que está activo
wp plugin list --allow-root | grep gero
# Debería mostrar: agente-retencion-unitec-02 | active
```

### Paso 2: Verificar REST API
```bash
# Probar REST API
curl -I https://staging2.geroeducacion.com/wp-json/
# Debe devolver: 200 OK

# Probar endpoint específico
curl -I https://staging2.geroeducacion.com/wp-json/gero/v1/validar-matricula-02
# Debe devolver: 200 OK (o 405 pero no 500)
```

### Paso 3: Probar Frontend
```
Abre en navegador:
https://staging2.geroeducacion.com/agente-unitec-02/

Debe cargar sin error 500
```

---

## 🔍 SI SIGUE DANDO ERROR 500

### Opción A: Usar Diagnóstico Automático

1. **Sube este archivo a SiteGround:**
   - `DIAGNOSTICO_PLUGIN.php`
   - Ubicación: `/public_html/` (raíz de WordPress)

2. **Accede en navegador:**
   ```
   https://staging2.geroeducacion.com/DIAGNOSTICO_PLUGIN.php
   ```

3. **Lee el diagnóstico completo:**
   - Te dirá exactamente dónde está el problema
   - Proporciona soluciones específicas

4. **Comparte conmigo:**
   - La salida completa del diagnóstico
   - Así identifico qué falta

---

### Opción B: Verificación Manual

```bash
# 1. Verificar que el archivo existe
ls -la /home/tu-cuenta/public_html/wp-content/plugins/ | grep agente

# Debe mostrar:
# -rw-r--r-- 1 tu-user grupo 61K agente-retencion-unitec-02.php

# 2. Si NO existe, sube el archivo
scp agente-retencion-unitec-02.php usuario@staging2.geroeducacion.com:/home/tu-cuenta/public_html/wp-content/plugins/

# 3. Corregir permisos
chmod 644 /home/tu-cuenta/public_html/wp-content/plugins/agente-retencion-unitec-02.php

# 4. Activar plugin
wp plugin activate agente-retencion-unitec-02 --allow-root

# 5. Ver el error log
tail -50 /home/tu-cuenta/public_html/wp-content/debug.log | grep -i error
```

---

## 📋 CHECKLIST DE VERIFICACIÓN

- [ ] Archivo `agente-retencion-unitec-02.php` está en `/wp-content/plugins/`
- [ ] Plugin está **ACTIVADO** (wp plugin list muestra "active")
- [ ] `/wp-json/` devuelve 200 OK
- [ ] `/wp-json/gero/v1/validar-matricula-02` devuelve 200 o 405 (pero NO 500)
- [ ] `dist/` está subido a `/agente-unitec-02/`
- [ ] `https://dominio.com/agente-unitec-02/` carga sin error 500

---

## 🎯 PASO A PASO EN SITEGROUND (Vía cPanel)

### Si no tienes SSH, usa el File Manager:

**1. Subir el Plugin:**
- Accede a cPanel → File Manager
- Navega a: `public_html/wp-content/plugins/`
- Sube: `agente-retencion-unitec-02.php`
- Permisos: 644 (clic derecho → Permissions)

**2. Subir el Frontend:**
- Crea carpeta: `public_html/agente-unitec-02`
- Dentro, sube TODO lo de `dist/` (o usa FTP)

**3. Activar el Plugin:**
- Accede a: `tu-dominio.com/wp-admin`
- Ve a: Plugins → Installed Plugins
- Busca: "Agente de retención"
- Haz clic: "Activate"

**4. Verificar:**
- Abre: `https://tu-dominio.com/agente-unitec-02/`
- Debe cargar sin error 500

---

## 🔧 UBICACIÓN CORRECTA DE ARCHIVOS

```
SiteGround (/home/tu-cuenta/public_html/)
│
├── wp-content/plugins/
│   └── agente-retencion-unitec-02.php ← AQUÍ va el plugin
│
├── agente-unitec-02/ ← AQUÍ va el frontend
│   ├── index.html
│   ├── favicon.svg
│   ├── assets/
│   │   ├── index-unitec-*.js
│   │   └── index-unitec-*.css
│   └── ...
│
└── [otros archivos WordPress]
```

---

## 🆘 SI SIGUE SIN FUNCIONAR

### Información a proporcionar:

```bash
# Recopila esta información y comparte:

echo "=== DIAGNÓSTICO SITEGROUND ===" > diagnostico.txt

# 1. Versión PHP
php -v >> diagnostico.txt

# 2. Versión WordPress
wp core version --allow-root >> diagnostico.txt

# 3. ¿Plugin existe?
ls -la wp-content/plugins/agente-retencion-unitec-02.php >> diagnostico.txt

# 4. ¿Está activado?
wp plugin list --allow-root | grep gero >> diagnostico.txt

# 5. Errores recientes
tail -50 wp-content/debug.log | grep -i error >> diagnostico.txt

# 6. Estado REST API
curl -I https://tu-dominio.com/wp-json/ >> diagnostico.txt
```

Comparte el archivo `diagnostico.txt` conmigo para resolver el problema.

---

## ✅ SOLUCIÓN DEFINITIVA

**Si el plugin está ACTIVADO y sigue dando 500:**

El problema es que el frontend React no está cargando correctamente. Verifica:

1. **¿La carpeta `dist/` existe en `/agente-unitec-02/`?**
   ```bash
   ls -la /home/tu-cuenta/public_html/agente-unitec-02/
   ```
   Debe tener: `index.html`, `favicon.svg`, `assets/`

2. **¿El index.html está ahí?**
   ```bash
   file /home/tu-cuenta/public_html/agente-unitec-02/index.html
   ```

3. **¿Es accesible?**
   ```bash
   curl -I https://staging2.geroeducacion.com/agente-unitec-02/index.html
   # Debe devolver: 200 OK
   ```

Si devuelve 404, el frontend no está donde debería estar.

---

## 🎉 CUANDO ESTÉ FUNCIONANDO

Verás:
- ✅ Página de inicio del agente carga
- ✅ Formulario de cuestionario visible
- ✅ Favicon U visible en la pestaña
- ✅ No hay errores en consola (F12)

Luego prueba el flujo completo:
1. Llena cuestionario P1-P9
2. Prueba crisis detection (escribe "suicidarme")
3. Accede al chat ALEX
4. Verifica que se guarda en base de datos

---

**¿Necesitas ayuda? Comparte:**
- Salida del diagnóstico
- URL del dominio
- Acceso SSH o cPanel (si es necesario)

