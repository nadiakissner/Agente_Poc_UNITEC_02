// Datos de carreras con sus códigos RIASEC
export const carrerasRiasec = [
  { nombre: "Ingeniería Biomédica", riasec: "IRS" },
  { nombre: "Ingeniería en Biotecnología", riasec: "IRC" },
  { nombre: "Licenciatura en Biología", riasec: "IR" },
  { nombre: "Licenciatura en Cirujano Dentista", riasec: "RI" },
  { nombre: "Licenciatura en Cultura Física y Deportes", riasec: "RSE" },
  { nombre: "Licenciatura en Enfermería", riasec: "SRC" },
  { nombre: "Licenciatura en Enfermería Modalidad Mixta (Ejecutiva)", riasec: "SRC" },
  { nombre: "Licenciatura en Fisioterapia", riasec: "SR" },
  { nombre: "Licenciatura en Medicina", riasec: "ISR" },
  { nombre: "Licenciatura en Medicina Veterinaria y Zootecnia", riasec: "RIS" },
  { nombre: "Licenciatura en Nutrición", riasec: "SIC" },
  { nombre: "Licenciatura en Psicología", riasec: "SI" },
  { nombre: "Licenciatura en Químico Farmacéutico Biólogo", riasec: "ICR" },
  { nombre: "Licenciatura en Ciencias de la Comunicación", riasec: "ASE" },
  { nombre: "Licenciatura en Criminología", riasec: "ISC" },
  { nombre: "Licenciatura en Derecho", riasec: "SEC" },
  { nombre: "Licenciatura en Educación", riasec: "SE" },
  { nombre: "Licenciatura en Filosofía", riasec: "IS" },
  { nombre: "Licenciatura en Historia", riasec: "ICS" },
  { nombre: "Licenciatura en Lengua y Literatura Hispánica", riasec: "AIS" },
  { nombre: "Licenciatura en Lenguas Extranjeras", riasec: "AIS" },
  { nombre: "Licenciatura en Pedagogía", riasec: "SC" },
  { nombre: "Licenciatura en Relaciones Internacionales", riasec: "ESI" },
  { nombre: "Licenciatura en Seguridad Pública", riasec: "RES" },
  { nombre: "Licenciatura en Sociología", riasec: "IS" },
  { nombre: "Licenciatura en Arquitectura", riasec: "AR" },
  { nombre: "Licenciatura en Diseño de Interiores", riasec: "ARE" },
  { nombre: "Licenciatura en Diseño de Modas", riasec: "AES" },
  { nombre: "Licenciatura en Diseño Gráfico y Comunicación Visual", riasec: "AE" },
  { nombre: "Licenciatura en Diseño Industrial", riasec: "ARI" },
  { nombre: "Licenciatura en Diseño, Animación y Arte Digital", riasec: "AR" },
  { nombre: "Licenciatura en Actuaría", riasec: "CRI" },
  { nombre: "Licenciatura en Administración de Empresas", riasec: "ECS" },
  { nombre: "Licenciatura en Administración de Empresas de Entretenimiento y Comunicación", riasec: "ESA" },
  { nombre: "Licenciatura en Administración de Empresas Turísticas", riasec: "ESC" },
  { nombre: "Licenciatura en Administración de Recursos Humanos", riasec: "SEC" },
  { nombre: "Licenciatura en Administración Financiera", riasec: "CE" },
  { nombre: "Licenciatura en Administración Pública", riasec: "SEC" },
  { nombre: "Licenciatura en Comercio Internacional", riasec: "EC" },
  { nombre: "Licenciatura en Comunicación y Medios", riasec: "AES" },
  { nombre: "Licenciatura en Contaduría Pública", riasec: "CE" },
  { nombre: "Licenciatura en Contaduría Pública y Finanzas", riasec: "CE" },
  { nombre: "Licenciatura en Economía", riasec: "ICE" },
  { nombre: "Licenciatura en Economía y Finanzas", riasec: "CEI" },
  { nombre: "Licenciatura en Finanzas", riasec: "CEI" },
  { nombre: "Licenciatura en Gestión de Ventas y Comercialización", riasec: "ESC" },
  { nombre: "Licenciatura en Mercadotecnia", riasec: "ESA" },
  { nombre: "Licenciatura en Mercadotecnia Digital y Publicidad", riasec: "AES" },
  { nombre: "Licenciatura en Negocios Internacionales", riasec: "ESC" },
  { nombre: "Licenciatura en Publicidad y Medios", riasec: "AES" },
  { nombre: "Ingeniería Ambiental y Energías Renovables", riasec: "IRS" },
  { nombre: "Ingeniería Civil", riasec: "RIC" },
  { nombre: "Ingeniería en Ciencia de Datos", riasec: "ICR" },
  { nombre: "Ingeniería en Electrónica", riasec: "RIC" },
  { nombre: "Ingeniería en Electrónica y Telecomunicaciones", riasec: "RIC" },
  { nombre: "Ingeniería en Gestión de Negocios", riasec: "ECI" },
  { nombre: "Ingeniería en Logística", riasec: "CIR" },
  { nombre: "Ingeniería en Robótica y Sistemas Digitales", riasec: "RIC" },
  { nombre: "Ingeniería en Sistemas Computacionales", riasec: "IRC" },
  { nombre: "Ingeniería en Sistemas de Software", riasec: "IRC" },
  { nombre: "Ingeniería en Videojuegos", riasec: "AIR" },
  { nombre: "Ingeniería Industrial y Administración", riasec: "RCE" },
  { nombre: "Ingeniería Industrial y de Sistemas", riasec: "RCI" },
  { nombre: "Ingeniería Mecatrónica", riasec: "RIC" },
  { nombre: "Ingeniería Mecánica", riasec: "RI" },
  { nombre: "Ingeniería Química", riasec: "IRC" },
  { nombre: "Licenciatura en Física Aplicada", riasec: "IRC" },
  { nombre: "Licenciatura en Ingeniería en Tecnologías de la Información", riasec: "IRC" },
  { nombre: "Licenciatura en Administración Turística y Reuniones Internacionales", riasec: "ESC" },
  { nombre: "Licenciatura en Gastronomía", riasec: "RAS" },
];

// Función para obtener RIASEC de una carrera (búsqueda flexible)
export const obtenerRiasecCarrera = (nombreCarrera: string): string | null => {
  if (!nombreCarrera || nombreCarrera.trim() === "") {
    console.warn("❌ obtenerRiasecCarrera: nombreCarrera vacío o inválido");
    return null;
  }
  
  const carreraLower = nombreCarrera.toLowerCase().trim();
  console.log("🔍 Buscando carrera:", carreraLower);
  console.log("📋 Total de carreras en BD:", carrerasRiasec.length);
  
  // Primero intentar coincidencia exacta
  let carrera = carrerasRiasec.find(
    c => c.nombre.toLowerCase() === carreraLower
  );
  
  if (carrera) {
    console.log("✅ EXACTA encontrada:", carrera.nombre, "→", carrera.riasec);
    return carrera.riasec;
  }
  
  console.log("⚠️ No hay exacta, buscando PARCIAL...");
  
  // Si no hay coincidencia exacta, buscar por contiene (parcial)
  if (!carrera) {
    carrera = carrerasRiasec.find(
      c => c.nombre.toLowerCase().includes(carreraLower) || 
           carreraLower.includes(c.nombre.toLowerCase())
    );
  }
  
  if (carrera) {
    console.log("✅ PARCIAL encontrada:", carrera.nombre, "→", carrera.riasec);
    return carrera.riasec;
  }
  
  console.error("❌ NO ENCONTRADA. Buscando:", nombreCarrera);
  console.log("📋 Primeras 10 carreras en BD:");
  carrerasRiasec.slice(0, 10).forEach(c => {
    console.log(`   • "${c.nombre}"`);
  });
  
  return null;
};

// Función para verificar si el resultado RIASEC del usuario contiene todas las letras de su carrera
export const verificarAlineacionRiasec = (
  resultadoUsuario: string,
  riasecCarrera: string
): { alineado: boolean; faltantes: string[] } => {
  const faltantes: string[] = [];
  
  for (const letra of riasecCarrera) {
    if (!resultadoUsuario.includes(letra)) {
      faltantes.push(letra);
    }
  }
  
  return {
    alineado: faltantes.length === 0,
    faltantes
  };
};
