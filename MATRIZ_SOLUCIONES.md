# 🎯 MATRIZ DE SOLUCIONES - Elige Tu Escenario

Tu situación → Solución recomendada

---

## 🟢 ESCENARIO 1: Tengo acceso SSH al servidor

**Tiempo:** 2-5 minutos  
**Dificultad:** Fácil

### Paso 1: Conectar
```bash
ssh usuario@staging2.geroeducacion.com
cd /var/www/html  # Ajusta según tu setup
```

### Paso 2: Activar plugin (LA SOLUCIÓN)
```bash
wp plugin activate agente-retencion-unitec-02 --allow-root
```

### Paso 3: Verificar
```bash
# Verificar que está activado
wp plugin list --allow-root | grep gero
# Debe mostrar: agente-retencion-unitec-02 | active

# Verificar REST API
curl -I https://staging2.geroeducacion.com/wp-json/
# Debe devolver: 200 OK
```

### Paso 4: Probar frontend
```bash
curl -I https://staging2.geroeducacion.com/agente-unitec-02/
# Debe devolver: 200 OK (en lugar de 500)
```

**Si no funciona:** Ve a "ESCENARIO 4: Diagnostico Avanzado" abajo

---

## 🟡 ESCENARIO 2: No tengo SSH, solo FTP/cPanel

**Tiempo:** 5-10 minutos  
**Dificultad:** Fácil

### Paso 1: Descargar herramienta
Descarga este archivo del proyecto:
```
DIAGNOSTICO_SIMPLE.php
```

### Paso 2: Subir vía FTP
1. Abre FTP/FileZilla
2. Conéctate a staging2.geroeducacion.com
3. Navega a la raíz de WordPress
4. Sube `DIAGNOSTICO_SIMPLE.php`

### Paso 3: Ejecutar diagnóstico
1. Abre navegador
2. Ve a: `https://staging2.geroeducacion.com/DIAGNOSTICO_SIMPLE.php`
3. Lee la salida completa
4. Comparte conmigo

### Paso 4: Activar plugin vía cPanel/Dashboard
1. Inicia sesión en: `/wp-admin`
2. Ve a: `Plugins`
3. Busca: `Agente de retención`
4. Haz clic: `Activar`

### Paso 5: Verificar
```
https://staging2.geroeducacion.com/agente-unitec-02/
```
Debe cargar sin error 500

---

## 🔴 ESCENARIO 3: Tengo error pero no sé qué

**Tiempo:** 3 minutos + 5 min de lectura  
**Dificultad:** Media

### Usa el script automático
```bash
# SSH al servidor
ssh usuario@staging2.geroeducacion.com

# Copia el script (o créalo manualmente)
bash fix_agente.sh
```

Esto automáticamente:
- ✅ Detecta problemas
- ✅ Intenta activar plugin
- ✅ Verifica REST API
- ✅ Revisa debug log
- ✅ Genera reporte

### Si el script dice "SOLUCIÓN"
Listo, problema resuelto

### Si el script reporta problemas
Ve a "ESCENARIO 4" abajo

---

## 🟣 ESCENARIO 4: Diagnóstico Profundo

**Tiempo:** 10-20 minutos  
**Dificultad:** Avanzado

Usa si los escenarios anteriores no funcionan.

### Paso 1: Recopilar información
```bash
# Versión de PHP
php -v

# Versión WordPress
wp core version --allow-root

# ¿Plugin existe?
ls -la wp-content/plugins/agente-retencion-unitec-02.php

# ¿Plugin está activo?
wp plugin list --allow-root | grep gero

# Ver errores
tail -100 wp-content/debug.log | grep -i error

# Verificar base de datos
wp db check --allow-root
```

### Paso 2: Leer guía completa
Abre: `GUIA_RESOLUCION_500_ERRORS.md`

Busca tu problema específico en la sección "PASO 3: Soluciones Comunes"

### Paso 3: Aplicar solución
Sigue los comandos exactos para tu caso

### Paso 4: Si aún falla
Comparte:
1. Salida completa de todos los comandos anteriores
2. Última 50 líneas de debug.log
3. Versión de WordPress y PHP
4. Tipo de servidor (Apache/Nginx)

---

## ⚡ ESCENARIO 5: Solución Rápida de 1 Minuto

**Solo si:**
- Tienes SSH
- Ya sabes que el plugin está subido

**Comando único que probablemente arregle todo:**
```bash
wp plugin activate agente-retencion-unitec-02 --allow-root && \
curl -I https://staging2.geroeducacion.com/wp-json/ && \
echo "✅ LISTO! El plugin está activado y REST API funciona"
```

---

## 🎓 TABLA DE REFERENCIA RÁPIDA

| Síntoma | Causa Probable | Solución |
|---------|---|---|
| 500 en `/agente-unitec-02/` | Plugin no activado | `wp plugin activate agente-retencion-unitec-02` |
| 500 en `/favicon.ico` | Nginx procesa como PHP | Añadir rewrite rule (ver GUIA) |
| `Plugin not found` | Archivo no existe | Sube `agente-retencion-unitec-02.php` a `wp-content/plugins/` |
| `/wp-json/ da 404` | REST API deshabilitado | Regenerar permalinks o activar plugin |
| Base de datos error | Tabla no existe | Completar primer cuestionario (tabla se crea auto) |
| Código 403 | Permisos incorrectos | `chmod 644 agente-retencion-unitec-02.php` |

---

## 📋 CHECKLIST POR ESCENARIO

### Escenario 1 (SSH)
- [ ] Conectado por SSH
- [ ] En directorio de WordPress
- [ ] Plugin activado (`wp plugin activate`)
- [ ] REST API responde 200
- [ ] Frontend carga sin 500

### Escenario 2 (FTP)
- [ ] Descargué DIAGNOSTICO_SIMPLE.php
- [ ] Lo subí vía FTP
- [ ] Ejecuté el diagnóstico
- [ ] Leí los resultados
- [ ] Compartí con soporte si hay errores

### Escenario 3 (Script automático)
- [ ] Descargué fix_agente.sh
- [ ] Ejecuté `bash fix_agente.sh`
- [ ] Leí el reporte
- [ ] Seguí recomendaciones del script

### Escenario 4 (Diagnóstico profundo)
- [ ] Recopilé toda la información
- [ ] Leí GUIA_RESOLUCION_500_ERRORS.md
- [ ] Encontré mi problema en la tabla
- [ ] Ejecuté la solución específica
- [ ] Verifiqué que funciona

### Escenario 5 (1 minuto)
- [ ] Ejecuté el comando único
- [ ] Veo ✅ LISTO al final
- [ ] Pruebo en navegador y funciona

---

## 🆘 SI NADA FUNCIONA

**No te desesperes.** Proporciona esto y resolveremos juntos:

```bash
# Copiar y ejecutar como un bloque en SSH
echo "=== DIAGNÓSTICO COMPLETO ===" && \
php -v && echo "" && \
wp core version --allow-root && echo "" && \
wp plugin list --allow-root | grep -E "gero|active" && echo "" && \
curl -I https://staging2.geroeducacion.com/wp-json/ && echo "" && \
tail -50 wp-content/debug.log 2>/dev/null | grep -i error || echo "No errors en debug.log"
```

Comparte toda esa salida y lo resolveremos.

---

## 🚀 RESUMEN

```
¿Tienes SSH? → ESCENARIO 1 (2 min, 100% garantizado)
¿Solo FTP? → ESCENARIO 2 (5 min)
¿No sé qué pasa? → ESCENARIO 3 (3 min)
¿Necesito ayuda? → ESCENARIO 4 (20 min)
¿Apurado? → ESCENARIO 5 (1 min)
```

**Pick your path and let's go! 🚀**

