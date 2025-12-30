# Resumen Técnico: Implementación de Justificaciones y Prioridad de Caso

**Fecha:** 29 Diciembre 2025  
**Estado:** ✅ Implementado y compilado  
**Cambios principales:** PHP backend + React frontend

---

## 🔧 Cambios en PHP (agente-retencion-unitec-02.php)

### 1. Función Mejorada: `gero_guardar_interacciones()` (Línea 1759)

**Antes:** Solo guardaba en `byw_coach_interacciones`  
**Ahora:** Guarda en ambas tablas y actualiza prioridad_caso

```php
✅ Recibe: user_id, tipo, contenido, riesgo_detectado
✅ Guarda en: byw_coach_interacciones (logs)
✅ Actualiza: byw_agente_retencion con:
   - justificacion (JSON array con historial)
   - prioridad_caso (auto-calculado)
✅ Genera justificaciones según tipo de interacción
```

### 2. Nueva Función: `gero_generar_justificacion_cuestionario()` (Línea 1898)

Analiza respuestas del cuestionario y detecta:
- Respuestas críticas ("mucha", "bastante", "crisis")
- Retorna descripción breve (<50 palabras)

### 3. Nueva Función: `gero_generar_justificacion_respuesta()` (Línea 1923)

Analiza respuestas individuales:
- Detecta palabras clave de crisis: suicidio, muerte, abandono
- Marca como "⚠️ Respuesta de alto riesgo" si las detecta
- Extrae primeras 50 caracteres de la respuesta

### 4. Nueva Función: `gero_generar_justificacion_ruta()` (Línea 1940)

Genera descripción para rutas seleccionadas:
- RouteA → "Estudiante realizó test RIASEC..."
- RouteB → "Estudiante requiere apoyo en manejo académico..."
- RouteC → "Estudiante necesita intervención en bienestar..."
- (Y así para D, E, F, G)

### 5. Nueva Función: `gero_determinar_prioridad_completa()` (Línea 1971)

Determina prioridad automáticamente analizando:
- **CRÍTICO:** suicidio, muerte, emergencia
- **ALTO:** crisis, grave, urgente, inmediato
- **MEDIO:** moderado, importante, seguimiento
- **BAJO:** sin palabras clave

```php
Retorna: 'critico' | 'alto' | 'medio' | 'bajo'
```

---

## 🔗 Cambios en React (SRC/Pages/)

### 1. RouteA.tsx - Nueva Función: `saveRouteCompletion()`

**Línea:** 233

```typescript
saveRouteCompletion(carrera: string, riasecCode: string, hasMatch: boolean)
```

**Qué hace:**
- Se ejecuta al completar el test RIASEC
- Envía POST a `/wp-json/gero/v1/guardar-interacciones`
- Incluye:
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
    "riesgo_detectado": {}
  }
  ```

**Se llama en:**
- Línea 596: Cuando hay MATCH RIASEC
- Línea 610: Cuando hay MISMATCH RIASEC

### 2. Questionnaire.tsx - Función Existente: `saveQuestionnaireInteraction()`

**Línea:** 406

**Ya estaba implementada, ahora:**
- Se ejecuta después de cada respuesta
- Se ejecuta al completar cuestionario con tipo='cuestionario_completado'

---

## 📊 Estructura de Datos Guardados

### Ejemplo: Justificación JSON Guardada

```json
{
  "cuestionario": [
    {
      "timestamp": "2025-12-29 10:15:30",
      "texto": "Respuesta crítica detectada"
    }
  ],
  "respuesta_cuestionario": [
    {
      "timestamp": "2025-12-29 10:16:00",
      "texto": "Respuesta: Tengo muchas dudas sobre..."
    },
    {
      "timestamp": "2025-12-29 10:17:15",
      "texto": "⚠️ Respuesta de alto riesgo: quiero abandonar..."
    }
  ],
  "ruta_routea_completada": [
    {
      "timestamp": "2025-12-29 10:30:00",
      "texto": "Estudiante realizó test RIASEC para alineación carrera-intereses"
    }
  ],
  "crisis_detectada": [
    {
      "timestamp": "2025-12-29 10:31:00",
      "texto": "⚠️ CRISIS DETECTADA: Potencial riesgo de abandono"
    }
  ]
}
```

---

## 🎯 Lógica de Predicción de Prioridad

### Algoritmo de Determinación

```
1. Analizar TODAS las justificaciones guardadas
2. Buscar palabras clave en el texto combinado
3. Si encuentra palabras CRÍTICAS → retorna 'critico'
4. Si encuentra palabras ALTO → retorna 'alto'
5. Si encuentra palabras MEDIO → retorna 'medio'
6. Si no encuentra nada → retorna 'bajo'
```

### Ejemplo: Cálculo de Prioridad

**Usuario responde P5:**
- Respuesta: "Creo que voy a abandonar la carrera"
- Contiene: "abandonar" (palabra clave de crisis)
- **Prioridad detectada:** `critico`

**Usuario selecciona RouteA:**
- RIASEC mismatch
- Respuesta de contención
- **Prioridad se mantiene:** `critico`

---

## 🔄 Flujo de Ejecución Completo

### Paso 1: Usuario responde cuestionario (P1-P9)

```
Input: Usuario escribe respuesta en input
↓
saveQuestionnaireInteraction() se ejecuta
↓
POST /wp-json/gero/v1/guardar-interacciones
├─ tipo: 'respuesta_cuestionario'
├─ contenido: { answer: "...", question_id: "P1" }
└─ riesgo_detectado: {}
↓
Backend recibe POST
├─ gero_generar_justificacion_respuesta() genera texto
├─ Agrega a justificacion array con timestamp
├─ gero_determinar_prioridad_completa() calcula nueva prioridad
└─ UPDATE byw_agente_retencion
```

### Paso 2: Usuario completa cuestionario

```
Input: Última respuesta enviada
↓
calculateAndSaveRiskScores() se ejecuta
↓
POST /wp-json/gero/v1/guardar-interacciones
├─ tipo: 'cuestionario_completado'
├─ contenido: {
│    respuestas: [["P1", "respuesta1"], ...],
│    puntajes: { emocional: 5, desorientacion: 8, ... }
│  }
└─ riesgo_detectado: {
     principal: "desorientacion",
     todos: { ... }
   }
↓
Backend:
├─ gero_generar_justificacion_cuestionario() analiza respuestas
├─ Actualiza justificacion["cuestionario"]
├─ Recalcula prioridad_caso
└─ UPDATE byw_agente_retencion
```

### Paso 3: Usuario selecciona ruta (RouteA)

```
Input: Confirma carrera y comienza test RIASEC
↓
calculateRiasecResult() calcula código
↓
saveRouteCompletion(carrera, riasecCode, hasMatch)
├─ Si match: "¡Excelente noticia! Alineado con..."
└─ Si mismatch: "Tus intereses se alinean diferente..."
↓
POST /wp-json/gero/v1/guardar-interacciones
├─ tipo: 'ruta_routea_completada'
├─ contenido: { ruta: "RouteA", carrera: "...", hasMatch: true }
└─ riesgo_detectado: { tipo: "desalineacion_carrera" } [si mismatch]
↓
Backend:
├─ gero_generar_justificacion_ruta() genera descripción
├─ Si mismatch: prioridad_caso puede aumentar
└─ UPDATE byw_agente_retencion
```

### Paso 4: Sistema detecta crisis

```
Input: Usuario menciona palabras clave (suicidio, abandonar, etc)
↓
Crisis detectado en Questionnaire.tsx o RouteA.tsx
↓
POST /wp-json/gero/v1/guardar-interacciones
├─ tipo: 'crisis_detectada'
├─ contenido: { mensaje: "Texto que activó crisis" }
└─ riesgo_detectado: { nivel: "critico", tipo: "autodaño" }
↓
Backend:
├─ gero_generar_justificacion_respuesta() marca con ⚠️
├─ gero_determinar_prioridad_completa() detecta 'critico'
└─ UPDATE byw_agente_retencion con prioridad_caso='critico'
```

---

## 💾 Cambios en Base de Datos

### ANTES:
```sql
CREATE TABLE byw_agente_retencion (
  ID INT PRIMARY KEY,
  user_email VARCHAR(255),
  justificacion VARCHAR(500),  ← Solo 1 texto
  prioridad_caso VARCHAR(50),  ← Manual
  ...
);
```

### DESPUÉS:
```sql
CREATE TABLE byw_agente_retencion (
  ID INT PRIMARY KEY,
  user_email VARCHAR(255),
  justificacion JSON,  ← Array con historial completo
  prioridad_caso VARCHAR(50),  ← Auto-calculado
  ...
);
```

---

## ✅ Verificación Post-Implementación

### En PHP:
```php
// Revisar que las funciones existen
if ( function_exists( 'gero_generar_justificacion_cuestionario' ) ) {
    echo "✅ Funciones de justificación instaladas";
}
```

### En MySQL:
```sql
-- Verificar estructura
DESCRIBE byw_agente_retencion;
-- Debe mostrar: justificacion | json | ...

-- Verificar datos
SELECT justificacion, prioridad_caso FROM byw_agente_retencion LIMIT 1;
```

### En React:
```javascript
// En consola del navegador
console.log('RouteA.saveRouteCompletion está disponible');
console.log('Questionnaire.saveQuestionnaireInteraction está disponible');
```

---

## 🚀 Deployment

1. **Deploy React:**
   ```bash
   npm run build
   # Subir dist/ a servidor
   ```

2. **Deploy PHP:**
   ```bash
   # Subir agente-retencion-unitec-02.php a /wp-content/plugins/
   # Ir a WordPress Admin → Plugins → Activar
   ```

3. **Migración SQL:**
   ```sql
   -- Ejecutar en phpMyAdmin
   ALTER TABLE byw_agente_retencion 
   MODIFY COLUMN justificacion JSON DEFAULT NULL;
   ```

4. **Verificar:**
   - Acceder a la app
   - Responder cuestionario
   - Verificar en database que se guardan JSON

---

## 🔍 Debugging

### Ver logs de justificaciones:
```php
// En error_log de WordPress
[GERO AGENTE] Actualizado usuario email@example.com - Prioridad: alto
```

### Ver datos guardados:
```sql
SELECT user_email, justificacion, prioridad_caso 
FROM byw_agente_retencion 
ORDER BY ID DESC LIMIT 1\G
```

### Probar endpoint manualmente:
```bash
curl -X POST http://localhost/wp-json/gero/v1/guardar-interacciones \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 123,
    "tipo": "cuestionario_completado",
    "contenido": {"respuestas": []},
    "riesgo_detectado": {}
  }'
```

---

## 📋 Checklist de Implementación

- [x] Crear 4 funciones de generación de justificaciones
- [x] Crear función de determinación de prioridad
- [x] Actualizar endpoint gero_guardar_interacciones
- [x] Agregar saveRouteCompletion en RouteA
- [x] Compilación exitosa (npm run build)
- [ ] **PENDIENTE: Ejecutar migración SQL**
- [ ] **PENDIENTE: Deploy a staging**
- [ ] **PENDIENTE: Test end-to-end en staging**
- [ ] **PENDIENTE: Deploy a producción**

---

## 📞 Soporte Rápido

| Problema | Solución |
|----------|----------|
| Error "Faltan parámetros" | Verificar que user_id y tipo se envían correctamente |
| Prioridad no actualiza | Revisar gero_determinar_prioridad_completa (línea 1971) |
| Justificaciones no se guardan | Verificar estructura JSON en MySQL |
| Crisis no se detecta | Revisar palabras clave en gero_generar_justificacion_respuesta |
