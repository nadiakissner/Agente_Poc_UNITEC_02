# Plan de Implementación - Nuevo Flujo RouteA

## 🎯 Objetivo
Reemplazar el flujo actual de RouteA por un nuevo flujo conversacional con preguntas una a la vez, lógica condicional, y análisis mejorado del LLM.

## 📋 Pre-requisitos
- [ ] Entorno React/TypeScript configurado
- [ ] Backend PHP con WordPress funcionando
- [ ] API Key de OpenAI configurada en `wp-config.php`
- [ ] Base de datos `byw_agente_retencion` accesible
- [ ] Git o control de versiones (para backup)

---

## 🔧 Fase 1: Preparación

### 1.1 Backup del código actual
```bash
# En tu directorio del proyecto
cp src/Pages/RouteA.tsx src/Pages/RouteA.BACKUP_2025.tsx
cp agente-retencion-unitec-02.php agente-retencion-unitec-02.BACKUP_2025.php
```

### 1.2 Revisar archivos relacionados
Verificar que estos archivos existen y funcionan:
- [ ] `/SRC/Components/Chat/ChatBubble.tsx` - Componente de mensaje
- [ ] `/SRC/Components/Chat/TypingIndicator.tsx` - Indicador de escritura
- [ ] `/SRC/Components/Ui/input.tsx` - Input de texto
- [ ] `/SRC/Components/Ui/button.tsx` - Botón
- [ ] `/SRC/Hooks/use-toast.ts` - Toast notifications

---

## 📦 Fase 2: Implementación Frontend

### 2.1 Reemplazar RouteA.tsx

1. **Abrir** `src/Pages/RouteA.tsx`
2. **Seleccionar TODO** (Ctrl+A o Cmd+A)
3. **Eliminar** todo el contenido
4. **Copiar** el contenido completo de `RouteA_NUEVO_FLUJO.tsx`
5. **Pegar** en `RouteA.tsx`
6. **Guardar** archivo

**Verificar:**
```bash
npm run build
# Debe compilar sin errores
```

### 2.2 Probar componente en desarrollo

```bash
npm run dev
# Navegar a RouteA
# Verificar que aparecen los 10 pasos
# Verificar que el chat es fluido
```

**Checklist visual:**
- [ ] Pregunta "¿Qué tan motivado...?" aparece
- [ ] Input de texto responde a cambios
- [ ] Typing indicator aparece después de responder
- [ ] Historial de chat se acumula
- [ ] Botón Send se habilita/deshabilita correctamente

### 2.3 Probar lógica condicional

**Caso 1: "ambas"**
```
Pregunta 2: "¿Sientes que tus dudas..."
Respuesta: "ambas cosas"
Siguiente: Debe ir a Paso 3 ✅
```

**Caso 2: "conmigo"**
```
Pregunta 2: "¿Sientes que tus dudas..."
Respuesta: "conmigo, por mi parte"
Siguiente: Debe SALTAR a Paso 5 ✅
```

### 2.4 Probar validación

**Paso 1 - Motivación:**
```
Respuesta: "6"
Resultado: Error message ❌ (rechaza > 5)

Respuesta: "3"
Resultado: Acepta ✅
```

---

## ⚙️ Fase 3: Implementación Backend

### 3.1 Actualizar función `agente_procesar_fin_cuestionario()`

**Archivo:** `agente-retencion-unitec-02.php`

**Ubicación:** Línea ~770 (buscar "agente_procesar_fin_cuestionario")

**Cambios incluidos en este documento:**
- [ ] ✅ Ya realizado - Extrae respuestas conversacionales
- [ ] ✅ Ya realizado - Construye contexto detallado
- [ ] ✅ Ya realizado - Pasa contexto al LLM

**Verificar en código:**
```php
// Debe existir:
$motivacion_inicial = isset( $respuestas_obj['1'] ) ? ... // ✅
$tipo_duda = isset( $respuestas_obj['2'] ) ? ... // ✅
$contexto = "El estudiante {$nombre}..." // ✅

// Debe llamar a LLM:
agente_clasificar_riesgo_con_llm(
    'cuestionario',
    $nombre,
    $carrera,
    $respuestas_obj,
    $contexto  // ← NUEVO
);
```

### 3.2 Actualizar prompts en `agente_clasificar_riesgo_con_llm()`

**Ubicación:** Línea ~1000 (buscar función)

**Prompts actualizados:**
- [ ] ✅ Ya realizado - Prompt 'cuestionario' mejorado
- [ ] ✅ Ya realizado - Prompt 'ruta' mejorado

**Verificar en código:**
```php
// Debe incluir:
if ( $etapa === 'cuestionario' ) {
    $prompt = <<<PROMPT
Analiza el cuestionario conversacional de un estudiante...
Identifica:
1. Su nivel de motivación inicial
2. Si sus dudas son internas o externas
...
PROMPT;
}
```

### 3.3 Probar backend localmente

```bash
# En terminal, verificar sintaxis PHP
php -l agente-retencion-unitec-02.php
# Debe mostrar: No syntax errors detected

# O usar WP-CLI si tienes
wp plugin verify-plugin agente-retencion-unitec-02
```

---

## 🧪 Fase 4: Testing Integrado

### 4.1 Test 1: Flujo Completo Normal

**Inicio:** `http://localhost/agente/routeA`

**Pasos a seguir:**
```
1. ¿Qué tan motivado? → "4"
2. ¿Dudas? → "Sobre la carrera, tengo dudas"
3. ¿Claridad? → "3"
4. ¿Duración? → "Sí, me preocupa"
5. ¿Materias? → "No, creo que puedo"
6. ¿Salida laboral? → "Sí, tengo dudas"
   [Debe mostrar feedback sobre derivación]
7. ¿Ayudar? → "Sí"
8. ¿Demostrarse? → "Sí"
9. ¿Dinero? → "Es importante"
10. ¿Empezar? → "Sí"
```

**Verificar:**
- [ ] Cada paso avanza solo después de responder
- [ ] El feedback aparece en paso 6
- [ ] Se completa sin errores
- [ ] Redirige a `/summary`
- [ ] En BD se guardó con `prioridad_caso = 'pendiente'`

### 4.2 Test 2: Bifurcación en Paso 2

**Inicio:** Recargar página, volver a empezar

**Pasos a seguir:**
```
1. Motivación → "2"
2. Dudas → "Conmigo, no confío en mí"
[Debe SALTAR a paso 5, NO mostrar paso 3-4]
5. ¿Materias? → "Sí, me asusta"
6. ¿Salida? → "No sé"
7-9. [Respuestas]
10. ¿Empezar? → "No, necesito ayuda"
```

**Verificar:**
- [ ] Paso 3 y 4 se OMITEN
- [ ] Va directamente a paso 5
- [ ] Redirige a `/routeA-riasec` (o muestra mensaje si ruta no existe)

### 4.3 Test 3: Validación de Motivación

**Paso 1 - Respuesta incorrecta:**
```
Usuario escribe: "mucho"
Click Send
Resultado: Mensaje de error "Por favor, responde un número entre 1 y 5"
```

**Verificar:**
- [ ] Rechaza respuesta
- [ ] Input mantiene el valor (no se borra)
- [ ] Usuario puede reintentar

### 4.4 Test 4: Persistencia

**Durante flujo:**
```
1. Responder pregunta 1
2. Recargar página (F5)
3. Verificar que pregunta 2 aparece
4. Verificar que historial se mantuvo
```

**Verificar:**
- [ ] Historial se recupera desde localStorage
- [ ] Paso actual es correcto
- [ ] Respuestas no se pierden

---

## 🔍 Fase 5: Validación LLM

### 5.1 Verificar respuesta del LLM

**En navegador (F12) → Network:**
```
POST /wp-json/gero/v1/procesar-fin-cuestionario
Status: 200 ✅
Response: {
    "success": true,
    "message": "Cuestionario procesado correctamente",
    "clasificacion_pendiente": true
}
```

### 5.2 Verificar datos en BD

**En phpMyAdmin:**
```sql
SELECT * FROM byw_agente_retencion 
WHERE user_email = 'email@que.testeas'
LIMIT 1;
```

**Verificar campos:**
- [ ] `user_email` ✅ Correcto
- [ ] `user_id` ✅ Correcto
- [ ] `prioridad_caso` = 'pendiente' ✅
- [ ] `justificacion` = JSON con "cuestionario" ✅
- [ ] `riesgo_detectado` ✅ Array JSON

**Ejemplo de `justificacion` esperado:**
```json
{
  "cuestionario": "Juan reporta motivación media (2/5) con dudas sobre su confianza personal. Tiene preocupación sobre capacidad académica..."
}
```

### 5.3 Verificar logs del LLM

**Archivo:** `/var/log/apache2/error.log` (o logs de WordPress)

**Buscar:**
```
✅ Clasificación de cuestionario guardada para: email@...
```

O en caso de error:
```
❌ Error en clasificación de cuestionario: [error details]
```

---

## 🐛 Troubleshooting

### Problema: Pregunta 2 no bifurca correctamente

**Causa:** Lógica de detección de palabras clave

**Solución:**
```typescript
// Revisar en RouteA_NUEVO_FLUJO.tsx la función:
const determineNextStep = (response: string): number => {
  const lowerResponse = response.toLowerCase();
  
  // Agregar más palabras clave si es necesario:
  if (lowerResponse.includes("ambas") || 
      lowerResponse.includes("carrera") ||
      lowerResponse.includes("programa")) {
    return 3;  // ← Paso 3
  }
  // ...
}
```

### Problema: LLM retorna error 401

**Causa:** API Key no configurada o incorrecta

**Solución:**
```php
// En wp-config.php:
define('OPENAI_API_KEY', 'sk-...');  // Tu API key real

// Verificar que está set:
if (!defined('OPENAI_API_KEY')) {
    die('❌ OPENAI_API_KEY not defined');
}
```

### Problema: Frontend no se conecta al endpoint

**Causa:** CORS o ruta incorrecta

**Solución:**
1. Verificar que endpoint existe en PHP:
   ```bash
   wp rest-api-client routes
   # Debe listar: /gero/v1/procesar-fin-cuestionario
   ```

2. Verificar en navegador (F12 → Network):
   ```
   Request: POST /wp-json/gero/v1/procesar-fin-cuestionario
   Headers: Content-Type: application/json
   ```

### Problema: Respuestas se pierden al recargar

**Causa:** localStorage no se guarda correctamente

**Solución:**
```typescript
// En RouteA_NUEVO_FLUJO.tsx:
useEffect(() => {
  localStorage.setItem("routeA_responses", JSON.stringify(responses));
  console.log('✅ Saved to localStorage:', responses);
}, [responses]);

// En console (F12) debe ver el log
```

---

## ✅ Checklist Final

### Antes de Producción
- [ ] Código frontend compila sin warnings
- [ ] Código PHP no tiene errores de sintaxis
- [ ] API Key OpenAI funciona correctamente
- [ ] Todos los 5 tests pasan
- [ ] Base de datos guarda datos correctamente
- [ ] LLM genera justificaciones coherentes
- [ ] localStorage persiste entre recargas
- [ ] Bifurcación Paso 2 funciona
- [ ] Feedback Paso 6 aparece
- [ ] Ambas salidas (SÍ/NO) funcionan

### Antes de Lanzamiento a Usuarios
- [ ] Testing con 5+ usuarios reales
- [ ] Validación de justificaciones LLM
- [ ] Verificar prioridades asignadas
- [ ] Documentación lista
- [ ] Plan de rollback
- [ ] Monitoreo de errores activo

---

## 📞 Soporte Durante Implementación

Si necesitas ayuda:
1. **Error en Frontend?** → Revisar console (F12 → Console)
2. **Error en Backend?** → Revisar logs de Apache
3. **LLM falla?** → Verificar API Key y logs de error
4. **BD vacía?** → Revisar tabla existe y permisos

---

**Duración estimada de implementación:** 2-3 horas
**Duración estimada de testing:** 1-2 horas
**Total:** 3-5 horas

---

**Versión:** 1.0
**Fecha:** Enero 2025
**Estado:** Listo para implementación
