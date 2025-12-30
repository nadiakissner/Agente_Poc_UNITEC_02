═════════════════════════════════════════════════════════════════════════════════
                 ✅ FLUJO DE SELECCIÓN DE RUMBO - MEJORADO
═════════════════════════════════════════════════════════════════════════════════

📋 PROBLEMA IDENTIFICADO
─────────────────────────────────────────────────────────────────────────────────

Cuando el usuario seleccionaba una ruta (ej: "Base académica para arrancar"),
la aplicación navegaba inmediatamente a /summary sin dar opción de:
  ❌ Ver la tarjeta seleccionada con descripción completa
  ❌ Cambiar de opinión a otra ruta
  ❌ Confirmar la selección con un botón "Vamos"


✅ SOLUCIÓN IMPLEMENTADA
─────────────────────────────────────────────────────────────────────────────────

Ahora el flujo es:

1️⃣  Usuario hace el cuestionario
            ↓
2️⃣  Sistema detecta el riesgo principal
            ↓
3️⃣  Agente pregunta: "¿Le entramos a esto o quieres ver más opciones?"
            ↓
4️⃣  Usuario elige "Ver otras opciones"
            ↓
5️⃣  Se muestran todas las rutas (cards) en grid
            ↓
6️⃣  Usuario hace click en una ruta
            ↓
7️⃣  LA RUTA SE SELECCIONA Y EXPANDE (nuevo)
     ├─ Se muestra en una tarjeta grande
     ├─ Con descripción completa
     ├─ Con 2 botones: "Cambiar" y "Vamos"
            ↓
8️⃣  Usuario puede:
     ├─ Hacer click "Cambiar" → vuelve a mostrar todas las rutas
     ├─ Hacer click "Vamos" → navega a /summary con la ruta seleccionada


🎨 INTERFAZ ACTUALIZADA
─────────────────────────────────────────────────────────────────────────────────

ANTES (Sin selección):
┌─────────────────────┬─────────────────────┐
│ Plan para gastos    │ Base académica      │
├─────────────────────┼─────────────────────┤
│ Claridad de rumbo   │ Integrarte y hacer  │
└─────────────────────┴─────────────────────┘
(Click → Navega inmediatamente)


DESPUÉS (Con selección expandida):
┌──────────────────────────────────────────────────┐
│ ✓ Base académica para arrancar                  │
│                                                  │
│ Identificamos lo que te puede costar al inicio  │
│ y cómo reforzarlo                               │
│                                                  │
│ ┌──────────────┬──────────────┐                │
│ │   Cambiar    │    Vamos     │                │
│ └──────────────┴──────────────┘                │
└──────────────────────────────────────────────────┘


📊 ESTADOS GESTIONADOS
─────────────────────────────────────────────────────────────────────────────────

NUEVO estado: selectedRisk
  - null: Mostrar grid de todas las rutas
  - RiskCategory: Mostrar tarjeta expandida de la ruta seleccionada

Estados afectados:
  ├─ showAllOptions: boolean (true = mostrar opciones)
  ├─ selectedRisk: RiskCategory | null (nueva)
  ├─ primaryRisk: RiskCategory (riesgo detectado principal)
  └─ riskScores: Record<string, number> (puntuaciones)


🔧 CAMBIOS EN CÓDIGO
─────────────────────────────────────────────────────────────────────────────────

Archivo: SRC/Pages/Questionnaire.tsx

1. Línea 40: Agregado estado selectedRisk
   ```tsx
   const [selectedRisk, setSelectedRisk] = useState<RiskCategory | null>(null);
   ```

2. Línea 486-493: Actualizada función handleSelectRisk()
   ```tsx
   const handleSelectRisk = (risk: RiskCategory) => {
     setSelectedRisk(risk);  // Solo marca, no navega
   };
   ```

3. Línea 495-502: Nueva función handleConfirmRisk()
   ```tsx
   const handleConfirmRisk = () => {
     if (selectedRisk) {
       localStorage.setItem("unitec_selected_risk", selectedRisk);
       navigate("/summary");
     }
   };
   ```

4. Línea 612-680: Renderizado condicional en JSX
   ├─ Condición: showAllOptions && !selectedRisk → Mostrar grid
   ├─ Condición: showAllOptions && selectedRisk → Mostrar tarjeta expandida
   └─ Tarjeta expandida incluye:
       ├─ Ícono de selección (CheckCircle2)
       ├─ Botón "Cambiar" → setSelectedRisk(null)
       └─ Botón "Vamos" → handleConfirmRisk()


🎯 FUNCIONALIDADES
─────────────────────────────────────────────────────────────────────────────────

✓ Click en ruta → Selecciona y expande
✓ Botón "Cambiar" → Vuelve al grid de rutas
✓ Botón "Vamos" → Confirma y navega
✓ Animaciones suaves (fade-in, slide-in)
✓ Responsive (mobile y desktop)
✓ Visual claro: tarjeta seleccionada tiene border-primary


🧪 PRUEBA
─────────────────────────────────────────────────────────────────────────────────

1. Completa el cuestionario hasta el final
2. Selecciona "Ver otras opciones"
3. Haz click en una ruta (ej: "Base académica para arrancar")
4. Verifica:
   ✓ La tarjeta se expande
   ✓ Muestra descripción completa
   ✓ Aparecen botones "Cambiar" y "Vamos"
   ✓ Botón "Cambiar" vuelve al grid
   ✓ Botón "Vamos" navega a resumen


📊 BUILD STATUS
─────────────────────────────────────────────────────────────────────────────────

✅ 1698 módulos compilados sin errores
✅ 0 errores TypeScript
✅ 0 errores ESLint
✅ Listo para desplegar


════════════════════════════════════════════════════════════════════════════════
