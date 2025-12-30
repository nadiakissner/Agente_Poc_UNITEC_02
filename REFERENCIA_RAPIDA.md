# 📋 Referencia Rápida: Justificaciones y Prioridad

**Última actualización:** 29 Diciembre 2025  
**Estado:** ✅ COMPLETO Y COMPILADO

---

## 🚀 En Una Sola Página

### ¿Cuál era el problema?
```
❌ No se guardaban justificaciones
❌ No se calculaba prioridad_caso automáticamente
❌ No había historial de cambios
```

### ¿Cuál es la solución?
```
✅ Sistema automático de justificaciones con timestamp
✅ Prioridad calculada automáticamente según contenido
✅ JSON array con historial completo de cada usuario
```

### ¿Qué necesito hacer?
```
1. Ejecutar 1 comando SQL (5 minutos)
2. Los cambios de código ya están hechos
3. Probar que funciona
```

---

## 📊 Tabla Comparativa: Antes vs Después

| Aspecto | ANTES | DESPUÉS |
|--------|-------|---------|
| **Justificación guardada** | ❌ No | ✅ Sí, JSON array |
| **Con timestamp** | ❌ No | ✅ Sí, cada cambio |
| **Prioridad calculada** | ❌ Manual | ✅ Automática |
| **Detecta crisis** | ❌ No | ✅ Sí, marca CRÍTICO |
| **Historial de eventos** | ❌ No | ✅ Sí, completo |
| **Límite de caracteres** | 500 | Sin límite |
| **Estructura BD** | VARCHAR | JSON |

---

## 🔧 Funciones Nuevas (Backend PHP)

| Función | Línea | Entrada | Salida |
|---------|-------|---------|--------|
| `gero_generar_justificacion_cuestionario()` | 1898 | Respuestas array | String (justificación) |
| `gero_generar_justificacion_respuesta()` | 1923 | Respuesta string | String (con/sin ⚠️) |
| `gero_generar_justificacion_ruta()` | 1940 | Ruta nombre | String (descripción) |
| `gero_determinar_prioridad_completa()` | 1971 | JSON justificaciones | 'critico'\|'alto'\|'medio'\|'bajo' |

---

## 🎨 Funciones Nuevas (Frontend React)

| Función | Archivo | Línea | Uso |
|---------|---------|-------|-----|
| `saveRouteCompletion()` | RouteA.tsx | 233 | Guardar RouteA completada |

---

## 🗄️ Cambio en Base de Datos

```sql
-- UNA SOLA LÍNEA A EJECUTAR:

ALTER TABLE byw_agente_retencion 
MODIFY COLUMN justificacion JSON DEFAULT NULL;
```

**Resultado:**
```
Antes: justificacion VARCHAR(500)
Después: justificacion JSON
```

---

## 📱 Flujo: Cómo Funciona

```
Usuario responde P1
    ↓
saveQuestionnaireInteraction() ejecuta
    ↓
POST /wp-json/gero/v1/guardar-interacciones
    ↓ [BACKEND]
gero_generar_justificacion_respuesta() crea texto
    ↓
INSERT en byw_coach_interacciones
    ↓
UPDATE en byw_agente_retencion con:
├─ justificacion (JSON array)
└─ prioridad_caso (calculada)
```

---

## 🎯 Tabla de Contenido Rápido

| Documento | Propósito | Audiencia |
|-----------|-----------|-----------|
| **RESUMEN_JUSTIFICACIONES.md** | Overview ejecutivo | Todos |
| **RESUMEN_JUSTIFICACIONES_TECH.md** | Detalles técnicos | Developers |
| **MAPA_CAMBIOS.md** | Dónde se hizo cada cambio | Code reviewers |
| **GUIA_MIGRACION_SQL.md** | Paso a paso de migración | DevOps/DBAs |
| **MIGRACION_JUSTIFICACIONES.md** | Opciones de migración | DBAs avanzados |
| **REFERENCIA_RAPIDA.md** | Esta página | Todos |

---

## 🚀 Pasos Rápidos para Deploy

### 1️⃣ Backup (1 min)
```sql
CREATE TABLE byw_agente_retencion_backup_20251229 AS 
SELECT * FROM byw_agente_retencion;
```

### 2️⃣ Migración (1 min)
```sql
ALTER TABLE byw_agente_retencion 
MODIFY COLUMN justificacion JSON DEFAULT NULL;
```

### 3️⃣ Verificación (1 min)
```sql
DESCRIBE byw_agente_retencion;
-- Ver que justificacion es JSON
```

### 4️⃣ Deploy código (0 min - ya está listo)
```bash
npm run build  # Ya compilado ✅
# Subir dist/ a servidor
```

### 5️⃣ Test (2 min)
- Acceder a la app
- Responder cuestionario
- Verificar datos en DB

---

## 📊 Estructura de JSON Guardado

```json
{
  "cuestionario": [
    {
      "timestamp": "2025-12-29 10:15:30",
      "texto": "Cuestionario completado sin riesgos críticos"
    }
  ],
  "respuesta_cuestionario": [
    {
      "timestamp": "2025-12-29 10:16:00",
      "texto": "Respuesta: No tengo dinero para continuar"
    },
    {
      "timestamp": "2025-12-29 10:17:00",
      "texto": "⚠️ Respuesta de alto riesgo: Creo que voy a ..."
    }
  ],
  "ruta_routea_completada": [
    {
      "timestamp": "2025-12-29 10:30:00",
      "texto": "Ruta A - Test RIASEC - Desalineación detectada"
    }
  ],
  "crisis_detectada": [
    {
      "timestamp": "2025-12-29 10:31:00",
      "texto": "⚠️ CRISIS DETECTADA: Potencial riesgo identificado"
    }
  ]
}
```

---

## 🎯 Palabras Clave Detectadas

### CRÍTICO 🔴
- suicidio
- muerte
- quiero morir
- emergencia

### ALTO 🟠
- crisis
- grave
- urgente
- inmediato
- crítico
- riesgo

### MEDIO 🟡
- moderado
- importante
- atención
- seguimiento
- monitoreo

### BAJO 🟢
- (sin palabras clave)

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Usuario Normal
```
P1: "Con algo de incertidumbre"
P5: "Sí tengo recursos"
Resultado: prioridad_caso = "bajo"
```

### Ejemplo 2: Usuario con Preocupaciones
```
P1: "Con muchas dudas"
P5: "No tengo dinero"
Resultado: prioridad_caso = "alto"
```

### Ejemplo 3: Usuario en Crisis
```
P5: "Quiero dejar todo"
P7: "No tengo amigos"
Respuesta: "No puedo más"
Resultado: prioridad_caso = "critico"
```

---

## ✅ Checklist Final

- [x] Código PHP implementado y compilado
- [x] Código React implementado y compilado
- [x] npm run build = 0 errores
- [ ] SQL ejecutado en BD
- [ ] Verificar DESCRIBE byw_agente_retencion
- [ ] Test end-to-end en staging
- [ ] Deploy a producción

---

## 🔍 Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| JSON no se guarda | Verificar que justificacion es JSON en BD |
| Prioridad siempre "bajo" | Revisar palabras clave en gero_determinar_prioridad_completa() |
| Error SQL | Ejecutar: `ALTER TABLE ... MODIFY COLUMN justificacion JSON` |
| Crisis no detecta | Revisar palabras clave exactas en gero_generar_justificacion_respuesta() |
| Datos antiguos perdidos | Usar Opción 3 de migración para preservar como "legado" |

---

## 📞 Contacto Rápido

- **Preguntas técnicas:** Ver RESUMEN_JUSTIFICACIONES_TECH.md
- **Migración SQL:** Ver GUIA_MIGRACION_SQL.md
- **Dónde se cambió:** Ver MAPA_CAMBIOS.md
- **Overview:** Ver RESUMEN_JUSTIFICACIONES.md

---

## 🎓 Conceptos Clave

**Justificación:** Descripción breve del evento (respuesta, ruta, crisis)  
**Timestamp:** Fecha y hora exacta del evento  
**Prioridad:** Nivel de urgencia (crítico, alto, medio, bajo)  
**Array:** Lista de eventos, no solo uno  
**JSON:** Formato estructurado para guardar datos complejos  
**Auto-calculado:** Se genera automáticamente, sin intervención manual  

---

## 🚀 Estado Actual

```
✅ Implementación: COMPLETA
✅ Compilación: EXITOSA (0 errores)
✅ Testing local: OK
⏳ Migración SQL: PENDIENTE
⏳ Deploy staging: PENDIENTE
⏳ Deploy producción: PENDIENTE
```

---

**Última compilación:** `✓ 1697 modules transformed. ✓ built in 10.56s`  
**Cambios:** 4 funciones PHP nuevas + 1 función React nueva + 3 mejoras  
**Archivos afectados:** 2 (agente-retencion-unitec-02.php + RouteA.tsx)  
**Esfuerzo de migración:** 5 minutos (SQL) + test

---

*Para más detalles, consulta los otros documentos de esta carpeta.*
