#!/bin/bash
# Script de Diagnóstico y Reparación Automática
# UNITEC Agente de Retención 02
# 
# USO:
# 1. Copiar este script al servidor
# 2. Ejecutar: bash fix_agente.sh
# 3. Proporcionar contraseña sudo si es necesario

set -e

echo "🔧 HERRAMIENTA DE REPARACIÓN - Agente UNITEC 02"
echo "================================================"
echo ""

# Detectar ubicación de WordPress
if [ -f "wp-config.php" ]; then
    WP_ROOT=$(pwd)
elif [ -f "wp-content/plugins" ]; then
    WP_ROOT=$(pwd)
elif [ -f "/var/www/html/wp-config.php" ]; then
    WP_ROOT="/var/www/html"
elif [ -f "/home/*/public_html/wp-config.php" ]; then
    WP_ROOT=$(find /home -name "wp-config.php" -type f 2>/dev/null | head -1 | xargs dirname)
else
    echo "❌ No se encontró WordPress. Ubícate en la raíz de WordPress e intenta de nuevo."
    exit 1
fi

echo "📍 Raíz de WordPress: $WP_ROOT"
cd "$WP_ROOT"

# ============================================
# PASO 1: DIAGNÓSTICO
# ============================================

echo ""
echo "📊 PASO 1: DIAGNÓSTICO"
echo "────────────────────────"

echo -n "  Versión de PHP: "
php -v 2>/dev/null | head -1 || echo "❌ PHP no disponible"

echo -n "  Servidor: "
grep -o 'Apache\|Nginx' /etc/apache2/apache2.conf /etc/nginx/nginx.conf 2>/dev/null | head -1 || echo "❌ No determinado"

echo -n "  ¿Existe wp-config.php? "
[ -f "wp-config.php" ] && echo "✓" || echo "✗"

echo -n "  ¿Existe wp-content/plugins? "
[ -d "wp-content/plugins" ] && echo "✓" || echo "✗"

echo -n "  ¿Existe el archivo del plugin? "
if [ -f "wp-content/plugins/agente-retencion-unitec-02.php" ]; then
    echo "✓"
    PLUGIN_EXISTS=true
else
    echo "✗ (FALTA)"
    PLUGIN_EXISTS=false
fi

# ============================================
# PASO 2: ACTIVAR PLUGIN (si existe)
# ============================================

if [ "$PLUGIN_EXISTS" = true ]; then
    echo ""
    echo "🔧 PASO 2: ACTIVAR PLUGIN"
    echo "────────────────────────"
    
    # Verificar permisos
    echo "  Verificando permisos..."
    PERMS=$(stat -c "%a" wp-content/plugins/agente-retencion-unitec-02.php 2>/dev/null || echo "unknown")
    echo "    Permisos actuales: $PERMS"
    
    if [ "$PERMS" != "644" ] && [ "$PERMS" != "unknown" ]; then
        echo "    Corrigiendo a 644..."
        chmod 644 wp-content/plugins/agente-retencion-unitec-02.php
    fi
    
    # Intentar activar con WP-CLI
    if command -v wp &> /dev/null; then
        echo "  Activando plugin con WP-CLI..."
        wp plugin activate agente-retencion-unitec-02 --allow-root 2>/dev/null || true
        wp plugin list --allow-root | grep gero || echo "    ⚠️  Plugin no aparece en lista"
    else
        echo "  ⚠️  WP-CLI no disponible. Activa desde dashboard:"
        echo "      /wp-admin → Plugins → Agente de retención → Activar"
    fi
fi

# ============================================
# PASO 3: VERIFICAR REST API
# ============================================

echo ""
echo "🔌 PASO 3: VERIFICAR REST API"
echo "────────────────────────────"

echo "  Verificando si REST API está activo..."

# Intentar con curl si está disponible
if command -v curl &> /dev/null; then
    PROTOCOL="http"
    if [ -n "$HTTPS" ] || grep -q "FORCE_SSL" wp-config.php 2>/dev/null; then
        PROTOCOL="https"
    fi
    
    HTTP_HOST=${HTTP_HOST:-localhost}
    
    RESPONSE=$(curl -s -I "$PROTOCOL://$HTTP_HOST/wp-json/" 2>/dev/null | head -1 || echo "")
    
    if echo "$RESPONSE" | grep -q "200\|301\|302"; then
        echo "  ✓ REST API está disponible"
    else
        echo "  ✗ REST API podría no estar disponible"
        echo "    Respuesta: $RESPONSE"
    fi
else
    echo "  ⚠️  curl no disponible, no se puede verificar REST API"
fi

# ============================================
# PASO 4: REVISAR DEBUG LOG
# ============================================

echo ""
echo "📋 PASO 4: REVISAR DEBUG LOG"
echo "────────────────────────────"

if [ -f "wp-content/debug.log" ]; then
    ERRORS=$(tail -50 wp-content/debug.log | grep -i "error\|fatal" | wc -l)
    if [ "$ERRORS" -gt 0 ]; then
        echo "  ⚠️  Se encontraron $ERRORS errores en debug.log"
        echo ""
        echo "  Últimos errores:"
        tail -50 wp-content/debug.log | grep -i "error\|fatal" | head -5
    else
        echo "  ✓ No hay errores recientes en debug.log"
    fi
else
    echo "  ℹ️  No hay debug.log. Para habilitarlo, añade a wp-config.php:"
    echo "      define( 'WP_DEBUG', true );"
    echo "      define( 'WP_DEBUG_LOG', true );"
fi

# ============================================
# PASO 5: CREAR TABLA DE CRISIS (si falta)
# ============================================

echo ""
echo "🗄️  PASO 5: VERIFICAR TABLA DE BD"
echo "─────────────────────────────────"

# Extraer BD credentials de wp-config.php
DB_NAME=$(grep "DB_NAME" wp-config.php | head -1 | cut -d "'" -f 4)
DB_USER=$(grep "DB_USER" wp-config.php | head -1 | cut -d "'" -f 4)
DB_PASSWORD=$(grep "DB_PASSWORD" wp-config.php | head -1 | cut -d "'" -f 4)
DB_HOST=$(grep "DB_HOST" wp-config.php | head -1 | cut -d "'" -f 4)
TABLE_PREFIX=$(grep "'table_prefix'" wp-config.php | head -1 | cut -d "'" -f 2)
CRISIS_TABLE="${TABLE_PREFIX}gero_crisis_states"

echo "  Base de datos: $DB_NAME"
echo "  Tabla: $CRISIS_TABLE"

# Si mysql está disponible, verificar tabla
if command -v mysql &> /dev/null; then
    TABLE_EXISTS=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES LIKE '$CRISIS_TABLE';" 2>/dev/null | grep "$CRISIS_TABLE" || echo "")
    
    if [ -z "$TABLE_EXISTS" ]; then
        echo "  ⚠️  Tabla no existe. El plugin la creará automáticamente."
        echo "      Cuando se ejecute la primera crisis, se creará."
    else
        echo "  ✓ Tabla de crisis existe"
    fi
fi

# ============================================
# PASO 6: RESUMEN
# ============================================

echo ""
echo "════════════════════════════════════════"
echo "✅ DIAGNÓSTICO COMPLETADO"
echo "════════════════════════════════════════"

if [ "$PLUGIN_EXISTS" = true ]; then
    echo ""
    echo "📋 PRÓXIMOS PASOS:"
    echo ""
    echo "1. Verifica que el plugin está ACTIVADO en:"
    echo "   https://tu-dominio.com/wp-admin/plugins.php"
    echo ""
    echo "2. Si sigue dando error 500, revisa:"
    echo "   tail -100 wp-content/debug.log"
    echo ""
    echo "3. Prueba los endpoints REST:"
    echo "   curl -I https://tu-dominio.com/wp-json/"
    echo "   curl -I https://tu-dominio.com/wp-json/gero/v1/guardar-conversation-state"
    echo ""
else
    echo ""
    echo "❌ ERROR: El archivo del plugin no existe"
    echo ""
    echo "Debe estar en: $WP_ROOT/wp-content/plugins/agente-retencion-unitec-02.php"
    echo ""
    echo "Sube el archivo y ejecuta este script nuevamente."
fi

echo ""
echo "📞 Si necesitas ayuda, revisa GUIA_RESOLUCION_500_ERRORS.md"
echo ""
