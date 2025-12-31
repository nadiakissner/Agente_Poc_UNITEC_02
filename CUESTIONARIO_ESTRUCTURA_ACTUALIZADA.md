# Actualización de Procesamiento de Cuestionario (PHP)

## Cambios Realizados

### Problema Original
El PHP estaba implementando una estructura de cuestionario incorrecta que no coincidía con la estructura real de 9 preguntas definidas en `questionnaire.ts`:
- Esperaba formato antiguo con mapeos manuales
- No procesaba correctamente las respuestas con `riskWeights`
- No manejaba preguntas especiales como P5 (text) y P7 (yesno)
- No aplicaba conditional weights para P6

### Estructura Real del Cuestionario (Ahora Correctamente Implementada)

```
P1 (Likert 1-5): "¿Qué tan seguro/a estás de tus ganas de estudiar?"
   → riskWeights directo en respuesta

P2 (Likert 1-5): "¿Qué tan cómodo/a con tu lugar de estudio?"
   → riskWeights directo en respuesta (entorno + emocional)

P3 (Likert 1-5): "¿Cómo te sientes académicamente?"
   → riskWeights directo (baja_preparacion + desorientacion)

P4 (Likert 1-5): "¿Qué tal se te da organizar tu tiempo?"
   → riskWeights directo (organizacion)

P5 (TEXT): "¿Cuál es tu fuente de financiamiento?"
   → Keyword detection: familia, beca, credito, trabajo
   → NO tiene riskWeights pero alimenta P6

P6 (Likert 1-5): "¿Qué tan complicado si se acaba el dinero?"
   → CONDITIONAL WEIGHTS basados en respuesta P5
   → Si P5="familia": 3→0pts, 4→1pt, 5→1pt
   → Si P5="beca": 3→1pt, 4→3pts, 5→3pts
   → Si P5="credito": 3→1pt, 4→3pts, 5→3pts
   → Si P5="trabajo": 3→1pt, 4→2pts, 5→2pts

P7 (YESNO): "¿Terminaste la prepa con dificultad?"
   → "Sí" → riskWeights.baja_preparacion = 2
   → "No" → riskWeights vacío (sin riesgo)

P8 (Likert 1-5): "¿Qué tan fácil hacer amigos en la universidad?"
   → riskWeights directo (social + emocional)

P9 (Likert 1-5): "¿Comodidad con herramientas digitales?"
   → riskWeights directo (tecnologica)
```

### Cambios en `gero_calcular_puntuacion_riesgos_unitec_02()`

**Antes:**
```php
// Procesaba respuestas como strings simples
// Usaba mappeos manuales para cada pregunta
// No existía manejo de P5 (text) ni P6 (conditional)
```

**Ahora:**
```php
function gero_calcular_puntuacion_riesgos_unitec_02( $respuestas ) {
    // 1. Itera sobre TODAS las respuestas
    // 2. Extrae 'text' y 'riskWeights' de cada una
    // 3. Aplica riskWeights directamente a las puntuaciones
    // 4. Manejo especial para P5:
    //    - Detecta keywords (familia, beca, credito, trabajo)
    //    - Almacena fuente para usar en P6
    // 5. Manejo especial para P6:
    //    - Aplica conditional weights según P5 detectado
    // 6. Manejo especial para P7:
    //    - Procesa "Sí" o "No" normalmente
    //    (ya tiene riskWeights aplicados)
    // 7. Retorna array con puntuaciones totales por categoría
}
```

### Funciones Eliminadas/Marcadas como DEPRECATED
- `gero_mapear_categoria_p2_unitec_02()` - Ya no se usa
- `gero_extraer_valor_likert_unitec_02()` - Ya no se usa

### Actualización de `gero_generar_resumen_respuestas_unitec_02()`

**Cambio Principal:**
Ahora maneja respuestas en formato array con 'text' key:
```php
// Antes:
$respuesta = "1 - Muy indeciso"

// Ahora:
$respuesta = [
    'text' => '1',
    'riskWeights' => { 'desorientacion' => 4 }
]
```

### Actualización de Endpoint `/procesar-respuestas-cuestionario-02`

**Nueva estructura de guardar:**
```php
$datos_insertar = [
    'user_email'         => $matricula,
    'user_id'            => $user_id_habilitados,
    'respuestas_json'    => json_encode($respuestas), // ✅ Ahora guarda completo
    'riesgo_detectado'   => json_encode($categorias),
    'ultima_actividad'   => now(),
];
```

Ahora se guarda el JSON completo de respuestas (con riskWeights) para poder reconstruir el análisis más tarde.

## Flujo Frontend → Backend

### 1. Frontend (Questionnaire.tsx)
```javascript
// Al completar cuestionario, calcula riskWeights Y envía:
fetch('/wp-json/gero/v1/procesar-respuestas-cuestionario-02', {
    body: JSON.stringify({
        user_id: 123,
        matricula: "ABC123",
        respuestas: {
            P1: { text: "4", riskWeights: { desorientacion: 0 } },
            P2: { text: "2", riskWeights: { entorno: 2, emocional: 1 } },
            P5: { text: "Mi papá paga", riskWeights: {} },
            P6: { text: "4", riskWeights: { economica: 1 } },
            P7: { text: "No", riskWeights: {} },
            ...
        }
    })
})
```

### 2. PHP Backend
```php
// Recibe y procesa:
1. Valida estructura básica
2. Llama gero_calcular_puntuacion_riesgos_unitec_02($respuestas)
   ├─ Aplica riskWeights directamente
   ├─ Detecta P5 keywords
   ├─ Aplica conditional P6 weights
   └─ Retorna puntuaciones totales
3. Determina hipótesis principales
4. Guarda en byw_agente_retencion
5. Retorna hipótesis al frontend
```

### 3. Frontend → Summary → RouteA
Frontend usa las hipótesis para determinar qué ruta mostrar.

## Ventajas de la Nueva Implementación

✅ **Sincronía Frontend-Backend**: Ambos usan la misma estructura de datos
✅ **Manejo de Tipos Especiales**: P5 (text) y P7 (yesno) se procesan correctamente
✅ **Conditional Weights**: P6 aplica pesos según P5 identificado
✅ **Persistencia Completa**: Se guarda el JSON de respuestas completo en BD
✅ **Auditoría**: Toda la información está disponible para análisis posterior
✅ **Escalable**: Fácil agregar nuevas categorías de riesgo o preguntas

## Testing Recomendado

1. **P5 Keywords**:
   - Responder con "Mi papá paga" → detectar como `familia_source`
   - Responder con "Tengo una beca" → detectar como `beca_source`

2. **P6 Conditional**:
   - P5="familia" + P6="4" → 1 punto economica
   - P5="beca" + P6="4" → 3 puntos economica
   - P5="trabajo" + P6="4" → 2 puntos economica

3. **P7 Processing**:
   - Responder "Sí" → +2 a baja_preparacion
   - Responder "No" → sin cambios

4. **Puntuaciones Totales**:
   - Verificar que la suma de riskWeights coincida con puntuaciones guardadas
   - Confirmar que hipótesis principal está correcta

## Archivo Modificado
- **[agente-retencion-unitec-02.php](agente-retencion-unitec-02.php)**
  - Líneas 57-175: Nueva implementación de `gero_calcular_puntuacion_riesgos_unitec_02()`
  - Líneas 176-220: Funciones DEPRECATED marcadas
  - Líneas 471-493: Actualización de guardado en BD
  - Líneas 1363-1413: Actualización de `gero_generar_resumen_respuestas_unitec_02()`
