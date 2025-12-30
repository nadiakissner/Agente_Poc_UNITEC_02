# ✨ Verificación del Flujo - Guía Paso a Paso

## 🎯 Lo que debería ver ahora

### En http://localhost:8080

#### 1️⃣ **Splash Screen** (Pantalla de Carga)
- ⏱️ Durará 3 segundos
- Se cerrará automáticamente
- Verás el logo de GERO

#### 2️⃣ **Consent Screen** (NUEVO - Pantalla de Autenticación)
**ANTES (Lo que NO deberías ver):**
```
¿Cómo te llamas?
[_______________]
```

**AHORA (Lo que SÍ deberías ver):**
```
┌─────────────────────────────────┐
│  Ingresa tu Matrícula           │
│  ☝️ AQUÍ ES EL CAMBIO PRINCIPAL  │
├─────────────────────────────────┤
│ Matrícula: [_____________]      │
│ Contraseña: [_____________]     │
│                                 │
│        [ Validar ]              │
└─────────────────────────────────┘
```

**Acciones:**
- Ingresa una matrícula válida (ej: `A12345`)
- Ingresa contraseña (ej: `password123`)
- Click en "Validar"
- Verás un loader mientras se valida con backend

---

## 🔍 Verificaciones por Pantalla

### Pantalla 1: Consent (Login)
```
✓ Debe mostrar campo "Matrícula" (NO "Nombre")
✓ Debe mostrar campo "Contraseña"
✓ Al hacer click en "Validar" → Loader aparece
✓ Si matricula es válida → Navega a Home o Agent
✓ Si matricula es inválida → Error message en rojo
✓ Error message dice: "Matrícula no encontrada."
```

**¿Qué sucede después?**
- Si usuario es NUEVO (flujo="nuevo"):
  - Navega a → **Home** (Bienvenida)
- Si usuario es RECURRENTE (flujo="recurrente"):
  - Navega a → **Agent** (Chat directo, sin cuestionario)

---

### Pantalla 2: Home (Si flujo="nuevo")
```
┌─────────────────────────────────┐
│ Hola, estudiante de matrícula   │
│ A12345                          │
│                                 │
│ Bienvenido al sistema GERO      │
│                                 │
│ Esta es una encuesta breve...   │
│                                 │
│       [ Continuar ]             │
└─────────────────────────────────┘
```

**Verificaciones:**
```
✓ Saludo DEBE mostrar "matrícula A12345"
✓ NO debe mostrar nombre (antes sí lo hacía)
✓ Si no hay matrícula en localStorage → Redirige a Consent
✓ Click "Continuar" → Va a Questionnaire
```

---

### Pantalla 3: Questionnaire (8 Preguntas)
```
┌─────────────────────────────────┐
│ Pregunta 1 de 8                 │
│                                 │
│ [Pregunta aquí]                 │
│                                 │
│ ○ Opción A                      │
│ ○ Opción B                      │
│ ○ Opción C                      │
│ ○ Opción D                      │
│                                 │
│       [ Siguiente ]             │
└─────────────────────────────────┘
```

**Verificaciones:**
```
✓ Debe mostrar preguntas P1 a P8
✓ Respuestas se guardan en localStorage.udla_answers
✓ Click "Siguiente" avanza a la siguiente pregunta
✓ En pregunta 8 → Último click va a Summary
```

---

### Pantalla 4: Summary (Análisis de Riesgos)
```
┌─────────────────────────────────┐
│ Análisis de tus respuestas      │
│                                 │
│ Score: 75/100                   │
│                                 │
│ Riesgos detectados:             │
│ • Desorientación académica      │
│ • Preocupación económica        │
│ • Malestar emocional            │
│                                 │
│  [ Ir al acompañamiento ]       │
└─────────────────────────────────┘
```

**Verificaciones:**
```
✓ Debe mostrar análisis (NO routing directo a /route-X)
✓ Click en "Ir al acompañamiento" → Envía respuestas a backend
✓ Backend responde con: score + hipótesis
✓ Guardar en localStorage.udla_riesgos_principales
✓ Navega a → Agent
```

**Si ves error:**
```
"Error al procesar respuestas"
→ Verifica que backend esté corriendo
→ Verifica endpoint /procesar-respuestas-cuestionario
```

---

### Pantalla 5: Agent (Chat)
```
┌─────────────────────────────────┐
│ GERO - Acompañamiento Académico │
├─────────────────────────────────┤
│ Conectado como:                 │
│ Juan Pérez (A12345)             │
│ Ingeniería en Sistemas          │
│                                 │
│ [Chat messages aquí]            │
│                                 │
│ Agent: Hola Juan, soy GERO...   │
│                                 │
│ [Escribe tu mensaje...]         │
│ [ Enviar ]                      │
└─────────────────────────────────┘
```

**Verificaciones:**
```
✓ Debe auto-cargar matricula (A12345)
✓ Debe mostrar nombre del usuario (Juan Pérez)
✓ Debe mostrar carrera (Ingeniería en Sistemas)
✓ Debe mostrar riesgos detectados
✓ Primer mensaje debe ser personalizado con contexto
✓ Al escribir mensajes → Backend responde
✓ Conversación se guarda automáticamente
```

---

## 🧪 Testing Manual - Paso a Paso

### Test Completo: Usuario Nuevo
```
1. Abre http://localhost:8080
2. Splash desaparece en 3 segundos
3. ✓ VER: Consent con campos Matrícula + Contraseña
4. Ingresa matrícula: A12345
5. Ingresa contraseña: password123
6. Click "Validar"
   ⏳ Espera loader
   ✓ VER: navegación a Home o Agent (dependiendo de flujo)
7. Si Home:
   ✓ VER: Saludo "Hola, estudiante de matrícula A12345"
   - Click "Continuar"
   ✓ VER: Questionnaire con pregunta 1
   - Responde todas 8 preguntas
   ✓ VER: Summary con análisis de riesgos
   - Click "Ir al acompañamiento"
8. Si Agent:
   ✓ VER: Auto-cargó matricula automáticamente
   ✓ VER: Datos del usuario (nombre, carrera)
9. Agent Chat:
   - Escribe: "Hola, necesito ayuda"
   - Click "Enviar"
   ⏳ Espera respuesta
   ✓ VER: Respuesta personalizada del agente
```

---

## 🔍 Inspeccionar localStorage (DevTools)

**Para verificar que los datos se guardan correctamente:**

```javascript
// Abre DevTools (F12)
// Consola → Copia y pega:

console.log("=== localStorage GERO ===");
console.log({
  matricula: localStorage.getItem("udla_matricula"),
  user_id: localStorage.getItem("udla_user_id"),
  flujo: localStorage.getItem("udla_flujo"),
  tiene_historial: localStorage.getItem("udla_tiene_historial"),
  answers: JSON.parse(localStorage.getItem("udla_answers") || '{}'),
  riesgos: JSON.parse(localStorage.getItem("udla_riesgos_principales") || '[]'),
});

// Deberías ver algo como:
{
  matricula: "A12345",
  user_id: "123",
  flujo: "nuevo",
  tiene_historial: "false",
  answers: {
    P1: "Opción A",
    P2: "Opción B",
    ...
  },
  riesgos: [
    "desorientacion_academica",
    "preocupacion_economica"
  ]
}
```

---

## 🌐 Inspeccionar Network (DevTools)

**Para verificar que los endpoints se llaman correctamente:**

```
1. Abre DevTools (F12)
2. Pestaña "Network"
3. En Consent:
   ✓ Busca GET request a: /wp-json/gero/v1/validar-matricula
     Status: 200
     Response: {id: 123, flujo: "nuevo", ...}
   
4. En Summary:
   ✓ Busca POST request a: /wp-json/gero/v1/procesar-respuestas-cuestionario
     Status: 200
     Payload: {user_id: 123, matricula: "A12345", respuestas: {...}}
     Response: {score: 75, hipotesis: [...]}
   
5. En Agent:
   ✓ Busca POST request a: /wp-json/gero/v1/chat-openai-agente
     Status: 200
     Payload: {messages: [...]}
     Response: {choices: [{message: {...}}]}
```

---

## 🐛 Troubleshooting

### Problema: Sigue pidiendo "Nombre" en lugar de "Matrícula"
```
Solución:
1. Hard refresh: Ctrl+Shift+R (o Cmd+Shift+R en Mac)
2. Limpia cache: DevTools → Storage → Clear All
3. Cierra y reabre navegador
4. Si sigue:
   - Verifica que npm run dev está corriendo
   - Busca errores en terminal (webpack errors)
   - Reinicia: npm run dev
```

### Problema: "Matrícula no encontrada" después de validar
```
Solución:
1. Verifica que la matrícula existe en backend
2. Verifica que el endpoint /validar-matricula está activo
3. Abre DevTools → Network
4. Busca la request GET a /validar-matricula
5. Verifica el response: Status 200 + respuesta con usuario
6. Si status es 404: backend endpoint no existe
7. Si status es 500: error en backend
```

### Problema: Summary dice "Error al procesar respuestas"
```
Solución:
1. Verifica que endpoint /procesar-respuestas-cuestionario existe
2. Abre DevTools → Network → Filter: "procesar"
3. Verifica status de request:
   - 200: OK, pero backend no calcula score
   - 404: Endpoint no existe
   - 500: Error en backend
4. Verifica payload enviado:
   {
     user_id: número,
     matricula: "string",
     respuestas: {P1, P2, ..., P8}
   }
```

### Problema: Agent no carga datos automáticamente
```
Solución:
1. Verifica localStorage:
   - Debe tener: udla_matricula, udla_user_id
2. Verifica que viniste del flujo correcto:
   - Si fuiste a /agent directamente (sin /consent): localStorage vacío
3. Abre DevTools → Network
4. Busca GET a /usuarios-habilitados
   - Si 404: endpoint no existe
   - Si 200 pero vacío: usuario no existe en BD
```

---

## ✅ Checklist Final

- [ ] Consent muestra Matrícula (no Nombre)
- [ ] Login valida con backend
- [ ] localStorage.udla_matricula se guarda
- [ ] Home muestra matrícula en saludo
- [ ] Questionnaire P1-P8 funciona
- [ ] Summary procesa respuestas
- [ ] Backend retorna hipótesis
- [ ] Agent auto-carga datos
- [ ] Chat funciona con contexto
- [ ] Historial se guarda

---

## 📞 Documentación Relacionada

- [INTEGRACION_FLUJO_COMPLETO.md](INTEGRACION_FLUJO_COMPLETO.md) - Diagrama completo
- [CAMBIOS_REALIZADOS.md](CAMBIOS_REALIZADOS.md) - Resumen técnico de cambios
- [agente-retencion-refactorizado.php](agente-retencion-refactorizado.php) - Backend

---

**¡Ahora a probar!** 🚀

Si algo no funciona, abre DevTools (F12) y sigue los pasos de troubleshooting arriba.
