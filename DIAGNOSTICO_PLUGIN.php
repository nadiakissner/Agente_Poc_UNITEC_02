<?php
/**
 * DIAGNOSTICO ACTIVACION PLUGIN - Agente UNITEC 02
 * Sube esto a la raíz de WordPress para ver qué está fallando
 */

// Cargar WordPress completamente
require_once 'wp-load.php';

echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:monospace;margin:20px;background:#f0f0f0}pre{background:white;padding:15px;border-radius:5px;overflow-x:auto}h1{color:#d32f2f}h2{color:#1976d2}.ok{color:green;font-weight:bold}.error{color:red;font-weight:bold}.warn{color:orange;font-weight:bold}</style></head><body>';

echo '<h1>🔍 DIAGNÓSTICO PLUGIN - Agente UNITEC 02</h1>';
echo '<pre>';

// 1. Verificar que el archivo existe
echo "📋 PASO 1: Verificar archivo del plugin\n";
echo "─────────────────────────────────────────\n";

$plugin_file = WP_CONTENT_DIR . '/plugins/agente-retencion-unitec-02.php';
if (file_exists($plugin_file)) {
    $size = filesize($plugin_file);
    echo "<span class='ok'>✓</span> Archivo encontrado: $plugin_file\n";
    echo "  Tamaño: " . round($size / 1024, 2) . " KB\n";
    echo "  Permisos: " . substr(sprintf('%o', fileperms($plugin_file)), -4) . "\n\n";
} else {
    echo "<span class='error'>✗</span> Archivo NO encontrado en: $plugin_file\n\n";
}

// 2. Verificar si está activado
echo "📋 PASO 2: Verificar activación del plugin\n";
echo "─────────────────────────────────────────\n";

$plugins = get_option('active_plugins');
$is_active = in_array('agente-retencion-unitec-02.php', $plugins);

if ($is_active) {
    echo "<span class='ok'>✓</span> Plugin ESTÁ ACTIVADO\n\n";
} else {
    echo "<span class='error'>✗</span> Plugin NO está activado\n";
    echo "  Plugins activos: " . implode(', ', $plugins) . "\n\n";
    
    echo "  <span class='warn'>Solución:</span>\n";
    echo "    1. Ve a: /wp-admin/plugins.php\n";
    echo "    2. Busca: 'Agente de retención'\n";
    echo "    3. Haz clic: 'Activar'\n";
    echo "    O ejecuta: wp plugin activate agente-retencion-unitec-02.php --allow-root\n\n";
}

// 3. Verificar REST API
echo "📋 PASO 3: Verificar REST API\n";
echo "─────────────────────────────────────────\n";

$rest_server = rest_get_server();
$routes = $rest_server->get_routes();
$gero_routes = array_filter($routes, function($route) {
    return strpos($route, '/gero/') !== false;
});

if (!empty($gero_routes)) {
    echo "<span class='ok'>✓</span> REST API de GERO está registrada\n";
    echo "  Rutas encontradas: " . count($gero_routes) . "\n";
    foreach (array_keys($gero_routes) as $route) {
        echo "    • $route\n";
    }
    echo "\n";
} else {
    echo "<span class='error'>✗</span> REST API de GERO NO está registrada\n";
    echo "  Esto significa que el plugin no se cargó correctamente\n\n";
}

// 4. Verificar tabla de BD
echo "📋 PASO 4: Verificar base de datos\n";
echo "─────────────────────────────────────────\n";

global $wpdb;
$table = $wpdb->prefix . 'gero_crisis_states';
$table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table'");

if ($table_exists) {
    echo "<span class='ok'>✓</span> Tabla de crisis existe: $table\n\n";
} else {
    echo "<span class='warn'>ℹ</span> Tabla de crisis no existe aún (se creará en primera ejecución)\n\n";
}

// 5. Verificar errores
echo "📋 PASO 5: Verificar errores recientes\n";
echo "─────────────────────────────────────────\n";

$log_file = WP_CONTENT_DIR . '/debug.log';
if (file_exists($log_file)) {
    $lines = file($log_file, FILE_SKIP_EMPTY_LINES);
    $last_lines = array_slice($lines, -20);
    $errors = array_filter($last_lines, function($line) {
        return stripos($line, 'error') !== false || stripos($line, 'fatal') !== false;
    });
    
    if (!empty($errors)) {
        echo "<span class='error'>✗</span> Se encontraron " . count($errors) . " errores\n";
        echo "Últimos errores:\n";
        foreach ($errors as $error) {
            echo "  " . trim($error) . "\n";
        }
    } else {
        echo "<span class='ok'>✓</span> No hay errores recientes en debug.log\n";
    }
} else {
    echo "<span class='warn'>ℹ</span> debug.log no existe (activar WP_DEBUG)\n";
}

echo "\n</pre>";

// Resumen
echo '<h2>📊 RESUMEN</h2>';
echo '<pre>';

if ($is_active && !empty($gero_routes)) {
    echo "<span class='ok'>✓ LISTO</span> - Todo está bien configurado\n";
    echo "El plugin debe estar funcionando. Si aún ves error 500:\n";
    echo "  1. Revisa: /wp-content/debug.log\n";
    echo "  2. Comparte el contenido conmigo\n";
} else if (!$is_active) {
    echo "<span class='error'>✗ PROBLEMA ENCONTRADO</span>\n";
    echo "El plugin NO está activado.\n\n";
    echo "Solución rápida (SSH):\n";
    echo "  $ wp plugin activate agente-retencion-unitec-02.php --allow-root\n\n";
    echo "O vía dashboard:\n";
    echo "  1. /wp-admin/plugins.php\n";
    echo "  2. Busca: 'Agente de retención'\n";
    echo "  3. Haz clic: 'Activar'\n";
} else {
    echo "<span class='warn'>⚠</span> Situación mixta:\n";
    echo "  • Plugin: " . ($is_active ? "ACTIVADO" : "DESACTIVADO") . "\n";
    echo "  • REST API: " . (empty($gero_routes) ? "NO REGISTRADA" : "OK") . "\n";
}

echo '</pre>';
echo '</body></html>';
?>
