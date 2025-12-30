# ✅ Checklist de Implementación Completa

## FASE 1: PREPARACIÓN (Pre-Implementación)

### 1.1 Verificar Requisitos Técnicos
- [ ] PHP 7.4+ instalado
- [ ] WordPress 5.0+ activo
- [ ] MySQL/MariaDB funcionando
- [ ] cURL habilitado en PHP
- [ ] Acceso a wp-config.php
- [ ] Acceso a base de datos (phpMyAdmin o MySQL CLI)

### 1.2 Obtener Credenciales
- [ ] API Key de OpenAI generada (https://platform.openai.com/api-keys)
- [ ] API Key tiene crédito disponible ($)
- [ ] Modelo gpt-4o está disponible en tu cuenta
- [ ] Email/usuario de WordPress con acceso admin

### 1.3 Documentación Recopilada
- [ ] Archivo `agente-retencion-unitec-02.php` modificado
- [ ] Script SQL de tabla (`schema_byw_agente_retencion.sql`)
- [ ] Guía de implementación práctica
- [ ] Ejemplos de código TypeScript

---

## FASE 2: CONFIGURACIÓN DE INFRAESTRUCTURA

### 2.1 Crear Tabla en Base de Datos
```bash
[ ] Conectar a MySQL/phpMyAdmin
[ ] Seleccionar base de datos de WordPress
[ ] Ejecutar script SQL:
    
    CREATE TABLE IF NOT EXISTS byw_agente_retencion (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_email VARCHAR(255) NOT NULL UNIQUE,
      prioridad_caso ENUM('alto', 'medio', 'bajo', 'pendiente') DEFAULT 'pendiente',
      justificacion JSON,
      justificacion_cuestionario LONGTEXT,
      ruta_seguida VARCHAR(100),
      fecha_cuestionario DATETIME,
      fecha_finalizacion DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX (user_email),
      INDEX (prioridad_caso)
    );

[ ] Verificar que tabla se creó correctamente
    SELECT * FROM byw_agente_retencion LIMIT 1;
```

### 2.2 Configurar API Key en WordPress
```bash
[ ] Abrir wp-config.php
[ ] Antes de "That's all, stop editing!", agregar:
    
    define( 'OPENAI_API_KEY', 'sk-your-actual-key-here' );

[ ] Guardar archivo
[ ] Verificar que el cambio se guardó:
    grep "OPENAI_API_KEY" wp-config.php
```

### 2.3 Configurar wp-cron
```bash
[ ] Verificar estado:
    wp config get DISABLE_WP_CRON
    
[ ] Si devuelve 'true', ejecutar:
    wp config set DISABLE_WP_CRON false

[ ] ALTERNATIVA: Si no tienes WP-CLI, editar wp-config.php:
    define('DISABLE_WP_CRON', false);

[ ] Agregar a crontab del servidor (cada 5 minutos):
    crontab -e
    # Agregar línea:
    */5 * * * * wget -q -O - https://tu-sitio.com/wp-cron.php?doing_wp_cron >/dev/null 2>&1
    
[ ] Guardar (Ctrl+X, Y, Enter en nano/vi)
```

---

## FASE 3: IMPLEMENTACIÓN DE BACKEND

### 3.1 Verificar que Plugin está Activo
```bash
[ ] Dashboard → Plugins → "Agente de retención UNITEC 02"
[ ] Debe mostrar estado "Activo"
[ ] O verificar con:
    wp plugin list | grep agente
```

### 3.2 Verificar que Endpoints están Registrados
```bash
[ ] Abrir terminal y probar:
    curl http://tu-sitio.local/wp-json/gero/v1/ | grep procesar
    
[ ] Debería devolver información sobre los nuevos endpoints
```

### 3.3 Revisar Código PHP Agregado
```bash
[ ] Abrir agente-retencion-unitec-02.php
[ ] Buscar "NUEVOS ENDPOINTS - CLASIFICACIÓN" (presionar Ctrl+F)
[ ] Verificar que están estas funciones:
    - agente_procesar_fin_cuestionario()
    - agente_procesar_fin_ruta()
    - agente_clasificar_riesgo_con_llm()
    - agente_determinar_prioridad()
    - Hook: gero_generar_clasificacion_cuestionario
    - Hook: gero_generar_clasificacion_ruta
```

### 3.4 Activar Debug Logging (Opcional)
```bash
[ ] Editar wp-config.php:
    define( 'WP_DEBUG', true );
    define( 'WP_DEBUG_LOG', true );
    define( 'WP_DEBUG_DISPLAY', false );

[ ] Guardar cambios
```

---

## FASE 4: IMPLEMENTACIÓN DE FRONTEND

### 4.1 En RouteA.tsx (o donde finaliza cuestionario)
```bash
[ ] Buscar la función handleDecision o similar
[ ] Antes de cambiar de paso, agregar:

    // Enviar análisis de cuestionario
    await fetch('/wp-json/gero/v1/procesar-fin-cuestionario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: parseInt(userId),
        respuestas: respuestasObj,
        riesgos: riesgosDetectados
      })
    }).catch(err => console.warn('⚠️ Análisis:', err));

[ ] Guardar archivo
```

### 4.2 En Agent.tsx (o donde finaliza ruta)
```bash
[ ] Buscar función que maneja finalización de chat
[ ] Antes de navegar a siguiente pantalla, agregar:

    // Enviar análisis de ruta
    await fetch('/wp-json/gero/v1/procesar-fin-ruta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: parseInt(userId),
        ruta: 'Agent',
        conversacion: chatHistory
      })
    }).catch(err => console.warn('⚠️ Análisis ruta:', err));

[ ] Guardar archivo
```

### 4.3 Compilar Frontend
```bash
[ ] npm run build
[ ] Copiar /dist/ a la carpeta del plugin
[ ] Verificar que archivos están en lugar correcto
```

---

## FASE 5: TESTING

### 5.1 Test 1: Procesar Cuestionario
```bash
[ ] Abrir terminal/PowerShell
[ ] Ejecutar:
    curl -X POST "http://localhost:3000/wp-json/gero/v1/procesar-fin-cuestionario" \
      -H "Content-Type: application/json" \
      -d '{"user_id": 1, "respuestas": {"P1": "test"}, "riesgos": ["desorientacion"]}'

[ ] Respuesta esperada:
    {"success": true, "message": "Cuestionario recibido..."}

[ ] ✅ Pasar a siguiente test
[ ] ❌ Si falla, revisar DEBUGGING.md
```

### 5.2 Test 2: Verificar en Base de Datos (después 5-10 seg)
```bash
[ ] phpMyAdmin o MySQL:
    SELECT * FROM byw_agente_retencion 
    WHERE user_email = 'email@usado.en.test';

[ ] Verificar que aparece con:
    - prioridad_caso = 'pendiente'
    - justificacion_cuestionario = (no vacío)
    - fecha_cuestionario = (tiempo reciente)
    - fecha_finalizacion = (NULL)

[ ] ✅ Procesar cuestionario funciona
[ ] ❌ Si no aparecen datos, revisar DEBUGGING.md → "Verificar wp-cron"
```

### 5.3 Test 3: Procesar Ruta
```bash
[ ] Ejecutar:
    curl -X POST "http://localhost:3000/wp-json/gero/v1/procesar-fin-ruta" \
      -H "Content-Type: application/json" \
      -d '{"user_id": 1, "ruta": "RouteA", "conversacion": [{"sender":"agent","message":"test"}]}'

[ ] Respuesta esperada:
    {"success": true, "message": "Ruta finalizada..."}

[ ] ✅ Pasar a siguiente test
[ ] ❌ Si falla, revisar DEBUGGING.md
```

### 5.4 Test 4: Verificar Datos Finales (después 5-10 seg)
```bash
[ ] MySQL:
    SELECT * FROM byw_agente_retencion 
    WHERE user_email = 'email@usado.en.test';

[ ] Verificar que se actualizó con:
    - prioridad_caso = 'alto' / 'medio' / 'bajo' (NO 'pendiente')
    - justificacion = JSON con "cuestionario" y "ruta"
    - ruta_seguida = 'RouteA'
    - fecha_finalizacion = (no NULL)

[ ] ✅ Flujo completo funciona
[ ] ❌ Si no se actualiza, revisar DEBUGGING.md → "Verificar OpenAI API"
```

### 5.5 Test 5: Flujo Completo en Navegador
```bash
[ ] Abrir: http://tu-sitio.local/[pagina-con-agente]

[ ] Usuario completa cuestionario:
    - Contesta todas las preguntas
    - Sistema debería indicar "Analizando respuestas..."
    - Continúa sin esperar (no se bloquea)
    - ✅ Si funciona así, está bien

[ ] Usuario finaliza ruta/chat:
    - Sistema debería indicar "Guardando análisis..."
    - Se navega a siguiente pantalla/gracias
    - No muestra errores
    - ✅ Si funciona así, está COMPLETAMENTE IMPLEMENTADO
```

---

## FASE 6: VERIFICACIÓN DE LOGS

### 6.1 Ver Logs en Tiempo Real
```bash
[ ] Terminal - Ver logs de Apache:
    tail -f /var/log/apache2/error.log | grep -E "✅|❌|⚠️"

[ ] Debería ver mensajes como:
    ✅ Clasificación de cuestionario guardada para: email@unitec.edu
    ✅ Clasificación de ruta guardada para: email@unitec.edu - Prioridad: alto

[ ] Si ves ❌ o ⚠️, seguir instrucciones en DEBUG_Y_TROUBLESHOOTING.md
```

### 6.2 Verificar WordPress Debug Log
```bash
[ ] Terminal:
    tail -f /wp-content/debug.log

[ ] Debería estar limpio (sin errores de PHP)
[ ] Si hay errores, revisar DEBUGGING.md
```

---

## FASE 7: VALIDACIÓN FINAL

### 7.1 Checklist de Funcionalidad
- [ ] Usuarios pueden completar cuestionario sin errores
- [ ] Usuarios pueden completar ruta/chat sin errores
- [ ] Datos se guardan en `byw_agente_retencion`
- [ ] `prioridad_caso` se asigna correctamente
- [ ] `justificacion` contiene análisis de ambas etapas
- [ ] No hay errores en console del navegador (F12)
- [ ] No hay errores en logs de servidor

### 7.2 Verificar Seguridad
- [ ] API Key NO aparece en logs públicos
- [ ] API Key NO aparece en respuestas JSON
- [ ] Código usa prepared statements ($wpdb->prepare())
- [ ] Validación de inputs (user_id es integer, etc)
- [ ] Try-catch blocks en funciones críticas

### 7.3 Verificar Performance
```bash
[ ] Tiempo de respuesta inmediata del endpoint < 500ms
[ ] Análisis en background toma 2-5 segundos
[ ] Usuario NO ve delays mientras completa cuestionario
[ ] Usuario NO ve delays mientras usa chat
[ ] Base de datos no se ralentiza (ver DEBUGGING.md → Performance)
```

---

## FASE 8: DOCUMENTACIÓN Y MANTENIMIENTO

### 8.1 Documentar Cambios Realizados
```bash
[ ] Crear un archivo CAMBIOS_IMPLEMENTACION.txt:
    - Fecha de implementación
    - Qué endpoints se agregaron
    - Qué tabla se creó
    - En qué archivos se hicieron cambios en frontend
    - Quién lo implementó
    - Estado actual
```

### 8.2 Crear Rutina de Monitoreo
```bash
[ ] Configurar cron job para revisar:
    - Casos con prioridad 'alto' diariamente
    - Casos incompletos (>7 días sin finalizar)
    - Errores en logs de OpenAI

Ejemplo:
    0 9 * * * mysql -u user -p"pass" database -e "SELECT COUNT(*) FROM byw_agente_retencion WHERE prioridad_caso = 'alto' AND DATE(fecha_finalizacion) = CURDATE();" | mail -s "Casos Altos Detectados" admin@unitec.edu
```

### 8.3 Plan de Backup
```bash
[ ] Realizar backup de tabla antes de cambios mayores:
    
    mysqldump -u user -p database byw_agente_retencion > byw_agente_retencion_backup.sql
```

---

## FASE 9: CAPACITACIÓN DEL EQUIPO

### 9.1 Documentar para Administradores
```bash
[ ] Crear guía: "Cómo revisar clasificaciones de riesgos"
    - Dónde encontrar datos en la BD
    - Cómo interpretar prioridades
    - Acciones sugeridas por prioridad
```

### 9.2 Documentar para Desarrolladores
```bash
[ ] Crear guía: "Cómo mantener y extender el sistema"
    - Cómo cambiar modelos de OpenAI
    - Cómo ajustar lógica de prioridades
    - Cómo agregar nuevos campos a clasificación
```

### 9.3 Compartir Documentación
```bash
[ ] README actualizado en repositorio
[ ] Comentarios en código explicando lógica
[ ] Archivo TROUBLESHOOTING accesible
[ ] Ejemplos de consultas SQL útiles
```

---

## 🎯 Resumen de Puntos Críticos

### Si algo NO funciona, revisar EN ORDEN:

1. **❌ Endpoint retorna 404**
   → Plugin no está activo: `wp plugin activate agente-retencion-unitec-02`

2. **❌ Error: "API key no configurada"**
   → Agregar en wp-config.php: `define('OPENAI_API_KEY', 'sk-...')`

3. **❌ Datos no aparecen en tabla**
   → wp-cron no se ejecutó: `wp config set DISABLE_WP_CRON false`

4. **❌ OpenAI devuelve error**
   → Verificar crédito y límites en platform.openai.com

5. **❌ JSON inválido en respuesta**
   → Verificar formato del prompt de OpenAI en función PHP

6. **❌ Tabla no existe**
   → Ejecutar script SQL: `CREATE TABLE IF NOT EXISTS...`

---

## ✅ Criterios de Éxito

✅ Usuario completa cuestionario → Se calcula prioridad inicial  
✅ Usuario completa ruta → Se calcula prioridad final  
✅ Análisis guardado en BD silenciosamente  
✅ No hay errores visibles en frontend  
✅ Logs muestran "✅ Clasificación guardada"  
✅ Datos se pueden consultar y reportar  
✅ Sistema es mantenible y extensible  

---

## 📞 Soporte

Si después de seguir todo esto aún hay problemas:

1. **Recolectar:**
   - Output de: `wp plugin list`
   - Últimas 50 líneas de: `tail -50 /var/log/apache2/error.log`
   - Resultado de: `SELECT * FROM byw_agente_retencion LIMIT 1;`
   - Versión PHP: `php -v`
   - Versión WP: `wp core version`

2. **Consultar:**
   - DEBUG_Y_TROUBLESHOOTING.md
   - GUIA_IMPLEMENTACION_PRACCTICA.md
   - EJEMPLOS_INTEGRACION_CODIGO.ts

3. **Contactar:**
   - Al desarrollador del plugin
   - Al equipo DevOps
   - Al administrador de WordPress
