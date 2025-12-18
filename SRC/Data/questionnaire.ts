// UDLA Questionnaire Data - Parsed from CSV
export type QuestionType = 'chips' | 'likert' | 'yesno' | 'list';
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
  risk?: RiskCategory;
  weight?: number;
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
}

export const questionnaireData: Question[] = [
  {
    id: 'P1',
    text: '✨ Todos tenemos una historia distinta al momento de elegir qué estudiar. Empezar una nueva etapa puede generar muchas emociones distintas.\n\n¿Cómo describirías hoy tu sensación frente a lo que estás por comenzar?',
    type: 'chips',
    options: [
      { text: 'Con entusiasmo' },
      { text: 'Con confianza' },
      { text: 'Curioso/a por lo que viene' },
      { text: 'Con algo de incertidumbre' },
      { text: 'Con muchas dudas' },
    ],
    condition: {
      questionId: 'P1',
      answers: ['Con algo de incertidumbre', 'Con muchas dudas'],
      skipTo: 'P2',
    },
  },
  {
    id: 'P2',
    text: 'A veces hay algo puntual que nos genera dudas. ¿Qué crees que influye más en esa inseguridad? Elige el factor que consideres más importante',
    type: 'list',
    options: [
      { text: 'Me preocupa el factor económico porque no estoy seguro/a de poder pagar la carrera', risk: 'economica', weight: 3 },
      { text: 'Me siento solo/a o sin apoyo para iniciar esta etapa universitaria', risk: 'social', weight: 3 },
      { text: 'Siento que no estoy preparado/a para enfrentar el nivel académico de la Universidad', risk: 'baja_preparacion', weight: 3 },
      { text: 'Tengo muchas responsabilidades y me cuesta conciliarlas con el tiempo que requieren los estudios', risk: 'organizacion', weight: 3 },
      { text: 'No cuento con la tecnología y conectividad necesarias', risk: 'tecnologica', weight: 3 },
      { text: 'No tengo los conocimientos de uso de herramientas digitales que creo son necesarios', risk: 'tecnologica', weight: 3 },
      { text: 'No estoy seguro/a si elegí bien la carrera', risk: 'desorientacion', weight: 3 },
      { text: 'No tengo claridad sobre por qué quiero estudiar', risk: 'desorientacion', weight: 3 },
      { text: 'Mi entorno no ayuda: no tengo un lugar (espacio físico) tranquilo o adecuado para estudiar', risk: 'entorno', weight: 3 },
      { text: 'Últimamente me siento desmotivado/a, ansioso/a o con altibajos emocionales', risk: 'emocional', weight: 3 },
    ],
  },
  {
    id: 'P3',
    text: '¿Qué tan preparado te sientes para tu carrera?',
    type: 'likert',
    options: [
      { text: '1 - Nada preparado', risk: 'desorientacion', weight: 2 },
      { text: '2', risk: 'desorientacion', weight: 2 },
      { text: '3', risk: 'desorientacion', weight: 2 },
      { text: '4' },
      { text: '5 - Muy preparado' },
    ],
  },
  {
    id: 'P4',
    text: '¿Qué tan preparado/a te sientes para gestionar tu tiempo y cumplir con las responsabilidades académicas de la universidad?',
    type: 'likert',
    options: [
      { text: '1 - Nada preparado', risk: 'organizacion', weight: 2 },
      { text: '2', risk: 'organizacion', weight: 2 },
      { text: '3', risk: 'organizacion', weight: 2 },
      { text: '4' },
      { text: '5 - Muy preparado' },
    ],
  },
  {
    id: 'P5',
    text: 'Si perdieras la principal fuente que cubre tus costos educativos, ¿qué tan difícil sería seguir estudiando?',
    type: 'likert',
    options: [
      { text: '1 - Nada difícil', risk: 'economica', weight: 2 },
      { text: '2', risk: 'economica', weight: 2 },
      { text: '3' },
      { text: '4' },
      { text: '5 - Muy difícil' },
    ],
  },
  {
    id: 'P6',
    text: '¿Te has esforzado para terminar la educación media más de lo que esperabas?',
    type: 'yesno',
    options: [
      { text: 'Sí', risk: 'baja_preparacion', weight: 2 },
      { text: 'No' },
    ],
  },
  {
    id: 'P7',
    text: '¿Qué tan fácil te resulta hacer nuevas amistades en entornos desconocidos, como la universidad?',
    type: 'likert',
    options: [
      { text: '1 - Nada fácil', risk: 'social', weight: 2 },
      { text: '2', risk: 'social', weight: 2 },
      { text: '3', risk: 'social', weight: 2 },
      { text: '4' },
      { text: '5 - Super fácil' },
    ],
  },
  {
    id: 'P8',
    text: '¿Qué tan cómodo/a te sientes con el uso de herramientas digitales para el aprendizaje, como plataformas en línea y recursos virtuales?',
    type: 'likert',
    options: [
      { text: '1 - Nada cómodo', risk: 'tecnologica', weight: 2 },
      { text: '2', risk: 'tecnologica', weight: 2 },
      { text: '3', risk: 'tecnologica', weight: 2 },
      { text: '4' },
      { text: '5 - Muy cómodo' },
    ],
  },
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
  economica: 'Preocupación económica',
  social: 'Desconexión social',
  baja_preparacion: 'Preparación académica',
  organizacion: 'Organización del tiempo',
  tecnologica: 'Barreras tecnológicas',
  desorientacion: 'Desorientación académica',
  entorno: 'Entorno de estudio',
  emocional: 'Bienestar emocional',
};
