# Guía Práctica: Dónde y Cómo Llamar los Nuevos Endpoints

## 🎯 Lugares Específicos en el Código Para Implementar

---

## 1️⃣ EN RouteA.tsx - Finalizar Cuestionario

**Ubicación:** Después de calcular puntuaciones RIASEC y antes de mostrar resultados

### Opción A: En el paso final del cuestionario
```typescript
// En RouteA.tsx, dentro del useEffect que detecta fin de cuestionario

const finalizarYAnalizarCuestionario = async () => {
  try {
    // Preparar datos a enviar
    const datosParaAnalizar = {
      user_id: parseInt(userId),
      respuestas: {
        P1: localStorage.getItem('respuesta_P1'),
        P2: localStorage.getItem('respuesta_P2'),
        // ... agregar todas las respuestas
      },
      riesgos: riesgosDetectados // Array que ya tienes
    };

    // Llamar endpoint (no esperar respuesta)
    fetch('/wp-json/gero/v1/procesar-fin-cuestionario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosParaAnalizar)
    }).catch(err => console.warn('⚠️ Error enviando cuestionario:', err));

    // Continuar el flujo SIN esperar
    console.log('✅ Cuestionario enviado para análisis');
    // Navegar a la siguiente sección
    
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Dónde agregar exactamente en RouteA.tsx:

**OPCIÓN 1 - Si el cuestionario es un paso separado:**
```typescript
// Después del paso 8 (Decisión), cuando entra a rama C o rama R
const handleDecision = (tipo: 'intentar' | 'pensar', userLabel: string) => {
  // ... código existente ...
  
  // AGREGAR AQUÍ:
  if (tipo === 'intentar') {
    // Enviar análisis de cuestionario
    finalizarYAnalizarCuestionario();
    // Después navegar a Chat IA
  }
};
```

**OPCIÓN 2 - Si está integrado en Agent.tsx:**
```typescript
// En Agent.tsx, cuando se inicia el chat
useEffect(() => {
  // Llamar al endpoint apenas carga el agente
  const enviarAnalisisCuestionario = async () => {
    const response = await fetch('/wp-json/gero/v1/procesar-fin-cuestionario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: parseInt(userId),
        respuestas: conversationHistory.filter(m => m.sender === 'user').map(m => m.message),
        riesgos: riesgosGuardados
      })
    });
  };
  
  enviarAnalisisCuestionario();
}, []);
```

---

## 2️⃣ EN Agent.tsx - Finalizar Ruta

**Ubicación:** Cuando el usuario termina la conversación con el agente IA

### Dónde agregar:
```typescript
// En Agent.tsx o Summary.tsx, cuando se finaliza el chat

const finalizarRutaConAnalisis = async () => {
  try {
    // Guardar conversación como siempre
    await saveConversation();

    // AGREGAR AQUÍ: Enviar para análisis final
    const response = await fetch('/wp-json/gero/v1/procesar-fin-ruta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: parseInt(userId),
        ruta: 'Agent',  // O la ruta actual
        conversacion: chatHistory
      })
    }).catch(err => {
      console.warn('⚠️ Análisis final no completado:', err);
      // NO detener el flujo
    });

    // Mostrar mensaje de finalización
    navigate('/thank-you');

  } catch (error) {
    console.error('Error finalizando:', error);
    navigate('/thank-you');
  }
};
```

### Botón para finalizar:
```typescript
<Button 
  onClick={finalizarRutaConAnalisis}
  className="w-full bg-blue-600"
>
  Finalizar y Guardar Análisis
</Button>
```

---

## 3️⃣ EN Questionnaire.tsx (si es separado)

**Ubicación:** En el `onSubmit` final del cuestionario

```typescript
const handleSubmitQuestionnaire = async (responses: QuestionnaireResponse) => {
  // Guardar respuestas
  localStorage.setItem('questionnaire_responses', JSON.stringify(responses));
  
  // AGREGAR AQUÍ:
  await fetch('/wp-json/gero/v1/procesar-fin-cuestionario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: parseInt(userId),
      respuestas: responses.answers,
      riesgos: responses.detectedRisks
    })
  }).catch(err => console.warn('⚠️ Cuestionario no analizado:', err));

  // Continuar
  setQuestionnaireComplete(true);
  navigate('/agente');
};
```

---

## 4️⃣ EN Summary.tsx (Página de resumen)

**Ubicación:** Cuando se muestra el resumen final antes de salir

```typescript
const Summary: React.FC = () => {
  useEffect(() => {
    // Al montar, enviar análisis final
    const enviarAnalisisFinal = async () => {
      const conversacion = JSON.parse(localStorage.getItem('conversacion_agente') || '[]');
      
      await fetch('/wp-json/gero/v1/procesar-fin-ruta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: parseInt(userId),
          ruta: 'Summary', // O la ruta específica
          conversacion: conversacion
        })
      }).catch(err => console.warn('Análisis final:', err));
    };

    enviarAnalisisFinal();
  }, []);

  return (
    <div className="space-y-4">
      <h1>¡Gracias por completar tu evaluación!</h1>
      <p>Tus respuestas han sido analizadas por nuestro sistema.</p>
      <p className="text-sm text-gray-500">
        Los datos se guardarán de forma confidencial.
      </p>
    </div>
  );
};

export default Summary;
```

---

## 🔄 Patrón General Para Cualquier Ruta

```typescript
// Patrón reutilizable
const enviarParaAnalisis = async (tipoAnalisis: 'cuestionario' | 'ruta') => {
  const userData = {
    user_id: parseInt(userId),
  };

  const endpoint = tipoAnalisis === 'cuestionario' 
    ? '/wp-json/gero/v1/procesar-fin-cuestionario'
    : '/wp-json/gero/v1/procesar-fin-ruta';

  const body = tipoAnalisis === 'cuestionario'
    ? { ...userData, respuestas: respuestasGlobales, riesgos: riesgosGlobales }
    : { ...userData, ruta: rutaActual, conversacion: conversacionGlobal };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      console.log('✅ Análisis enviado correctamente');
    }
  } catch (error) {
    console.warn('⚠️ No se pudo completar el análisis:', error);
    // El flujo NO se detiene
  }
};

// Uso:
// enviarParaAnalisis('cuestionario');
// enviarParaAnalisis('ruta');
```

---

## ✅ Checklist de Implementación

- [ ] **Crear tabla en MySQL:**
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

- [ ] **Definir API Key en wp-config.php:**
  ```php
  define( 'OPENAI_API_KEY', 'sk-...' );
  ```

- [ ] **Agregar código en agente-retencion-unitec-02.php** (ya hecho)

- [ ] **En RouteA.tsx:** Agregar llamada `finalizarCuestionario()` cuando se completa

- [ ] **En Agent.tsx:** Agregar llamada `finalizarRuta()` cuando termina conversación

- [ ] **En Summary.tsx (si existe):** Agregar envío de análisis final

- [ ] **Prueba manual:**
  ```bash
  # Verificar que la tabla existe
  SELECT * FROM byw_agente_retencion;
  
  # Después de completar flujo, verificar datos
  SELECT user_email, prioridad_caso, fecha_finalizacion FROM byw_agente_retencion;
  ```

- [ ] **Verificar logs:**
  ```bash
  tail -f /var/log/apache2/error.log | grep "✅\|❌"
  ```

---

## 🧪 Test Rápido

### 1. Probar endpoint directamente

```bash
curl -X POST "http://tu-sitio.local/wp-json/gero/v1/procesar-fin-cuestionario" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "respuestas": {"P1": "Con algo de incertidumbre"},
    "riesgos": ["desorientacion", "economica"]
  }'
```

Respuesta esperada:
```json
{
  "success": true,
  "message": "Cuestionario recibido. Procesando en background..."
}
```

### 2. Verificar en base de datos después de 5 segundos

```sql
SELECT * FROM byw_agente_retencion WHERE user_email = '[email]';
```

Deberías ver la `justificacion_cuestionario` poblada.

---

## 🔍 Troubleshooting

| Problema | Solución |
|----------|----------|
| **Endpoint retorna 404** | Verificar que agente-retencion-unitec-02.php está activo en plugins |
| **Error: "API key no configurada"** | Agregar `define( 'OPENAI_API_KEY', 'sk-...' );` en wp-config.php |
| **Tabla no existe** | Ejecutar comando SQL CREATE TABLE |
| **Logs muestran "JSON inválido"** | Verificar que el modelo gpt-4o responde con JSON válido |
| **Procesos no se ejecutan** | Verificar wp-cron: `ps aux \| grep wp-cron` |
| **Base de datos muy lenta** | Agregar índices: `ALTER TABLE byw_agente_retencion ADD INDEX (user_email, fecha_finalizacion);` |

---

## 📞 Contacto

Si encuentras problemas, revisa:
1. Los logs de PHP: `/var/log/apache2/error.log`
2. Los logs de WordPress: `/wp-content/debug.log`
3. Verifica la respuesta de OpenAI en el endpoint `/wp-json/gero/v1/chat-openai-agente-02`
