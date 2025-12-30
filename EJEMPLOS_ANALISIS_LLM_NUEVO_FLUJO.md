# Ejemplos de Análisis LLM - Nuevo Flujo RouteA

## 📊 Casos de Uso: Cómo el LLM Interpreta las Respuestas

### Caso 1: Estudiante con Baja Motivación + Dudas Internas

**Respuestas del Usuario:**
```json
{
  "1": "2",
  "2": "Conmigo, no confío en mis capacidades",
  "5": "Sí, me asusta no entender las materias",
  "8": "No, no creo poder",
  "9": "No es lo mío",
  "10": "No estoy seguro"
}
```

**Contexto que Backend envía al LLM:**
```
El estudiante reportó:
- Motivación inicial: 2/5 (MUY BAJA)
- Tipo de dudas: Conmigo (DUDAS INTERNAS)
- Preocupación materias: Sí, me asusta
- Motivación demostrarse: No, no creo poder (NEGATIVA)
- Decisión final: No estoy seguro (INSEGURIDAD)
```

**Respuesta LLM esperada:**
```json
{
  "justificacion": "Juan inicia con muy baja motivación (2/5) y sus dudas son principalmente de autoconfianza. Teme no comprender las materias. No busca demostrarse capaz. Necesita intervención urgente en autoestima y definición de propósito académico.",
  "riesgos_identificados": ["baja_confianza", "dudas_internas", "preocupacion_academica", "falta_motivacion"]
}
```

**Prioridad Asignada:** `ALTO`

---

### Caso 2: Estudiante Motivado + Carrera Clara + Preocupaciones Académicas

**Respuestas del Usuario:**
```json
{
  "1": "5",
  "2": "Sobre la carrera, pero tengo dudas de cómo lograrlo",
  "3": "4",
  "4": "Un poco, pero es lo que quiero",
  "5": "Sí, me asusta un poco las materias",
  "6": "No, confío en la salida laboral",
  "7": "Sí, quiero ayudar a otros",
  "8": "Sí, quiero demostrar mis capacidades",
  "9": "También es importante",
  "10": "Sí, quiero empezar"
}
```

**Contexto que Backend envía:**
```
El estudiante reportó:
- Motivación inicial: 5/5 (MUY ALTA)
- Tipo de dudas: Carrera (DUDAS EXTERNAS)
- Claridad carrera: 4/5 (CLARA)
- Preocupaciones: Duración (poco), Materias (sí), Salida laboral (no)
- Motivaciones: Ayudar (sí), Demostrarse (sí), Dinero (importante)
```

**Respuesta LLM esperada:**
```json
{
  "justificacion": "María inicia con alta motivación (5/5) y claridad en su carrera (4/5). Sus dudas son sobre cómo ejecutar el plan, no sobre la decisión. Tiene preocupación académica pero motivación múltiple (ayudar, demostrarse). Requiere principalmente tutoría académica, no intervención emocional.",
  "riesgos_identificados": ["preocupacion_academica_moderada"]
}
```

**Prioridad Asignada:** `BAJO` (solo seguimiento académico)

---

### Caso 3: Estudiante Indeciso - Bifurcación en Paso 2

**Respuestas del Usuario:**
```json
{
  "1": "3",
  "2": "Ambas cosas, me cuesta confiar y tampoco estoy seguro de la carrera",
  "3": "2",
  "4": "Sí, me preocupa la duración",
  "5": "Sí, las materias me asustan",
  "6": "Sí, no sé si hay empleo",
  "7": "Espero ayudar, pero no sé",
  "8": "A veces",
  "9": "Necesito trabajar para pagar",
  "10": "Creo que necesito ayuda"
}
```

**Contexto que Backend envía:**
```
El estudiante reportó:
- Motivación inicial: 3/5 (MODERADA)
- Tipo de dudas: Ambas (INTERNAS Y EXTERNAS)
- Claridad carrera: 2/5 (MUY BAJA)
- Preocupaciones: TODAS (duración, materias, salida laboral)
- Motivaciones: Inciertas (espero/a veces/necesito)
- Decisión final: Creo que necesito ayuda
```

**Respuesta LLM esperada:**
```json
{
  "justificacion": "Carlos inicia con motivación moderada (3/5) pero tiene dudas combinadas de confianza y elección de carrera. Claridad muy baja (2/5). Múltiples preocupaciones académicas y laborales. Motivaciones son reactivas (pagar). Requiere intervención integral: clarificación de carrera + fortalecimiento confianza + orientación vocacional.",
  "riesgos_identificados": ["baja_claridad_carrera", "dudas_combinadas", "preocupaciones_multiples", "motivacion_limitada", "requiere_orientacion_vocacional"]
}
```

**Prioridad Asignada:** `ALTO` (requiere orientación y aclaración vocacional)

---

### Caso 4: Estudiante Decidido que Requiere RIASEC

**Respuestas del Usuario:**
```json
{
  "1": "4",
  "2": "La carrera, tengo muchas dudas sobre la carrera",
  "3": "2",
  "4": "No, la duración es ok",
  "5": "No, sé que puedo",
  "6": "Sí, no veo mucha salida laboral",
  "7": "Sí, definitivamente",
  "8": "Sí, quiero ser alguien importante",
  "9": "No es la prioridad",
  "10": "No, necesito pensar más"
}
```

**Contexto que Backend envía:**
```
El estudiante reportó:
- Motivación inicial: 4/5 (BUENA)
- Tipo de dudas: Carrera (EXTERNAS)
- Claridad carrera: 2/5 (BAJA)
- Preocupación salida laboral: SÍ (CRÍTICA)
- Motivaciones claras: Ayudar (sí), Demostrarse (sí), Dinero (no es prioridad)
- Decisión final: No, necesito pensar más
```

**Respuesta LLM esperada:**
```json
{
  "justificacion": "Diana tiene buena motivación (4/5) pero baja claridad en carrera elegida (2/5). Sus dudas externas se centran en salida laboral. Motivaciones intrínsecas claras (ayudar, demostrarse). CANDIDATA IDEAL PARA RIASEC: necesita alineación entre intereses (RIASEC) y carrera actual.",
  "riesgos_identificados": ["baja_claridad_carrera", "dudas_salida_laboral"]
}
```

**Recomendación:** `DERIVAR A RIASEC TEST`

---

## 🎯 Patrones de Interpretación del LLM

### Riesgos que el LLM Detecta Automáticamente

#### 1. **baja_confianza**
Indicadores:
- Paso 1: Motivación < 3
- Paso 2: Menciona "conmigo", "yo", "confío"
- Paso 5: Sí a preocupación de materias
- Paso 8: No/negativo a demostrarse

#### 2. **baja_claridad_carrera**
Indicadores:
- Paso 2: Dice "carrera"
- Paso 3: Puntuación < 3
- Paso 6: Sí a dudas de salida laboral

#### 3. **preocupaciones_multiples**
Indicadores:
- Múltiples "Sí" en pasos 4, 5, 6
- Combinación de baja confianza + dudas carrera

#### 4. **falta_motivacion**
Indicadores:
- Paso 1: < 3
- Pasos 7, 8, 9: Respuestas negativas/inciertas
- Motivaciones reactivas en lugar de proactivas

#### 5. **requiere_orientacion_vocacional**
Indicadores:
- Paso 3: Muy baja claridad (< 2)
- Paso 10: "No sé" o "necesito ayuda"
- Combinación de dudas sobre carrera

---

## 📈 Algoritmo de Priorización Actualizado

El LLM y backend determinan prioridad basándose en:

```python
if motivacion < 2 or (dudas_internas and materias_concern):
    prioridad = "ALTO"  # Intervención urgente

elif multiple_concerns and claridad_carrera < 3:
    prioridad = "ALTO"  # Requiere orientación

elif preocupaciones_academicas and motivacion < 4:
    prioridad = "MEDIO"  # Seguimiento + tutoría

elif solo_preocupacion_laboral and motivacion > 3:
    prioridad = "BAJO"   # Información + RIASEC

else:
    prioridad = "BAJO"   # Seguimiento regular
```

---

## 💬 Feedback Contextual del Agente

En **Paso 6**, si el usuario dice SÍ a dudas de salida laboral:

```
Agent: "Es totalmente comprensible. Puedo derivarte con el área 
de información de la universidad para que veas el perfil 
profesional detallado."

[Pausa 800ms]

Agent: "¿Buscas ayudar a otros o dejar una huella?"
```

Este feedback es importante porque:
- **Valida el sentimiento** del estudiante
- **Ofrece solución concreta** (derivación)
- **No interrumpe el flujo** (continúa al siguiente paso)

---

## 🔍 Validación de Respuestas Tipo "Motivación"

**Paso 1:** "¿Qué tan motivado te sientes del 1 al 5?"

**Validación Frontend:**
```typescript
const validateMotivationResponse = (response: string): boolean => {
  const num = parseInt(response);
  return num >= 1 && num <= 5;
};

// Si falla: 
// "Por favor, responde un número entre 1 y 5."
```

**Ejemplos aceptados:**
- "1", "2", "3", "4", "5" ✅
- "1 " (con espacio) ✅ (trim)
- " 3 " (ambos espacios) ✅

**Ejemplos rechazados:**
- "0" ❌
- "6" ❌
- "bajo" ❌
- "no sé" ❌

---

## 📋 Resumen: Flujo de Análisis Completo

```
Usuario responde 10 pasos
    ↓
Frontend valida cada respuesta
    ↓
Frontend acumula historial chat
    ↓
Usuario completa Paso 10
    ↓
Frontend POST a /procesar-fin-cuestionario
    {
      respuestas: {...},
      conversacion: [...],
      user_id, user_email, ...
    }
    ↓
Backend extrae información contextual
    ↓
Backend construye CONTEXTO para LLM
    ↓
Backend llama LLM con PROMPT mejorado
    ↓
LLM analiza conversación COMPLETA
    ↓
LLM retorna:
    - justificacion (50 palabras)
    - riesgos_identificados (array)
    ↓
Backend determina prioridad_caso
    (alto/medio/bajo/pendiente)
    ↓
Backend guarda en byw_agente_retencion
    ↓
Frontend redirige a:
    - /summary (SÍ en paso 10)
    - /routeA-riasec (NO en paso 10)
```

---

**Nota:** El LLM ahora interpreta NO SOLO las respuestas individuales, sino la conversación COMPLETA, lo que permite detectar matices como: "dice que confía pero su tono es inseguro" o "expresa motivación pero tiene múltiples preocupaciones".
