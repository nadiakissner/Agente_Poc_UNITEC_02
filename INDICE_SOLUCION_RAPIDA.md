# 🚀 ÍNDICE RÁPIDO - Solución 500 Errors

**Proyecto:** Agente de Retención UNITEC 02  
**Estado:** Frontend ✅ | Backend ⚠️ (necesita activación)  
**Fecha:** 2024

---

## 📌 PROBLEMA

```
HTTP 500 errors en staging:
• GET /agente-unitec-02/ → 500
• GET /favicon.ico → 500
```

---

## ⚡ SOLUCIÓN RÁPIDA (5 MINUTOS)

```bash
# 1. SSH al servidor
ssh usuario@staging2.geroeducacion.com
cd /var/www/html  # (o donde esté WordPress)

# 2. Activar el plugin
wp plugin activate agente-retencion-unitec-02 --allow-root

# 3. Verificar que funciona
curl -I https://staging2.geroeducacion.com/wp-json/

# 4. Listo
```

**Si no funciona:** Sigue la guía paso a paso abajo ↓

---

## 📚 DOCUMENTOS POR CASO

### 🟢 "Tengo acceso SSH al servidor"
**Lee:** [`GUIA_RESOLUCION_500_ERRORS.md`](GUIA_RESOLUCION_500_ERRORS.md)
- Diagnóstico completo
- Soluciones paso a paso
- Troubleshooting avanzado

### 🟡 "No tengo SSH, solo FTP/cPanel"
**Pasos:**
1. Descarga el archivo: `DIAGNOSTICO_SIMPLE.php`
2. Sube a raíz de WordPress vía FTP
3. Abre en navegador: `https://tu-dominio.com/DIAGNOSTICO_SIMPLE.php`
4. Copia la salida y comparte conmigo

### 🔴 "Necesito script automático"
**Usa:** [`fix_agente.sh`](fix_agente.sh)
```bash
bash fix_agente.sh
```
- Detecta problemas automáticamente
- Intenta reparar
- Genera reporte

---

## 📋 ARCHIVOS INCLUIDOS

| Archivo | Propósito | Cuándo usarlo |
|---------|-----------|---------------|
| **GUIA_RESOLUCION_500_ERRORS.md** | Guía completa de solución | SSH disponible |
| **CHECKLIST_DEPLOYMENT.md** | Checklist de deployment | Antes de desplegar |
| **RESUMEN_ESTADO_ACTUAL.md** | Estado del proyecto | Visión general |
| **DIAGNOSTICO_SIMPLE.php** | Script sin WordPress | Sin SSH / FTP only |
| **DIAGNOSTICO.php** | Script con WordPress | Diagnóstico profundo |
| **fix_agente.sh** | Script automático | Reparación rápida |
| **validate_php.py** | Validador PHP | Ya ejecutado ✓ |

---

## 🎯 DIAGNÓSTICO EN 3 PASOS

### Paso 1: ¿Existe el archivo?
```bash
ls -la wp-content/plugins/agente-retencion-unitec-02.php
# Debería existir y tener ~61 KB
```

### Paso 2: ¿Está activado?
```bash
wp plugin list --allow-root | grep gero
# Debería mostrar: agente-retencion-unitec-02 | active
```

### Paso 3: ¿REST API funciona?
```bash
curl -I https://staging2.geroeducacion.com/wp-json/
# Debería devolver: 200 OK
```

**Si los 3 dan ✓, problema resuelto. Si no, sigue GUIA_RESOLUCION_500_ERRORS.md**

---

## ✅ VERIFICACIÓN FINAL

Cuando esté online, prueba:

```bash
# 1. Frontend carga
curl -I https://staging2.geroeducacion.com/agente-unitec-02/
# Esperado: 200

# 2. Favicon carga
curl -I https://staging2.geroeducacion.com/favicon.svg
# Esperado: 200

# 3. API funciona
curl -X POST https://staging2.geroeducacion.com/wp-json/gero/v1/guardar-conversation-state \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "conversation_state": "test"}'
# Esperado: 200 + {"success": true}
```

---

## 🔧 CHECKLIST RÁPIDO

- [ ] Plugin existe: `wp-content/plugins/agente-retencion-unitec-02.php`
- [ ] Plugin está ACTIVADO
- [ ] REST API devuelve 200: `/wp-json/`
- [ ] No hay errores en: `wp-content/debug.log`
- [ ] Permisos correctos: 644 para archivos, 755 para directorios
- [ ] Frontend subido a `/agente-unitec-02/`
- [ ] favicon.svg existe y se sirve correctamente

---

## 💡 CAUSAS MÁS COMUNES

| Error | Causa | Solución |
|-------|-------|----------|
| 500 en `/agente-unitec-02/` | Plugin no activado | `wp plugin activate agente-retencion-unitec-02` |
| 500 en `/favicon.ico` | Nginx intenta procesar como PHP | Añadir rewrite rule (ver guía) |
| REST API 404 | WordPress no lo detecta | Regenerar permalinks |
| Tabla no existe | Primera ejecución aún no pasó | Completar primer cuestionario |

---

## 🚀 SIGUIENTES PASOS

**1. Hoy:**
- [ ] Leer GUIA_RESOLUCION_500_ERRORS.md
- [ ] Activar plugin en WordPress
- [ ] Verificar REST API

**2. Mañana:**
- [ ] Probar flujo completo
- [ ] Verificar crisis detection
- [ ] Validar mobile responsive

**3. Semana que viene:**
- [ ] Load testing
- [ ] Integración con otros sistemas
- [ ] Documentación para usuarios finales

---

## 📞 SOPORTE

Si tienes dudas, proporciona:

1. **Error exacto** (captura de pantalla)
2. **Salida de diagnóstico:**
   ```bash
   tail -100 wp-content/debug.log
   wp plugin list --allow-root
   php -v
   wp --info --allow-root
   ```
3. **URL del servidor**
4. **Acceso (SSH, FTP, cPanel)**

---

## 📊 ESTADO ACTUAL

```
Frontend:      ████████████████████ 100% ✅
Backend:       ████████████████░░░░  80% (plugin listo, falta activar)
Deployment:    ███████░░░░░░░░░░░░░░  35% (archivos listos, falta subir)
Testing:       ██░░░░░░░░░░░░░░░░░░░  10% (falta server online)

ETA COMPLETAR: 1-2 horas con ejecución de pasos
```

---

## 🎓 LECTURAS RECOMENDADAS

1. **Principiante:** RESUMEN_ESTADO_ACTUAL.md
2. **Intermedio:** GUIA_RESOLUCION_500_ERRORS.md
3. **Avanzado:** CHECKLIST_DEPLOYMENT.md

---

**¡Puedes hacerlo! Si algo no funciona, revisa la guía o comparte el diagnostico.** 🚀

