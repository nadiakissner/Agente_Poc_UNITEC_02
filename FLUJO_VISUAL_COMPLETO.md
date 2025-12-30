# 📊 Flujo Visual Completo - Clasificación de Riesgos con LLM

## Diagrama General del Sistema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React/TypeScript)                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────┐        ┌──────────────────┐   ┌──────────────────┐
│  │  Cuestionario    │        │   RouteA/B/C...  │   │    Agent Chat    │
│  │   (Preguntas)    │───────▶│  (Intervención)  │──▶│  (OpenAI Chat)   │
│  └──────────────────┘        └──────────────────┘   └──────────────────┘
│         │                            │                        │
│         │ Respuestas +Riesgos        │ Conversación historial │
│         ▼                            ▼                        ▼
│  ┌──────────────────────────────────────────────────────────────────────┐
│  │        POST /wp-json/gero/v1/procesar-fin-cuestionario              │
│  │        + respuestas, riesgos                                         │
│  │        ✅ Respuesta inmediata (background processing)               │
│  └──────────────────────────────────────────────────────────────────────┘
│                                      │
│                                      │
│                   ┌────────────────────────────────┐
│                   │ POST /procesar-fin-ruta        │
│                   │ + ruta seguida, conversación   │
│                   │ ✅ Respuesta inmediata         │
│                   └────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      BACKEND (PHP - agente-retencion-unitec-02.php)     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  agente_procesar_fin_cuestionario()                                      │
│  ├─ Recibe user_id, respuestas, riesgos                                 │
│  ├─ Programa: wp_schedule_single_event()                                │
│  │   └─ HOOK: gero_generar_clasificacion_cuestionario                  │
│  │      ├─ Llama: agente_clasificar_riesgo_con_llm('cuestionario')    │
│  │      │   └─ 📡 Envía a OpenAI                                       │
│  │      │      └─ Recibe: { justificacion: "..." }                     │
│  │      ├─ Guarda en: byw_agente_retencion                           │
│  │      │   ├─ prioridad_caso = 'pendiente'                            │
│  │      │   ├─ justificacion_cuestionario = respuesta LLM              │
│  │      │   └─ fecha_cuestionario = NOW()                              │
│  │      └─ Log: ✅ Clasificación de cuestionario guardada              │
│  │                                                                       │
│  agente_procesar_fin_ruta()                                              │
│  ├─ Recibe user_id, ruta, conversacion                                  │
│  ├─ Programa: wp_schedule_single_event()                                │
│  │   └─ HOOK: gero_generar_clasificacion_ruta                          │
│  │      ├─ Obtiene: justificacion_cuestionario anterior                │
│  │      ├─ Llama: agente_clasificar_riesgo_con_llm('ruta')           │
│  │      │   └─ 📡 Envía a OpenAI                                       │
│  │      │      └─ Recibe: { justificacion: "..." }                     │
│  │      ├─ Combina justificaciones:                                     │
│  │      │   {                                                           │
│  │      │     "cuestionario": "...",                                    │
│  │      │     "ruta": "..."                                             │
│  │      │   }                                                           │
│  │      ├─ Determina prioridad: agente_determinar_prioridad()          │
│  │      │   └─ Busca palabras clave → 'alto' | 'medio' | 'bajo'      │
│  │      ├─ Actualiza: byw_agente_retencion                           │
│  │      │   ├─ prioridad_caso = 'alto'/'medio'/'bajo'                 │
│  │      │   ├─ justificacion = JSON con ambas                          │
│  │      │   ├─ ruta_seguida = 'RouteA' / 'Agent' / etc                │
│  │      │   └─ fecha_finalizacion = NOW()                              │
│  │      └─ Log: ✅ Clasificación de ruta guardada                      │
│  │                                                                       │
│  agente_clasificar_riesgo_con_llm($etapa, $nombre, $carrera, ...)     │
│  ├─ Try-Catch block:                                                    │
│  │   ├─ ✅ Si LLM responde correctamente:                              │
│  │   │   └─ Retorna: justificación (~30 palabras)                      │
│  │   ├─ ⚠️ Si LLM retorna JSON inválido:                               │
│  │   │   └─ Retorna: "Error al procesar respuesta"                     │
│  │   └─ ❌ Si LLM falla:                                                │
│  │       └─ Retorna: "Error al conectar con LLM"                       │
│  │       └─ NO rompe el flujo del usuario                              │
│  │                                                                       │
│  agente_determinar_prioridad($justificacion)                            │
│  ├─ Análisis de palabras clave                                          │
│  ├─ Palabras "alto": crítico, urgente, grave...                        │
│  ├─ Palabras "medio": moderado, importante...                          │
│  └─ Retorna: 'alto' | 'medio' | 'bajo'                                 │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                     ┌────────────────────────┐
                     │   OpenAI API (gpt-4o)  │
                     ├────────────────────────┤
                     │ POST /chat/completions │
                     │ + system prompt        │
                     │ + mensaje del usuario  │
                     └────────────────────────┘
                                │
                                │ JSON Response
                                ▼
                     ┌────────────────────────┐
                     │  {                     │
                     │    "choices": [{       │
                     │      "message": {      │
                     │        "content": JSON │
                     │      }                 │
                     │    }]                  │
                     │  }                     │
                     └────────────────────────┘
```

---

## Flujo Temporal Detallado

### Momento 1: Usuario Responde Cuestionario

```
TIEMPO 0s
  │
  └─ Usuario hace click en "Finalizar Cuestionario"
     │
     ├─ Frontend recoge: respuestas, riesgos detectados
     │
     ├─ Llama: POST /procesar-fin-cuestionario
     │  {
     │    "user_id": 123,
     │    "respuestas": {...},
     │    "riesgos": ["desorientacion", "economica"]
     │  }
     │
     ├─ Backend responde INMEDIATAMENTE:
     │  {
     │    "success": true,
     │    "message": "Cuestionario recibido. Procesando en background..."
     │  }
     │
     └─ ✅ Usuario ve: "Analizando tus respuestas..."
        (Pero el flujo no se detiene)

TIEMPO 1s (Usuario ya está en la siguiente pantalla)
  │
  └─ En BACKGROUND:
     ├─ PHP ejecuta: wp_schedule_single_event()
     │
     └─ wp-cron se activa
        └─ Ejecuta: gero_generar_clasificacion_cuestionario
           ├─ Llama a OpenAI
           │  └─ "Analiza estas respuestas: ..."
           │     └─ OpenAI: {"justificacion": "Presenta dudas sobre..."}
           │
           ├─ Guarda en byw_agente_retencion:
           │  {
           │    "user_email": "alumno@unitec.edu",
           │    "prioridad_caso": "pendiente",
           │    "justificacion_cuestionario": "Presenta dudas sobre su carrera...",
           │    "fecha_cuestionario": "2024-01-15 10:00:00"
           │  }
           │
           └─ 📝 Log: ✅ Clasificación guardada
```

### Momento 2: Usuario Completa la Ruta

```
TIEMPO 0s (Usuario finaliza intervención/chat)
  │
  └─ Usuario hace click en "Finalizar"
     │
     ├─ Frontend guarda conversación
     │
     ├─ Llama: POST /procesar-fin-ruta
     │  {
     │    "user_id": 123,
     │    "ruta": "Agent",
     │    "conversacion": [
     │      {"sender": "agent", "message": "Hola..."},
     │      {"sender": "user", "message": "Tengo dudas..."}
     │    ]
     │  }
     │
     ├─ Backend responde INMEDIATAMENTE:
     │  {
     │    "success": true,
     │    "message": "Ruta finalizada. Procesando en background..."
     │  }
     │
     └─ ✅ Usuario ve: "Guardando análisis final..."
        └─ Navega a thank-you page

TIEMPO 1s (Usuario leyendo página de agradecimiento)
  │
  └─ En BACKGROUND:
     ├─ PHP ejecuta: wp_schedule_single_event()
     │
     └─ wp-cron se activa
        └─ Ejecuta: gero_generar_clasificacion_ruta
           ├─ Obtiene: justificacion_cuestionario anterior
           │  ("Presenta dudas sobre su carrera...")
           │
           ├─ Llama a OpenAI:
           │  "Usuario presentó dudas... después de esta conversación...
           │   Análisis: {'justificacion': 'Requiere seguimiento...'}
           │
           ├─ Determina prioridad:
           │  - Busca palabras en respuesta → "Requiere seguimiento"
           │  - Contiene "seguimiento" → prioridad = "medio"
           │
           ├─ Actualiza byw_agente_retencion:
           │  {
           │    "prioridad_caso": "medio",
           │    "justificacion": {
           │      "cuestionario": "Presenta dudas sobre su carrera...",
           │      "ruta": "Requiere seguimiento personalizado..."
           │    },
           │    "ruta_seguida": "Agent",
           │    "fecha_finalizacion": "2024-01-15 10:05:00"
           │  }
           │
           └─ 📝 Log: ✅ Ruta guardada - Prioridad: medio
```

---

## Estados de la Base de Datos

### Estado 1: Cuestionario en Progreso

```
byw_agente_retencion:
┌────┬──────────────────────────┬──────────────┬─────────────────┬─────────────────┐
│ id │ user_email               │ prioridad_   │ justificacion_  │ fecha_          │
│    │                          │ caso         │ cuestionario    │ cuestionario    │
├────┼──────────────────────────┼──────────────┼─────────────────┼─────────────────┤
│ 1  │ alumno123@unitec.edu     │ pendiente    │ "Presenta       │ 2024-01-15      │
│    │                          │              │  dudas sobre    │ 10:00:00        │
│    │                          │              │  su carrera..." │                 │
└────┴──────────────────────────┴──────────────┴─────────────────┴─────────────────┘

Otros campos:
- justificacion: NULL (se llenará después)
- ruta_seguida: NULL (se llenará después)
- fecha_finalizacion: NULL (se llenará después)
```

### Estado 2: Ruta Completada

```
byw_agente_retencion:
┌────┬──────────────────────────┬──────────────┬─────────────────────────────────────┐
│ id │ user_email               │ prioridad_   │ justificacion                       │
│    │                          │ caso         │                                     │
├────┼──────────────────────────┼──────────────┼─────────────────────────────────────┤
│ 1  │ alumno123@unitec.edu     │ medio        │ {                                   │
│    │                          │              │   "cuestionario": "Presenta dudas", │
│    │                          │              │   "ruta": "Requiere seguimiento"    │
│    │                          │              │ }                                   │
└────┴──────────────────────────┴──────────────┴─────────────────────────────────────┘

Otros campos actualizados:
- ruta_seguida: "Agent"
- fecha_finalizacion: "2024-01-15 10:05:00"
```

---

## Flujo de Errores

```
┌─────────────────────────────────────────┐
│  OpenAI falla                           │
│  (Timeout, rate limit, etc)             │
└──────────────┬──────────────────────────┘
               │
               ▼
        Try-Catch Block
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
    ❌ Error      Log Error
        │             │
        │    ┌────────┘
        │    │
        ▼    ▼
    Retorna: "Error al conectar con LLM"
        │
        ▼
    Se guarda en la BD igual (no deja en null)
        │
        └─ ⚠️ Admin puede ver que falló
        └─ 👤 Usuario NO ve nada, continúa
        └─ 🔄 Siguiente intento: próximo webhook de wp-cron
```

---

## Flujo de Datos JSON

### Entrada (Frontend → Backend)

```typescript
// Fin de cuestionario
{
  "user_id": 123,
  "respuestas": {
    "P1": "Con algo de incertidumbre",
    "P2": "Preocupación económica",
    "P3": [1, "Muy poco preparado"],
    "P4": [2, "Muy desorganizado"],
    "P5": [3, "Algo limitado"],
    "P6": [4, "Esfuerzo moderado"],
    "P7": [1, "Dificultad para socializar"],
    "P8": [5, "Muy cómodo con tech"]
  },
  "riesgos": ["desorientacion", "economica", "organizacion"]
}

// Fin de ruta
{
  "user_id": 123,
  "ruta": "Agent",
  "conversacion": [
    {"sender": "agent", "message": "Hola, ¿cómo estás?"},
    {"sender": "user", "message": "Tengo dudas..."},
    {"sender": "agent", "message": "Te entiendo..."}
  ]
}
```

### Procesamiento (Backend → OpenAI)

```json
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "system",
      "content": "Eres un analizador de riesgos académicos. SIEMPRE devuelves SOLO un JSON válido."
    },
    {
      "role": "user",
      "content": "Analiza las respuestas del cuestionario de [nombre]... Proporciona ÚNICAMENTE un JSON: {\"justificacion\": \"...\"}"
    }
  ],
  "temperature": 0.5
}
```

### Respuesta (OpenAI → Backend)

```json
{
  "choices": [
    {
      "message": {
        "content": "{\"justificacion\": \"Presenta dudas significativas sobre su carrera y preocupación económica. Muestra desorganización.\"}"
      }
    }
  ]
}
```

### Salida (Backend → Base de Datos)

```sql
UPDATE byw_agente_retencion SET
  prioridad_caso = 'medio',
  justificacion = '{"cuestionario": "...", "ruta": "..."}',
  ruta_seguida = 'Agent',
  fecha_finalizacion = NOW()
WHERE user_email = 'alumno@unitec.edu';
```

---

## Resumen Arquitectura

```
                    FRONTEND (Usuario)
                          │
                          │ HTTP POST
                          ▼
                   Backend (WordPress)
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
      Validación     Programación   Respuesta inmediata
                    de evento
                          │
                          ▼
                     wp-cron ejecuta
                    (Background)
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    Obtiene datos  Llama a OpenAI  Procesa respuesta
                          │
                    JSON validation
                          │
          ┌───────────────┼───────────────┐
          │               │               │
         ✅              ⚠️              ❌
    JSON válido    JSON incorrecto   Error conexión
          │               │               │
          ▼               ▼               ▼
    Extrae datos  Genera defecto   Registra error
          │               │               │
          └───────────────┼───────────────┘
                          │
                          ▼
                 Guarda en byw_agente_
                   interaccion
                          │
                    ✅ Completado
```

---

## Puntos Críticos del Diseño

✅ **Fire and Forget**: Frontend no espera respuesta  
✅ **Background Processing**: No bloquea al usuario  
✅ **Error Handling**: Fallos del LLM no detienen flujo  
✅ **Prepared Statements**: Seguridad contra SQL injection  
✅ **JSON Validation**: Verifica respuestas antes de procesar  
✅ **Logging**: Todos los eventos registrados  
✅ **Idempotencia**: Se puede reintentar sin efectos secundarios  
✅ **Escalabilidad**: Soporta muchos usuarios concurrentes
