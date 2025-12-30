// Datos centralizados de las rutas alternativas
export interface AlternativeRoute {
  id: string;
  title: string;
  description: string;
  path: string;
}

export const alternativeRoutes: AlternativeRoute[] = [
  {
    id: 'routeB',
    title: 'Manejo Académico',
    description: 'Fortalece tus habilidades de estudio y organización académica con estrategias personalizadas.',
    path: '/routeB'
  },
  {
    id: 'routeC',
    title: 'Bienestar y Balance',
    description: 'Aprende técnicas de bienestar, manejo del estrés y balance vida-estudio.',
    path: '/routeC'
  },
  {
    id: 'routeD',
    title: 'Integración Social',
    description: 'Conecta con otros estudiantes y construye una red de apoyo en tu institución.',
    path: '/routeD'
  },
  {
    id: 'routeE',
    title: 'Desarrollo Profesional',
    description: 'Prepárate para tu futura carrera profesional con herramientas prácticas.',
    path: '/routeE'
  }
];
