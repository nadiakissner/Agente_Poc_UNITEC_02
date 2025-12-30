# Debugging y Manejo de Errores - Clasificación de Riesgos

## 🐛 Troubleshooting Guía Completa

---

## 1️⃣ Verificar que el Plugin está Activo

### En WordPress Admin
```
Dashboard → Plugins → Buscar "Agente de retención UNITEC 02"
Estado: Debe mostrar "Activo" en verde
```

### Por línea de comandos (WP-CLI)
```bash
wp plugin list | grep agente
wp plugin activate agente-retencion-unitec-02/agente-retencion-unitec-02.php
```

### Verificar registración de endpoints
```bash
curl -s http://tu-sitio.local/wp-json/ | grep gero
```

Debería devolver:
```json
{
  "_links": {
    "https://api.w.org/": [
      { "href": "http://tu-sitio.local/wp-json/wp/v2/" }
    ]
  },
  "namespace": "gero/v1",
  ...
}
```

---

## 2️⃣ Verificar Configuración de OpenAI API

### Paso 1: Confirmar API Key está definida

```bash
# En wp-config.php, debe existir:
grep "OPENAI_API_KEY" wp-config.php
```

Debería mostrar:
```php
define( 'OPENAI_API_KEY', 'sk-...' );
```

### Paso 2: Probar conexión a OpenAI

```bash
# Desde línea de comandos
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer sk-YOUR-KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hola"}],
    "temperature": 0.5
  }'
```

Respuesta exitosa tendrá:
```json
{
  "choices": [
    {
      "message": {
        "content": "¡Hola! ¿Cómo puedo ayudarte?"
      }
    }
  ]
}
```

### Paso 3: Verificar cuota de OpenAI

1. Ir a https://platform.openai.com/account/billing/overview
2. Verificar que tienes crédito disponible
3. Revisar límites de uso

---

## 3️⃣ Verificar Tabla en Base de Datos

### Ver si la tabla existe

```sql
USE nombre_base_datos;
SHOW TABLES LIKE 'byw_agente_retencion';
```

Debe mostrar:
```
+--------------------------------+
| Tables_in_db (byw_agente_retencion) |
+--------------------------------+
| byw_agente_retencion         |
+--------------------------------+
```

### Si no existe, crear:

```sql
-- Copiar el contenido de schema_byw_agente_retencion.sql
-- y ejecutar en phpMyAdmin o MySQL Workbench
```

### Ver estructura de la tabla

```sql
DESCRIBE byw_agente_retencion;
```

Debe mostrar todas estas columnas:
```
+---------------------------+-----------+
| Field                     | Type      |
+---------------------------+-----------+
| id                        | int(11)   |
| user_email                | varchar   |
| prioridad_caso            | enum      |
| justificacion             | json      |
| justificacion_cuestionario| longtext  |
| ruta_seguida              | varchar   |
| fecha_cuestionario        | datetime  |
| fecha_finalizacion        | datetime  |
| created_at                | timestamp |
| updated_at                | timestamp |
+---------------------------+-----------+
```

---

## 4️⃣ Verificar que los Hooks se Registran

### Ver en debug.log

```bash
tail -f /wp-content/debug.log
```

Buscar logs durante una prueba. Deberían aparecer:
```
✅ Clasificación de cuestionario guardada para: user@example.com
✅ Clasificación de ruta guardada para: user@example.com - Prioridad: alto
```

### Verificar wp-cron está activo

```bash
# Verificar si wp-cron está habilitado
wp config get DISABLE_WP_CRON

# Si devuelve 'true', está deshabilitado. Para activarlo:
wp config set DISABLE_WP_CRON false
```

### Si wp-cron está deshabilitado, agregar a crontab

```bash
# Editar crontab
crontab -e

# Agregar esta línea:
*/5 * * * * wget -q -O - https://tu-sitio.com/wp-cron.php?doing_wp_cron >/dev/null 2>&1
```

---

## 5️⃣ Probar Endpoints Directamente

### Test 1: Procesar Cuestionario

```bash
curl -X POST "http://tu-sitio.local/wp-json/gero/v1/procesar-fin-cuestionario" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "respuestas": {
      "P1": "Con algo de incertidumbre",
      "P2": "Preocupación económica",
      "P3": [1, "Muy poco preparado"]
    },
    "riesgos": ["economica", "desorientacion"]
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Cuestionario recibido. Procesando en background..."
}
```

**Si falla, busca estos errores:**
```
Error 400: "Faltan parámetros"
→ Verificar que user_id existe en byw_usuarios_habilitados

Error 404: "Not found"
→ El plugin no está activo o el endpoint no está registrado

Error 500: "Internal Server Error"
→ Ver logs en /var/log/apache2/error.log
```

### Test 2: Procesar Ruta

```bash
curl -X POST "http://tu-sitio.local/wp-json/gero/v1/procesar-fin-ruta" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "ruta": "RouteA",
    "conversacion": [
      {"sender": "agent", "message": "Hola, ¿cómo estás?"},
      {"sender": "user", "message": "Tengo dudas sobre mi carrera"}
    ]
  }'
```

---

## 6️⃣ Verificar Datos en Base de Datos

### Después de ejecutar test 1, verificar:

```sql
SELECT * FROM byw_agente_retencion WHERE user_email = 'email@del.usuario';
```

**Esperado (después de 5-10 segundos):**
- `prioridad_caso`: 'pendiente'
- `justificacion_cuestionario`: Tendrá texto análisis
- `fecha_cuestionario`: Hora actual
- `fecha_finalizacion`: NULL (todavía)

### Después de ejecutar test 2, verificar:

```sql
SELECT 
  user_email,
  prioridad_caso,
  justificacion,
  ruta_seguida,
  fecha_finalizacion
FROM byw_agente_retencion 
WHERE user_email = 'email@del.usuario';
```

**Esperado:**
- `prioridad_caso`: 'alto' | 'medio' | 'bajo' (ya no 'pendiente')
- `justificacion`: JSON con dos campos:
  ```json
  {
    "cuestionario": "Análisis inicial...",
    "ruta": "Análisis final..."
  }
  ```
- `ruta_seguida`: 'RouteA'
- `fecha_finalizacion`: Hora actual

---

## 7️⃣ Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| **404 Not Found** | Endpoint no existe | Verificar que plugin está activo: `wp plugin list` |
| **400 Bad Request** | Parámetros incompletos | Incluir `user_id`, `respuestas`, `riesgos` |
| **400 Usuario no encontrado** | User ID no existe | Crear usuario en `byw_usuarios_habilitados` |
| **500 OPENAI_API_KEY no configurada** | Falta la constante en wp-config.php | Agregar `define('OPENAI_API_KEY', 'sk-...');` |
| **500 JSON inválido en respuesta de LLM** | OpenAI no devolvió JSON | Esperar, reintentar. Ver logs |
| **Tabla no existe** | No se ejecutó SQL | Crear tabla con script schema_byw_agente_retencion.sql |
| **Datos no se guardan después de 10 seg** | wp-cron no está corriendo | Activar wp-cron o agregar a crontab del servidor |
| **502 Bad Gateway** | Timeout en OpenAI | Aumentar timeout a 45 segundos |

---

## 8️⃣ Ver Logs en Tiempo Real

### Logs de PHP/Apache

```bash
# Linux
tail -f /var/log/apache2/error.log

# macOS
tail -f /var/log/apache2/error_log

# O en Docker
docker logs -f nombre-contenedor-apache

# Filtrar solo errores de nuestro plugin
tail -f /var/log/apache2/error.log | grep -E "✅|❌|⚠️"
```

### Logs de WordPress

```bash
# Habilitar debug en wp-config.php
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );

# Ver logs
tail -f /wp-content/debug.log
```

### Logs filtrados por severidad

```bash
# Solo errores
grep "❌" /var/log/apache2/error.log

# Solo éxitos
grep "✅" /var/log/apache2/error.log

# Solo advertencias
grep "⚠️" /var/log/apache2/error.log

# Por fecha
grep "2024-01-15" /var/log/apache2/error.log
```

---

## 9️⃣ Monitorear Procesos en Background

### Ver si wp-cron se ejecutó

```bash
# Verificar último evento ejecutado
wp cron test

# Ver eventos programados
wp cron event list

# Buscar nuestros eventos
wp cron event list | grep gero_generar
```

### Forzar ejecución de tareas pendientes

```bash
# Visitar la URL (así corre wp-cron)
curl -s https://tu-sitio.com/wp-cron.php?doing_wp_cron > /dev/null

# O desde WordPress CLI
wp cron event run gero_generar_clasificacion_cuestionario
wp cron event run gero_generar_clasificacion_ruta
```

---

## 🔟 Performance y Optimización

### Ver tamaño de tabla

```sql
SELECT 
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb,
  table_rows
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name = 'byw_agente_retencion';
```

### Si la tabla crece mucho, limpiar registros viejos

```sql
-- Borrar registros incompletos de hace más de 30 días
DELETE FROM byw_agente_retencion
WHERE fecha_cuestionario IS NOT NULL
  AND fecha_finalizacion IS NULL
  AND DATEDIFF(NOW(), fecha_cuestionario) > 30;

-- Optimizar la tabla
OPTIMIZE TABLE byw_agente_retencion;
```

### Agregar índices si las consultas son lentas

```sql
CREATE INDEX idx_fecha_finalizacion 
ON byw_agente_retencion(fecha_finalizacion);

CREATE INDEX idx_prioridad_fecha 
ON byw_agente_retencion(prioridad_caso, fecha_finalizacion);

-- Analizar tabla después de índices
ANALYZE TABLE byw_agente_retencion;
```

---

## 🔍 Debug Avanzado

### Activar verbose logging en PHP

```php
// En agente-retencion-unitec-02.php, agregar al inicio
if ( ! defined( 'GERO_DEBUG' ) ) {
    define( 'GERO_DEBUG', true );
}

function gero_debug_log( $message ) {
    if ( GERO_DEBUG ) {
        error_log( '[GERO DEBUG] ' . wp_json_encode( $message ) );
    }
}
```

### Ver respuestas crudas de OpenAI

```php
// En la función agero_clasificar_riesgo_con_llm, agregar:
error_log( 'OpenAI Response: ' . wp_json_encode( $response_body ) );
```

### Probar con diferentes modelos

```php
// Cambiar de gpt-4o a gpt-3.5-turbo si OpenAI está costoso
'model' => 'gpt-3.5-turbo', // Más barato, más rápido
// O
'model' => 'gpt-4', // Más caro, mejor calidad
```

---

## 📊 Generador de Reporte de Diagnóstico

```bash
#!/bin/bash
# script: diagnóstico.sh

echo "=== DIAGNOSTICO AGENTE RETENCION ==="
echo ""

echo "1️⃣ Plugin Status:"
wp plugin list | grep agente

echo ""
echo "2️⃣ Tabla Status:"
mysql -u user -p database -e "SHOW TABLES LIKE 'byw_agente_retencion';"

echo ""
echo "3️⃣ API Key Configured:"
wp config get OPENAI_API_KEY | head -c 20

echo ""
echo "4️⃣ wp-cron Status:"
wp config get DISABLE_WP_CRON

echo ""
echo "5️⃣ Recent Logs:"
tail -5 /var/log/apache2/error.log | grep -E "✅|❌"

echo ""
echo "6️⃣ Registros en tabla:"
mysql -u user -p database -e "SELECT COUNT(*) FROM byw_agente_retencion;"

echo ""
echo "7️⃣ Casos por prioridad:"
mysql -u user -p database -e "SELECT prioridad_caso, COUNT(*) FROM byw_agente_retencion GROUP BY prioridad_caso;"

echo ""
echo "✅ Diagnóstico Completo"
```

---

## 💬 Contacto para Soporte

Si los pasos anteriores no resuelven el problema:

1. Recolectar información:
   - Output de `wp plugin list`
   - Output de `SELECT * FROM byw_agente_retencion LIMIT 1;`
   - Últimos 50 líneas de `/var/log/apache2/error.log`
   - Versión de PHP: `php -v`
   - Versión de WordPress: `wp core version`

2. Revisar si hay errores en la consola del navegador (F12)

3. Probar en entorno local primero

4. Activar `WP_DEBUG` en `wp-config.php`
