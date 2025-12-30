═════════════════════════════════════════════════════════════════════════════════
                  🔧 MEJORA: DETECCIÓN DE MENSAJES DE CRISIS
═════════════════════════════════════════════════════════════════════════════════

📝 PROBLEMA ENCONTRADO
─────────────────────────────────────────────────────────────────────────────────

El sistema de detección de crisis NO se disparaba cuando el usuario escribía
mensajes indicativos de riesgo emocional/suicida porque:

1. La lista de palabras clave era muy limitada
2. No detectaba variaciones naturales del lenguaje de un estudiante en crisis
3. Faltaban expresiones comunes en español mexicano

Ejemplos que NO se detectaban:
  ❌ "me quiero suicidar"
  ❌ "voy a suicidarme"
  ❌ "quiero matarme"
  ❌ "no aguanto más"
  ❌ "no puedo con esto"
  ❌ "me duele mucho"
  ❌ "insoportable"


✅ SOLUCIONES IMPLEMENTADAS
─────────────────────────────────────────────────────────────────────────────────

### 1. Palabras clave de RIESGO EXTREMO expandidas

Antes (16 palabras):
  • suicidio, suicidarme, matarme, quitarme la vida, no quiero vivir, ...

Después (31 palabras):
  • suicidio, suicidarme, suicidate
  • me quiero suicidar, voy a suicidarme, quiero matarme
  • no aguanto más, no puedo más
  • desesperación, desesperado/a
  • sin razón para vivir, sin motivo para vivir
  • quiero desaparecer, quiero irme, acabar con todo
  • ... (31 total)

### 2. Palabras clave de RIESGO ALTO expandidas

Antes (17 palabras):
  • depresión, deprimido, ansiedad severa, pánico, ...

Después (43 palabras):
  • depresión, deprimido, muy deprimido
  • ansiedad severa, ansiedad extrema
  • pánico, ataques de pánico, pánico constante
  • no aguanto esta vida, no puedo con esto
  • todo me afecta mucho
  • no tengo esperanza, sin esperanza, sin futuro
  • me duele mucho, es insoportable
  • no veo salida, sin salida
  • quiero escapar, quiero huir
  • ... (43 total)

### 3. Logging mejorado en detectCrisis()

Ahora la función emite logs en la consola del navegador:
  ```
  [CRISIS DETECTION] 🚨 EXTREME RISK DETECTED: ['suicidio'] in: "estoy pensando en suicidio"
  [CRISIS DETECTION] ⚠️ HIGH RISK DETECTED: ['deprimido', 'no puedo'] in: "estoy muy deprimido no puedo más"
  ```

Esto permite:
  ✓ Debugging en tiempo real
  ✓ Verificar que la detección está funcionando
  ✓ Auditoría de casos detectados


📊 FLUJO DE DETECCIÓN ACTUAL
─────────────────────────────────────────────────────────────────────────────────

1️⃣  Usuario escribe mensaje en Agent.tsx
                ↓
2️⃣  handleSend() llama a detectCrisis(text)
                ↓
3️⃣  detectCrisis() normaliza el input y busca palabras clave
                ↓
4️⃣  Si encuentra palabra extrema → EXTREME RISK
                ↓
5️⃣  Si encuentra palabra alta → HIGH RISK
                ↓
6️⃣  Si crisis detectada y NO fue detectada antes:
      → setCrisisDetected(true)
      → Mensaje de contención (Paso A)
      → saveCrisisState() → Backend PHP
                ↓
7️⃣  Backend (PHP) recibe estado y lo registra en MySQL
      → INSERT en byw_agente_retencion
      → Marca como prioridad 'alto'


🧪 PRUEBAS - CÓMO VERIFICAR QUE FUNCIONA
─────────────────────────────────────────────────────────────────────────────────

1. Abre la aplicación en navegador
2. Abre Console (F12 → Console)
3. Escribe UNO de estos mensajes:

   PARA RIESGO EXTREMO:
   ├─ "no quiero vivir"
   ├─ "quiero matarme"
   ├─ "me quiero suicidar"
   ├─ "voy a suicidarme"
   ├─ "no puedo más"
   ├─ "mejor muerto"
   └─ "quiero desaparecer"

   PARA RIESGO ALTO:
   ├─ "estoy muy deprimido"
   ├─ "tengo ansiedad severa"
   ├─ "ataque de pánico"
   ├─ "todo es sin sentido"
   ├─ "no aguanto esta vida"
   ├─ "me duele mucho"
   ├─ "insoportable"
   └─ "sin esperanza"

4. Presiona Enter

RESULTADO ESPERADO:
  ✓ En la consola verás: "[CRISIS DETECTION] 🚨 EXTREME RISK DETECTED: ..."
  ✓ El agente responde con mensaje de contención
  ✓ Se guarda en backend (POST /wp-json/gero/v1/guardar-conversation-state)
  ✓ En base de datos: byw_agente_retencion → prioridad_caso = 'alto'


📁 ARCHIVOS MODIFICADOS
─────────────────────────────────────────────────────────────────────────────────

SRC/Lib/crisisSafety.ts
  ├─ Línea 11-42: EXTREME_RISK_KEYWORDS (16 → 31 palabras)
  ├─ Línea 44-86: HIGH_RISK_KEYWORDS (17 → 43 palabras)
  ├─ Línea 100-141: detectCrisis() (+ console.log para debugging)
  └─ Status: ✅ ACTUALIZADO


🏗️ ARQUITECTURA
─────────────────────────────────────────────────────────────────────────────────

Frontend (React):
  SRC/Lib/crisisSafety.ts
    ├─ EXTREME_RISK_KEYWORDS[] (31 palabras)
    ├─ HIGH_RISK_KEYWORDS[] (43 palabras)
    └─ detectCrisis() → CrisisDetection

SRC/Pages/Agent.tsx
    └─ handleSend() → detectCrisis() → setCrisisDetected() → saveCrisisState()

Backend (WordPress PHP):
  agente-retencion-unitec-02.php
    └─ /guardar-conversation-state endpoint
        └─ gero_generar_sintesis_crisis()
            └─ INSERT byw_agente_retencion
                └─ prioridad_caso = 'alto'


✨ RESULTADOS
─────────────────────────────────────────────────────────────────────────────────

Build: ✅ 1698 modules, 0 errors
Deployment: ✅ Ready
Testing: ✅ Console logging active
Functionality: ✅ Complete detection flow


═════════════════════════════════════════════════════════════════════════════════
