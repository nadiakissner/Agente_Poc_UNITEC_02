# Integración de Clasificación de Riesgos con LLM

## 📋 Resumen

Se han agregado dos nuevos endpoints al backend PHP que interceptan:
1. **Fin del cuestionario** → Genera justificación inicial de riesgos
2. **Fin de la ruta** → Genera justificación final y determina prioridad del caso

Ambos procesos se ejecutan en **background** (no bloquean el flujo del usuario) y guardan los datos en la tabla `byw_agente_retencion`.

---

## 🔧 Endpoints Creados

### 1️⃣ POST `/wp-json/gero/v1/procesar-fin-cuestionario`

**Cuándo llamar:** Después de que el usuario finalice el cuestionario

**Parámetros:**
```json
{
  "user_id": 123,
  "respuestas": {
    "P1": "Con algo de incertidumbre",
    "P2": "Preocupación económica",
    "P3": [1, "Muy poco preparado"],
    "P4": [2, "Muy desorganizado"]
  },
  "riesgos": ["desorientacion", "economica", "organizacion"]
}
```

**Respuesta (inmediata):**
```json
{
  "success": true,
  "message": "Cuestionario recibido. Procesando en background..."
}
```

**Qué hace:**
- Guarda los datos en `byw_agente_retencion`
- Llama a OpenAI de forma asíncrona (sin esperar respuesta)
- Genera `justificacion_cuestionario` (~30 palabras)
- Establece `prioridad_caso` como 'pendiente' hasta que se complete la ruta

---

### 2️⃣ POST `/wp-json/gero/v1/procesar-fin-ruta`

**Cuándo llamar:** Después de que el usuario finalice la ruta (chatbot o intervención)

**Parámetros:**
```json
{
  "user_id": 123,
  "ruta": "RouteA",
  "conversacion": [
    { "sender": "agent", "message": "Hola, ¿cómo estás?" },
    { "sender": "user", "message": "Bien, con dudas..." },
    { "sender": "agent", "message": "Entiendo..." }
  ]
}
```

**Respuesta (inmediata):**
```json
{
  "success": true,
  "message": "Ruta finalizada. Procesando en background..."
}
```

**Qué hace:**
- Obtiene la `justificacion_cuestionario` anterior
- Llama a OpenAI para generar `justificacion_ruta` (~30 palabras)
- Combina ambas justificaciones en un JSON
- Determina `prioridad_caso` (alto, medio, bajo)
- Actualiza el registro en `byw_agente_retencion`

---

## 📊 Estructura de la Tabla `byw_agente_retencion`

Crear con:
```sql
CREATE TABLE IF NOT EXISTS byw_agente_retencion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL UNIQUE,
  prioridad_caso ENUM('alto', 'medio', 'bajo', 'pendiente') DEFAULT 'pendiente',
  justificacion JSON,
  justificacion_cuestionario LONGTEXT,
  ruta_seguida VARCHAR(100),
  fecha_cuestionario DATETIME,
  fecha_finalizacion DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (user_email),
  INDEX (prioridad_caso)
);
```

**Columnas:**
- `user_email`: Email/matrícula del estudiante (clave única)
- `prioridad_caso`: 'alto' | 'medio' | 'bajo' | 'pendiente' (mientras completa ruta)
- `justificacion`: JSON con ambas justificaciones
  ```json
  {
    "cuestionario": "Análisis inicial...",
    "ruta": "Análisis final..."
  }
  ```
- `justificacion_cuestionario`: Almacena la justificación del cuestionario por separado
- `ruta_seguida`: Nombre de la ruta (ej: 'RouteA')
- `fecha_cuestionario`: Cuándo completó el cuestionario
- `fecha_finalizacion`: Cuándo completó la ruta

---

## 🚀 Integración en Frontend (React)

### En RouteA.tsx (o el componente que finaliza)

**Al finalizar el cuestionario:**

```typescript
// Después de guardar respuestas y detectar riesgos
const finalizarCuestionario = async () => {
  try {
    const response = await fetch('/wp-json/gero/v1/procesar-fin-cuestionario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: parseInt(userId),
        respuestas: respuestasGuardadas, // Las respuestas del cuestionario
        riesgos: riesgosDetectados      // Array de categorías de riesgo
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Cuestionario enviado para análisis');
      // Continuar con el flujo (no esperar la respuesta)
      setStep(nextStep);
    }
  } catch (error) {
    console.error('Error enviando cuestionario:', error);
    // El error no detiene el flujo del usuario
    setStep(nextStep);
  }
};
```

**Al finalizar la ruta:**

```typescript
// Después de que el usuario complete todas las intervenciones
const finalizarRuta = async () => {
  try {
    const response = await fetch('/wp-json/gero/v1/procesar-fin-ruta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: parseInt(userId),
        ruta: 'RouteA',  // O el nombre de la ruta actual
        conversacion: chatHistory  // Historial de conversación
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Ruta enviada para análisis final');
      // Mostrar mensaje de finalización
      navigate('/thank-you');
    }
  } catch (error) {
    console.error('Error finalizando ruta:', error);
    // El error no detiene el flujo del usuario
    navigate('/thank-you');
  }
};
```

---

## 🔐 Características de Seguridad

✅ **$wpdb prepared statements** - Previene SQL injection  
✅ **try-catch blocks** - Errores del LLM no rompen el flujo  
✅ **JSON validation** - Verifica que el LLM devuelva JSON válido  
✅ **Error logging** - Todos los errores se registran en error_log  
✅ **Procesamiento en background** - El usuario nunca ve fallos  
✅ **Timeouts** - Espera máximo 30 segundos por respuesta de API  

---

## ⚙️ Configuración Necesaria

### 1. Definir API Key en wp-config.php

```php
// wp-config.php
define( 'OPENAI_API_KEY', 'sk-your-api-key-here' );
```

### 2. Crear tabla en la base de datos

Ejecutar la sentencia SQL proporcionada arriba en phpMyAdmin o WP-CLI

### 3. Verificar que wp-cron está activo

```bash
# Verificar en WordPress
ps aux | grep wp-cron
```

Si wp-cron no está activo, agregar a crontab:
```bash
*/5 * * * * wget -q -O - https://tu-sitio.com/wp-cron.php?doing_wp_cron >/dev/null 2>&1
```

---

## 🧪 Testing

### Probar endpoint de cuestionario

```bash
curl -X POST "http://localhost:8000/wp-json/gero/v1/procesar-fin-cuestionario" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "respuestas": {"P1": "Con algo de incertidumbre", "P2": "Preocupación económica"},
    "riesgos": ["economica"]
  }'
```

### Probar endpoint de ruta

```bash
curl -X POST "http://localhost:8000/wp-json/gero/v1/procesar-fin-ruta" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "ruta": "RouteA",
    "conversacion": [
      {"sender": "agent", "message": "Hola"},
      {"sender": "user", "message": "Hola, necesito ayuda"}
    ]
  }'
```

### Ver logs

```bash
tail -f /var/log/apache2/error.log
# O en WordPress
tail -f /home/usuario/wp-content/debug.log
```

---

## 📝 Flujo Completo

```
1. Usuario responde cuestionario
   ↓
2. Frontend llama → POST /procesar-fin-cuestionario
   ↓
3. Backend guarda en byw_agente_retencion (prioridad_caso = 'pendiente')
   ↓
4. OpenAI genera justificacion_cuestionario (background, sin bloqueo)
   ↓
5. Usuario entra a la ruta (RouteA, RouteB, etc.)
   ↓
6. Usuario finaliza la ruta
   ↓
7. Frontend llama → POST /procesar-fin-ruta
   ↓
8. Backend obtiene justificacion_cuestionario anterior
   ↓
9. OpenAI genera justificacion_ruta (background)
   ↓
10. Backend determina prioridad_caso y actualiza registro
    ↓
11. Tabla final tiene:
    - prioridad_caso: 'alto' | 'medio' | 'bajo'
    - justificacion: { cuestionario: "...", ruta: "..." }
```

---

## ❓ Preguntas Frecuentes

**P: ¿Qué pasa si la API de OpenAI falla?**
R: Se registra un error en el log, pero el usuario continúa sin verlo. Cuando se intente de nuevo, se reintentar la llamada.

**P: ¿Cuánto tiempo tarda en procesar?**
R: 2-5 segundos normalmente. El usuario nunca espera porque es background.

**P: ¿Dónde veo los resultados?**
R: En la tabla `byw_agente_retencion`. Las clasificaciones se almacenan silenciosamente.

**P: ¿Cómo consultar los datos?**
R: 
```sql
SELECT user_email, prioridad_caso, justificacion, fecha_finalizacion 
FROM byw_agente_retencion 
WHERE fecha_finalizacion IS NOT NULL 
ORDER BY fecha_finalizacion DESC;
```

**P: ¿Puedo personalizar la lógica de prioridades?**
R: Sí, edita la función `agente_determinar_prioridad()` en el PHP.

---

## 🔄 Próximas Mejoras Sugeridas

- [ ] Dashboard para ver todas las clasificaciones
- [ ] Webhooks para notificar a consejeros cuando hay casos 'alto'
- [ ] Machine learning para refinar categorización
- [ ] Export a CSV de clasificaciones
- [ ] Integración con sistemas de tutoría
