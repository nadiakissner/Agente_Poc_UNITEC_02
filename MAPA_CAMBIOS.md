# 🗂️ Mapa de Cambios Implementados

Documentación de exactamente dónde se realizaron cambios para guardar justificaciones y prioridad de caso.

---

## 📁 Backend Changes

### ✅ Archivo: `agente-retencion-unitec-02.php`

#### 1. Función Actualizada: `gero_guardar_interacciones()`
- **Línea:** 1759
- **Cambios:**
  - ✅ Ahora guarda en AMBAS tablas (coach_interacciones + agente_retencion)
  - ✅ Genera justificaciones automáticamente según tipo
  - ✅ Calcula prioridad_caso automáticamente
  - ✅ Actualiza byw_agente_retencion con JSON array

**Código:**
```php
✅ Guarda en: byw_coach_interacciones
✅ Actualiza: byw_agente_retencion
✅ Estructura JSON con timestamp
✅ Auto-calcula prioridad_caso
```

#### 2. Función Nueva: `gero_generar_justificacion_cuestionario()`
- **Línea:** 1898
- **Qué hace:**
  - Analiza respuestas del cuestionario
  - Detecta palabras clave: "mucha", "bastante", "crisis"
  - Retorna descripción breve (<50 palabras)

**Ejemplo:**
```php
Input: ["P1", "Con muchas dudas"]
Output: "Respuesta crítica detectada"
```

#### 3. Función Nueva: `gero_generar_justificacion_respuesta()`
- **Línea:** 1923
- **Qué hace:**
  - Analiza respuesta individual
  - Detecta palabras de crisis: suicidio, muerte, abandono
  - Marca con ⚠️ si es de alto riesgo

**Ejemplo:**
```php
Input: "Quiero dejar la carrera y morirme"
Output: "⚠️ Respuesta de alto riesgo: Quiero dejar la carrera..."
```

#### 4. Función Nueva: `gero_generar_justificacion_ruta()`
- **Línea:** 1940
- **Qué hace:**
  - Genera descripción para cada ruta
  - Mapea RouteA-G a textos descriptivos

**Ejemplo:**
```php
Input: "RouteA"
Output: "Estudiante realizó test RIASEC para alineación carrera-intereses"
```

#### 5. Función Nueva: `gero_determinar_prioridad_completa()`
- **Línea:** 1971
- **Qué hace:**
  - Analiza TODAS las justificaciones
  - Detecta palabras clave por nivel
  - Retorna: critico | alto | medio | bajo

**Ejemplo:**
```php
Input: { justificaciones: { ... }, riesgo: "..." }
Output: "critico"  // Detectó "suicidio"
```

---

## 🎨 Frontend Changes

### ✅ Archivo: `SRC/Pages/RouteA.tsx`

#### 1. Función Nueva: `saveRouteCompletion()`
- **Línea:** 233
- **Se llama en:**
  - Línea 596: Cuando hay MATCH en RIASEC
  - Línea 610: Cuando hay MISMATCH en RIASEC

**Código:**
```typescript
const saveRouteCompletion = (
  carrera: string, 
  riasecCode: string, 
  hasMatch: boolean
) => {
  // POST a /wp-json/gero/v1/guardar-interacciones
  // Envía: ruta, carrera, RIASEC, match status
}
```

**Datos enviados:**
```json
{
  "user_id": 123,
  "tipo": "ruta_routea_completada",
  "contenido": {
    "ruta": "RouteA",
    "carrera": "Ingeniería en Sistemas",
    "riasecCode": "IRE",
    "hasMatch": true,
    "timestamp": "2025-12-29T10:30:00Z"
  },
  "riesgo_detectado": {
    "tipo": "desalineacion_carrera"  // Solo si mismatch
  }
}
```

#### 2. Cambios en `calculateRiasecResult()`
- **Línina:** 560-620
- **Qué cambió:**
  - Se añadió call a `saveRouteCompletion()` después de detectar match/mismatch
  - El guardado es asincrónico (no bloquea UI)

### ✅ Archivo: `SRC/Pages/Questionnaire.tsx`

#### 1. Función que Actualmente Existe: `saveQuestionnaireInteraction()`
- **Línea:** 406
- **Ya estaba implementada, se usa para:**
  - Guardar cada respuesta individual (tipo='respuesta_cuestionario')
  - Guardar cuestionario completado (tipo='cuestionario_completado')

**Se ejecuta en:**
- Línea 327: Después de cada respuesta
- Línea 493: Al completar cuestionario

---

## 🗄️ Database Changes Requeridos

### ✅ Tabla: `byw_agente_retencion`

#### Cambio 1: Columna `justificacion`
- **Estado Actual:** `VARCHAR(500)` 
- **Necesita ser:** `JSON`

**SQL a ejecutar:**
```sql
ALTER TABLE byw_agente_retencion 
MODIFY COLUMN justificacion JSON DEFAULT NULL;
```

**O preservando datos:**
```sql
ALTER TABLE byw_agente_retencion 
MODIFY COLUMN justificacion JSON DEFAULT NULL;

UPDATE byw_agente_retencion 
SET justificacion = JSON_OBJECT('legado', justificacion)
WHERE justificacion IS NOT NULL;
```

#### Cambio 2: Columna `prioridad_caso`
- **Estado Actual:** Manual o simple
- **Ahora es:** Auto-calculado por `gero_determinar_prioridad_completa()`

**No requiere cambio en estructura, solo en lógica**

---

## 📊 Flujo de Datos End-to-End

### Secuencia Completa:

```
┌─────────────────────────────────────────────────────────────┐
│                     USUARIO RESPONDE P1                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
        ┌──────────────────────────────┐
        │ saveQuestionnaireInteraction()│  (Questionnaire.tsx:327)
        │ - question_id: "P1"          │
        │ - answer: "Con muchas dudas" │
        └───────────┬──────────────────┘
                    │
                    ↓
        ┌──────────────────────────────────────────┐
        │ POST /wp-json/gero/v1/guardar-interacciones
        │ {                                        │
        │   user_id: 123,                         │
        │   tipo: "respuesta_cuestionario",       │
        │   contenido: { answer, question_id },   │
        │   riesgo_detectado: {}                  │
        │ }                                        │
        └───────────┬──────────────────────────────┘
                    │
                    ↓ [BACKEND]
        ┌──────────────────────────────────────────┐
        │ gero_generar_justificacion_respuesta()   │  (línea 1923)
        │ → "⚠️ Respuesta de alto riesgo: Con..."  │
        └───────────┬──────────────────────────────┘
                    │
                    ↓
        ┌──────────────────────────────────────────┐
        │ INSERT INTO byw_coach_interacciones {    │
        │   user_id, tipo, contenido, ...         │
        │ }                                        │
        └───────────┬──────────────────────────────┘
                    │
                    ↓
        ┌──────────────────────────────────────────┐
        │ SELECT FROM byw_agente_retencion WHERE   │
        │ user_email = ... → obtener registro      │
        └───────────┬──────────────────────────────┘
                    │
                    ↓
        ┌──────────────────────────────────────────┐
        │ Combinar justificaciones anteriores      │
        │ con la nueva                             │
        │ → Array JSON con timestamps              │
        └───────────┬──────────────────────────────┘
                    │
                    ↓
        ┌──────────────────────────────────────────┐
        │ gero_determinar_prioridad_completa()     │  (línea 1971)
        │ → "alto" (detectó palabra clave)         │
        └───────────┬──────────────────────────────┘
                    │
                    ↓
        ┌──────────────────────────────────────────┐
        │ UPDATE byw_agente_retencion SET:        │
        │ - justificacion = { nuevo JSON array }   │
        │ - prioridad_caso = "alto"                │
        │ WHERE user_email = ...                   │
        └──────────────────────────────────────────┘
                    │
                    ↓
                RESPUESTA AL FRONTEND:
                {
                  success: true,
                  message: "Interacción guardada",
                  id: 12345
                }
```

---

## 🔍 Ver Cambios en Archivos

### Para revisar exactamente qué cambió:

#### Backend:
```bash
# Ver línea 1759 (gero_guardar_interacciones)
sed -n '1759,1900p' agente-retencion-unitec-02.php

# Ver línea 1898 (gero_generar_justificacion_cuestionario)
sed -n '1898,1922p' agente-retencion-unitec-02.php

# Ver línea 1923 (gero_generar_justificacion_respuesta)
sed -n '1923,1939p' agente-retencion-unitec-02.php

# Ver línea 1940 (gero_generar_justificacion_ruta)
sed -n '1940,1970p' agente-retencion-unitec-02.php

# Ver línea 1971 (gero_determinar_prioridad_completa)
sed -n '1971,2020p' agente-retencion-unitec-02.php
```

#### Frontend:
```bash
# Ver línea 233 (saveRouteCompletion en RouteA)
sed -n '233,260p' SRC/Pages/RouteA.tsx

# Ver línea 596-610 (llamadas a saveRouteCompletion)
sed -n '596,610p' SRC/Pages/RouteA.tsx
```

---

## ✅ Checklist de Cambios

### Backend (agente-retencion-unitec-02.php)
- [x] Línea 1759: `gero_guardar_interacciones()` actualizada
- [x] Línea 1898: Nueva función `gero_generar_justificacion_cuestionario()`
- [x] Línea 1923: Nueva función `gero_generar_justificacion_respuesta()`
- [x] Línea 1940: Nueva función `gero_generar_justificacion_ruta()`
- [x] Línea 1971: Nueva función `gero_determinar_prioridad_completa()`

### Frontend (SRC/Pages/)
- [x] Línea 233 (RouteA.tsx): Nueva función `saveRouteCompletion()`
- [x] Línea 596 (RouteA.tsx): Call a `saveRouteCompletion()` en MATCH
- [x] Línea 610 (RouteA.tsx): Call a `saveRouteCompletion()` en MISMATCH
- [x] Línea 406 (Questionnaire.tsx): Ya existía, se usa correctamente

### Database
- [ ] **PENDIENTE:** Ejecutar `ALTER TABLE ... MODIFY COLUMN justificacion JSON`

### Compilación
- [x] npm run build → 0 errores
- [x] 1697 módulos transformados
- [x] Assets generados correctamente

---

## 🚀 Para Implementar

### Paso 1: Ejecutar migración SQL
```sql
ALTER TABLE byw_agente_retencion 
MODIFY COLUMN justificacion JSON DEFAULT NULL;
```

### Paso 2: Deploy código
```bash
npm run build
# Subir dist/ a servidor
# Verificar PHP está actualizado en /wp-content/plugins/
```

### Paso 3: Verificar en DB
```sql
SELECT user_email, justificacion, prioridad_caso 
FROM byw_agente_retencion 
LIMIT 1\G
```

### Paso 4: Test
- Responder cuestionario
- Completar ruta
- Verificar que se guardaron justificaciones y prioridad

---

## 📋 Resumen Visual

| Componente | Tipo | Línea | Estado |
|-----------|------|-------|---------|
| gero_guardar_interacciones | Actualizado | 1759 | ✅ |
| gero_generar_justificacion_cuestionario | Nuevo | 1898 | ✅ |
| gero_generar_justificacion_respuesta | Nuevo | 1923 | ✅ |
| gero_generar_justificacion_ruta | Nuevo | 1940 | ✅ |
| gero_determinar_prioridad_completa | Nuevo | 1971 | ✅ |
| saveRouteCompletion | Nuevo | 233 | ✅ |
| saveQuestionnaireInteraction | Existente | 406 | ✅ |
| justificacion (SQL) | Modificar | - | ⏳ |
| prioridad_caso (SQL) | Usar | - | ✅ |
| npm build | Check | - | ✅ |

---

## 🎯 Conclusión

**Todos los cambios están implementados y compilados.**  
**Solo falta ejecutar la migración SQL en la base de datos.**

Una vez hecho, el sistema:
- ✅ Guardará automáticamente justificaciones con timestamp
- ✅ Calculará automáticamente prioridad_caso
- ✅ Detectará automáticamente crisis
- ✅ Creará un historial completo de cada usuario
