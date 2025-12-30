<?php
/**
 * Diagnostico simple - No requiere WordPress
 * Sirve para verificar que PHP funciona en el servidor
 */

// Información básica del servidor
echo '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Diagnostico UNITEC</title><style>body{font-family:Arial;margin:20px;background:#f5f5f5}pre{background:#fff;padding:20px;border:1px solid #ddd;border-radius:5px}h1{color:#1e40af}</style></head><body>';

echo '<h1>🔍 Diagnóstico de Servidor - Agente UNITEC</h1>';
echo '<pre>';

// 1. Versión de PHP
echo "PHP Version: " . phpversion() . "\n";
echo "PHP SAPI: " . php_sapi_name() . "\n\n";

// 2. Rutas importantes
echo "DocumentRoot: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "Script Filename: " . $_SERVER['SCRIPT_FILENAME'] . "\n";
echo "Script Name: " . $_SERVER['SCRIPT_NAME'] . "\n\n";

// 3. Extensiones relevantes
echo "Extensiones cargadas:\n";
$extensions = ['curl', 'json', 'mysqli', 'pdo', 'gd', 'openssl'];
foreach ($extensions as $ext) {
    $status = extension_loaded($ext) ? '✓' : '✗';
    echo "  $status $ext\n";
}

// 4. Límites de memoria
echo "\nConfiguración de límites:\n";
echo "  memory_limit: " . ini_get('memory_limit') . "\n";
echo "  max_execution_time: " . ini_get('max_execution_time') . " segundos\n";
echo "  upload_max_filesize: " . ini_get('upload_max_filesize') . "\n";
echo "  post_max_size: " . ini_get('post_max_size') . "\n\n";

// 5. Variables de entorno
echo "Servidor: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'No disponible') . "\n";
echo "Protocolo: " . ($_SERVER['SERVER_PROTOCOL'] ?? 'No disponible') . "\n\n";

// 6. Permisos de directorios
$dirs_check = [
    dirname(__FILE__) => 'Directorio del script',
    $_SERVER['DOCUMENT_ROOT'] . '/wp-content' => 'wp-content',
    $_SERVER['DOCUMENT_ROOT'] . '/wp-content/plugins' => 'wp-content/plugins',
];

echo "Permisos de directorios:\n";
foreach ($dirs_check as $dir => $label) {
    if (is_dir($dir)) {
        $perms = substr(sprintf('%o', fileperms($dir)), -4);
        $writable = is_writable($dir) ? '✓ W' : '✗ R';
        echo "  $label: $perms ($writable)\n";
    } else {
        echo "  $label: ✗ NO EXISTE\n";
    }
}

// 7. Búsqueda de archivos del plugin
echo "\n\nBúsqueda de archivo del plugin:\n";
$plugin_paths = [
    $_SERVER['DOCUMENT_ROOT'] . '/wp-content/plugins/agente-retencion-unitec-02.php',
    $_SERVER['DOCUMENT_ROOT'] . '/agente-retencion-unitec-02.php',
];

foreach ($plugin_paths as $path) {
    if (file_exists($path)) {
        $size = filesize($path);
        echo "  ✓ Encontrado: $path ($size bytes)\n";
        
        // Verificar sintaxis básica
        $content = file_get_contents($path);
        if (strpos($content, '<?php') !== 0) {
            echo "    ⚠ ADVERTENCIA: No comienza con <?php\n";
        }
        if (substr($content, -2) !== '?>') {
            echo "    ⚠ ADVERTENCIA: No termina con ?>\n";
        }
    } else {
        echo "  ✗ No encontrado: $path\n";
    }
}

// 8. Test de conexión HTTP
echo "\n\nTest de conexiones HTTP internas:\n";
$test_urls = [
    '/wp-json/' => 'REST API Base',
    '/wp-json/wp/v2/posts' => 'Posts endpoint',
];

$context = stream_context_create([
    'http' => [
        'timeout' => 5,
        'ignore_errors' => true,
    ]
]);

foreach ($test_urls as $path => $label) {
    $url = 'http://' . $_SERVER['HTTP_HOST'] . $path;
    @$response = file_get_contents($url, false, $context);
    $http_code = isset($http_response_header) ? 
        substr($http_response_header[0], 9, 3) : 'Error';
    echo "  $label: HTTP $http_code\n";
}

echo '</pre>';

// 9. Instrucciones de próximos pasos
echo '<h2>📋 Próximos pasos:</h2>';
echo '<ol>';
echo '<li>Sube este archivo a la raíz de WordPress en staging</li>';
echo '<li>Accede a: https://staging2.geroeducacion.com/DIAGNOSTICO_SIMPLE.php</li>';
echo '<li>Revisa los resultados y comparte la salida</li>';
echo '<li>Especialmente: versión PHP, permisos, ubicación del plugin, HTTP status de /wp-json/</li>';
echo '</ol>';

echo '</body></html>';
?>
