# 🗄️ Guía: Ejecutar Migración SQL - Paso a Paso

**Tiempo estimado:** 5-10 minutos  
**Riesgo:** BAJO (con backup)  
**Complejidad:** FÁCIL  

---

## ⚠️ ANTES DE EMPEZAR

### 1️⃣ Hacer Backup (OBLIGATORIO)

**Opción A: En phpMyAdmin (Recomendado)**
1. Acceder a SiteGround → cPanel → phpMyAdmin
2. Seleccionar base de datos (ej: `unitec_db`)
3. Clic en tabla `byw_agente_retencion`
4. Clic en **"Export"** (arriba)
5. Guardar archivo SQL en tu computadora con nombre: `backup_byw_agente_retencion_2025-12-29.sql`

**Opción B: Desde terminal SSH**
```bash
# Conectarse al servidor
ssh usuario@tuservidor.com

# Hacer backup
mysqldump -u usuario -p unitec_db byw_agente_retencion > backup_byw_agente_retencion_2025-12-29.sql

# Descargar el archivo a tu PC
# (usa SFTP o WinSCP)
```

**Opción C: SQL en phpMyAdmin (Rápido)**
```sql
-- Crear tabla de respaldo
CREATE TABLE byw_agente_retencion_backup_20251229 AS 
SELECT * FROM byw_agente_retencion;

-- Verificar que se creó
SELECT COUNT(*) FROM byw_agente_retencion_backup_20251229;
-- Debe mostrar el mismo número de filas que la original
```

---

## 🔧 EJECUTAR MIGRACIÓN

### Opción 1: phpMyAdmin (MÁS FÁCIL)

**Paso 1:** Ir a SiteGround cPanel → phpMyAdmin

**Paso 2:** Seleccionar base de datos
- Click en tu base de datos (ej: `unitec_db`)

**Paso 3:** Seleccionar tabla
- Click en `byw_agente_retencion`

**Paso 4:** Ir a pestaña "SQL"

**Paso 5:** Pegar y ejecutar SQL:

```sql
-- Modificar la columna justificacion a JSON
ALTER TABLE byw_agente_retencion 
MODIFY COLUMN justificacion JSON DEFAULT NULL;
```

**Paso 6:** Click en botón **"Go"** o **"Execute"**

**Resultado esperado:**
```
Query successful. (Modificó 1 tabla)
```

---

### Opción 2: Terminal SSH (AVANZADO)

```bash
# Conectarse al servidor
ssh usuario@tudominio.com

# Acceder a MySQL
mysql -u usuario -p

# Cuando pida contraseña, escribirla (no se verá)

# Seleccionar base de datos
USE unitec_db;

# Ejecutar migración
ALTER TABLE byw_agente_retencion 
MODIFY COLUMN justificacion JSON DEFAULT NULL;

# Verificar (debería mostrar json)
DESCRIBE byw_agente_retencion;

# Salir
EXIT;
```

---

### Opción 3: Actualizar datos existentes (RECOMENDADO)

Si tienes datos antiguos en `justificacion` y quieres preservarlos:

```sql
-- PRIMERO: Hacer backup (ver arriba)

-- PASO 1: Modificar columna
ALTER TABLE byw_agente_retencion 
MODIFY COLUMN justificacion JSON DEFAULT NULL;

-- PASO 2: Convertir datos existentes a JSON
UPDATE byw_agente_retencion 
SET justificacion = JSON_OBJECT('legado', justificacion)
WHERE justificacion IS NOT NULL 
  AND justificacion != ''
  AND JSON_TYPE(justificacion) IS NULL;

-- PASO 3: Verificar que funciona
SELECT user_email, justificacion, prioridad_caso
FROM byw_agente_retencion
LIMIT 5\G

-- PASO 4: Si todo está bien, ya está hecho
```

**Explicación:**
- `JSON_OBJECT('legado', justificacion)` convierte texto a JSON
- `WHERE JSON_TYPE(justificacion) IS NULL` solo afecta texto, no JSON ya existente
- El resto de usuarios nuevos usarán la nueva estructura automáticamente

---

## ✅ VERIFICAR QUE FUNCIONÓ

### En phpMyAdmin:

**1. Mostrar estructura de tabla**
```sql
DESCRIBE byw_agente_retencion;
```

**Deberías ver:**
```
Field           | Type      | Null | Key | Default | Extra
...
justificacion   | json      | YES  |     | NULL    |
prioridad_caso  | varchar   | YES  |     | NULL    |
...
```

**2. Ver datos existentes**
```sql
SELECT user_email, justificacion, prioridad_caso
FROM byw_agente_retencion
WHERE justificacion IS NOT NULL
LIMIT 5\G
```

**Deberías ver:**
```
user_email: estudiante@example.com
justificacion: {"legado": "Texto anterior..."}
prioridad_caso: bajo
```

**3. Verificar estructura de nuevo JSON**
```sql
-- Esto funciona después de que el sistema guarde nuevos datos
SELECT JSON_KEYS(justificacion)
FROM byw_agente_retencion
WHERE justificacion IS NOT NULL
LIMIT 1;

-- Deberías ver:
-- ["cuestionario", "respuesta_cuestionario", "ruta_routea_completada"]
```

---

## 🧪 TEST: Generar Datos de Prueba

Después de la migración, prueba que el sistema guarda correctamente:

### 1. En la app:
- Acceder como un usuario de prueba
- Responder el cuestionario completo
- Seleccionar una ruta

### 2. En phpMyAdmin:
```sql
-- Ver los nuevos datos guardados
SELECT user_email, 
       JSON_PRETTY(justificacion) as justificacion_pretty,
       prioridad_caso
FROM byw_agente_retencion
ORDER BY ID DESC
LIMIT 1\G
```

**Deberías ver algo como:**
```
user_email: prueba@unitec.edu.mx
justificacion_pretty: {
  "cuestionario": [
    {
      "timestamp": "2025-12-29 10:15:30",
      "texto": "Respuesta crítica detectada"
    }
  ],
  "respuesta_cuestionario": [
    {
      "timestamp": "2025-12-29 10:16:00",
      "texto": "Respuesta: Tengo muchas dudas..."
    },
    ...
  ]
}
prioridad_caso: alto
```

---

## 🚨 SI ALGO SALIÓ MAL

### Error: "Column 'justificacion' doesn't exist"
```sql
-- Verificar que la tabla existe
SHOW TABLES LIKE 'byw_agente_retencion';

-- Si existe, verificar columnas
DESCRIBE byw_agente_retencion;
```

### Error: "Out of range value"
```sql
-- Verificar datos existentes
SELECT LENGTH(justificacion) as tam, justificacion
FROM byw_agente_retencion
ORDER BY tam DESC
LIMIT 5;

-- Si alguno es > 5000 caracteres, reducir:
UPDATE byw_agente_retencion
SET justificacion = SUBSTRING(justificacion, 1, 500)
WHERE LENGTH(justificacion) > 500;
```

### Rollback Completo:
```sql
-- Restaurar desde backup
DROP TABLE byw_agente_retencion;
RENAME TABLE byw_agente_retencion_backup TO byw_agente_retencion;

-- Verificar
SELECT COUNT(*) FROM byw_agente_retencion;
```

---

## 📊 Performance y Consideraciones

### Tamaño de la base de datos
- **Antes:** `justificacion` VARCHAR(500) = máx 500 bytes
- **Después:** `justificacion` JSON = sin límite teórico
- **En la práctica:** Esperado ~1-5 KB por usuario (historial completo)

### Índices (Opcional, si tienes muchos datos)
```sql
-- Si la tabla tiene > 10,000 registros, considera índices
ALTER TABLE byw_agente_retencion 
ADD INDEX idx_user_email (user_email),
ADD INDEX idx_prioridad_caso (prioridad_caso);

-- Ver índices creados
SHOW INDEXES FROM byw_agente_retencion;
```

### Queries comunes después de migración
```sql
-- Buscar todos los casos CRÍTICOS
SELECT user_email, justificacion
FROM byw_agente_retencion
WHERE prioridad_caso = 'critico';

-- Buscar casos que mencionan "crisis"
SELECT user_email, prioridad_caso
FROM byw_agente_retencion
WHERE JSON_SEARCH(justificacion, 'one', '%crisis%') IS NOT NULL;

-- Contar por prioridad
SELECT prioridad_caso, COUNT(*) as cantidad
FROM byw_agente_retencion
GROUP BY prioridad_caso;
```

---

## 📋 Checklist de Migración

### Antes:
- [ ] Hacer backup
- [ ] Verificar que el backup se guardó
- [ ] Tener acceso a phpMyAdmin o SSH
- [ ] Leer este documento completamente

### Durante:
- [ ] Ejecutar SQL de modificación
- [ ] Ver mensaje "Query successful"
- [ ] Verificar DESCRIBE resultado

### Después:
- [ ] Ejecutar verificación DESCRIBE
- [ ] Ver que justificacion es JSON
- [ ] Probar la app con usuario de prueba
- [ ] Verificar que se guardan nuevos datos

### Validación Final:
- [ ] Nueva respuesta genera JSON con timestamp
- [ ] prioridad_caso se actualiza automáticamente
- [ ] El sistema detecta crisis correctamente
- [ ] No hay errores en error_log de WordPress

---

## 🎯 Tiempo Estimado

| Tarea | Tiempo |
|-------|--------|
| Hacer backup | 1-2 min |
| Ejecutar ALTER TABLE | <1 min |
| Verificar estructura | 1-2 min |
| Probar con usuario de prueba | 2-3 min |
| **TOTAL** | **5-10 min** |

---

## 📞 Soporte

### Si necesitas ayuda:

**Error "Access Denied":**
- Verifica usuario y contraseña de MySQL
- Asegúrate de tener permisos en esa base de datos

**No aparecen los datos nuevos:**
- Revisa que la app está usando el usuario correcto (user_id)
- Verifica los logs de WordPress: `/wp-content/debug.log`
- Prueba hacer POST manual al endpoint:
  ```bash
  curl -X POST http://localhost/wp-json/gero/v1/guardar-interacciones \
    -H "Content-Type: application/json" \
    -d '{"user_id":1,"tipo":"test","contenido":{},"riesgo_detectado":{}}'
  ```

**La columna no cambia a JSON:**
- Asegúrate que no hay conexiones activas a la base de datos
- Intenta con SQL diferente: `MODIFY COLUMN justificacion LONGTEXT`
- Verifica la versión de MySQL (JSON está disponible en 5.7+)

---

## 🎓 Documentación Relacionada

1. [RESUMEN_JUSTIFICACIONES.md](RESUMEN_JUSTIFICACIONES.md) - Resumen ejecutivo
2. [RESUMEN_JUSTIFICACIONES_TECH.md](RESUMEN_JUSTIFICACIONES_TECH.md) - Documentación técnica
3. [MAPA_CAMBIOS.md](MAPA_CAMBIOS.md) - Dónde se hicieron los cambios

---

**¡Listo! Una vez completada la migración, el sistema estará completamente funcional.**
