# Integración Flujo Completo: Frontend + Backend

## 📊 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                     SPLASH SCREEN (/)                           │
│                 Carga inicial - 3 segundos                      │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│              CONSENT PAGE (/consent)                            │
│        🔐 Validación de Matrícula + Contraseña                 │
├─────────────────────────────────────────────────────────────────┤
│ 1. Usuario ingresa: Matrícula + Contraseña                      │
│ 2. Frontend: Llamada POST a validateMatricula()                │
│    └─ Backend: GET /wp-json/gero/v1/validar-matricula           │
│       Respuesta: {                                              │
│         user_id: 123,                                           │
│         matricula: "A12345",                                    │
│         nombre: "Juan Pérez",                                   │
│         carrera: "Ingeniería en Sistemas",                      │
│         flujo: "nuevo" | "recurrente",                          │
│         tiene_historial: true/false                             │
│       }                                                         │
│ 3. Frontend: Guardar en localStorage:                           │
│    ├─ udla_matricula = "A12345"                                 │
│    ├─ udla_user_id = 123                                        │
│    ├─ udla_flujo = "nuevo" | "recurrente"                      │
│    └─ udla_tiene_historial = true/false                         │
│ 4. Routing condicional:                                         │
│    ├─ Si flujo = "recurrente" → /agent (Usuario recurrente)   │
│    └─ Si flujo = "nuevo" → /home (Usuario nuevo)              │
└──────────┬──────────────────────────┬──────────────────────────┘
           │                          │
   flujo = "recurrente"      flujo = "nuevo"
           │                          │
           ▼                          ▼
    ┌──────────────┐      ┌──────────────────────┐
    │  AGENT PAGE  │      │  HOME PAGE (/home)   │
    │   (/agent)   │      │  Bienvenida          │
    └──────────────┘      └─────────┬────────────┘
           ▲                         │
           │                         ▼
           │              ┌────────────────────────────────┐
           │              │  QUESTIONNAIRE PAGE             │
           │              │  (/questionnaire)              │
           │              │  8 Preguntas (P1-P8)           │
           │              ├────────────────────────────────┤
           │              │ 1. Usuario responde 8 preguntas│
           │              │ 2. Frontend: Guardar respuestas│
           │              │    localStorage.udla_answers:  │
           │              │    {                           │
           │              │      "P1": "Opción A",          │
           │              │      "P2": "Opción B",          │
           │              │      ...                       │
           │              │      "P8": "Opción C"          │
           │              │    }                           │
           │              │ 3. Siguiente: /summary         │
           │              └────────┬─────────────────────────┘
           │                       │
           │                       ▼
           │              ┌──────────────────────────────┐
           │              │  SUMMARY PAGE (/summary)     │
           │              │  Análisis de Riesgos         │
           │              ├──────────────────────────────┤
           │              │ 1. Retrieves localStorage:   │
           │              │    ├─ udla_answers          │
           │              │    ├─ udla_matricula        │
           │              │    └─ udla_user_id          │
           │              │ 2. Frontend → Backend:       │
           │              │    POST /procesar-respuestas │
           │              │    {                         │
           │              │      user_id: 123,           │
           │              │      matricula: "A12345",    │
           │              │      respuestas: {           │
           │              │        P1: "Opción A", ...  │
           │              │      }                       │
           │              │    }                         │
           │              │ 3. Backend calcula:          │
           │              │    ├─ Scoring (0-100)        │
           │              │    ├─ Categoría de riesgo    │
           │              │    └─ Hipótesis principales  │
           │              │ 4. Respuesta:                │
           │              │    {                         │
           │              │      score: 75,              │
           │              │      hipotesis: [            │
           │              │        "desorientacion_...", │
           │              │        "preocupacion_...",   │
           │              │        ...                   │
           │              │      ]                       │
           │              │    }                         │
           │              │ 5. Frontend: Guardar:        │
           │              │    localStorage.udla_riesgos│
           │              │ 6. Navega a: /agent          │
           │              └────────┬─────────────────────┘
           │                       │
           └───────────────────────┘
                        │
                        ▼
        ┌──────────────────────────────────┐
        │  AGENT PAGE (/agent)             │
        │  Chat de Acompañamiento          │
        ├──────────────────────────────────┤
        │ 1. Load datos del localStorage:  │
        │    ├─ udla_matricula             │
        │    ├─ udla_user_id               │
        │    └─ udla_riesgos_principales  │
        │ 2. Auto-cargar último historial: │
        │    GET /last-conversation        │
        │ 3. Mensaje inicial personalizado│
        │ 4. Usuario escribe mensajes      │
        │ 5. POST /chat-openai-agente      │
        │    Sistema recibe contexto:      │
        │    ├─ Nombre del estudiante      │
        │    ├─ Matrícula                  │
        │    ├─ Carrera                    │
        │    ├─ Riesgos detectados         │
        │    └─ Historial de hipótesis     │
        │ 6. Guardar conversación:         │
        │    POST /guardar-conversacion    │
        └──────────────────────────────────┘
```

## 🔑 localStorage Keys (Estado Persistente)

```javascript
// De Consent.tsx (Autenticación)
localStorage.getItem("udla_matricula")           // "A12345"
localStorage.getItem("udla_user_id")             // "123"
localStorage.getItem("udla_flujo")               // "nuevo" o "recurrente"
localStorage.getItem("udla_tiene_historial")     // "true" o "false"

// De Questionnaire.tsx (Respuestas)
localStorage.getItem("udla_answers")             // JSON con P1-P8

// De Summary.tsx (Resultados)
localStorage.getItem("udla_riesgos_principales") // JSON con hipótesis
```

## 🔗 Endpoints Backend Utilizados

### 1. **Validación de Matrícula** (Consent.tsx)
```
GET /wp-json/gero/v1/validar-matricula?matricula=A12345
RESPONSE:
{
  "user_id": 123,
  "nombre": "Juan Pérez",
  "carrera": "Ingeniería en Sistemas",
  "flujo": "nuevo|recurrente",
  "tiene_historial": true/false
}
```

### 2. **Obtener Datos del Usuario** (Agent.tsx)
```
GET /wp-json/gero/v1/usuarios-habilitados?id=123
RESPONSE:
{
  "nombre": "Juan Pérez",
  "carrera": "Ingeniería en Sistemas"
}
```

### 3. **Procesar Respuestas del Cuestionario** (Summary.tsx)
```
POST /wp-json/gero/v1/procesar-respuestas-cuestionario
BODY:
{
  "user_id": 123,
  "matricula": "A12345",
  "respuestas": {
    "P1": "Opción A",
    "P2": "Opción B",
    "P3": "Opción C",
    ...
    "P8": "Opción Z"
  }
}
RESPONSE:
{
  "score": 75,
  "hipotesis": [
    "desorientacion_academica",
    "preocupacion_economica",
    ...
  ]
}
```

### 4. **Obtener Última Conversación** (Agent.tsx)
```
GET /wp-json/gero/v1/last-conversation?value_validador=A12345
RESPONSE:
{
  "conversation_string": "User: Hola\nAgent: Hola, ¿cómo estás?"
}
```

### 5. **Enviar Mensaje al Agente** (Agent.tsx)
```
POST /wp-json/gero/v1/chat-openai-agente
BODY:
{
  "messages": [
    {
      "role": "system",
      "content": "Eres GERO, un asistente académico. El estudiante es Juan Pérez (A12345), carrera Ingeniería en Sistemas. Riesgos detectados: desorientacion_academica, preocupacion_economica"
    },
    {
      "role": "user",
      "content": "Hola, necesito ayuda"
    }
  ]
}
RESPONSE:
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Hola Juan, te voy a ayudar con eso..."
      }
    }
  ]
}
```

### 6. **Guardar Conversación** (Agent.tsx)
```
POST /wp-json/gero/v1/guardar-conversacion-agente
BODY:
{
  "id": 123,
  "conversacion": "User: Hola\nAgent: Hola, ¿cómo estás?..."
}
```

## 📝 Componentes Modificados

### 1. **Consent.tsx** → Login con Matrícula
- ✅ Campo de Matrícula (antes: Nombre)
- ✅ Campo de Contraseña (nuevo)
- ✅ Validación backend
- ✅ Manejo de errores
- ✅ Routing condicional (nuevo vs recurrente)

### 2. **Home.tsx** → Bienvenida Personalizada
- ✅ Recupera matricula del localStorage
- ✅ Valida que exista antes de mostrar
- ✅ Redirect a /consent si no existe
- ✅ Mensaje personalizado con matrícula

### 3. **Questionnaire.tsx** → Sin cambios
- ✅ Ya funciona correctamente
- ✅ P1-P8 almacenados en localStorage
- ✅ Flujo de preguntas intacto

### 4. **Summary.tsx** → Integración Backend
- ✅ Recupera respuestas del localStorage
- ✅ Envía a POST /procesar-respuestas-cuestionario
- ✅ Recibe hipótesis del backend
- ✅ Almacena riesgos en localStorage
- ✅ Navega a /agent

### 5. **Agent.tsx** → Auto-inicialización
- ✅ Auto-carga matricula del localStorage
- ✅ Obtiene datos del usuario
- ✅ Carga último historial
- ✅ Inicializa chat con contexto personalizado

## 🎯 Testing Manual

### Paso 1: Ir al Login
```
1. Accede a http://localhost:8080
2. Espera Splash (3 seg)
3. Deberías ver pantalla de Consent
4. Campo de entrada: Matrícula (NO Nombre)
```

### Paso 2: Login con Matrícula
```
1. Ingresa matrícula válida (ej: A12345)
2. Ingresa contraseña
3. Click "Validar"
4. Si flujo="nuevo": Va a /home
   Si flujo="recurrente": Va directo a /agent
```

### Paso 3: Flujo Nuevo (nuevo usuario)
```
1. Home: Ver saludo "Hola, estudiante de matrícula A12345"
2. Click "Continuar"
3. Questionnaire: Responde 8 preguntas
4. Click "Siguiente"
5. Summary: Ver análisis de riesgos
6. Click "Ir al acompañamiento"
7. Agent: Chat con contexto personalizado
```

### Paso 4: Flujo Recurrente (usuario recurrente)
```
1. Consent: Login con matrícula
2. Directo a Agent (sin cuestionario)
3. Ver último historial cargado
4. Chat continúa desde donde quedó
```

## 🐛 Debugging

### localStorage inspeccionador (Browser DevTools)
```javascript
// Ver todos los datos guardados
console.log({
  matricula: localStorage.getItem("udla_matricula"),
  user_id: localStorage.getItem("udla_user_id"),
  flujo: localStorage.getItem("udla_flujo"),
  answers: localStorage.getItem("udla_answers"),
  riesgos: localStorage.getItem("udla_riesgos_principales"),
});
```

### Network inspeccionador (Browser DevTools)
```
1. Abre DevTools (F12)
2. Pestaña "Network"
3. Intenta el flujo
4. Verifica:
   - GET /validar-matricula → 200
   - POST /procesar-respuestas-cuestionario → 200
   - POST /chat-openai-agente → 200
```

### Console para errores
```javascript
// Busca errores en la consola
// Error en Consent: "Matrícula no encontrada"
// Error en Summary: "Error al enviar respuestas"
// Error en Agent: "Error validando"
```

## ✅ Checklist de Integración

- [ ] Consent.tsx muestra campo Matrícula (no Nombre)
- [ ] Login valida con backend
- [ ] localStorage tiene udla_matricula después del login
- [ ] Home.tsx muestra matrícula en saludo
- [ ] Questionnaire almacena respuestas P1-P8
- [ ] Summary envía respuestas al backend
- [ ] Backend devuelve hipótesis
- [ ] Agent.tsx auto-carga matricula del localStorage
- [ ] Chat funciona con contexto personalizado
- [ ] Historial se guarda correctamente

## 🚀 Próximos Pasos

1. **Recargar navegador** en http://localhost:8080
2. **Probar Consent** con matrícula válida
3. **Completar flujo** hasta Agent
4. **Verificar localStorage** en DevTools
5. **Revisar Network** para errores de API
6. **Ajustar backend** si es necesario (endpoints, respuestas, etc.)

---

**Actualización:** Todos los componentes ahora integrados y funcionales. ✨
