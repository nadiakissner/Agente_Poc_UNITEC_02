/**
 * Storage Manager - Gestión segura de localStorage con validación de user_id
 * Previene contaminación de datos entre usuarios
 */

/**
 * Obtiene el user_id actual desde localStorage
 */
export const getCurrentUserId = (): string => {
  return localStorage.getItem("unitec_user_id") || "0";
};

/**
 * Obtiene el user_id almacenado en una clave específica
 * Retorna null si no está definido
 */
export const getStoredUserIdForKey = (key: string): string | null => {
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  
  try {
    const parsed = JSON.parse(stored);
    if (typeof parsed === 'object' && parsed !== null && parsed._userId) {
      return parsed._userId;
    }
  } catch {
    // No es JSON o no tiene estructura
  }
  
  return null;
};

/**
 * Limpia TODOS los datos de localStorage del usuario anterior cuando cambia
 * Mantiene solo datos de sistema (token, configuración global, etc.)
 */
export const cleanupOldUserData = (): void => {
  const currentUserId = getCurrentUserId();
  const keysToPreserve = [
    'unitec_user_id',
    'unitec_nombre',
    'unitec_user_email',
    'unitec_matricula',
    'unitec_carrera',
    'unitec_riesgos_principales',
    'unitec_reminder',
  ];

  const keysToDelete: string[] = [];

  // Iterar sobre todas las claves de localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    // Saltar claves del sistema
    if (keysToPreserve.includes(key)) continue;

    // Saltar claves del usuario actual
    if (key.startsWith(`user_${currentUserId}_`)) continue;

    // Marcar para eliminación (claves de usuario anterior)
    keysToDelete.push(key);
  }

  // Eliminar claves del usuario anterior
  keysToDelete.forEach(key => {
    try {
      localStorage.removeItem(key);
      console.log(`🗑️ Limpiado localStorage: ${key}`);
    } catch (e) {
      console.error(`Error eliminando ${key}:`, e);
    }
  });

  if (keysToDelete.length > 0) {
    console.log(`✅ Se eliminaron ${keysToDelete.length} claves de usuario anterior`);
  }
};

/**
 * Obtiene un item de localStorage validando que pertenezca al usuario actual
 * Si el item pertenece a otro usuario, lo elimina y retorna null
 */
export const getSafeStorageItem = (key: string): string | null => {
  const currentUserId = getCurrentUserId();
  const value = localStorage.getItem(key);
  
  if (!value) return null;

  // Si la clave contiene user_id, validar que sea del usuario actual
  if (key.includes('user_')) {
    const storedUserId = getStoredUserIdForKey(key);
    if (storedUserId && storedUserId !== currentUserId) {
      // Usuario diferente - eliminar dato
      localStorage.removeItem(key);
      console.warn(`🚨 Dato eliminado (usuario diferente): ${key}`);
      return null;
    }
  }

  return value;
};

/**
 * Limpia completamente toda la sesión del usuario actual
 * Útil al logout o cambio de usuario
 */
export const clearCurrentUserData = (): void => {
  const currentUserId = getCurrentUserId();
  const keysToDelete: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    // Preservar solo datos de sistema
    const keysToPreserve = [
      'unitec_user_id',
      'unitec_nombre',
      'unitec_user_email',
      'unitec_matricula',
      'unitec_carrera',
      'unitec_riesgos_principales',
    ];

    if (keysToPreserve.includes(key)) continue;

    // Si tiene el user_id actual o es key sin prefijo de usuario, eliminar
    if (key.startsWith(`user_${currentUserId}_`) || !key.includes('user_')) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Error eliminando ${key}:`, e);
    }
  });

  console.log(`✅ Datos del usuario ${currentUserId} limpiados`);
};

/**
 * Valida que los datos en localStorage correspondan al usuario actual
 * Se debe llamar en el useEffect de inicialización de cada página
 */
export const validateStorageIntegrity = (): void => {
  const currentUserId = getCurrentUserId();
  
  if (!currentUserId || currentUserId === "0") {
    return; // Usuario no autenticado
  }

  // Limpiar datos de usuario anterior
  cleanupOldUserData();
};
