<?php
/**
 * Script de diagnóstico para Agente UNITEC
 * Coloca este archivo en la raíz de WordPress para diagnosticar problemas
 */

// Habilitar errores
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', true);

// Cargar WordPress
require_once( dirname( __FILE__ ) . '/wp-load.php' );

echo '<h1>Diagnóstico - Agente UNITEC 02</h1>';
echo '<pre>';

// 1. Verificar si el plugin está activo
echo "✓ WordPress cargado correctamente\n";
echo "Versión: " . get_bloginfo('version') . "\n\n";

// 2. Verificar base de datos
global $wpdb;
echo "Base de datos:\n";
echo "  Host: " . DB_HOST . "\n";
echo "  Nombre: " . DB_NAME . "\n";
echo "  Tabla prefix: " . $wpdb->prefix . "\n";

// Probar conexión
$test = $wpdb->get_results("SELECT 1");
if ($test) {
    echo "  ✓ Conexión OK\n\n";
} else {
    echo "  ✗ Error de conexión: " . $wpdb->last_error . "\n\n";
}

// 3. Verificar rutas REST registradas
echo "Rutas REST registradas:\n";
$rest_server = rest_get_server();
$routes = $rest_server->get_routes();
$gero_routes = array_filter($routes, function($route) {
    return strpos($route, '/gero/') !== false;
});

if (!empty($gero_routes)) {
    foreach (array_keys($gero_routes) as $route) {
        echo "  ✓ $route\n";
    }
} else {
    echo "  ✗ No se encontraron rutas /gero/\n";
}

echo "\n";

// 4. Verificar tabla de crisis
$crisis_table = $wpdb->prefix . 'gero_crisis_states';
$crisis_exists = $wpdb->get_var("SHOW TABLES LIKE '$crisis_table'");
if ($crisis_exists) {
    echo "✓ Tabla de crisis existe: $crisis_table\n";
} else {
    echo "✗ Tabla de crisis NO existe: $crisis_table\n";
}

// 5. Verificar último error de PHP
if (function_exists('wp_get_environment_type')) {
    echo "\nEntorno: " . wp_get_environment_type() . "\n";
}

echo "\nÚltimo error en debug.log:\n";
$log_file = WP_CONTENT_DIR . '/debug.log';
if (file_exists($log_file)) {
    $lines = file($log_file, FILE_SKIP_EMPTY_LINES);
    $last_lines = array_slice($lines, -10);
    foreach ($last_lines as $line) {
        echo "  " . trim($line) . "\n";
    }
} else {
    echo "  No hay debug.log disponible\n";
}

echo '</pre>';
echo '<p><a href="' . admin_url() . '">Volver a admin</a></p>';
?>
