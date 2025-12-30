# Modificación Nuevo Flujo RouteA - Resumen Ejecutivo

## 📌 Cambios Realizados

### 1. **Frontend - Nuevo Componente RouteA**

**Archivo creado:** `RouteA_NUEVO_FLUJO.tsx`

**Características principales:**
- ✅ Flujo conversacional totalmente nuevo (10 pasos)
- ✅ Preguntas una a la vez con texto libre del usuario
- ✅ Validación de respuestas por tipo (motivación 1-5, sí/no, texto)
- ✅ Lógica condicional: Paso 2 → Paso 3 O Paso 5 (según tipo de duda)
- ✅ Tono de escucha activa con feedback breve
- ✅ Persistencia en localStorage (para recuperación ante recarga)
- ✅ Historial de chat completo
- ✅ Dos salidas finales: Completado o Requiere RIASEC test

**Estructura de preguntas:**
```
Paso 1: Motivación (1-5)
  ↓
Paso 2: Tipo de duda (conmigo / carrera / ambas) [BRANCHPOINT]
  ├→ ambas/carrera: Paso 3
  └→ conmigo: SALTA a Paso 5
Paso 3: Claridad carrera (1-5)
Paso 4: Preocupación duración
Paso 5: Preocupación materias
Paso 6: Preocupación salida laboral [+ FEEDBACK si dice SÍ]
Paso 7: Busca ayudar a otros
Paso 8: Busca demostrarse capaz
Paso 9: Busca ganar dinero
Paso 10: Decisión final (SÍ/NO/No sé)
  ├→ SÍ: Finaliza → Summary
  └→ NO/No sé: Requiere RIASEC → routeA-riasec
```

### 2. **Backend - Funciones PHP Actualizadas**

**Archivo:** `agente-retencion-unitec-02.php`

**Funciones modificadas:**

#### a. `agente_procesar_fin_cuestionario()`
```php
// Ahora extrae:
- $motivacion_inicial (1-5 numérico)
- $tipo_duda (texto libre)
- $claridad_carrera (1-5)
- $duracion_concern (texto)
- $materias_concern (texto)
- $salida_laboral_concern (texto)
- $motivacion_ayudar (texto)
- $motivacion_demostrarse (texto)
- $motivacion_dinero (texto)

// Construye contexto detallado para LLM
// Guarda en BD con estructura JSON
```

#### b. `agente_clasificar_riesgo_con_llm()`
**Prompts actualizados:**

Para **'cuestionario'**:
```
Analiza el cuestionario conversacional...
Identifica:
1. Nivel motivación inicial
2. Tipo dudas (internas vs externas)
3. Preocupaciones académicas
4. Motivaciones expresadas
5. Claridad en decisión carrera

Retorna: justificacion + riesgos_identificados
```

Para **'ruta'**:
```
Analiza el impacto de la intervención...
Determina:
1. Cambio en claridad/confianza
2. Cambio en motivación
3. Recomendaciones seguimiento
4. Prioridad intervención

Retorna: justificacion + prioridad_sugerida
```

### 3. **Base de Datos - Estructura Utilizada**

La tabla `byw_agente_retencion` recibe:

```json
{
  "ID": 123,
  "user_id": 456,
  "user_email": "estudiante@unitec.edu",
  "riesgo_detectado": ["duda_interna", "preocupacion_academica"],
  "prioridad_caso": "alto|medio|bajo|pendiente",
  "justificacion": {
    "cuestionario": "Análisis de respuestas conversacionales...",
    "ruta": "Análisis de impacto de intervención..."
  },
  "ultima_actividad": "2025-01-15 10:30:00"
}
```

### 4. **Flujo de Datos Completo**

```
Usuario en Frontend
    ↓
Responde Paso 1 (motivación 1-5)
    ↓
Responde Paso 2 (tipo duda) → LÓGICA CONDICIONAL
    ├→ ambas → Continúa Paso 3
    └→ conmigo → SALTA a Paso 5
    ↓
Responde Pasos 3-10 secuencialmente
    ↓
Historial de chat se acumula
    ↓
Respuestas se guardan en objeto
    ↓
Usuario decide en Paso 10
    ↓
Frontend envía POST /procesar-fin-cuestionario
    ├─ Payload: respuestas (1-10), historial chat, conversacion completa
    └─ Body: user_id, user_email, nombre, carrera, respuestas, conversacion, status
    ↓
Backend extrae información contextual
    ↓
Backend llama LLM con PROMPT nuevo
    ↓
LLM retorna: justificacion + riesgos_identificados
    ↓
Backend guarda en byw_agente_retencion:
    - prioridad_caso = 'pendiente' (se actualiza después en ruta)
    - justificacion = JSON con análisis
    - riesgo_detectado = array de riesgos
    ↓
Frontend redirige:
    ├→ Si SÍ: /summary (fin del flujo)
    └→ Si NO: /routeA-riasec (continúa con test)
```

## 🔍 Cambios Técnicos Clave

| Aspecto | Antes | Ahora |
|--------|--------|--------|
| **Tipo de respuesta** | Selección múltiple (Chips) | Texto libre del usuario |
| **Número de pasos** | Flexible (8-12 según rama) | Fijo: 10 pasos máximo |
| **Lógica de bifurcación** | En múltiples puntos | Solo en Paso 2 |
| **Almacenamiento respuestas** | Variables separadas | Objeto indexado por step |
| **Análisis LLM** | Respuestas estructuradas | Conversación + respuestas |
| **Historial guardado** | No persistido | Completo en localStorage + BD |
| **Validación** | UI solo | UI + Backend |
| **Feedback usuario** | Único al final | Incrementales (ej: Paso 6) |

## ✅ Implementación Checklist

### Frontend
- [ ] Reemplazar `RouteA.tsx` con contenido de `RouteA_NUEVO_FLUJO.tsx`
- [ ] Probar flujo paso a paso (1 → 10)
- [ ] Probar lógica condicional Paso 2 (ambas → 3 vs conmigo → 5)
- [ ] Probar persistencia localStorage (recarga página)
- [ ] Probar validación motivación (rechaza valores > 5)
- [ ] Probar endpoint POST al completar

### Backend
- [ ] Actualizar `agente_procesar_fin_cuestionario()` con nuevo contexto
- [ ] Actualizar prompts en `agente_clasificar_riesgo_con_llm()`
- [ ] Verificar extracción correcta de respuestas conversacionales
- [ ] Probar llamada a OpenAI con nuevo prompt
- [ ] Verificar guardado en `byw_agente_retencion` con estructura correcta

### Integration
- [ ] Probar flujo END-TO-END: Frontend → Backend → LLM → BD
- [ ] Verificar que LLM interpreta respuestas conversacionales
- [ ] Verificar que prioridad se calcula correctamente
- [ ] Probar ambas salidas (SÍ → summary, NO → riasec)

## 📚 Documentación Relacionada

- [GUIA_NUEVO_FLUJO_ROUTEA.md](GUIA_NUEVO_FLUJO_ROUTEA.md) - Detalle técnico completo
- [RouteA_NUEVO_FLUJO.tsx](./SRC/Pages/RouteA_NUEVO_FLUJO.tsx) - Código fuente frontend
- [NOTA_ESTRUCTURA_TABLA.md](NOTA_ESTRUCTURA_TABLA.md) - Estructura BD

## 🚀 Próximas Fases

1. **Fase 1 (Actualización):** Implementar nuevo RouteA
2. **Fase 2 (RIASEC):** Crear `/routeA-riasec` para rama "No" del paso 10
3. **Fase 3 (Validación):** Testing end-to-end con usuarios reales
4. **Fase 4 (Iteración):** Refinar prompts del LLM según resultados reales

## ⚠️ Notas Importantes

- **Compatibilidad:** Nuevo flujo es 100% independiente del antiguo RouteA
- **Persistencia:** Todas las respuestas se persisten en localStorage y BD
- **Recuperación:** Si usuario recarga página, puede continuar desde donde estaba
- **LLM:** Los prompts ahora interpretan conversación COMPLETA, no solo respuestas
- **Validación:** Las respuestas de "motivación" se validan como números 1-5

---

**Versión:** 1.0 (Enero 2025)
**Estado:** Listo para implementación
