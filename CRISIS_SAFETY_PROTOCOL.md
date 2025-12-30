# 🔴 Sistema de Detección de Crisis y Protocolo de Contención - GERO

## 📋 Resumen Ejecutivo

Se ha implementado un **Sistema Integral de Detección y Contención de Crisis Emocionales** que funciona en tres niveles:

1. **Frontend React** (Agent.tsx, Questionnaire.tsx)
2. **Librería de Utilidades** (crisisSafety.ts)
3. **Backend PHP** (agente-retencion-unitec-02.php)

---

## 🎯 Palabras Clave Detectadas

### RIESGO EXTREMO (Prioridad Máxima)
```
suicidio, suicidarme, matarme, quitarme la vida, no quiero vivir,
desesperación total, autolesión, cortarme, lastimarme, hacerme daño,
ya no puedo, no puedo más, cansado de vivir, no tengo razón para vivir,
mejor si no estuviera, todos estarían mejor sin mí
```

### RIESGO ALTO (Probable depresión/ansiedad severa)
```
depresión, deprimido, deprimida, ansiedad severa, pánico,
ataque de pánico, quiero morir, deseo de morir, pensamientos de muerte,
todo es sin sentido, nada tiene sentido, soy un fracaso, soy inútil,
nadie me quiere, estoy solo/a, me siento muy mal
```

---

## 🔄 Flujo de Respuesta

### Fase 1: DETECCIÓN (Paso A - Empatía y Validación)
Cuando se detecta crisis por **primera vez**:

```
Usuario: "No puedo más, quiero morirme..."
           ↓ [DETECTA RIESGO EXTREMO]
           ↓
AGENTE:   "Siento mucho que estés pasando por un momento tan difícil.
           Me preocupa lo que mencionas y quiero escucharte.
           ¿Podrías contarme un poco más sobre cómo te sientes?"
           
Backend:  [Guarda conversation_state si es riesgo EXTREMO]
```

### Fase 2: EVALUACIÓN DE PERSISTENCIA (Paso B - Referencia a Recursos)
Si el usuario mantiene el discurso negativo:

```
Usuario: "No, siento que todo es sin sentido..."
         ↓ [SIGUE DETECTANDO CRISIS]
         ↓
AGENTE:  "Entiendo que es una situación pesada. Quiero que sepas que
          no estás solo/a y la universidad cuenta con profesionales
          para apoyarte. Por favor, ingresa a www.cade.com ahora mismo
          para hablar con alguien que puede darte el apoyo especializado
          que necesitas."
          
Backend: [Guarda conversation_state CON MARCADOR DE CRISIS]
```

### Fase 3: RETORNO AL FLUJO (Paso C - Recovery)
Si el usuario muestra mejoría:

```
Usuario: "Bueno, creo que hablando me siento un poco mejor..."
         ↓ [NO DETECTA CRISIS]
         ↓
AGENTE:  "¿Te sientes mejor para continuar con nuestra charla?
          O si prefieres, podemos dejarlo para después."
          
         [Espera respuesta SÍ/NO]
         
SI Usuario responde positivamente:
  → Retoma conversación normal exactamente donde quedó
  
NO Usuario responde negativamente:
  → "Entiendo perfectamente. Tómate tu tiempo. Te escribiré
    más tarde para que retomemos cuando estés listo.
    Aquí estaré."
```

---

## 📁 Archivos Implementados

### 1. **SRC/Lib/crisisSafety.ts** (NEW)
Librería reutilizable con funciones de detección:

```typescript
export const detectCrisis = (input: string): CrisisDetection
export const getCrisisContainmentMessage = (): string
export const getCrisisResourceMessage = (): string
export const getReturnToFlowMessage = (topic?: string): string
export const getPauseMessage = (): string
export const getCrisisMarker = (): string
export const isPositiveResponse = (input: string): boolean
export const isNegativeResponse = (input: string): boolean
```

### 2. **SRC/Pages/Agent.tsx** (ACTUALIZADO)
- Estados adicionales: `crisisDetected`, `crisisLevel`, `crisisPhase`, `priorTopic`
- Función `handleSend` integrada con protocolo de crisis
- Función `saveCrisisState` para persistencia backend

### 3. **SRC/Pages/Questionnaire.tsx** (ACTUALIZADO)
- Estados adicionales: `crisisDetected`, `crisisLevel`
- Función `handleNumericResponse` integrada con protocolo de crisis
- Función `saveCrisisState` para persistencia backend

### 4. **agente-retencion-unitec-02.php** (ACTUALIZADO)
- Nueva ruta REST: `/wp-json/gero/v1/guardar-conversation-state`
- Crea tabla `wp_gero_crisis_states` automáticamente
- Guarda JSON con estado de conversación
- Registra eventos en logs para auditoría

---

## 💾 Estructura de Datos - Crisis State

Cuando se detecta crisis, se guarda en MySQL:

```json
{
  "id": 1,
  "user_id": 123,
  "conversation_state": {
    "isCrisis": true,
    "crisisLevel": "extreme",  // o "high"
    "crisisPhase": "containment",  // "evaluation" | "containment" | "recovery"
    "currentQuestion": "P5",  // En Questionnaire
    "userLastInput": "No puedo más, quiero matarme",
    "agentLastResponse": "Siento mucho que estés pasando...",
    "timestamp": "2025-12-29T15:30:45.000Z"
  },
  "crisis_marker": "[STATUS: INTERRUPTED_BY_SAFETY]",
  "created_at": "2025-12-29 15:30:45",
  "updated_at": "2025-12-29 15:30:45"
}
```

---

## 🔐 Seguridad y Auditoría

### Logging
Cada detección de crisis se registra en `wp-content/debug.log`:
```
[29-Dec-2025 15:30:45 UTC] [GERO CRISIS] User #123 - [STATUS: INTERRUPTED_BY_SAFETY] - 2025-12-29 15:30:45
```

### Tabla MySQL
```sql
CREATE TABLE wp_gero_crisis_states (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    conversation_state LONGTEXT,
    crisis_marker VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Normalización de Input
- Se eliminan acentos automáticamente
- Se convierte a minúsculas
- Se detectan variaciones (papá = papa, tío = tio)

---

## 🧪 Casos de Prueba

### Test 1: Riesgo Extremo
```
INPUT:  "Creo que es mejor si no existiera..."
OUTPUT: [CRISIS DETECTADO - RIESGO EXTREMO]
        Mensaje de contención + Guarda estado
```

### Test 2: Riesgo Alto
```
INPUT:  "Tengo una depresión severa y no sé qué hacer..."
OUTPUT: [CRISIS DETECTADO - RIESGO ALTO]
        Aguarda evaluación (próxima respuesta)
```

### Test 3: Recuperación
```
INPUT 1: "No puedo más..."
         → [DETECTA CRISIS]
         
INPUT 2: "Bueno, si... creo que hablar ayuda"
         → [CRISIS RESUELTA]
         → Pregunta si continuar o pausar
```

### Test 4: Persistencia
```
INPUT 1: "Quiero suicidarme"
         → [EXTREMO DETECTADO]
         
INPUT 2: "Sigo pensando que es sin sentido"
         → [SIGUE DETECTADA CRISIS]
         → Envía recursos (www.cade.com)
```

---

## 📞 Recursos Proporcionados al Usuario

**Cuando se confirma persistencia de crisis:**
- Enlace directo: `www.cade.com`
- Mensaje: "Profesionales especializados te esperan"
- Marcador invisible: `[STATUS: INTERRUPTED_BY_SAFETY]`

---

## 🔗 Integración con Flujos Previos

### Agent.tsx (Rama C - Chat IA)
✅ Sistema integrado y activo
- Interrumpe flujo normal inmediatamente
- Guarda estado para reanudación
- Retoma cuando usuario mejora

### Questionnaire.tsx (Rama R - RIASEC)
✅ Sistema integrado y activo
- Interrumpe después de cada pregunta
- Mantiene progreso de cuestionario
- Retoma en pregunta actual cuando mejora

### RouteA.tsx (Rama A - Conversacional)
⚠️ Revisar si necesita integración (usar mismo protocolo)

---

## 🚀 Próximos Pasos Recomendados

1. **Testing**: Validar palabras clave con psicólogos UNITEC
2. **UX**: Agregar indicador visual cuando crisis es detectada
3. **Backend**: Crear dashboard para monitorear casos de crisis
4. **Follow-up**: Implementar notificación a orientadores cuando se detecta crisis
5. **Recuperación**: API para retomar conversation_state guardado

---

## ✅ Build Status

```
✓ 1698 modules transformed
✓ 0 errors
✓ Build successful
```

Implementación completada: **29 Dic 2025**
