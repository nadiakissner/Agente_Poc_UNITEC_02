# ✅ ACTUALIZACIÓN - Manejo de Crisis en Tablas MySQL

**Fecha:** 29 Diciembre 2025  
**Cambios:** Integración con tablas existentes MySQL

---

## 🔧 CAMBIOS REALIZADOS

### 1. **Eliminación de tabla personalizada**
❌ **Antes:** Creaba tabla `wp_gero_crisis_states`  
✅ **Ahora:** Usa tabla existente `byw_agente_retencion`

---

### 2. **Lógica de síntesis de crisis**

Nuevo endpoint `/guardar-conversation-state` ahora:

```php
function gero_generar_sintesis_crisis( $crisis_marker, $conversation_state ) {
```

**Características:**
- Detecta tipo de crisis (extrema, alta, moderada)
- Genera síntesis breve automática
- NO guarda la conversación completa
- Solo guarda justificación sintetizada

---

### 3. **Guardar en byw_agente_retencion**

Cuando se detecta crisis, guarda:

| Campo | Valor | Descripción |
|-------|-------|-------------|
| `user_id` | Número | ID del usuario |
| `justificacion` | Texto (80-100 chars) | Síntesis breve de la crisis |
| `prioridad_caso` | `"alto"` | Siempre "alto" para crisis |
| `estado` | `"crisis_detectada"` | Marca la fila como crisis |
| `fecha_registro` | Timestamp | Cuándo se detectó |

---

## 📝 EJEMPLOS DE SÍNTESIS

### Crisis Extrema
```
Input: "quiero suicidarme"
Output: "Crisis emocional severa detectada. Riesgo de autolesión o 
         ideación suicida. Requiere atención inmediata."
Prioridad: urgente ← Se guarda como "alto"
```

### Crisis Alta
```
Input: "Tengo depresión severa"
Output: "Situación de estrés emocional significativa detectada. 
         Requiere seguimiento prioritario."
Prioridad: alto
```

### Crisis Moderada
```
Input: Otros indicadores
Output: "Indicadores de malestar emocional identificados. 
         Se requiere atención especializada."
Prioridad: alto
```

---

## 🔑 PALABRAS CLAVE DETECTADAS

### Crisis Extrema (28 palabras)
```
suicidio, matarme, morir, muerte, no quiero vivir,
ending my life, quitarme la vida, mejor muerto, ya no aguanto,
no soporto, automutilación, cortarme, autolesión, me duele,
nadie me quiere, estoy solo, depresión severa, bipolar crítico
```

### Crisis Alta (13 palabras)
```
depresión, ansiedad severa, pánico, ataque, miedo,
stress extremo, acoso, violencia, abuso, trauma,
discriminación, bullying, aislado
```

---

## 💾 FLUJO DE DATOS

```
Frontend (Agent.tsx / Questionnaire.tsx)
        ↓
    Crisis Detection
        ↓
POST /wp-json/gero/v1/guardar-conversation-state
        ↓
    Generar Síntesis ← gero_generar_sintesis_crisis()
        ↓
INSERT/UPDATE byw_agente_retencion
        ├── user_id
        ├── justificacion (síntesis breve)
        ├── prioridad_caso = "alto"
        ├── estado = "crisis_detectada"
        └── fecha_registro
        ↓
Log: [GERO CRISIS] User #X - Tipo: XXX - Síntesis: ...
        ↓
Response: { success: true, prioridad: "alto", justificacion: "..." }
```

---

## 🎯 VENTAJAS

✅ **No usa tabla adicional** - Usa `byw_agente_retencion` existente  
✅ **Síntesis automática** - Genera texto breve inteligente  
✅ **Optimizado** - No guarda conversación completa (ahorra BD)  
✅ **Prioridad clara** - Siempre `"alto"` para crisis  
✅ **Auditable** - Todo en logs  

---

## 📊 ESTRUCTURA DE byw_agente_retencion ESPERADA

```sql
CREATE TABLE byw_agente_retencion (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    justificacion TEXT,           ← Aquí se guarda la síntesis
    prioridad_caso VARCHAR(50),   ← "alto" para crisis
    estado VARCHAR(50),            ← "crisis_detectada"
    fecha_registro DATETIME,       ← Timestamp automático
    ... (otras columnas)
);
```

---

## 🚀 DEPLOYMENT

1. **Subir archivo actualizado:**
   ```
   agente-retencion-unitec-02.php
   ```

2. **Activar plugin:**
   ```bash
   wp plugin activate agente-retencion-unitec-02 --allow-root
   ```

3. **Probar:**
   ```bash
   # Simular crisis
   curl -X POST https://dominio.com/wp-json/gero/v1/guardar-conversation-state \
     -H "Content-Type: application/json" \
     -d '{
       "id": 1,
       "conversation_state": "quiero suicidarme",
       "crisis_marker": "EXTREME_RISK"
     }'
   
   # Respuesta esperada:
   # {
   #   "success": true,
   #   "message": "Crisis registrada con prioridad alto",
   #   "prioridad": "alto",
   #   "justificacion": "Crisis emocional severa..."
   # }
   ```

4. **Verificar BD:**
   ```sql
   SELECT * FROM byw_agente_retencion 
   WHERE estado = 'crisis_detectada' 
   ORDER BY fecha_registro DESC 
   LIMIT 5;
   ```

---

## ✨ CAMBIOS EN RESPUESTA API

### Antes
```json
{
  "success": true,
  "message": "Estado de crisis guardado para reanudación posterior"
}
```

### Ahora
```json
{
  "success": true,
  "message": "Crisis registrada con prioridad alto",
  "prioridad": "alto",
  "justificacion": "Crisis emocional severa detectada. Riesgo de autolesión o ideación suicida. Requiere atención inmediata."
}
```

---

## 📋 CHECKLIST

- [x] Eliminada lógica de crear tabla personalizada
- [x] Implementada función de síntesis de crisis
- [x] Actualizado endpoint para guardar en `byw_agente_retencion`
- [x] `prioridad_caso` siempre es "alto" para crisis
- [x] Justificación es síntesis breve, NO conversación completa
- [x] Build exitoso: 1698 módulos
- [x] Sin errores TypeScript/PHP

---

## 🔍 ARCHIVOS MODIFICADOS

```
agente-retencion-unitec-02.php
  - Línea ~1615: Nueva función gero_generar_sintesis_crisis()
  - Línea ~1650: Endpoint /guardar-conversation-state actualizado
  - Cambios: Síntesis + prioridad "alto" + tabla existente
```

---

**Estado:** ✅ LISTO PARA DESPLEGAR

