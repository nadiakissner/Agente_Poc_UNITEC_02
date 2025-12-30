═════════════════════════════════════════════════════════════════════════════════
        ✅ GUARDADO DE INTERACCIONES EN TIEMPO REAL + RIESGO DETECTADO
═════════════════════════════════════════════════════════════════════════════════

📋 IMPLEMENTACIÓN COMPLETADA
─────────────────────────────────────────────────────────────────────────────────

1️⃣  Guardado de interacciones en tiempo real
2️⃣  Guardado de riesgo_detectado al completar questionnaire
3️⃣  Nuevo endpoint REST: /wp-json/gero/v1/guardar-interacciones


🔧 CAMBIOS EN BACKEND (PHP)
─────────────────────────────────────────────────────────────────────────────────

NUEVO ENDPOINT:
  Ruta: POST /wp-json/gero/v1/guardar-interacciones
  Archivo: agente-retencion-unitec-02.php (línea 1749)
  
  Función: gero_guardar_interacciones()
  
  Parámetros esperados:
  ├─ user_id (int): ID del usuario
  ├─ tipo (string): Tipo de interacción
  │   ├─ 'respuesta_cuestionario'
  │   ├─ 'cuestionario_completado'
  │   └─ Otros tipos según necesidad
  ├─ contenido (json): Datos de la interacción
  └─ riesgo_detectado (json): Riesgo detectado (opcional)
  
  Base de datos:
  ├─ Tabla: byw_coach_interacciones
  ├─ Campos guardados:
  │   ├─ user_id
  │   ├─ tipo_interaccion
  │   ├─ contenido (JSON)
  │   ├─ riesgo_detectado (JSON)
  │   └─ fecha_creacion
  └─ Ejemplo INSERT:
      INSERT INTO byw_coach_interacciones 
      (user_id, tipo_interaccion, contenido, riesgo_detectado, fecha_creacion)
      VALUES (123, 'respuesta_cuestionario', '{"pregunta_id":"P1"...}', '', NOW())


🔧 CAMBIOS EN FRONTEND (REACT)
─────────────────────────────────────────────────────────────────────────────────

SRC/Pages/Questionnaire.tsx

1. Nueva función: saveQuestionnaireInteraction()
   Línea: 405-424
   
   Descripción: Guarda cada respuesta en el backend
   
   Llamada: En cada respuesta del usuario
   
   Datos enviados:
   ```tsx
   {
     user_id: 123,
     tipo: 'respuesta_cuestionario',
     contenido: {
       pregunta_id: 'P1',
       respuesta: '5',
       timestamp: '2025-12-29T15:30:00Z'
     }
   }
   ```

2. Actualizada función: calculateAndSaveRiskScores()
   Línea: 468-496
   
   Nueva funcionalidad: Al completar el questionnaire, guarda:
   ├─ Todas las respuestas
   ├─ Puntajes calculados
   ├─ Riesgo principal detectado
   └─ En tipo: 'cuestionario_completado'
   
   Datos enviados:
   ```tsx
   {
     user_id: 123,
     tipo: 'cuestionario_completado',
     contenido: {
       respuestas: [['P1', {...}], ['P2', {...}], ...],
       puntajes: {
         economica: 0,
         social: 2,
         baja_preparacion: 3,
         ...
       }
     },
     riesgo_detectado: {
       principal: 'baja_preparacion',
       todos: { economica: 0, social: 2, ... }
     }
   }
   ```

3. Llamada agregada: saveQuestionnaireInteraction()
   Línea: 328
   
   Momento: Cuando el usuario responde cada pregunta
   
   Antes de: setChatHistory()


📊 FLUJO DE GUARDADO
─────────────────────────────────────────────────────────────────────────────────

DURANTE EL CUESTIONARIO:
┌─────────────────────────────────────┐
│ Usuario responde P1 (ej: "4")       │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ saveQuestionnaireInteraction('P1')   │
│ {                                   │
│   tipo: 'respuesta_cuestionario',   │
│   contenido: { P1, '4', timestamp } │
│ }                                   │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ POST /guardar-interacciones         │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ INSERT en byw_coach_interacciones   │
│ (de inmediato, sin espera)          │
└──────────────┬──────────────────────┘
               ↓
        [Siguiente pregunta]


AL COMPLETAR CUESTIONARIO:
┌─────────────────────────────────────┐
│ Usuario responde P8 (última preg)   │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ calculateAndSaveRiskScores()        │
│ Calcula scores y detecta riesgo     │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ POST /guardar-interacciones         │
│ {                                   │
│   tipo: 'cuestionario_completado',  │
│   contenido: {respuestas, puntajes},│
│   riesgo_detectado: {principal, ...}│
│ }                                   │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ INSERT en byw_coach_interacciones   │
│ (completo con riesgos)              │
└──────────────┬──────────────────────┘
               ↓
    [Mostrar recomendación inicial]


💾 ESTRUCTURA DE DATOS EN BASE DE DATOS
─────────────────────────────────────────────────────────────────────────────────

Tabla: byw_coach_interacciones

Registro de respuesta individual:
{
  "ID": 1,
  "user_id": 123,
  "tipo_interaccion": "respuesta_cuestionario",
  "contenido": "{\"pregunta_id\":\"P1\",\"respuesta\":\"4\",\"timestamp\":\"2025-12-29T15:30:00Z\"}",
  "riesgo_detectado": "",
  "fecha_creacion": "2025-12-29 15:30:00"
}

Registro de fin de cuestionario:
{
  "ID": 2,
  "user_id": 123,
  "tipo_interaccion": "cuestionario_completado",
  "contenido": "{\"respuestas\":[[\"P1\",{...}],...],\"puntajes\":{\"economica\":0,\"baja_preparacion\":3,...}}",
  "riesgo_detectado": "{\"principal\":\"baja_preparacion\",\"todos\":{...}}",
  "fecha_creacion": "2025-12-29 15:35:00"
}


✨ BENEFICIOS
─────────────────────────────────────────────────────────────────────────────────

✓ Auditoría completa: Cada interacción registrada con timestamp
✓ Análisis granular: Puedes analizar cuándo el usuario responde algo importante
✓ Recuperación: Si se desconecta, tienes datos de dónde estaba
✓ Inteligencia: Datos para análisis de patrones de comportamiento
✓ Riesgo temprano: Riesgo_detectado se guarda inmediatamente al completar


🧪 VALIDACIÓN
─────────────────────────────────────────────────────────────────────────────────

Para verificar que funciona:

1. Abre Developer Tools (F12 → Network)
2. Completa el cuestionario
3. Observa las peticiones POST a /wp-json/gero/v1/guardar-interacciones
4. Cada respuesta debe generar una petición
5. Al terminar, una última petición con "cuestionario_completado"

En base de datos:
  SELECT * FROM byw_coach_interacciones WHERE user_id = 123;
  ✓ Debe haber N+1 registros (N respuestas + 1 final)


📊 BUILD STATUS
─────────────────────────────────────────────────────────────────────────────────

✅ 1698 módulos compilados sin errores
✅ 0 errores TypeScript
✅ 0 errores ESLint
✅ Listo para desplegar


════════════════════════════════════════════════════════════════════════════════
