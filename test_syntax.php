<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Mock WordPress functions
function sanitize_text_field($s) { return $s; }
function sanitize_textarea_field($s) { return $s; }
function wp_json_encode($d) { return json_encode($d); }
function current_time($f) { return date($f); }
function is_wp_error($e) { return false; }
function wp_remote_post($u, $o) { return []; }
function wp_remote_retrieve_body($r) { return '{}'; }
function add_action($h, $c) {}
function add_shortcode($t, $c) {}
function register_rest_route($n, $r, $a) {}

class WP_REST_Request {
    function get_json_params() { return []; }
    function get_param($n) { return ''; }
}
class WP_REST_Response {
    function __construct($d, $c) {}
}

// Try to parse the file
$code = file_get_contents('agente-retencion-unitec-02.php');
$tokens = token_get_all($code);
echo "Tokens generados: " . count($tokens) . "
";
echo "Archivo parseado correctamente
";
