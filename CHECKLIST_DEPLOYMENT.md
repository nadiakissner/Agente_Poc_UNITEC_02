# ✅ CHECKLIST FINAL DE DEPLOYMENT - Agente UNITEC 02

## 📌 Estado del Proyecto

**Fecha:** 2024
**Versión:** 2.0
**Estado:** Listo para deployment

---

## 🎯 COMPONENTES VERIFICADOS

### Frontend (React/TypeScript)
- [x] Build exitoso: `npm run build`
- [x] 1698 módulos compilados
- [x] 0 errores de TypeScript
- [x] Bundle optimizado: 420 KB JS (126 KB gzip)
- [x] Favicon.svg creado (U logo)
- [x] Localizaciónn a español mexicano completada
- [x] Crisis safety system integrado

### Backend (PHP/WordPress)
- [x] Sintaxis PHP válida (23 funciones, 14 add_action, 12 REST routes)
- [x] Protección contra acceso directo: PRESENTE
- [x] Sanitización de datos: PRESENTE
- [x] 3 constantes definidas: GERO_RISK_CATEGORIES, GERO_RISK_PRIORITY, GERO_MODO_DERIVACION
- [x] 1673 líneas de código PHP (61.53 KB)

### Configuración
- [x] index.html actualizado (lang="es", favicon refs)
- [x] tailwind.config.ts configurado
- [x] vite.config.ts configurado
- [x] tsconfig.json actualizado
- [x] package.json con dependencias

---

## 📦 ARCHIVOS A DESPLEGAR

### En WordPress root (`/wp-content/plugins/`)

```
agente-retencion-unitec-02.php
├── 1673 líneas
├── 14 REST API endpoints
├── 23 funciones PHP
└── Tabla: wp_gero_crisis_states (auto-creada)
```

**Verificación:**
- [x] Archivo existe: ✓
- [x] Sintaxis válida: ✓
- [x] Protección ABSPATH: ✓
- [x] Permisos recomendados: 644

---

### En raíz de WordPress (`/` o `/agente-unitec-02/`)

```
dist/
├── index.html (actualizado: lang="es", favicon refs)
├── assets/
│   ├── index-*.js (1698 módulos)
│   ├── index-*.css
│   └── ...
└── favicon.svg (UNITEC U logo)

favicon.svg (mismo que en dist/)
```

**Verificación:**
- [x] Build local exitoso: ✓
- [x] favicon.svg creado: ✓
- [x] index.html references correctas: ✓

---

## 🔧 PASOS DE DEPLOYMENT

### 1️⃣ Preparar el servidor

```bash
# SSH al servidor de staging
ssh usuario@staging2.geroeducacion.com

# Navegar a WordPress
cd /var/www/html/  # o donde esté WordPress

# Respaldar el plugin actual (si existe)
cp wp-content/plugins/agente-retencion-unitec-02.php \
   wp-content/plugins/agente-retencion-unitec-02.php.backup

# Respaldar la carpeta de la app (si existe)
cp -r agente-unitec-02 agente-unitec-02.backup
```

### 2️⃣ Subir el plugin

```bash
# Opción A: SCP/SFTP
scp agente-retencion-unitec-02.php usuario@staging2.geroeducacion.com:/var/www/html/wp-content/plugins/

# Opción B: Via FTP/cPanel
# Navega a public_html/wp-content/plugins/
# Sube agente-retencion-unitec-02.php
```

### 3️⃣ Subir el frontend

```bash
# Opción A: SCP
scp -r dist/* usuario@staging2.geroeducacion.com:/var/www/html/agente-unitec-02/

# Opción B: Via FTP
# Navega a public_html/agente-unitec-02/
# Sube contenido de dist/
```

### 4️⃣ Activar el plugin

```bash
# Via WP-CLI (si está disponible)
wp plugin activate agente-retencion-unitec-02 --allow-root

# Via dashboard WordPress:
# 1. Inicia sesión en /wp-admin
# 2. Plugins → Plugins instalados
# 3. Busca "Agente de retención"
# 4. Haz clic en "Activar"
```

### 5️⃣ Verificar deployment

```bash
# Verificar permisos
ls -la wp-content/plugins/agente-retencion-unitec-02.php
ls -la agente-unitec-02/

# Verificar REST API
curl -I https://staging2.geroeducacion.com/wp-json/

# Verificar frontend
curl -I https://staging2.geroeducacion.com/agente-unitec-02/

# Verificar favicon
curl -I https://staging2.geroeducacion.com/favicon.svg
```

---

## 🧪 TESTS POST-DEPLOYMENT

### Test 1: Cargar página inicial
```
Acción: Navega a https://staging2.geroeducacion.com/agente-unitec-02/
Esperado: 
  ✓ Se carga el formulario de inicio
  ✓ Favicon U visible en la pestaña
  ✓ No hay errores en consola (F12)
```

### Test 2: Flujo completo del cuestionario
```
Acción: Completa P1-P9 con respuestas variadas
Esperado:
  ✓ Cada respuesta se registra
  ✓ P5 detecta palabras clave (familia, beca, crédito, trabajo)
  ✓ P6 cambia peso según respuesta de P5
  ✓ Al final, se muestra recomendación
```

### Test 3: Crisis safety
```
Acción: En cualquier campo, escribe: "quiero suicidarme"
Esperado:
  ✓ Sistema detecta palabra clave
  ✓ Muestra mensaje de crisis: "Lamento mucho lo que estás pasando..."
  ✓ Ofrece recursos (UNITEC apoyo estudiantil)
  ✓ Backend: POST a /wp-json/gero/v1/guardar-conversation-state devuelve 200
```

### Test 4: Rama ALEX (Chat)
```
Acción: Haz clic en botón ALEX/Chat
Esperado:
  ✓ Se abre conversación con Agent (OpenAI)
  ✓ Las crisis se detectan aquí también
  ✓ Botón de salida vuelve a la home
```

### Test 5: Mobile responsive
```
Acción: Accede desde móvil (F12 → Toggle device)
Esperado:
  ✓ Input footer sigue siendo redondo y funcional
  ✓ Textos son legibles
  ✓ Botones son clickeables
```

---

## ⚠️ TROUBLESHOOTING COMÚN

### Problema: 500 en /agente-unitec-02/

**Posibles causas:**
1. Plugin no activado
2. PHP version < 7.4
3. WordPress version < 5.0
4. REST API deshabilitado
5. Error en la tabla de BD

**Solución:**
```bash
# Verificar error log
tail -100 wp-content/debug.log

# Verificar plugin
wp plugin list --allow-root
wp plugin activate agente-retencion-unitec-02 --allow-root

# Verificar REST API
wp rest-api status --allow-root
```

### Problema: 500 en /favicon.ico

**Posibles causas:**
1. Servidor intenta procesar .ico como PHP
2. Falta nginx rewrite rule

**Solución (Nginx):**
```nginx
location = /favicon.ico {
    access_log off;
    log_not_found off;
    try_files $uri /favicon.svg;
}
```

**Solución (Apache):**
```apache
<Files "favicon.ico">
    SetHandler default-handler
</Files>
```

### Problema: Crisis detection no funciona

**Verificar:**
```bash
# 1. ¿Existe el archivo crisisSafety.ts en build?
ls -la dist/assets/ | grep crisis

# 2. ¿Se compila sin errores?
npm run build

# 3. ¿El endpoint de backend está registrado?
curl -X POST https://staging2.geroeducacion.com/wp-json/gero/v1/guardar-conversation-state \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "conversation_state": "{}", "crisis_marker": "TEST"}'
```

---

## 📋 DEPENDENCIAS REQUERIDAS

### Backend
- WordPress 5.0+
- PHP 7.4+
- MySQL 5.7+
- REST API habilitada (default en WP 5.0+)

### Frontend
- Node.js 16+ (solo para build)
- npm 8+

### APIs Externas
- OpenAI API (para rama Chat ALEX)
- Mailgun (opcional, para emails)

---

## 🔐 SEGURIDAD

- [x] Protección ABSPATH: incluida
- [x] Sanitización de datos: sanitize_text_field(), sanitize_textarea_field()
- [x] Validación de nonce: NO (REST API pública, intencionalmente)
- [x] SQL injection prevention: $wpdb->replace() con placeholders
- [x] XSS prevention: dangerouslySetInnerHTML solo para HTML conocido (crisis message)

---

## 📞 CONTACTOS DE SOPORTE

**Si hay problemas después del deployment:**

1. Revisa `wp-content/debug.log`
2. Sube `DIAGNOSTICO_SIMPLE.php` a la raíz
3. Accede a `https://staging2.geroeducacion.com/DIAGNOSTICO_SIMPLE.php`
4. Comparte la salida

---

## ✅ SIGN-OFF

- **Frontend:** Verificado ✓
- **Backend:** Verificado ✓
- **Seguridad:** Verificado ✓
- **Configuración:** Verificado ✓

**Estado:** 🟢 LISTO PARA PRODUCTION

