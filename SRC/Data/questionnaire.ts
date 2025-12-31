// UNITEC Questionnaire Data - Parsed from CSV
export type QuestionType = 'chips' | 'likert' | 'yesno' | 'list' | 'checkbox' | 'chips-text';
export type RiskCategory = 
  | 'economica' 
  | 'social' 
  | 'baja_preparacion' 
  | 'organizacion' 
  | 'tecnologica' 
  | 'desorientacion' 
  | 'entorno' 
  | 'emocional';

export interface QuestionOption {
  text: string;
  risk?: RiskCategory | RiskCategory[];
  weight?: number;
  // Permite asignar diferentes puntos a diferentes categorías
  // Ejemplo: { desorientacion: 2, baja_preparacion: 1 }
  riskWeights?: Partial<Record<RiskCategory, number>>;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: QuestionOption[];
  condition?: {
    questionId: string;
    answers: string[];
    skipTo?: string;
  };
  keywordDetection?: {
    [key: string]: {
      keywords: string[];
      riskWeights: Partial<Record<RiskCategory, number>>;
    };
  };
  conditionalWeights?: {
    [dependsOnQuestion: string]: {
      [categoryOrAnswer: string]: {
        [answer: string]: Partial<Record<RiskCategory, number>>;
      };
    };
  };
}

export const questionnaireData: Question[] = [
  {
    id: 'P1',
    text: '¿Cómo describirías hoy tu sensación frente a comenzar la universidad?',
    type: 'chips-text', // Permite chips O texto libre
    options: [
      { text: 'Entusiasmado/a', riskWeights: {} },
      { text: 'Con curiosidad', riskWeights: {} },
      { text: 'Con algo de incertidumbre', riskWeights: { desorientacion: 2, emocional: 1 } },
      { text: 'Tengo dudas', riskWeights: { desorientacion: 2 } },
      { text: 'Desmotivado/a', riskWeights: { emocional: 3, desorientacion: 2 } },
    ],
  },
  {
    id: 'P2',
    text: 'A veces hay algo puntual que nos inquieta. ¿Qué factores generan esas inquietudes? Selecciona el más importante para ti',
    type: 'chips',
    options: [
      { text: 'Me preocupa el factor económico porque no estoy seguro/a de poder cubrir la carrera.', riskWeights: { economica: 4 } },
      { text: 'No estoy seguro de si elegí bien la carrera o de por qué quiero estudiar', riskWeights: { desorientacion: 4} },
      { text: 'No cuento con la tecnología y conectividad necesarias', riskWeights: { tecnologica: 4 } },
      { text: 'Siento que no estoy preparado/a para enfrentar el nivel académico de la uni', riskWeights: { baja_preparacion: 4 } },
    ],
  },
  // {
  //   id: 'P1',
  //   text: 'En una escala del 1 al 5, siendo 1 "muy indeciso/a" y 5 "muy seguro/a", ¿qué tan seguro/a estás de tus ganas de estudiar y de la carrera que elegiste?',
  //   type: 'likert',
  //   options: [
  //     { text: '1', riskWeights: { desorientacion: 4 } },
  //     { text: '2', riskWeights: { desorientacion: 2 } },
  //     { text: '3', riskWeights: { desorientacion: 1 } },
  //     { text: '4', riskWeights: {} },
  //     { text: '5', riskWeights: {} },
  //   ],
  //   // condition: {
  //   //   questionId: 'P1',
  //   //   answers: ['4', '5'],
  //   //   skipTo: 'P2',
  //   // },
  // },
  // {
  //   id: 'P2',
  //   text: 'En una escala del 1 al 5, siendo 1 "no tengo dónde estudiar en paz" y 5 "me encanta dónde estudio", ¿qué tan cómodo/a estás con tu lugar de estudio en este momento?',
  //   type: 'likert',
  //   options: [
  //     { text: '1', riskWeights: { entorno: 4, emocional: 2 } },
  //     { text: '2', riskWeights: { entorno: 2, emocional: 1 } },
  //     { text: '3', riskWeights: { entorno: 1 } },
  //     { text: '4', riskWeights: {} },
  //     { text: '5', riskWeights: {} },
  //   ],
  // },

  // // P2 - Checkbox comentado - Omitido del flujo
  // /*
  // {
  //   id: 'P2',
  //   text: 'A veces hay algo puntual que nos genera dudas. ¿Qué factores influyen en esa inseguridad? Selecciona todos los que apliquen',
  //   type: 'checkbox',
  //   options: [
  //     { text: 'Me preocupa el factor económico porque no estoy seguro/a de poder pagar la carrera', risk: 'economica', weight: 3 },
  //     { text: 'Me siento solo/a o sin apoyo para iniciar esta etapa universitaria', risk: 'social', weight: 3 },
  //     { LISTOOO text: 'Siento que no estoy preparado/a para enfrentar el nivel académico de la Universidad', risk: 'baja_preparacion', weight: 3 },
  //     { LISTOOO text: 'Tengo muchas responsabilidades y me cuesta conciliarlas con el tiempo que requieren los estudios', risk: 'organizacion', weight: 3 },
  //     { LISTOOO text: 'No cuento con la tecnología y conectividad necesarias', risk: 'tecnologica', weight: 3 },
  //     { LISTOOO text: 'No tengo los conocimientos de uso de herramientas digitales que creo son necesarios', risk: 'tecnologica', weight: 3 },
  //     { LISTOOO text: 'No estoy seguro/a si elegí bien la carrera', risk: 'desorientacion', weight: 3 },
  //     { LISTOOO text: 'No tengo claridad sobre por qué quiero estudiar', risk: 'desorientacion', weight: 3 },
  //     { text: 'Mi entorno no ayuda: no tengo un lugar (espacio físico) tranquilo o adecuado para estudiar', risk: 'entorno', weight: 3 },
  //     { text: 'Últimamente me siento desmotivado/a, ansioso/a o con altibajos emocionales', risk: 'emocional', weight: 3 },
  //   ],
  // },
  // */
  // {
  //   id: 'P3',
  //   text: 'En una escala del 1 al 5, siendo 1 "me siento muy atrasado/a" y 5 "me siento bien preparado/a", ¿cómo te sientes académicamente para empezar tu carrera?',
  //   type: 'likert',
  //   options: [
  //     { text: '1', riskWeights: { desorientacion: 2, baja_preparacion: 4 } },
  //     { text: '2', riskWeights: { baja_preparacion: 3, desorientacion: 1 } },
  //     { text: '3', riskWeights: { baja_preparacion: 1 } },
  //     { text: '4', riskWeights: {} },
  //     { text: '5', riskWeights: {} },
  //   ],
  // },
  // {
  //   id: 'P4',
  //   text: 'Del 1 al 5, ¿qué tal se te da organizar tu tiempo y estar al corriente con las tareas y trabajos?',
  //   type: 'likert',
  //   options: [
  //     { text: '1', riskWeights: { organizacion: 4 } },
  //     { text: '2', riskWeights: { organizacion: 3 } },
  //     { text: '3', riskWeights: { organizacion: 1 } },
  //     { text: '4', riskWeights: {} },
  //     { text: '5', riskWeights: {} },
  //   ],
  // },
  // {
  //   id: 'P5',
  //   text: '¿Cual es tu fuente de financiamento principal para tus estudios en la universidad?',
  //   type: 'text',
  //   options: [],
  //   keywordDetection: {
  //     familia: { keywords: ['padre', 'padres', 'madre', 'papa', 'mama', 'tio', 'tia', 'abuelo', 'abuela', 'abuelos', 'abuelas', 'tios', 'tias', 'hermano', 'hermana', 'hermanos', 'hermanas', 'parientes', 'familia'], riskWeights: { } },
  //     beca: { keywords: ['beca', 'becado', 'becada', 'becarios'], riskWeights: { economica: 2 } },
  //     credito: { keywords: ['credito', 'financiamiento', 'prestamo', 'banco'], riskWeights: { economica: 2 } },
  //     trabajo: { keywords: ['trabajo', 'laboral', 'empleo', 'trabajando', 'laburo', 'laboro'], riskWeights: { economica: 1 } },
  //   }
  // },
  // {
  //   id: 'P6',
  //   text: 'Si se acabara ese dinero para pagar tu carrera, del 1 al 5, ¿qué tan complicado sería seguir estudiando? (1 = nada complicado, 5 = muy complicado)',
  //   type: 'likert',
  //   options: [
  //     { text: '1', riskWeights: {} },
  //     { text: '2', riskWeights: {} },
  //     { text: '3', riskWeights: {} },
  //     { text: '4', riskWeights: {} },
  //     { text: '5', riskWeights: {} },
  //   ],
  //   conditionalWeights: {
  //     P5: {
  //       familia: {
  //         '3': { economica: 0 },
  //         '4': { economica: 1 },
  //         '5': { economica: 1 },
  //       },
  //       beca: {
  //         '3': { economica: 1 },
  //         '4': { economica: 3 },
  //         '5': { economica: 3 },
  //       },
  //       credito: {
  //         '3': { economica: 1 },
  //         '4': { economica: 3 },
  //         '5': { economica: 3 },
  //       },
  //       trabajo: {
  //         '3': { economica: 1 },
  //         '4': { economica: 2 },
  //         '5': { economica: 2 },
  //       },
  //     },
  //   },
  // },
  // {
  //   id: 'P7',
  //   text: '¿Sentiste que terminar la prepa te costó más trabajo de lo que esperabas?',
  //   type: 'yesno',
  //   options: [
  //     { text: 'Sí', riskWeights: { baja_preparacion: 2 } },
  //     { text: 'No', riskWeights: {} },
  //   ],
  // },
  // {
  //   id: 'P8',
  //   text: 'Del 1 al 5, ¿qué tan fácil se te hace hacer amigos/as cuando llegas a un lugar nuevo, como la universidad?',
  //   type: 'likert',
  //   options: [
  //     { text: '1', riskWeights: { social: 4, emocional: 3 } },
  //     { text: '2', riskWeights: { social: 3, emocional: 2 } },
  //     { text: '3', riskWeights: { social: 1 } },
  //     { text: '4', riskWeights: {} },
  //     { text: '5', riskWeights: {} },
  //   ],
  // },
  // {
  //   id: 'P9',
  //   text: 'Si 1 es "nada cómodo/a" y 5 es "muy cómodo/a", ¿qué tal te sientes usando plataformas digitales, zoom, campus virtual y esas cosas para las clases?',
  //   type: 'likert',
  //   options: [
  //     { text: '1', riskWeights: { tecnologica: 4 } },
  //     { text: '2', riskWeights: { tecnologica: 3 } },
  //     { text: '3', riskWeights: { tecnologica: 1 } },
  //     { text: '4', riskWeights: {} },
  //     { text: '5', riskWeights: {} },
  //   ],
  // },
];

export const riskPriority: RiskCategory[] = [
  'emocional',
  'desorientacion',
  'organizacion',
  'baja_preparacion',
  'economica',
  'social',
  'tecnologica',
  'entorno',
];

export const riskLabels: Record<RiskCategory, string> = {
  economica: 'Organizarte con tus gastos de carrera',
  social: 'Conectar y hacer amigos en la universidad',
  baja_preparacion: 'Reforzar tus bases académicas',
  organizacion: 'Organizar tu semana y tiempos',
  tecnologica: 'Dominar las herramientas digitales',
  desorientacion: 'Clarificar hacia dónde vas',
  entorno: 'Mejorar tus condiciones para estudiar',
  emocional: 'Cuidar tu bienestar emocional',
};
