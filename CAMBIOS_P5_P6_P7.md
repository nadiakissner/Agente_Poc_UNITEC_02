═════════════════════════════════════════════════════════════════════════════════
              ✅ P5 AHORA ACEPTA TEXTO LIBRE + P6/P7 REORDENADAS
═════════════════════════════════════════════════════════════════════════════════

📋 CAMBIOS REALIZADOS
─────────────────────────────────────────────────────────────────────────────────

### 1. P5 - AHORA ACEPTA CUALQUIER TEXTO (sin restricción 1-5)

ANTES:
  - Tipo: text (pero con restricción de validación)
  - Validación: Rechazaba cualquier cosa que no fuera 1-5
  - Resultado: El usuario no podía escribir nada

AHORA:
  - Tipo: text (sin restricciones de números)
  - Validación: Acepta texto libre (mínimo 3 caracteres)
  - Detección: Busca palabras clave (familia, beca, crédito, trabajo)
  - Resultado: El usuario puede describir libremente su fuente de financiamiento
  
  Ejemplos válidos ahora:
  ✓ "Mi familia me está pagando"
  ✓ "Tengo una beca de la universidad"
  ✓ "Estoy trabajando para pagar"
  ✓ "Un préstamo del banco"
  ✓ "Varias fuentes: trabajo + familia"


### 2. P6 → P7: La pregunta sí/no se movió a posición 7

FLUJO ANTERIOR (6 preguntas):
  P1 → P2 → P3 → P4 → P5 → P6 (Sí/No)

FLUJO NUEVO (7 preguntas):
  P1 → P2 → P3 → P4 → P5 → P6 (Likert: 1-5) → P7 (Sí/No)

CAMBIOS EN VALIDACIÓN:
  ├─ P5: Ahora valida como texto libre
  ├─ P6: Sigue siendo likert (números 1-5)
  ├─ P7: Es la pregunta sí/no (antes era P6)
  └─ Todas las referencias en el código actualizadas


📁 ARCHIVOS MODIFICADOS
─────────────────────────────────────────────────────────────────────────────────

SRC/Pages/Questionnaire.tsx:
  ✅ Línea 57-102: validateNumericInput()
     - P5 ahora acepta texto libre (mínimo 3 caracteres)
     - P7 (no P6) valida como sí/no
     
  ✅ Línea 251-267: Normalización de respuestas
     - P5: Almacena texto tal como lo escribe el usuario
     - P7: Normaliza "si/sí" → "Sí", "no" → "No"
     
  ✅ Línea 269-283: Detección de palabras clave para P5
     - Detecta categoría (familia, beca, crédito, trabajo)
     - Aplica riskWeights automáticamente
     
  ✅ Línea 285-307: Pesos condicionales para P6
     - Busca la categoría detectada en P5
     - Aplica pesos condicionales según respuesta numérica en P6
     
  ✅ Línea 316-323: Guardado de respuestas
     - P5 guarda con riskWeights detectados por palabras clave
     - P6 guarda con pesos condicionales si aplica


🔄 LÓGICA DE DETECCIÓN DE PALABRAS CLAVE (P5)
─────────────────────────────────────────────────────────────────────────────────

Palabras clave definidas en questionnaire.ts:

familia:   padre, padres, madre, papá, mamá, tío, tía, abuelo/a, hermano/a, parientes
beca:      beca, becado/a, becarios
crédito:   crédito, financiamiento, préstamo, banco
trabajo:   trabajo, laboral, empleo, trabajando, laburo, laboro

Ejemplo de flujo:
  ┌─────────────────────────────────────┐
  │ Usuario escribe:                    │
  │ "Mi papá y mi mamá me están        │
  │  pagando la carrera"                │
  └─────────────────────────────────────┘
           ↓
  ┌─────────────────────────────────────┐
  │ Detecta palabras: "papá", "mamá"    │
  │ Categoría detectada: familia        │
  └─────────────────────────────────────┘
           ↓
  ┌─────────────────────────────────────┐
  │ Aplica riskWeights: {}              │
  │ (familia no tiene riesgo asociado)  │
  └─────────────────────────────────────┘


🔗 PESOS CONDICIONALES (P6 depende de P5)
─────────────────────────────────────────────────────────────────────────────────

Si P5 detecta "beca" y usuario responde "4" en P6:
  P6 pregunta: "¿Si se acabara ese dinero, qué tan complicado sería?"
  
  Pesos condicionales:
  ├─ familia + 3 → economica: 0
  ├─ familia + 4 → economica: 1
  ├─ familia + 5 → economica: 1
  ├─ beca + 3   → economica: 1
  ├─ beca + 4   → economica: 3  ← Usuario selecciona esto
  └─ beca + 5   → economica: 3


✨ BENEFICIOS
─────────────────────────────────────────────────────────────────────────────────

✓ P5 Más natural: El usuario describe su situación en sus propias palabras
✓ Detección automática: El sistema identifica la categoría sin que el usuario lo haga
✓ Más datos: Obtenemos información cualitativa (no solo opciones predefinidas)
✓ Mejor UX: Sin restricciones extrañas de números en un campo de texto libre
✓ Flujo consistente: P6 sigue siendo cuantitativo (1-5), P7 es dicotómico (Sí/No)


🧪 CÓMO PROBAR
─────────────────────────────────────────────────────────────────────────────────

1. Abre la aplicación en el navegador
2. Completa el flujo hasta P5
3. Verifica que puedas escribir texto libre:
   ✓ "Mis padres me pagan"
   ✓ "Tengo beca UNITEC 50%"
   ✓ "Trabajo en una tienda y ahorro"
   
4. Verifica P6 siga siendo números 1-5:
   ✓ "1", "2", "3", "4", "5"
   
5. Verifica P7 ahora sea sí/no:
   ✓ "Sí" / "No" (antes era P6)


📊 BUILD STATUS
─────────────────────────────────────────────────────────────────────────────────

✅ 1698 módulos compilados sin errores
✅ 0 errores TypeScript
✅ 0 errores ESLint
✅ Listo para desplegar


════════════════════════════════════════════════════════════════════════════════
