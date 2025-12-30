# ⚠️ IMPORTANTE: Estructura de la Tabla `byw_agente_retencion`

## Situación Actual

La tabla **`byw_agente_retencion` ya existe** en tu base de datos con la siguiente estructura:

```sql
ID              INT (primary key)
user_id         INT
user_email      VARCHAR(255)
riesgo_detectado JSON
prioridad_caso  ENUM('alto', 'medio', 'bajo', 'pendiente')
justificacion   JSON
ultima_actividad TIMESTAMP
```

## Archivo SQL

El archivo `schema_byw_agente_interaccion.sql` **NO se ejecuta automáticamente**. Es solo un archivo de referencia/documentación.

✅ **NO necesitas ejecutar ese archivo** porque la tabla ya existe.

## Cambios Realizados en el Código

El código PHP (`agente-retencion-unitec-02.php`) ha sido actualizado para:

1. ✅ Usar solo las columnas que realmente existen
2. ✅ Cambiar `id` por `ID` (mayúsculas)
3. ✅ Usar `justificacion` (JSON) en lugar de `justificacion_cuestionario`
4. ✅ Cambiar `user_id_habilitados` por `user_id`
5. ✅ Eliminar referencias a columnas que no existen:
   - ❌ `respuestas_json`
   - ❌ `puntuaciones_json`
   - ❌ `riesgo_principal`
   - ❌ `fecha_cuestionario`
   - ❌ `fecha_finalizacion`
   - ❌ `ruta_seguida`
   - ❌ `created_at`
   - ❌ `updated_at`

## Cómo Funciona `justificacion` (JSON)

La columna `justificacion` almacena un JSON con estructura:

```json
{
  "cuestionario": "Análisis del cuestionario...",
  "ruta": "Análisis de la ruta completada..."
}
```

Cuando el usuario:
1. **Completa cuestionario**: Se guarda `justificacion: { "cuestionario": "..." }`
2. **Completa ruta**: Se actualiza `justificacion: { "cuestionario": "...", "ruta": "..." }`

## Resumiendo

- ✅ Tabla existe con estructura correcta
- ✅ Código PHP ya está actualizado
- ✅ Archivo SQL es solo referencia (no ejecutar)
- ✅ `ultima_actividad` se actualiza automáticamente

**Todo está listo para usar sin cambios en la BD.**
