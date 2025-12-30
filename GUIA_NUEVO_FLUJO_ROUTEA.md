# Nuevo Flujo de Preguntas RouteA - Guía de Implementación

## 📋 Cambios Principales

### Archivo Nuevo Creado
- **`RouteA_NUEVO_FLUJO.tsx`** - Implementación completa del nuevo flujo conversacional
- **El archivo original `RouteA.tsx` debe ser reemplazado o archivado**

## 🔄 Flujo de Preguntas

### Secuencia Lineal Base

```
Paso 1: "¿Qué tan motivado te sientes del 1 al 5?"
    ↓ (espera respuesta)
Paso 2: "¿Sientes que tus dudas tienen que ver contigo, sobre tu elección de carrera o ambas?"
    ↓
    ├─ Si: ambas/carrera → Paso 3
    └─ Si: conmigo/yo → SALTA a Paso 5
    ↓
Paso 3: "Del 1 al 5, ¿qué tan clara sientes tu decisión de carrera?"
    ↓
Paso 4: "¿Te preocupa que la carrera sea muy larga?"
    ↓
Paso 5: "¿Te preocupa no entender las materias?"
    ↓
Paso 6: "¿Tienes dudas sobre la salida laboral?" 
    ├─ Si dice SÍ → Agrega: "Puedo derivarte con el área de información..."
    ↓
Paso 7: "Con tu elección de carrera, ¿buscas ayudar a otros o dejar una huella?"
    ↓
Paso 8: "¿Buscas demostrar que eres capaz?"
    ↓
Paso 9: "¿Buscas ganar dinero?"
    ↓
Paso 10: "Después de todo lo que hablamos, ¿sientes que quieres empezar este primer semestre?"
    ↓
    ├─ SÍ → Cierre amable + Finaliza
    └─ NO/No sé → Menciona Test RIASEC + Continúa
```

## 💾 Estructura de Datos - Respuestas

Las respuestas se guardan en un objeto:

```typescript
{
  "1": "5",                              // Motivación (1-5)
  "2": "ambas",                          // Tipo de duda
  "3": "4",                              // Claridad carrera (1-5)
  "4": "Sí, un poco",                    // Preocupación duración
  "5": "No, creo que lo entendré",       // Preocupación materias
  "6": "Tengo algunas dudas",            // Dudas salida laboral
  "7": "Sí, quiero ayudar",              // Motivación: ayudar
  "8": "Definitivamente",                // Motivación: demostrarse
  "9": "Es importante",                  // Motivación: dinero
  "10": "Sí, quiero intentar"            // Decisión final
}
```

## 🔗 Endpoint Backend

### POST `/wp-json/gero/v1/procesar-fin-cuestionario`

**Body esperado:**
```json
{
  "user_id": 123,
  "user_email": "estudiante@unitec.edu",
  "nombre": "Juan Pérez",
  "carrera": "Ingeniería en Sistemas",
  "respuestas": {
    "1": "5",
    "2": "ambas",
    ...
  },
  "conversacion": [
    {"sender": "agent", "message": "¿Qué tan motivado..."},
    {"sender": "user", "message": "5"}
  ],
  "status": "completed" | "riasec_needed"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Cuestionario procesado correctamente",
  "clasificacion_pendiente": true
}
```

## 🤖 Cambios Necesarios en Backend PHP

### Función a Modificar: `agente_procesar_fin_cuestionario()`

Actualmente espera:
```php
$respuestas = $body['respuestas'];  // Array de respuestas por pregunta
```

Debe extraer información:
```php
// Extraer datos relevantes para LLM
$motivacion_inicial = $respuestas['1'];           // 1-5
$tipo_duda = $respuestas['2'];                    // "ambas", "conmigo", etc.
$claridad_carrera = $respuestas['3'] ?? '';       // 1-5 (puede no existir si saltó)
$duracion_concern = $respuestas['4'];             // sí/no
$materias_concern = $respuestas['5'];             // sí/no
$salida_laboral_concern = $respuestas['6'];       // sí/no
$motivacion_ayudar = $respuestas['7'];            // sí/no
$motivacion_demostrarse = $respuestas['8'];       // sí/no
$motivacion_dinero = $respuestas['9'];            // sí/no

// Construir contexto para LLM
$contexto = "
El estudiante reportó:
- Motivación inicial: {$motivacion_inicial}/5
- Tipo de dudas: {$tipo_duda}
- Claridad de carrera: {$claridad_carrera}/5 (si aplica)
- Preocupaciones: Duración ({$duracion_concern}), Materias ({$materias_concern}), Salida laboral ({$salida_laboral_concern})
- Motivaciones: Ayudar ({$motivacion_ayudar}), Demostrarse ({$motivacion_demostrarse}), Ganar dinero ({$motivacion_dinero})
Conversación: [historial de chat]
";
```

### Prompt para LLM (Actualizado)

El prompt debe ser modificado para interpretar respuestas conversacionales:

```php
$prompt = "
Analiza la conversación y respuestas del estudiante {$nombre}:

{$contexto}

Basado en:
1. La baja/alta motivación inicial
2. Si sus dudas son internas o sobre la carrera
3. Sus preocupaciones específicas (duración, materias, salida laboral)
4. Sus motivaciones (ayudar otros, demostrarse, ganar dinero)
5. La conversación completa

Proporciona en JSON:
{
  \"justificacion\": \"Análisis breve (30-50 palabras) sobre por qué el estudiante podría estar en riesgo o motivado\",
  \"riesgo_nivel\": \"bajo|medio|alto\",
  \"factores_clave\": [\"factor1\", \"factor2\"]
}
";
```

## 🎯 Cómo el LLM Interpreta las Respuestas

### Patrones de Riesgo a Detectar

| Patrón | Indicador | Respuestas Clave |
|--------|-----------|-----------------|
| **Baja motivación** | motivacion < 3 | Paso 1 |
| **Dudas internas** | "conmigo", "yo" en Paso 2 | Paso 2 → Salta a 5 |
| **Carrera poco clara** | claridad < 2 en Paso 3 | Paso 3 |
| **Preocupaciones acumuladas** | SÍ en múltiples pasos 4-6 | Pasos 4, 5, 6 |
| **Sin motivación clara** | NO a todos los pasos 7-9 | Pasos 7, 8, 9 |
| **Incertidumbre final** | NO en Paso 10 | Paso 10 |

### Ejemplo de Análisis LLM

**Respuestas:**
```
Paso 1: 3 (baja motivación)
Paso 2: "por mí, no confío" (dudas internas)
Paso 5: "Sí, me asusta" (preocupación materias)
Paso 8: "No, no" (no busca demostrarse)
Paso 10: "No sé" (inseguridad)
```

**Justificación que el LLM generaría:**
```
"Juan reporta baja motivación inicial (3/5) con dudas centradas en su confianza personal
más que en la carrera. Tiene preocupación específica sobre capacidad académica. 
Muestra poca motivación de superación. Necesita acompañamiento urgente en confianza 
y definición de propósito."
```

**Prioridad:** `alto` (porque combina baja motivación + dudas internas + preocupación académica)

## 📝 Validaciones Implementadas

El frontend valida:

1. **Respuestas de motivación (1-5)**
   - Solo acepta números entre 1 y 5
   - Mensaje de error si no cumple

2. **Lógica condicional en Paso 2**
   - Detecta palabras clave: "ambas", "carrera", "conmigo", "yo"
   - Determina siguiente paso dinámicamente

3. **Feedback en Paso 6**
   - Si dice SÍ a dudas de salida laboral, agrega derivación a información

## 🔄 Flujo de Datos Completo

```
Frontend (RouteA_NUEVO_FLUJO.tsx)
    ↓
Usuario responde pregunta a pregunta
    ↓
Respuestas se guardan en estado local + localStorage
    ↓
Historial de chat se acumula
    ↓
Usuario completa paso 10
    ↓
Frontend envía POST a /procesar-fin-cuestionario
    ↓
Backend PHP recibe respuestas + conversación
    ↓
Backend llama a agente_clasificar_riesgo_con_llm()
    ↓
LLM interpreta respuestas conversacionales
    ↓
LLM retorna justificación + análisis
    ↓
Backend determina prioridad_caso (alto/medio/bajo)
    ↓
Backend guarda en byw_agente_retencion:
   - user_email
   - user_id
   - riesgo_detectado (array de riesgos)
   - prioridad_caso (alto/medio/bajo)
   - justificacion (JSON con análisis)
    ↓
Frontend redirige a /summary o /routeA-riasec
```

## ✅ Checklist de Implementación

- [ ] Reemplazar `RouteA.tsx` con `RouteA_NUEVO_FLUJO.tsx`
- [ ] Actualizar función `agente_procesar_fin_cuestionario()` en PHP
- [ ] Actualizar prompt del LLM para interpretar respuestas conversacionales
- [ ] Probar flujo completo: pregunta 1 → 10 → guardado
- [ ] Probar lógica condicional: Paso 2 → Paso 3 o Paso 5
- [ ] Probar feedback en Paso 6
- [ ] Verificar que respuestas se guardan correctamente en BD
- [ ] Verificar que LLM genera justificaciones apropiadas

## 🚀 Próximos Pasos

1. **Crear/actualizar** el endpoint backend
2. **Actualizar prompt LLM** con nueva estructura de respuestas
3. **Probar integración** frontend-backend
4. **Crear ruta RIASEC** para cuando usuario elige opción "No" en Paso 10

---

**Nota:** Este nuevo flujo es 100% conversacional (texto libre del usuario), lo que permite que el LLM interprete no solo respuestas binarias sino matices y preocupaciones reales.
