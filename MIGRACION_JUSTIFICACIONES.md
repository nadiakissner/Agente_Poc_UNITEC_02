# Migración: Columna `justificacion` a JSON Array

## 📋 Cambios en Base de Datos

### Problema Original
- La columna `justificacion` en `byw_agente_retencion` era un simple `VARCHAR(500)`
- No permitía guardar múltiples justificaciones (cuestionario, ruta, crisis, etc.)
- Solo guardaba un texto simple, sin estructura

### Solución Implementada
Cambiar la columna a JSON para soportar un array de justificaciones:

```json
{
  "cuestionario": [
    {
      "timestamp": "2025-12-29 10:15:00",
      "texto": "Preocupación económica detectada en P5"
    }
  ],
  "respuesta_cuestionario": [
    {
      "timestamp": "2025-12-29 10:16:00",
      "texto": "Respuesta: Tengo dudas sobre mi elección..."
    }
  ],
  "ruta_routea_completada": [
    {
      "timestamp": "2025-12-29 10:30:00",
      "texto": "Ruta seleccionada: RouteA. RIASEC match: SÍ"
    }
  ],
  "crisis_detectada": [
    {
      "timestamp": "2025-12-29 10:31:00",
      "texto": "⚠️ CRISIS DETECTADA: Respuesta de alto riesgo"
    }
  ]
}
```

---

## 🔧 Pasos para la Migración

### 1. **Backup de datos** (IMPORTANTE)
```sql
-- Crear tabla de respaldo
CREATE TABLE byw_agente_retencion_backup AS 
SELECT * FROM byw_agente_retencion;
```

### 2. **Modificar la columna** (opción A: Si quieres preservar datos)
```sql
-- Convertir VARCHAR existente a JSON
ALTER TABLE byw_agente_retencion 
MODIFY COLUMN justificacion JSON DEFAULT NULL;

-- Actualizar datos existentes a formato JSON
UPDATE byw_agente_retencion 
SET justificacion = JSON_OBJECT('legado', justificacion)
WHERE justificacion IS NOT NULL AND justificacion != '';
```

### 3. **O crear tabla nueva con estructura correcta** (opción B: Recomendado)
```sql
-- Si prefieres empezar limpio
ALTER TABLE byw_agente_retencion 
DROP COLUMN justificacion;

ALTER TABLE byw_agente_retencion 
ADD COLUMN justificacion JSON DEFAULT NULL 
AFTER prioridad_caso;
```

### 4. **Verificar la estructura**
```sql
-- Ver estructura de la tabla
DESCRIBE byw_agente_retencion;

-- Debería mostrar:
-- justificacion | json | YES | | NULL |
```

---

## 🔍 Nuevas Funciones PHP

### `gero_guardar_interacciones()`
**Ubicación:** `agente-retencion-unitec-02.php` (línea 1759)

**Qué hace:**
- Recibe: `user_id`, `tipo` (cuestionario, ruta, crisis, etc.), `contenido`, `riesgo_detectado`
- Guarda en `byw_coach_interacciones` (logs)
- **Actualiza** `byw_agente_retencion` con:
  - `justificacion` (JSON array con todas las entradas)
  - `prioridad_caso` (auto-calculado según contenido)

### `gero_generar_justificacion_cuestionario()`
**Ubicación:** `agente-retencion-unitec-02.php` (línea 1898)

**Qué hace:**
- Analiza respuestas del cuestionario
- Detecta palabras clave de riesgo
- Genera descripción breve (50 palabras máx)

### `gero_generar_justificacion_respuesta()`
**Ubicación:** `agente-retencion-unitec-02.php` (línea 1923)

**Qué hace:**
- Analiza respuestas individuales de preguntas
- Detecta crisis potencial (suicidio, abandono, etc.)
- Marca como "⚠️" si es de alto riesgo

### `gero_generar_justificacion_ruta()`
**Ubicación:** `agente-retencion-unitec-02.php` (línea 1940)

**Qué hace:**
- Genera descripción de la ruta seleccionada
- Mapea RouteA → RouteG con textos descriptivos

### `gero_determinar_prioridad_completa()`
**Ubicación:** `agente-retencion-unitec-02.php` (línea 1971)

**Qué hace:**
- Analiza TODAS las justificaciones
- Detecta palabras clave de prioridad:
  - **CRÍTICO**: suicidio, muerte, emergencia
  - **ALTO**: crisis, grave, urgente
  - **MEDIO**: moderado, importante, monitoreo
  - **BAJO**: sin palabras clave

---

## 📱 Cambios en React

### `RouteA.tsx`
- **Nueva función:** `saveRouteCompletion()` (línea 233)
  - Se llama al completar el test RIASEC
  - Guarda: carrera, código RIASEC, si hay match
  - Envía a `/wp-json/gero/v1/guardar-interacciones`

### `Questionnaire.tsx`
- **Ya existía:** `saveQuestionnaireInteraction()` (línea 406)
  - Se ejecuta al responder cada pregunta
  - Envía a `/wp-json/gero/v1/guardar-interacciones`

---

## 📊 Flujo de Datos

```
USUARIO
   ↓
Responde Questionnaire (P1-P9)
   ↓
saveQuestionnaireInteraction() [cada respuesta]
   ↓
POST /wp-json/gero/v1/guardar-interacciones
   ├─ Guarda en byw_coach_interacciones (log)
   └─ Actualiza byw_agente_retencion:
      ├─ justificacion (JSON array)
      └─ prioridad_caso (auto-calculado)
   ↓
Completa Questionnaire
   ↓
calculateAndSaveRiskScores()
   ├─ Detecta riesgos
   └─ POST guardar-interacciones con tipo='cuestionario_completado'
   ↓
Selecciona Ruta (RouteA, B, C, etc.)
   ↓
saveRouteCompletion() [en RouteA]
   ├─ POST guardar-interacciones con tipo='ruta_routea_completada'
   └─ Incluye: carrera, RIASEC, match status
   ↓
Responde Ruta
   ↓
POST guardar-interacciones [al finalizar cada ruta]
   ↓
Si se detecta CRISIS
   ├─ POST guardar-interacciones con tipo='crisis_detectada'
   └─ prioridad_caso cambia a 'crítico' automáticamente
```

---

## ✅ Checklist de Implementación

- [x] Crear funciones PHP de generación de justificaciones
- [x] Crear función PHP de determinación de prioridad
- [x] Actualizar endpoint `gero_guardar_interacciones`
- [x] Agregar `saveRouteCompletion()` en RouteA.tsx
- [x] Compilación exitosa (0 errores)
- [ ] **PENDIENTE: Ejecutar migración SQL en base de datos**
- [ ] **PENDIENTE: Probar flujo end-to-end en staging**
- [ ] **PENDIENTE: Verificar que justificaciones se guardan correctamente**

---

## 🚀 Cómo Ejecutar la Migración

### En SiteGround/cPanel:
1. Acceder a **phpMyAdmin**
2. Seleccionar base de datos: `unitec_...` o similar
3. Ejecutar SQL (Opción A o B arriba)
4. Verificar que la columna cambió a JSON

### Alternativa: En Terminal (SSH)
```bash
mysql -u usuario -p nombre_bd << EOF
-- Backup
CREATE TABLE byw_agente_retencion_backup AS 
SELECT * FROM byw_agente_retencion;

-- Modificar
ALTER TABLE byw_agente_retencion 
MODIFY COLUMN justificacion JSON DEFAULT NULL;

-- Actualizar datos existentes
UPDATE byw_agente_retencion 
SET justificacion = JSON_OBJECT('legado', justificacion)
WHERE justificacion IS NOT NULL;

-- Verificar
DESCRIBE byw_agente_retencion;
EOF
```

---

## 🔒 Rollback (si algo va mal)

```sql
-- Restaurar backup
DROP TABLE byw_agente_retencion;
RENAME TABLE byw_agente_retencion_backup TO byw_agente_retencion;
```

---

## 📝 Notas Importantes

1. **El PHP ya está actualizado** - El código está listo en `agente-retencion-unitec-02.php`
2. **El React ya está actualizado** - Las funciones de guardado están en lugar
3. **Solo falta la migración SQL** - Necesitas ejecutar el SQL en la base de datos
4. **Compatibilidad con datos antiguos** - Si usas Opción A, preservarás datos existentes
5. **Prioridad Auto-Calculada** - No necesitas cambiar manualmente, se calcula automáticamente

---

## 📞 Soporte

Si encuentras errores después de la migración:
- Revisar logs en `wp-json/gero/v1/guardar-interacciones`
- Verificar estructura JSON con: `SELECT JSON_TYPE(justificacion) FROM byw_agente_retencion;`
- Revisar error_log de WordPress en `/wp-content/debug.log`
