# Guía: Sistema de Múltiples Puntos por Respuesta (riskWeights)

## Descripción General
El nuevo sistema `riskWeights` permite asignar **diferentes puntos a diferentes categorías de riesgo** desde una sola respuesta.

## ¿Por qué es útil?
Antes, si una respuesta afectaba a múltiples categorías, todas recibían el **mismo peso**:
```typescript
// ❌ Sistema antiguo
{ text: '1', risk: ['social', 'emocional'], weight: 4 }
// Esto suma 4 puntos a social Y 4 puntos a emocional (no hay control individual)
```

Ahora, puedes especificar el peso de cada categoría:
```typescript
// ✅ Sistema nuevo
{ text: '1', riskWeights: { social: 4, emocional: 4 } }
// O incluso asignar pesos diferentes:
{ text: '5', riskWeights: { desorientacion: 2, baja_preparacion: 1 } }
```

## Estructura de riskWeights

`riskWeights` es un objeto que mapea categorías de riesgo con sus puntos:

```typescript
riskWeights?: Partial<Record<RiskCategory, number>>
```

**RiskCategory** puede ser cualquiera de:
- `'economica'`
- `'social'`
- `'baja_preparacion'`
- `'organizacion'`
- `'tecnologica'`
- `'desorientacion'`
- `'entorno'`
- `'emocional'`

## Ejemplos de Uso

### Ejemplo 1: Respuesta que suma a una sola categoría
```typescript
{
  id: 'P4',
  text: 'Del 1 al 5, ¿qué tan preparado/a te sientes para manejar tu tiempo?',
  type: 'likert',
  options: [
    { text: '1', riskWeights: { organizacion: 3 } },
    { text: '2', riskWeights: { organizacion: 2 } },
    { text: '3', riskWeights: { organizacion: 1 } },
    { text: '4', riskWeights: {} },  // Sin puntos
    { text: '5', riskWeights: {} },  // Sin puntos
  ],
}
```

### Ejemplo 2: Respuesta que suma a múltiples categorías (pesos iguales)
```typescript
{
  id: 'P7',
  text: 'En una escala del 1 al 5, ¿qué tan fácil te resulta hacer amistades?',
  type: 'likert',
  options: [
    { text: '1', riskWeights: { social: 4, emocional: 4 } },
    { text: '2', riskWeights: { social: 2 } },
    { text: '3', riskWeights: { social: 1 } },
    { text: '4', riskWeights: {} },
    { text: '5', riskWeights: {} },
  ],
}
```

### Ejemplo 3: Respuesta que suma a múltiples categorías (pesos diferentes) ⭐
Este es el caso que solicitaste:
```typescript
{
  id: 'P2',
  text: 'Del 1 al 5, ¿qué tan a gusto te sientes en tu ambiente de estudio?',
  type: 'likert',
  options: [
    { text: '1', riskWeights: { entorno: 3, emocional: 3 } },
    { text: '2', riskWeights: { entorno: 2 } },
    { text: '3', riskWeights: { entorno: 1 } },
    { text: '4', riskWeights: {} },
    { text: '5', riskWeights: { desorientacion: 2, baja_preparacion: 1 } },  // ⭐ Diferentes pesos
  ],
}
```

## Cómo Funciona Internamente

Cuando el usuario completa el questionnaire, el sistema:

1. Lee la respuesta seleccionada (ej: "5" en P2)
2. Extrae el `riskWeights` de esa opción
3. Suma cada valor del objeto a su categoría correspondiente:
   ```typescript
   // Si el usuario selecciona "5" en P2:
   riskScores['desorientacion'] += 2
   riskScores['baja_preparacion'] += 1
   ```

## Compatibilidad Retroactiva

El código sigue siendo compatible con el sistema antiguo (`risk` + `weight`):

```typescript
// ✅ Esto todavía funciona:
{ text: '1', risk: 'desorientacion', weight: 0 }
{ text: '2', risk: ['social', 'emocional'], weight: 4 }

// ✅ Pero ahora tienes la opción de usar:
{ text: '1', riskWeights: { desorientacion: 0 } }
{ text: '2', riskWeights: { social: 4, emocional: 4 } }
```

## Casos de Uso Recomendados

### Usar `riskWeights` cuando:
- Una respuesta afecta a múltiples categorías con **diferentes pesos**
- Necesitas fine-tuning en la asignación de puntos
- Una pregunta es "compleja" y tiene impacto variado en distintos factores de riesgo

### Usar el sistema antiguo (`risk` + `weight`) cuando:
- Una respuesta afecta solo a una categoría
- Todos los riesgos afectados merecen el mismo peso

## Validación

El sistema valida automáticamente que las categorías sean válidas. TypeScript mostrará un error si intentas usar:
```typescript
// ❌ Esto generará un error:
{ text: '5', riskWeights: { invalid_category: 2 } }
```

---

**Resumen:** El nuevo sistema `riskWeights` te permite máxima flexibilidad para asignar puntos de riesgo, permitiendo diferentes pesos para diferentes categorías en una sola respuesta.
