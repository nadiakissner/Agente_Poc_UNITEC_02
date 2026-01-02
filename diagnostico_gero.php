<?php
/**
 * DIAGNOSTICO DEL PLUGIN
 * Sube este archivo a la raiz de WordPress y accede a:
 * https://staging2.geroeducacion.com/diagnostico_gero.php
 */

// Show all errors
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Diagnostico del Plugin Gero</h1>";
echo "<p>PHP Version: " . phpversion() . "</p>";

// Check if we're in WordPress
$wp_load = dirname(__FILE__) . '/wp-load.php';
echo "<p>wp-load.php existe: " . (file_exists($wp_load) ? 'SI' : 'NO') . "</p>";

// Check plugin file
$plugin_file = dirname(__FILE__) . '/wp-content/plugins/agente-retencion-unitec-02/agente-retencion-unitec-02.php';
echo "<h2>Verificando Plugin</h2>";
echo "<p>Ruta: " . $plugin_file . "</p>";
echo "<p>Existe: " . (file_exists($plugin_file) ? 'SI' : 'NO') . "</p>";

if (file_exists($plugin_file)) {
    echo "<p>Tamano: " . filesize($plugin_file) . " bytes</p>";
    
    // Try to check syntax without executing
    echo "<h3>Verificando Sintaxis PHP...</h3>";
    $output = [];
    $return_var = 0;
    exec("php -l " . escapeshellarg($plugin_file) . " 2>&1", $output, $return_var);
    
    echo "<pre style='background:#f5f5f5;padding:10px;'>";
    echo implode("\n", $output);
    echo "</pre>";
    
    if ($return_var === 0) {
        echo "<p style='color:green;font-weight:bold;'>✓ Sintaxis PHP correcta</p>";
    } else {
        echo "<p style='color:red;font-weight:bold;'>✗ Error de sintaxis PHP</p>";
    }
    
    // Check first 20 lines
    echo "<h3>Primeras 20 lineas del archivo:</h3>";
    $lines = file($plugin_file);
    echo "<pre style='background:#f5f5f5;padding:10px;'>";
    for ($i = 0; $i < min(20, count($lines)); $i++) {
        echo htmlspecialchars($lines[$i]);
    }
    echo "</pre>";
}

// Check dist folder
$dist_file = dirname(__FILE__) . '/wp-content/plugins/agente-retencion-unitec-02/dist/index.html';
echo "<h2>Verificando dist/</h2>";
echo "<p>dist/index.html existe: " . (file_exists($dist_file) ? 'SI' : 'NO') . "</p>";

// Try to load WordPress and check for errors
echo "<h2>Intentando cargar WordPress...</h2>";
echo "<p>Esto puede mostrar errores si hay problemas:</p>";

try {
    // Define WordPress constants if needed
    define('WP_USE_THEMES', false);
    
    if (file_exists($wp_load)) {
        require($wp_load);
        echo "<p style='color:green;'>✓ WordPress cargado correctamente</p>";
        
        // Check if plugin is active
        $active_plugins = get_option('active_plugins');
        echo "<h3>Plugins activos que contienen 'agente' o 'gero':</h3>";
        echo "<ul>";
        foreach ($active_plugins as $plugin) {
            if (stripos($plugin, 'agente') !== false || stripos($plugin, 'gero') !== false) {
                echo "<li>" . htmlspecialchars($plugin) . "</li>";
            }
        }
        echo "</ul>";
        
        // Check if shortcode is registered
        global $shortcode_tags;
        echo "<h3>Shortcode registrado:</h3>";
        if (isset($shortcode_tags['agente-retencion-unitec-02'])) {
            echo "<p style='color:green;'>✓ Shortcode [agente-retencion-unitec-02] esta registrado</p>";
        } else {
            echo "<p style='color:red;'>✗ Shortcode [agente-retencion-unitec-02] NO esta registrado</p>";
        }
        
        // List all gero shortcodes
        echo "<p>Shortcodes que contienen 'agente':</p><ul>";
        foreach ($shortcode_tags as $tag => $callback) {
            if (stripos($tag, 'agente') !== false) {
                echo "<li>" . htmlspecialchars($tag) . "</li>";
            }
        }
        echo "</ul>";
        
    } else {
        echo "<p style='color:red;'>✗ No se encontro wp-load.php</p>";
    }
} catch (Exception $e) {
    echo "<p style='color:red;'>Error: " . htmlspecialchars($e->getMessage()) . "</p>";
} catch (Error $e) {
    echo "<p style='color:red;'>Error Fatal: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p>Archivo: " . htmlspecialchars($e->getFile()) . "</p>";
    echo "<p>Linea: " . $e->getLine() . "</p>";
}

echo "<hr><p><small>Diagnostico completado</small></p>";
