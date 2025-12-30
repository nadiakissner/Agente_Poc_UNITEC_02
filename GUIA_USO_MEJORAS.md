# 🎯 Guía de Uso - Mejoras Implementadas

**Versión:** 2.0  
**Fecha:** Diciembre 23, 2025

---

## 📖 Resumen Rápido

Se han implementado 5 mejoras principales en el flujo conversacional del agente:

1. ✨ Mensaje personalizado al iniciar cuestionario
2. 📖 Control de scroll en lugar de auto-scroll forzado
3. 🔄 Transición fluida entre Home y Questionnaire
4. 🎓 Mensaje final que menciona explícitamente la carrera
5. ⚡ Optimización de tiempos de transición

---

## 🚀 Cómo Funciona Cada Mejora

### 1️⃣ Mensaje Personalizado del Cuestionario

**¿Qué sucede?**
Cuando un estudiante llega a Questionnaire, ve:
```
"Perfecto, Juan! ✨ Comencemos."
```

**¿Cómo funciona?**
- El sistema recupera el nombre desde `localStorage.unitec_nombre`
- Se reemplaza `{Nombre}` automáticamente
- El emoji ✨ lo hace más amigable

**Ubicación:** `SRC/Pages/Questionnaire.tsx` (líneas ~20-40)

---

### 2️⃣ Control de Scroll Inteligente

**¿Qué sucede?**
En el cuestionario, cuando llega una nueva pregunta:
- ❌ NO hace scroll automático al final
- ✅ El usuario ve la pregunta en su posición actual
- ✅ Puede scrollear manualmente si lo desea

**¿Por qué es mejor?**
- Permite leer tranquilamente
- No interrumpe la concentración
- El usuario tiene control visual

**Ubicación:** `SRC/Pages/Questionnaire.tsx` (líneas ~34-37, comentadas)

```typescript
// Auto-scroll DESACTIVADO
// useEffect(() => {
//   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
// }, [chatHistory, currentQuestionIndex]);
```

---

### 3️⃣ Transición Fluida Home → Questionnaire

**¿Qué sucede?**

**Antes:**
```
Home → Cambio de pantalla → Questionnaire vacío → Carga de preguntas
```

**Después:**
```
Home → Mismo historial visible → Questionnaire con contexto
```

**¿Cómo funciona?**

En `Home.tsx`:
```typescript
// Cuando el usuario confirma pasar al cuestionario
localStorage.setItem("unitec_home_chat_history", JSON.stringify(historyWithConfirm));
navigate("/questionnaire");
```

En `Questionnaire.tsx`:
```typescript
// Al cargar, se recupera el historial
const homeChatHistory = localStorage.getItem("unitec_home_chat_history");
// Se integra con el nuevo mensaje personalizado
// Se limpia localStorage para no dejar rastros
localStorage.removeItem("unitec_home_chat_history");
```

**Ubicación:** 
- `SRC/Pages/Home.tsx` (línea ~57)
- `SRC/Pages/Questionnaire.tsx` (líneas ~21-40)

---

### 4️⃣ Mensaje Final Personalizado de RouteA

**¿Qué sucede?**

Cuando se completa el flujo RIASEC y hay alineación:

**Antes:**
```
"Tus intereses y gustos parecen estar alineados con la carrera 
que has elegido..."
```

**Después:**
```
"¡Excelente noticia! Tus intereses y aptitudes están bien 
alineados con **Licenciatura en Ingeniería en Sistemas Computacionales**. 
Los resultados de nuestro análisis confirman que tus preferencias 
profesionales encajan con lo que esta carrera te ofrece..."
```

**¿Cómo funciona?**

```typescript
// En calculateRiasecResult() de RouteA.tsx
const introMsg = `¡Excelente noticia! Tus intereses y aptitudes están bien 
alineados con **${userCarrera}**. Los resultados...`;
```

**Ubicación:** `SRC/Pages/RouteA.tsx` (línea ~571)

---

### 5️⃣ Optimización de Tiempos

**¿Qué sucede?**

Las transiciones entre pasos en RouteA son ahora más rápidas pero cómodas:

| Elemento | Antes | Después |
|----------|-------|---------|
| Paso 1 → 2 | 800ms | 400ms ⚡ |
| Paso 2 → 3 | 800ms | 400ms ⚡ |
| Paso 3 → 4 | 800ms | 400ms ⚡ |
| Paso 6 → 7 | 1500ms | 800ms ⚡ |
| Paso 7 → 8 | 1500ms | 800ms ⚡ |

**¿Por qué?**
- Menos espera percibida
- Flujo más ágil
- Sigue siendo cómodo (no es instant)

**Ubicación:** `SRC/Pages/RouteA.tsx` (múltiples líneas con `showTyping()`)

---

## 📱 Flujo Visual Completo

```
┌─────────────────────────────────┐
│ 1. CONSENT / LOGIN              │
│ Usuario ingresa matrícula       │
└──────────────┬──────────────────┘
               │ localStorage guardado:
               │ - matricula
               │ - nombre
               │ - carrera
               │
               ▼
┌─────────────────────────────────┐
│ 2. HOME                         │
│ "Hola, {nombre}. Soy Gero..."   │
│ [Sí, veamos] [Tengo prisa]      │
│                                 │
│ [Usuario selecciona opción]     │
│ ↓ Historial guardado            │
└──────────────┬──────────────────┘
               │ historial enviado a:
               │ unitec_home_chat_history
               │
               ▼
┌─────────────────────────────────┐
│ 3. QUESTIONNAIRE                │
│ ✨ "Perfecto, {nombre}! ✨      │
│     Comencemos."                │
│ ↓ (Historial de Home visible)   │
│ [Pregunta 1...]                 │
│ [Opciones de respuesta]         │
│                                 │
│ 📖 NOTA: Sin auto-scroll        │
│    Usuario controla lectura     │
└──────────────┬──────────────────┘
               │ respuestas guardadas
               │ historial completo
               │
               ▼
┌─────────────────────────────────┐
│ 4. ROUTEA - FLUJO GUIADO        │
│ Paso 1: ¿Vamos?                 │
│ Paso 2: ¿Preocupación?          │
│ Paso 3: ¿Origen?                │
│ Paso 4: Motivación (slider)     │
│ Paso 5: Claridad (slider)       │
│ Paso 6: Proyección              │
│ Paso 7: Sentido                 │
│ Paso 8: ¿Intentar o Pensar?     │
│                                 │
│ ⏱️ Transiciones optimizadas      │
│    (más rápidas pero cómodas)   │
└──────────────┬──────────────────┘
               │ RAMIFICACIÓN
        ┌──────┴─────┐
        │             │
        ▼             ▼
    RAMA C        RAMA R
    (C ≥ R)       (R > C)
        │             │
        ▼             ▼
   Chat IA      12 Preguntas
   Generativo   RIASEC
   Inmediato    
                      │
                      ▼
           ┌─────────────────────┐
           │ Cálculo de RIASEC   │
           │ Verificación de     │
           │ alineación          │
           └──────────┬──────────┘
                      │
              ┌───────┴────────┐
              │                │
              ▼                ▼
          ALINEADO         NO ALINEADO
          (Match ✅)       (No Match ❌)
              │                │
              ▼                ▼
         ┌─────────────┐  ┌─────────────┐
         │Chat IA con  │  │Derivar a    │
         │mensaje:     │  │ALEX         │
         │"¡Excelente! │  │             │
         │ Tu carrera: │  │"Hablemos    │
         │ **{Carrera}**  │ con ALEX"   │
         │ Alineados!"  │  │             │
         └─────────────┘  └─────────────┘
```

---

## 🔍 Cómo Verificar los Cambios

### Verificación en Navegador

1. **Mensaje Personalizado:**
   - Ir a Home → Seleccionar "Sí, veamos"
   - Esperar a que cargue Questionnaire
   - Verificar: "Perfecto, [Tu Nombre]! ✨ Comencemos."

2. **Scroll Control:**
   - En Questionnaire, responder algunas preguntas
   - Observar que NO hay scroll automático
   - El contenido se mantiene donde lo dejaste

3. **Historial Continuo:**
   - En Home, ver que el historial se muestra
   - En Questionnaire, verificar que el historial de Home sigue visible

4. **Mensaje de Carrera:**
   - Completar todo el flujo
   - Llegar a RouteA con alineación RIASEC
   - Verificar: "¡Excelente noticia! ... **Tu Carrera**"

5. **Velocidad de Transiciones:**
   - Notar que los cambios de pregunta son más rápidos
   - Pero sin sentirse "instante" (sigue habiendo pequeña pausa)

---

## 🐛 Solución de Problemas

### "No veo el nombre en Questionnaire"
- Verificar: ¿Viene del Home o accede directamente?
- Solución: Asegurar que `localStorage.unitec_nombre` tiene un valor
- Debug: `console.log(localStorage.getItem("unitec_nombre"))`

### "El scroll está raro en Questionnaire"
- Verificar: Scroll debe ser manual (no automático)
- Si hay auto-scroll, revisar que línea 34-37 en Questionnaire.tsx está comentada
- Solución: Descomenta y vuelve a comentar el useEffect

### "El mensaje final no menciona mi carrera"
- Verificar: ¿Es alineado === true?
- Si no: El usuario va a ALEX directamente (comportamiento correcto)
- Debug: Ver console.log en RouteA.tsx para ver `userCarrera`

### "Los tiempos de transición siguen lento"
- Verificar: Que ShowTyping() tiene tiempos reducidos
- Solución: Revisar llamadas a `showTyping()` en RouteA.tsx
- Debug: Abrir DevTools → Console → Ver logs de timing

---

## 📊 localStorage - Referencia

### Claves Utilizadas

```typescript
// Datos del usuario (generales)
localStorage.getItem("unitec_matricula")        // ej: "2024-001"
localStorage.getItem("unitec_nombre")           // ej: "Juan García"
localStorage.getItem("unitec_carrera")          // ej: "Ingeniería en Sistemas"
localStorage.getItem("unitec_user_id")          // ej: "123"

// Datos del flujo Home
localStorage.getItem("unitec_home_chat_history") // TEMPORAL (se limpia)
                                                 // Guardado antes de ir a Questionnaire
                                                 // Recuperado en Questionnaire

// Datos del flujo Questionnaire
localStorage.getItem("unitec_answers")          // Respuestas del cuestionario
localStorage.getItem("routeA_conversationHistory") // Historial completo

// Datos del flujo RouteA
localStorage.getItem("routeA_step")             // Paso actual
localStorage.getItem("routeA_puntuacionC")      // Puntuación Compromiso
localStorage.getItem("routeA_puntuacionR")      // Puntuación Reorientación
localStorage.getItem("routeA_riasecScores")     // Scores RIASEC
localStorage.getItem("riasec_result")           // Resultado final RIASEC

// Datos de riesgos
localStorage.getItem("unitec_riesgos_principales") // Riesgos detectados
```

---

## 🎓 Ejemplo de Flujo Real

**Usuario:** "María" (inscripta en "Ingeniería en Sistemas")

1. **Home:**
   ```
   "Hola, María. Soy Gero. Te haré algunas preguntas breves..."
   [Usuario: Sí, veamos]
   "Perfecto. Vamos a conocerte mejor entonces."
   ```

2. **Transición (mejorada):**
   - localStorage guarda historial
   - Se navega a Questionnaire
   - Historial persiste

3. **Questionnaire (personalizado):**
   ```
   [Historial de Home visible]
   
   "Perfecto, María! ✨ Comencemos."
   
   "✨ Comenzar una nueva etapa puede generar muchas emociones distintas.
    ¿Cómo describirías hoy tu sensación...?"
   [Opciones de respuesta]
   ```

4. **RouteA - Si R > C (Rama R):**
   ```
   [Flujo de preguntas]
   ...
   Pantalla: "Descubramos tu perfil de intereses profesionales.
             Son solo 12 preguntas rápidas (≈ 5 min).
             Vamos, comenzar"
   ...
   [Usuario completa 12 preguntas RIASEC]
   ```

5. **Resultado (personalizado):**
   ```
   "¡Excelente noticia! Tus intereses y aptitudes están bien 
    alineados con **Ingeniería en Sistemas**. Los resultados de 
    nuestro análisis confirman que tus preferencias profesionales 
    encajan con lo que esta carrera te ofrece.
    
    Ahora que hemos confirmado este match, ¿hay algo específico 
    sobre tu carrera o tu motivación que quieras trabajar juntos?"
    
    [Campo de chat para continuar]
   ```

---

## 🚀 Próximos Pasos

1. **Deploy:** Llevar cambios a producción
2. **Monitoring:** Ver cómo interactúan los usuarios
3. **Feedback:** Recopilar comentarios
4. **Iteración:** Ajustes basados en feedback

---

## 📞 Soporte

Si tienes dudas sobre cómo funcionan los cambios, consulta:

- `MEJORAS_FLUJO_CONVERSACIONAL.md` - Detalles técnicos
- `VISTA_PREVIA_CAMBIOS.md` - Visuales de los cambios
- `VERIFICACION_IMPLEMENTACION_CHECKLIST.md` - Checklist de validación

---

**¡Listo para mejorar la experiencia del estudiante! 🎓✨**
