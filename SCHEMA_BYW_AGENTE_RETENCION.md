-- ========================================
-- 🔹 TABLA PARA CLASIFICACIÓN DE RIESGOS
-- ========================================

-- Estructura REAL de la tabla byw_agente_retencion (ya existe en BD)
-- NOTA: Esta tabla YA existe con esta estructura. Este archivo es solo referencia.
-- NO ejecutar CREATE TABLE. La tabla ya está en la base de datos.

CREATE TABLE IF NOT EXISTS byw_agente_retencion (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  user_email VARCHAR(255) NOT NULL UNIQUE,
  riesgo_detectado JSON COMMENT 'Array de riesgos detectados del cuestionario',
  prioridad_caso ENUM('alto', 'medio', 'bajo', 'pendiente') DEFAULT 'pendiente' COMMENT 'Prioridad asignada por LLM',
  justificacion JSON COMMENT 'Justificación de la clasificación (cuestionario + ruta)',
  ultima_actividad TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última actualización'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tabla para almacenar clasificación de riesgos de estudiantes mediante LLM';

-- ========================================
-- 📊 CONSULTAS ÚTILES (para análisis)
-- ========================================

-- Ver todos los casos clasificados, ordenados por prioridad
SELECT 
  ID,
  user_email,
  prioridad_caso,
  riesgo_detectado,
  justificacion,
  ultima_actividad
FROM byw_agente_retencion
ORDER BY 
  CASE prioridad_caso
    WHEN 'alto' THEN 1
    WHEN 'medio' THEN 2
    WHEN 'bajo' THEN 3
    ELSE 4
  END,
  ultima_actividad DESC;

-- Contar casos por prioridad
SELECT 
  prioridad_caso,
  COUNT(*) as total
FROM byw_agente_retencion
GROUP BY prioridad_caso
ORDER BY total DESC;

-- Ver casos de alta prioridad
SELECT 
  user_email,
  prioridad_caso,
  justificacion,
  ultima_actividad
FROM byw_agente_retencion
WHERE prioridad_caso = 'alto'
ORDER BY ultima_actividad DESC
LIMIT 20;

-- Ver riesgos detectados para un usuario
SELECT 
  user_email,
  riesgo_detectado,
  prioridad_caso,
  justificacion,
  ultima_actividad
FROM byw_agente_retencion
WHERE user_email = 'usuario@example.com';

-- Exportar para análisis (CSV)
SELECT 
  user_email,
  prioridad_caso,
  riesgo_detectado,
  DATE_FORMAT(ultima_actividad, '%Y-%m-%d %H:%i') as fecha_actualizacion
FROM byw_agente_retencion
ORDER BY ultima_actividad DESC
INTO OUTFILE '/tmp/clasificaciones_riesgos.csv'
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n';

-- ========================================
-- 🧹 MANTENIMIENTO (si es necesario)
-- ========================================

-- Limpiar registros (backups antes de ejecutar)
-- DELETE FROM byw_agente_retencion WHERE user_id = 123;

-- Actualizar índices después de cambios masivos
ANALYZE TABLE byw_agente_retencion;
OPTIMIZE TABLE byw_agente_retencion;

-- Ver tamaño de la tabla
SELECT 
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name = 'byw_agente_retencion';

-- Ver índices actuales
SHOW INDEX FROM byw_agente_retencion;

-- ========================================
-- 🔄 POSIBLES MEJORAS (comentado)
-- ========================================

-- Si necesitas agregar índices para búsquedas más rápidas:
-- ALTER TABLE byw_agente_retencion 
-- ADD INDEX idx_prioridad_fecha (prioridad_caso, ultima_actividad);

-- Si necesitas agregar columnas adicionales:
-- ALTER TABLE byw_agente_retencion 
-- ADD COLUMN observaciones_consultor TEXT AFTER justificacion;

-- Backup de la tabla antes de cambios:
-- mysqldump -u user -p database byw_agente_retencion > byw_agente_retencion_backup.sql
