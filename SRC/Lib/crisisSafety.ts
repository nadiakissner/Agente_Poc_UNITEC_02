/**
 * Crisis Safety Detection System
 * Detecta indicadores de riesgo extremo y maneja protocolos de contención
 */

export interface CrisisDetection {
  isCrisis: boolean;
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'extreme';
  detectedKeywords: string[];
}

// Palabras clave de riesgo extremo (Prioridad Máxima)
const EXTREME_RISK_KEYWORDS = [
  'suicidio',
  'suicidarme',
  'suicidate',
  'me quiero suicidar',
  'voy a suicidarme',
  'quiero matarme',
  'me quiero matar',
  'matarme',
  'quitarme la vida',
  'no quiero vivir',
  'no quiero volver',
  'desesperación total',
  'desesperado',
  'autolesión',
  'cortarme',
  'lastimarme',
  'hacerme daño',
  'ya no puedo',
  'no puedo más',
  'no aguanto más',
  'cansado de vivir',
  'cansada de vivir',
  'no tengo razón para vivir',
  'mejor si no estuviera',
  'mejor muerto',
  'todos estarían mejor sin mí',
  'sin razón para vivir',
  'sin motivo para vivir',
  'vida sin sentido',
  'deseo de morir',
  'quiero desaparecer',
  'quiero irme',
  'acabar con todo',
];

// Palabras clave de riesgo alto (Probable referencia a depresión/ansiedad severa)
const HIGH_RISK_KEYWORDS = [
  'depresión',
  'deprimido',
  'deprimida',
  'muy deprimido',
  'ansiedad severa',
  'ansiedad extrema',
  'pánico',
  'ataque de pánico',
  'ataques de pánico',
  'pánico constante',
  'quiero morir',
  'deseo de morir',
  'pensamientos de muerte',
  'pensando en la muerte',
  'todo es sin sentido',
  'nada tiene sentido',
  'soy un fracaso',
  'soy inútil',
  'soy basura',
  'no sirvo para nada',
  'no merezco vivir',
  'nadie me quiere',
  'nadie me ama',
  'estoy solo/a',
  'me siento solo',
  'me siento sola',
  'me siento muy mal',
  'no aguanto esta vida',
  'no puedo con esto',
  'todo me afecta mucho',
  'he fracasado',
  'he perdido todo',
  'no tengo esperanza',
  'sin esperanza',
  'sin futuro',
  'me duele mucho',
  'es insoportable',
  'insoportable',
  'no veo salida',
  'sin salida',
  'quiero escapar',
  'quiero huir',
];

/**
 * Detecta si el input del usuario contiene indicadores de crisis
 * @param input - Texto del usuario
 * @returns Objeto con detección de crisis
 */
export const detectCrisis = (input: string): CrisisDetection => {
  const normalizedInput = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const detectedKeywords: string[] = [];

  // Verificar palabras clave de riesgo extremo
  for (const keyword of EXTREME_RISK_KEYWORDS) {
    if (normalizedInput.includes(keyword.toLowerCase())) {
      detectedKeywords.push(keyword);
    }
  }

  if (detectedKeywords.length > 0) {
    console.log('[CRISIS DETECTION] 🚨 EXTREME RISK DETECTED:', detectedKeywords, 'in:', input);
    return {
      isCrisis: true,
      riskLevel: 'extreme',
      detectedKeywords,
    };
  }

  // Verificar palabras clave de riesgo alto
  for (const keyword of HIGH_RISK_KEYWORDS) {
    if (normalizedInput.includes(keyword.toLowerCase())) {
      detectedKeywords.push(keyword);
    }
  }

  if (detectedKeywords.length > 0) {
    console.log('[CRISIS DETECTION] ⚠️ HIGH RISK DETECTED:', detectedKeywords, 'in:', input);
    return {
      isCrisis: true,
      riskLevel: 'high',
      detectedKeywords,
    };
  }

  return {
    isCrisis: false,
    riskLevel: 'none',
    detectedKeywords: [],
  };
};

/**
 * Mensaje de contención inicial (Paso A)
 */
export const getCrisisContainmentMessage = (): string => {
  return `Lamento mucho lo que estás pasando en este momento. Me preocupa lo que compartes y realmente quiero escucharte. ¿Podrías platicarme un poco más sobre cómo te estás sintiendo?`;
};

/**
 * Mensaje de referencia a recursos (Paso B)
 */
export const getCrisisResourceMessage = (): string => {
  const supportLink = 'https://www.unitec.mx/apoyo-al-desarrollo-estudiantil/?utm_source=BLOG&utm_medium=ORGANIC&utm_campaign=BLG_UG_UNITEC_CONT_C3_24';
  return `Entiendo que esto es muy pesado. Quiero que sepas que no estás solo/a y en UNITEC contamos con profesionales especializados para apoyarte. Por favor, accede a <a href="${supportLink}" target="_blank" style="color: #0066cc; text-decoration: underline; font-weight: 500;">apoyo al desarrollo estudiantil</a> ahora para platicar con alguien que puede darte el apoyo que necesitas.`;
};

/**
 * Mensaje de retorno al flujo (Paso C)
 */
export const getReturnToFlowMessage = (previousTopic: string = 'nuestra plática'): string => {
  return `¿Ya te sientes mejor para seguir? O si prefieres, podemos dejarlo para después.`;
};

/**
 * Mensaje de pausa (cuando usuario dice NO a retomar)
 */
export const getPauseMessage = (): string => {
  return `Claro que sí, entiendo perfectamente. Tómate el tiempo que necesites. Te estaré escribiendo más tarde para que sigas cuando estés listo/a. Aquí estoy para ti.`;
};

/**
 * Genera marcador para backend PHP
 */
export const getCrisisMarker = (): string => {
  return '[STATUS: INTERRUPTED_BY_SAFETY]';
};

/**
 * Verifica si el input es una respuesta positiva a recuperación
 */
export const isPositiveResponse = (input: string): boolean => {
  const positiveKeywords = ['si', 'sí', 'claro', 'ok', 'órale', 'sí claro', 'dale', 'bueno', 'bien', 'mejor', 'continuar', 'adelante', 'siguiente', 'va', 'va pues', 'ándale'];
  const normalized = input.toLowerCase().trim();
  return positiveKeywords.some(keyword => normalized.includes(keyword));
};

/**
 * Verifica si el input es una respuesta negativa a recuperación
 */
export const isNegativeResponse = (input: string): boolean => {
  const negativeKeywords = ['no', 'nope', 'después', 'luego', 'más tarde', 'ahorita no', 'ahora no', 'déjalo', 'dejalo', 'no me siento', 'no quiero', 'me late no'];
  const normalized = input.toLowerCase().trim();
  return negativeKeywords.some(keyword => normalized.includes(keyword));
};
