# Quick Start: Separación de Agentes (Resumen Ejecutivo)

## 📌 TL;DR - Lo Esencial

Se implementó separación **completa e independiente** de `Agente_Poc` y `Agente_Poc_UNITEC`:

| Aspecto | Solución |
|---------|----------|
| **Nombres de archivo** | Prefijo `-unitec`: `index-unitec-abc123.js` |
| **Handles WordPress** | Únicos: `agente_unitec_app` vs `agente_prototype_app` |
| **Elemento Root** | Único: `#agente-unitec-root` vs `#agente-prototype-root` |
| **Configuración JS** | Única: `GERO_CONFIG_UNITEC` vs `GERO_CONFIG` |
| **Resultado** | ✅ Ambos agentes coexisten sin conflictos |

---

## 🚀 3 Pasos para Desplegar

### Paso 1: Compilar Localmente (2 min)
```bash
cd Agente_Poc_UNITEC
npm run build
```
**Verificar:** `ls dist/assets/` debe mostrar archivos con `-unitec`

### Paso 2: Subir a SiteGround (10 min)
```
FTP: wp-content/plugins/Agente_Poc_UNITEC/
- agente-retencion.php
- dist/
- SRC/main.tsx
- SRC/Lib/backendAdapter.ts
- index.html
```

### Paso 3: Limpiar Caché (2 min)
- SiteGround Panel → Tools → Cloudflare Cache → Purge
- WordPress → Plugins → WP Super Cache → Delete Cache
- Navegador → Ctrl+Shift+Del

---

## ✅ Verificación Rápida

**En DevTools Console (F12):**
```javascript
// Debe retornar objeto con rest_base, nonce, modal
window.GERO_CONFIG_UNITEC

// Debe retornar el elemento <div>
document.getElementById("agente-unitec-root")

// En Network tab, buscar:
// - index-unitec-abc123.js
// - index-unitec-xyz789.css
```

---

## 📁 Archivos Modificados

```
✅ vite.config.ts              Prefijo -unitec en build
✅ agente-retencion.php        Handles + root únicos
✅ SRC/main.tsx                Busca agente-unitec-root
✅ SRC/Lib/backendAdapter.ts   CONFIG centralizado
✅ index.html                  ID root correcto
```

---

## 🎯 Garantías

- ✅ Agente_Poc NO se ve afectado
- ✅ Agente_Poc_UNITEC completamente independiente
- ✅ Backend compartido seguramente
- ✅ Sin caché collisions
- ✅ Desarrollo paralelo posible

---

## 📚 Documentación Completa

1. **ARQUITECTURA_SEPARACION.md** → Entiende por qué
2. **GUIA_IMPLEMENTACION.md** → Aprende cómo desplegar
3. **REFERENCIA_TECNICA.md** → Detalle línea por línea
4. **COMPARATIVA_ANTES_DESPUES.md** → Entiende el cambio
5. **RESUMEN_SEPARACION.md** → Executive summary

---

## 🐛 Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| No aparece agente | `console.log(window.GERO_CONFIG_UNITEC)` → Debe existir |
| Carga archivos viejos | Purge SiteGround Cache + Ctrl+Shift+R |
| Conflicto con Agente_Poc | Verificar que están en páginas separadas |
| Elemento root no existe | Verificar que `#agente-unitec-root` en HTML |

---

## 📊 Status: ✅ LISTO PARA PRODUCCIÓN

**Próximos pasos:**
1. ✅ Código preparado y documentado
2. ⏳ Subir a SiteGround (15-30 min)
3. ⏳ Verificar en producción (10-15 min)
4. ⏳ Comunicar al equipo (5 min)

---

**Duración total despliegue:** ~1 hora

**Riesgo:** Bajo (cambios simples, sin refactorización)

**Compatibilidad:** 100% (WordPress, PHP, React)

---

### 🎓 Última Verificación Pre-Despliegue

```bash
# 1. Archivos compilados correctamente
ls Agente_Poc_UNITEC/dist/assets/ | grep unitec

# 2. Cambios en PHP
grep -c "agente_unitec" Agente_Poc_UNITEC/agente-retencion.php
# Debe retornar: >= 5

# 3. Cambios en React
grep "agente-unitec-root" Agente_Poc_UNITEC/SRC/main.tsx

# 4. Cambios en backend adapter
grep "GERO_CONFIG_UNITEC" Agente_Poc_UNITEC/SRC/Lib/backendAdapter.ts

# 5. HTML actualizado
grep "agente-unitec-root" Agente_Poc_UNITEC/index.html
```

✅ Si todos retornan resultados → **LISTO PARA DESPLEGAR**
