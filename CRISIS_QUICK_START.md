# 🚨 DETECCIÓN DE CRISIS - REFERENCIA RÁPIDA

## ¿Qué se arregló?

El sistema de detección de mensajes graves/negativos estaba **incompleto**. Ahora detecta automáticamente cuando un usuario escribe algo de riesgo.

---

## 🧪 Pruébalo YA

### 1. En la aplicación, escribe:
```
me quiero suicidar
```

### 2. Verifica en Consola del navegador (F12):
```
[CRISIS DETECTION] 🚨 EXTREME RISK DETECTED: ['suicidarme'] in: "me quiero suicidar"
```

### 3. El agente responde con:
> Lamento mucho lo que estás pasando en este momento. Me preocupa lo que compartes...

---

## 📋 Palabras que DISPARAN el sistema

### 🔴 RIESGO EXTREMO (activa inmediatamente):
- "me quiero suicidar"
- "voy a suicidarme"  
- "quiero matarme"
- "no puedo más"
- "no aguanto más"
- "quiero desaparecer"
- "mejor muerto"

### 🟠 RIESGO ALTO (detecta también):
- "estoy muy deprimido"
- "tengo ansiedad severa"
- "ataque de pánico"
- "todo es sin sentido"
- "no tengo esperanza"
- "me duele mucho"
- "insoportable"

---

## 📊 ¿Cómo funciona?

```
Usuario escribe → detectCrisis() → ¿Encuentra palabra? → SÍ
                                          ↓
                                  setCrisisDetected(true)
                                          ↓
                                  Respuesta de contención
                                          ↓
                                  Guarda en BD con prioridad 'alto'
```

---

## ✅ Lo que cambió

| Antes | Después |
|-------|---------|
| 16 palabras extremas | 31 palabras extremas |
| 17 palabras altas | 43 palabras altas |
| Sin logs | ✓ Logs en consola |
| Limitado a palabras exactas | ✓ Detecta variaciones |

---

## 📁 Archivo modificado

**SRC/Lib/crisisSafety.ts**
- Línea 11-42: Palabras clave extremas
- Línea 44-86: Palabras clave altas  
- Línea 100-141: Función de detección con logs

---

## 🔗 Endpoint usado

```
POST /wp-json/gero/v1/guardar-conversation-state
```

Guarda en: `byw_agente_retencion` con `prioridad_caso = 'alto'`

---

## 🎯 Siguientes pasos

1. ✅ Sistema implementado y compilado
2. ⏭️ Desplega a staging
3. ⏭️ Prueba con los mensajes de ejemplo
4. ⏭️ Verifica logs en consola
5. ⏭️ Consulta BD para confirmar guardado
