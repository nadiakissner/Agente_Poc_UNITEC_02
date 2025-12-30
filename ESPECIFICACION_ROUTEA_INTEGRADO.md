# RouteA Integrado - Especificación Técnica

**Versión:** 2.0 - Nuevo Flujo con Puntuación C/R  
**Fecha:** 29 de Diciembre 2025

---

## 📋 Estructura General

El nuevo `RouteA.tsx` integra:

1. **Flujo Conversacional (Pasos 1-9):** Del nuevo flujo de 10 pasos
2. **Sistema de Puntuación C/R:** Determina qué Rama activar
3. **Rama C (Compromiso):** Chat IA generativa con LLM
4. **Rama R (Reorientación):** Test RIASEC de 12 preguntas

---

## 🎯 Flujo de Pasos (1-9) CON PUNTUACIÓN

### Paso 1: Motivación Inicial
```
Pregunta: "¿Qué tan motivado/a te sientes? (1-5)"
Scoring:
  - 1-2: +2 a R (baja motivación requiere reorientación)
  - 3:   +1 a R
  - 4-5: +0   (alta motivación)
```

### Paso 2: Tipo de Duda (BIFURCACIÓN)
```
Pregunta: "¿Dudas en ti, la carrera, o ambas?"
Opciones:
  - "Carrera" o "Ambas" → Paso 3 (+1 a C)
  - "Conmigo" o "Yo" → SALTA a Paso 5 (+2 a R)
  - Default → Paso 3
```

### Paso 3: Claridad de Decisión
```
Pregunta: "¿Qué tan clara tu decisión? (1-5)"
Scoring:
  - 1-2: +2 a R
  - 3:   +1 a R
  - 4-5: +0
```

### Paso 4: Duración de la Carrera
```
Pregunta: "¿Te preocupa que sea muy larga?"
Scoring:
  - Sí: +1 a R
  - No: +0
```

### Paso 5: Entendimiento de Materias
```
Pregunta: "¿Te preocupa no entender?"
Scoring:
  - Sí: +2 a R (preocupación académica fuerte)
  - No: +0
```

### Paso 6: Salida Laboral (CON FEEDBACK)
```
Pregunta: "¿Dudas sobre salida laboral?"
Scoring:
  - Sí: +1 a R (con feedback: "Es comprensible...")
  - No: +1 a C (con feedback: "¡Excelente!...")
```

### Paso 7: Deseo de Ayudar
```
Pregunta: "¿Buscas ayudar a otros?"
Scoring:
  - Sí: +1 a C (propósito suma a compromiso)
  - No: +0
```

### Paso 8: Deseo de Demostrarse
```
Pregunta: "¿Buscas demostrar que eres capaz?"
Scoring:
  - Sí: +1 a C (autoafirmación suma a compromiso)
  - No: +0
```

### Paso 9: Decisión Final → DETERMINA RAMA
```
Pregunta: "¿Quieres empezar este semestre?"
Scoring:
  - Sí: +1 a C
  - No: +1 a R

RAMA SELECTION:
  if (R >= C) → RAMA R (Reorientación - RIASEC)
  else       → RAMA C (Compromiso - Chat IA)
```

---

## 🎮 Sistemas de Rama

### RAMA C: Compromiso (Chat IA)
- **Activación:** Si C > R después de Paso 9
- **Flujo:** Chat generativo con LLM
- **Endpoint:** `/wp-json/gero/v1/chat-openai-agente`
- **Persistencia:** localStorage `routeA_chatHistory`
- **Propósito:** Conversar sobre dudas específicas con soporte personalizado

**Mensaje de inicio:**
```
"Perfecto, esa decisión muestra tu compromiso. Vamos a construir 
un plan juntos que sea realista y adaptado a tu situación. 
Estoy acá para ayudarte en cada paso."
```

---

### RAMA R: Reorientación (RIASEC)
- **Activación:** Si R >= C después de Paso 9
- **Flujo:** 12 preguntas RIASEC binarias
- **Resultado:** Código RIASEC (ej: "SIE")
- **Comparación:** Contrastar con carrera actual
- **Salida:**
  - ✅ **Match:** Derecha a Rama C con mensaje positivo
  - ❌ **No Match:** Derivar a ALEX para reorientación

**Mensaje de inicio:**
```
"Entiendo tus dudas y está bien sentirlo así. 
Antes de mover nada grande, vamos a explorar tus intereses de forma sencilla.
Te haré 12 preguntas simples..."
```

---

## 💾 localStorage Keys

```javascript
routeA_step              // Paso actual (1-9)
routeA_puntuacionC       // Puntos Compromiso (0-10+)
routeA_puntuacionR       // Puntos Reorientación (0-10+)
routeA_riasecScores      // Objeto: {R, I, A, S, E, C}
routeA_conversationHistory // Array de mensajes
routeA_isRamaRActive     // Boolean
routeA_ramaRStarted      // Boolean
routeA_ramaRStep         // Número de pregunta RIASEC
routeA_isAiChatActive    // Boolean
routeA_chatHistory       // Array de chat IA
```

---

## 📊 Ejemplo de Flujo Completo

### Escenario: Usuario Indeciso (Rama R)
```
P1: Motivación = 2
    → +2 a R (R=2, C=0)

P2: "Conmigo, no me siento seguro"
    → +2 a R, SALTA a P5 (R=4, C=0)

P5: "Sí, me asusta" 
    → +2 a R (R=6, C=0)

P6: "Sí, tengo dudas"
    → +1 a R (R=7, C=0)

P7: "No, es personal"
    → +0 (R=7, C=0)

P8: "No, no es mi foco"
    → +0 (R=7, C=0)

P9: "No, tengo muchas dudas"
    → +1 a R (R=8, C=0)

RESULTADO: R(8) >= C(0) → RAMA R (RIASEC test)
```

### Escenario: Usuario Decidido (Rama C)
```
P1: Motivación = 4
    → +0 (R=0, C=0)

P2: "Ambas, la carrera y mis dudas"
    → +1 a C (R=0, C=1)

P3: "Mi decisión = 4"
    → +0 (R=0, C=1)

P4: "No, está bien"
    → +0 (R=0, C=1)

P5: "No, creo que puedo"
    → +0 (R=0, C=1)

P6: "No, estoy confiado"
    → +1 a C (R=0, C=2)

P7: "Sí, quiero ayudar"
    → +1 a C (R=0, C=3)

P8: "Sí, definitivamente"
    → +1 a C (R=0, C=4)

P9: "Sí, quiero intentarlo"
    → +1 a C (R=0, C=5)

RESULTADO: C(5) > R(0) → RAMA C (Chat IA)
```

---

## 🔄 Bifurcación Paso 2

**Pasos 3-4 se pueden SALTAR si responde "conmigo":**

```
Normal:  P2 → P3 → P4 → P5 → ...
Salto:   P2 → P5 → P6 → ... (omite P3 y P4)
```

**Lógica de detección:**
```typescript
const lowerOption = opcion.toLowerCase();

if (lowerOption.includes("ambas") || lowerOption.includes("carrera")) {
  setStep(3);  // Continua normal
} else if (lowerOption.includes("conmigo") || lowerOption.includes("yo")) {
  setStep(5);  // SALTA 3 y 4
}
```

---

## 🎨 Componentes UI Utilizados

- `ChatBubble` - Mostrar mensajes agente/usuario
- `Chip` - Botones de opción rápida
- `Input` - Para chat IA
- `Button` - Acciones primarias
- `Header` - Encabezado con subtítulo
- `TypingIndicator` - Indicador de escritura agente
- `ResourceCard` - (opcional, para recursos)

---

## 🔌 Endpoints Utilizados

### 1. `/guardar-riesgos-agente`
```javascript
POST {
  user_id: int,
  riesgos: string[]
}
```

### 2. `/chat-openai-agente`
```javascript
POST {
  user_id: string,
  matricula: string,
  message: string
}
Response: { success: bool, respuesta: string }
```

### 3. `/guardar-conversacion-agente`
```javascript
POST {
  id: int,
  conversacion: string
}
```

---

## ✅ Checklist de Validación

- [x] Pasos 1-9 implementados con mensajes correctos
- [x] Puntuación C/R sumando correctamente
- [x] Bifurcación Paso 2 (salta P3/P4 si "conmigo")
- [x] Feedback personalizado Paso 6
- [x] Rama C (Chat IA) funcional
- [x] Rama R (RIASEC) funcional
- [x] Integración con componentes UI
- [x] localStorage persistence
- [x] Endpoints configurados
- [x] Imports correctos

---

## 📝 Notas Importantes

1. **Arquitectura clara:** Flujo → Puntuación → Rama
2. **Feedback en tiempo real:** Respuestas inmediatas del agente
3. **Persistencia completa:** Retomar sesión sin perder progreso
4. **Dos salidas claras:** Chat IA o RIASEC según perfil
5. **LLM Integration:** RIASEC puede derivar a Chat IA si hay match

---

**Listo para implementación y testing.**
