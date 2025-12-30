<?php
/*
Plugin Name: Agente de retención - UNITEC 02 (Chat Format)
Description: Agente de Gero con interfaz de chat - Versión UNITEC 02. Motor de hipótesis, procesamiento de cuestionario, inyección dinámica de contexto.
Version: 2.0
Author: Christian Pflaum
License: GPL v2 or later
Text Domain: agente-retencion-unitec-02
Domain Path: /languages
*/

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// ========================================
// 🔹 MOTOR DE SCORING Y CÁLCULO DE HIPÓTESIS
// ========================================
/**
 * Mapeo de categorías de riesgo del cuestionario (questionnaire.ts)
 * Cada categoría puede recibir puntos según las respuestas del estudiante
 * Las categorías se priorizan según riskPriority para determinar hipótesis principal
 */
define('GERO_RISK_CATEGORIES', [
    'emocional'         => 'Bienestar emocional',
    'desorientacion'    => 'Desorientación académica',
    'organizacion'      => 'Organización del tiempo',
    'baja_preparacion'  => 'Preparación académica',
    'economica'         => 'Preocupación económica',
    'social'            => 'Desconexión social',
    'tecnologica'       => 'Barreras tecnológicas',
    'entorno'           => 'Entorno de estudio',
]);

// Orden de prioridad de hipótesis (misma que questionnaire.ts)
define('GERO_RISK_PRIORITY', [
    'emocional',
    'desorientacion',
    'organizacion',
    'baja_preparacion',
    'economica',
    'social',
    'tecnologica',
    'entorno',
]);

/**
 * Calcula puntuación de riesgos basada en respuestas del cuestionario
 * 
 * @param array $respuestas Array asociativo: ['P1' => 'respuesta', 'P2' => ['opciones'], ...]
 * @return array Puntuaciones por categoría: ['economica' => 5, 'desorientacion' => 8, ...]
 * 
 * LÓGICA:
 * - P1: Pregunta cualitativa ("Con algo de incertidumbre" o "Con muchas dudas" abre rama P2)
 * - P2: Selección única → asigna 3 puntos a su categoría de riesgo
 * - P3-P8: Escala Likert o Yes/No → asigna pesos según valor de riesgo (1-5 más alto = más riesgo)
 */
function gero_calcular_puntuacion_riesgos_unitec_02( $respuestas ) {
    // Inicializar contador de puntos por categoría
    $puntuaciones = array_fill_keys( array_keys( GERO_RISK_CATEGORIES ), 0 );
    
    // === PREGUNTA 1 (P1): Sensación inicial ===
    // Si responde "Con algo de incertidumbre" o "Con muchas dudas" → +2 a desorientacion
    if ( isset( $respuestas['P1'] ) ) {
        $p1 = trim( $respuestas['P1'] );
        if ( $p1 === 'Con algo de incertidumbre' || $p1 === 'Con muchas dudas' ) {
            $puntuaciones['desorientacion'] += 2;
        }
    }
    
    // === PREGUNTA 2 (P2): Factor más importante de inseguridad ===
    // Selección única con categoría de riesgo directa
    if ( isset( $respuestas['P2'] ) ) {
        $p2_categoria = gero_mapear_categoria_p2_unitec_02( $respuestas['P2'] );
        if ( $p2_categoria && isset( $puntuaciones[ $p2_categoria ] ) ) {
            $puntuaciones[ $p2_categoria ] += 3;
        }
    }
    
    // === PREGUNTAS 3-8: Escalas Likert ===
    $likert_mappings = [
        'P3' => 'desorientacion',      // "¿Qué tan preparado te sientes para tu carrera?"
        'P4' => 'organizacion',        // "¿Gestión de tiempo y responsabilidades?"
        'P5' => 'economica',           // "¿Dificultad si pierdes fuente de costos?"
        'P6' => 'baja_preparacion',    // "¿Te esforzaste más de lo esperado en media?"
        'P7' => 'social',              // "¿Facilidad para hacer amistades?"
        'P8' => 'tecnologica',         // "¿Comodidad con herramientas digitales?"
    ];
    
    foreach ( $likert_mappings as $pregunta_id => $categoria ) {
        if ( isset( $respuestas[ $pregunta_id ] ) ) {
            $valor = gero_extraer_valor_likert_unitec_02( $respuestas[ $pregunta_id ] );
            // Si es alto riesgo (1-3 en escala), suma puntos proporcionales
            if ( $valor >= 1 && $valor <= 3 ) {
                $puntos = (4 - $valor) * 1.5; // Escala invertida: 1→4.5, 2→3, 3→1.5
                $puntuaciones[ $categoria ] += $puntos;
            }
        }
    }
    
    return $puntuaciones;
}

/**
 * Mapea la respuesta de P2 a su categoría de riesgo
 * 
 * @param string $respuesta Texto completo de la opción seleccionada
 * @return string|null Categoría de riesgo o null si no coincide
 */
function gero_mapear_categoria_p2_unitec_02( $respuesta ) {
    $mappings = [
        'factor económico' => 'economica',
        'solo/a' => 'social',
        'no estoy preparado/a' => 'baja_preparacion',
        'responsabilidades' => 'organizacion',
        'tecnología' => 'tecnologica',
        'herramientas digitales' => 'tecnologica',
        'elegí bien la carrera' => 'desorientacion',
        'claridad sobre por qué' => 'desorientacion',
        'entorno' => 'entorno',
        'desmotivado/a' => 'emocional',
    ];
    
    $respuesta_lower = strtolower( $respuesta );
    foreach ( $mappings as $clave => $categoria ) {
        if ( strpos( $respuesta_lower, $clave ) !== false ) {
            return $categoria;
        }
    }
    
    return null;
}

/**
 * Extrae el valor numérico de una respuesta Likert (1-5)
 * 
 * @param string $respuesta Ej: "1 - Nada preparado" o "5 - Muy preparado"
 * @return int|null Valor 1-5 o null si no es válido
 */
function gero_extraer_valor_likert_unitec_02( $respuesta ) {
    if ( preg_match( '/^(\d)/', trim( $respuesta ), $matches ) ) {
        return intval( $matches[1] );
    }
    return null;
}

/**
 * Determina la hipótesis principal basada en puntuaciones
 * Retorna array ordenado de hipótesis por prioridad (la primera es la principal)
 * 
 * @param array $puntuaciones Puntuaciones por categoría
 * @return array Hipótesis ordenadas por prioridad y relevancia
 */
function gero_determinar_hipotesis_principales_unitec_02( $puntuaciones ) {
    // Filtrar solo categorías con puntuación > 0
    $riesgos_activos = array_filter(
        $puntuaciones,
        function ( $puntos ) {
            return $puntos > 0;
        }
    );
    
    // Ordenar según riskPriority global
    $hipotesis_ordenadas = [];
    foreach ( GERO_RISK_PRIORITY as $categoria ) {
        if ( isset( $riesgos_activos[ $categoria ] ) ) {
            $hipotesis_ordenadas[ $categoria ] = $riesgos_activos[ $categoria ];
        }
    }
    
    return $hipotesis_ordenadas;
}

/**
 * Construye etiqueta legible de hipótesis a partir de categoría
 * 
 * @param string $categoria Clave de categoría (ej: 'desorientacion')
 * @return string Etiqueta legible (ej: 'Desorientación académica')
 */
function gero_obtener_etiqueta_hipotesis_unitec_02( $categoria ) {
    return GERO_RISK_CATEGORIES[ $categoria ] ?? $categoria;
}

// ========================================
// 🔹 VALIDACIÓN Y AUTENTICACIÓN DE MATRÍCULA
// ========================================

/**
 * Valida matrícula y retorna datos de usuario + estado de historial
 * 
 * LÓGICA:
 * 1. Busca matrícula en byw_usuarios_habilitados
 * 2. Si NO existe → retorna error 'matrícula no encontrada'
 * 3. Si EXISTE:
 *    a. Verifica si hay interacciones previas en byw_coach_interacciones
 *    b. Si SÍ hay historial → caso recurrente (skip cuestionario)
 *    c. Si NO hay historial → caso nuevo (mostrar cuestionario)
 * 4. Retorna datos del usuario y estado del caso
 */
add_action( 'rest_api_init', function () {
    register_rest_route( 'gero/v1', '/validar-matricula-02', [
        'methods'             => 'GET',
        'callback'            => 'gero_validar_matricula_unitec',
        'permission_callback' => '__return_true',
    ] );
} );

function gero_validar_matricula_unitec_02( WP_REST_Request $request ) {
    global $wpdb;
    
    $matricula = sanitize_text_field( $request->get_param( 'matricula' ) );
    $url_origen = sanitize_text_field( $request->get_param( 'url_origen' ) ?? '' );
    
    if ( empty( $matricula ) ) {
        return new WP_REST_Response( [
            'success' => false,
            'error'   => 'matricula_vacia',
            'message' => 'Por favor ingresa tu matrícula.',
        ], 400 );
    }
    
    $tabla_habilitados = 'byw_usuarios_habilitados';
    
    // 🔍 Buscar usuario en tabla de habilitados
    $usuario = $wpdb->get_row( $wpdb->prepare(
        "SELECT id, cedula_matricula, nombre, carrera 
         FROM $tabla_habilitados 
         WHERE cedula_matricula = %s 
         LIMIT 1",
        $matricula
    ) );
    
    // ❌ Matrícula no válida
    if ( ! $usuario ) {
        gero_registrar_intento_validacion_unitec_02( $matricula, 'denied', $url_origen );
        return new WP_REST_Response( [
            'success' => false,
            'error'   => 'matricula_no_encontrada',
            'message' => 'La matrícula ingresada no está registrada. Verifica tu información.',
        ], 200 );
    }
    
    $user_id_habilitados = (int) $usuario->id;
    
    // ✅ Matrícula válida → Verificar historial previo
    $tiene_historial = gero_tiene_historial_previo_unitec_02( $matricula );
    
    // 🎯 Determinar flujo según si es recurrente o nuevo
    $flujo = $tiene_historial ? 'recurrente' : 'nuevo';
    
    // 📋 Si es nuevo, preparar para cuestionario
    $estado_cuestionario = 'no_completado';
    if ( ! $tiene_historial ) {
        $estado_cuestionario = 'pendiente';
    }
    
    // ✅ Registrar intento validación exitoso
    gero_registrar_intento_validacion_unitec_02( $matricula, 'allowed', $url_origen );
    
    return new WP_REST_Response( [
        'success'                => true,
        'user_id'                => $user_id_habilitados,
        'matricula'              => $matricula,
        'nombre'                 => $usuario->nombre,
        'carrera'                => $usuario->carrera,
        'flujo'                  => $flujo, // 'nuevo' o 'recurrente'
        'tiene_historial'        => $tiene_historial,
        'estado_cuestionario'    => $estado_cuestionario,
        'message'                => 'Matrícula validada correctamente.',
    ], 200 );
}

/**
 * Verifica si existe historial previo para una matrícula
 * 
 * @param string $matricula Cédula/matrícula del estudiante
 * @return bool True si tiene interacciones previas, false si es nuevo
 */
function gero_tiene_historial_previo_unitec_02( $matricula ) {
    global $wpdb;
    
    $tabla_coach = 'byw_coach_interacciones';
    $tabla_agente = 'byw_agente_retencion';
    
    // Verificar si existe registro en tabla de conversaciones del coach
    $tiene_conversacion = (bool) $wpdb->get_var( $wpdb->prepare(
        "SELECT COUNT(*) FROM $tabla_coach WHERE value_validador = %s LIMIT 1",
        $matricula
    ) );
    
    // Verificar si existe registro en tabla de hipótesis del agente
    $tiene_hipotesis = (bool) $wpdb->get_var( $wpdb->prepare(
        "SELECT COUNT(*) FROM $tabla_agente WHERE user_email = %s LIMIT 1",
        $matricula
    ) );
    
    return $tiene_conversacion || $tiene_hipotesis;
}

/**
 * Registra intento de validación en base de datos (para auditoría)
 * 
 * @param string $matricula
 * @param string $resultado 'allowed' o 'denied'
 * @param string $url_origen URL de origen del intento
 */
function gero_registrar_intento_validacion_unitec_02( $matricula, $resultado, $url_origen = '' ) {
    global $wpdb;
    
    $post_id = $url_origen ? url_to_postid( $url_origen ) : 0;
    $nombre_post = ( $post_id ) ? get_the_title( $post_id ) : 'Desconocido';
    
    $wpdb->insert(
        'byw_validacion_cuestionario',
        [
            'created_at'              => current_time( 'mysql' ),
            'tipo_validacion'         => 'Matrícula',
            'valor_validacion'        => $matricula,
            'resultado_validacion'    => $resultado,
            'url_origen'              => $url_origen,
            'post_name'               => $nombre_post,
        ],
        [ '%s', '%s', '%s', '%s', '%s', '%s' ]
    );
}

// ========================================
// 🔹 PROCESAMIENTO DEL CUESTIONARIO
// ========================================

/**
 * ENDPOINT: Recibe respuestas del cuestionario desde el frontend
 * 
 * FLUJO:
 * 1. Recibe array de respuestas: { P1, P2, P3, ..., P8 }
 * 2. Calcula puntuaciones por categoría usando motor_scoring
 * 3. Determina hipótesis principal (ordenadas por prioridad)
 * 4. Guarda en byw_agente_retencion
 * 5. Retorna hipótesis para inyectar en system_prompt
 */
add_action( 'rest_api_init', function () {
    register_rest_route( 'gero/v1', '/procesar-respuestas-cuestionario-02', [
        'methods'             => 'POST',
        'callback'            => 'gero_procesar_respuestas_cuestionario_unitec',
        'permission_callback' => '__return_true',
    ] );
} );

function gero_procesar_respuestas_cuestionario_unitec_02( WP_REST_Request $request ) {
    global $wpdb;
    
    $body = json_decode( $request->get_body(), true );
    
    // Parámetros esperados
    $user_id_habilitados = isset( $body['user_id'] ) ? intval( $body['user_id'] ) : 0;
    $matricula = sanitize_text_field( $body['matricula'] ?? '' );
    $respuestas = is_array( $body['respuestas'] ?? null ) ? $body['respuestas'] : [];
    
    // Validaciones básicas
    if ( ! $user_id_habilitados || empty( $matricula ) || empty( $respuestas ) ) {
        return new WP_REST_Response( [
            'success' => false,
            'error'   => 'parametros_incompletos',
            'message' => 'Faltan parámetros requeridos: user_id, matricula, respuestas.',
        ], 400 );
    }
    
    // ======= 📊 MOTOR DE HIPÓTESIS =======
    // Calcular puntuaciones de riesgo basadas en respuestas
    $puntuaciones = gero_calcular_puntuacion_riesgos_unitec_02( $respuestas );
    
    // Determinar hipótesis principales (ordenadas por prioridad)
    $hipotesis_ordenadas = gero_determinar_hipotesis_principales_unitec_02( $puntuaciones );
    
    // Construir lista legible de hipótesis
    $hipotesis_lista = array_map(
        function ( $categoria ) {
            return gero_obtener_etiqueta_hipotesis_unitec_02( $categoria );
        },
        array_keys( $hipotesis_ordenadas )
    );
    
    // ======= 💾 GUARDAR EN BASE DE DATOS =======
    $tabla_agente = 'byw_agente_retencion';
    
    // Verificar si ya existe registro para esta matrícula
    $registro_existente = $wpdb->get_var( $wpdb->prepare(
        "SELECT id FROM $tabla_agente WHERE user_email = %s LIMIT 1",
        $matricula
    ) );
    
    $datos_insertar = [
        'user_email'       => $matricula,
        'user_id'          => $user_id_habilitados,
        'riesgo_detectado' => wp_json_encode( array_keys( $hipotesis_ordenadas ) ),
    ];
    
    if ( $registro_existente ) {
        // Actualizar registro existente
        $wpdb->update(
            $tabla_agente,
            $datos_insertar,
            [ 'ID' => $registro_existente ],
            [ '%s', '%d', '%s' ],
            [ '%d' ]
        );
    } else {
        // Insertar nuevo registro
        $wpdb->insert(
            $tabla_agente,
            $datos_insertar,
            [ '%s', '%d', '%s' ]
        );
    }
    
    // Log de depuración
    error_log( '🎯 Hipótesis calculadas para ' . $matricula . ': ' . wp_json_encode( $hipotesis_lista ) );
    
    // ======= ✅ RETORNAR RESULTADO =======
    return new WP_REST_Response( [
        'success'                   => true,
        'matricula'                 => $matricula,
        'puntuaciones'              => $puntuaciones,
        'hipotesis_ordenadas'       => $hipotesis_ordenadas,
        'hipotesis_lista'           => $hipotesis_lista,
        'riesgo_principal'          => array_key_first( $hipotesis_ordenadas ) ?? 'desorientacion',
        'message'                   => 'Cuestionario procesado y hipótesis calculadas correctamente.',
    ], 200 );
}

// ========================================
// 🔹 INYECCIÓN DINÁMICA DE SYSTEM_PROMPT
// ========================================

/**
 * ENDPOINT: Construye el system_prompt dinámico para OpenAI
 * 
 * Inyecta:
 * - Datos del estudiante (nombre, carrera, matrícula)
 * - Resumen de respuestas del cuestionario
 * - Hipótesis de riesgo calculadas (ordenadas por prioridad)
 * - Instrucciones de intervención según hipótesis
 */
add_action( 'rest_api_init', function () {
    register_rest_route( 'gero/v1', '/construir-system-prompt-02', [
        'methods'             => 'GET',
        'callback'            => 'gero_construir_system_prompt_unitec',
        'permission_callback' => '__return_true',
    ] );
} );

function gero_construir_system_prompt_unitec_02( WP_REST_Request $request ) {
    global $wpdb;
    
    $user_id = intval( $request->get_param( 'user_id' ) );
    $matricula = sanitize_text_field( $request->get_param( 'matricula' ) );
    
    if ( ! $user_id || empty( $matricula ) ) {
        return new WP_REST_Response( [
            'success' => false,
            'error'   => 'parametros_incompletos',
            'message' => 'Faltan parámetros: user_id, matricula.',
        ], 400 );
    }
    
    // ======= 📋 OBTENER DATOS DEL USUARIO =======
    $tabla_habilitados = 'byw_usuarios_habilitados';
    $usuario = $wpdb->get_row( $wpdb->prepare(
        "SELECT nombre, carrera FROM $tabla_habilitados WHERE id = %d LIMIT 1",
        $user_id
    ) );
    
    if ( ! $usuario ) {
        return new WP_REST_Response( [
            'success' => false,
            'error'   => 'usuario_no_encontrado',
            'message' => 'Usuario no encontrado.',
        ], 404 );
    }
    
    // ======= 📊 OBTENER HIPÓTESIS Y RESPUESTAS =======
    $tabla_agente = 'byw_agente_retencion';
    $registro_agente = $wpdb->get_row( $wpdb->prepare(
        "SELECT respuestas_json, riesgo_detectado FROM $tabla_agente 
         WHERE user_email = %s LIMIT 1",
        $matricula
    ) );
    
    $riesgos = [];
    $resumen_respuestas = '';
    
    if ( $registro_agente ) {
        // Decodificar hipótesis
        $riesgos_json = json_decode( $registro_agente->riesgo_detectado, true );
        $riesgos = is_array( $riesgos_json ) ? $riesgos_json : [];
        
        // Generar resumen legible de respuestas para contexto
        $respuestas_raw = json_decode( $registro_agente->respuestas_json, true );
        if ( is_array( $respuestas_raw ) ) {
            $resumen_respuestas = gero_generar_resumen_respuestas_unitec_02( $respuestas_raw );
        }
    }
    
    // ======= 🏗️ CONSTRUIR SYSTEM_PROMPT =======
    // Convertir categorías a etiquetas legibles
    $riesgos_legibles = array_map( 'gero_obtener_etiqueta_hipotesis_unitec', $riesgos );
    $riesgos_lista = implode( ', ', $riesgos_legibles );
    
    $nombre = $usuario->nombre;
    $carrera = $usuario->carrera;
    
    // ======= 🔍 DETECTAR SI YA HA HABIDO SALUDO PREVIO =======
    $tabla_interacciones = 'byw_coach_interacciones';
    $interacciones_previas = $wpdb->get_results( $wpdb->prepare(
        "SELECT contenido FROM $tabla_interacciones WHERE user_id = %d AND tipo_interaccion = 'interaccion_agente' ORDER BY fecha_creacion DESC LIMIT 10",
        $user_id
    ) );
    
    $ya_ha_saludado = false;
    if ( ! empty( $interacciones_previas ) ) {
        foreach ( $interacciones_previas as $interaccion ) {
            $contenido = json_decode( $interaccion->contenido, true );
            if ( isset( $contenido['agente'] ) ) {
                $respuesta_agente = strtolower( $contenido['agente'] );
                if ( preg_match( '/^\s*(hola|buenos|saludos|qué tal|cómo estás|hey)\b/i', $respuesta_agente ) ) {
                    $ya_ha_saludado = true;
                    break;
                }
            }
        }
    }
    
    $instruccion_saludo = ! $ya_ha_saludado 
        ? "Si es el primer mensaje: Comienza con un breve saludo (máximo 5 palabras) y luego directo al punto."
        : "No saludes de nuevo. Ve directo al tema, continuando el flujo previo.";
    
    $system_prompt = <<<PROMPT
Eres Gero, agente de retención de UNITEC. $nombre es estudiante de $carrera, matrícula $matricula.

HIPÓTESIS DE RIESGO (ordenadas por relevancia):
$riesgos_lista

CONTEXTO:
$resumen_respuestas

INSTRUCCIONES CRÍTICAS:
- BREVEDAD EXTREMA: Máximo 30 palabras por respuesta. Si es necesario extenderse, máximo 50-60 palabras.
- $instruccion_saludo
- Continúa fluidamente: Si ya hay conversación previa, sigue el hilo sin repetir información.
- Valida hipótesis: ¿Sí? ¿En parte? ¿No?
- Si confirma → profundiza brevemente y ofrece 1-2 acciones concretas.
- Si descarta → explora siguiente hipótesis.
- Cierra siempre con pregunta abierta breve.
- Tono: Cálido, profesional, motivador.
PROMPT;
    
    // ======= ✅ RETORNAR SYSTEM_PROMPT =======
    return new WP_REST_Response( [
        'success'        => true,
        'system_prompt'  => $system_prompt,
        'nombre'         => $nombre,
        'carrera'        => $carrera,
        'matricula'      => $matricula,
        'riesgos'        => $riesgos,
        'riesgos_legibles' => $riesgos_legibles,
    ], 200 );
}

/**
 * Genera resumen legible de respuestas del cuestionario para contexto del prompt
 * 
 * @param array $respuestas Array de respuestas { P1, P2, ..., P8 }
 * @return string Resumen formateado
 */
function gero_generar_resumen_respuestas_unitec_02( $respuestas ) {
    $preguntas_etiquetas = [
        'P1' => 'Sensación inicial frente a los estudios',
        'P2' => 'Factor principal de inseguridad',
        'P3' => 'Preparación para la carrera',
        'P4' => 'Capacidad de gestionar tiempo y responsabilidades',
        'P5' => 'Dificultad si pierden fuente principal de financiamiento',
        'P6' => 'Esfuerzo requerido en educación media',
        'P7' => 'Facilidad para hacer amistades en entornos nuevos',
        'P8' => 'Comodidad con herramientas digitales',
    ];
    
    $resumen = '';
    foreach ( $respuestas as $pregunta_id => $respuesta ) {
        if ( isset( $preguntas_etiquetas[ $pregunta_id ] ) ) {
            $etiqueta = $preguntas_etiquetas[ $pregunta_id ];
            $resumen .= "- $etiqueta: $respuesta\n";
        }
    }
    
    return $resumen;
}

// ========================================
// 🔹 SWITCH/DERIVACIÓN POST-CUESTIONARIO
// ========================================

/**
 * ENDPOINT: Determina flujo post-cuestionario y activa derivación
 * 
 * LÓGICA DE DERIVACIÓN:
 * 
 * Opción A (ACTIVA): Iniciar Agente Generativo
 *   - Usa system_prompt dinámico construido
 *   - Llama a OpenAI/API con contexto del estudiante
 *   - Conversación con IA generativa
 * 
 * Opción B (FUTURE): Iniciar Flujo Estático de Intervención
 *   - Camino predefinido según hipótesis principal
 *   - Scripts y recursos estáticos
 *   - Menos flexible pero más controlado
 * 
 * Por defecto: Opción A está activada
 */
add_action( 'rest_api_init', function () {
    register_rest_route( 'gero/v1', '/derivar-post-cuestionario-02', [
        'methods'             => 'POST',
        'callback'            => 'gero_derivar_post_cuestionario_unitec',
        'permission_callback' => '__return_true',
    ] );
} );

function gero_derivar_post_cuestionario_unitec_02( WP_REST_Request $request ) {
    global $wpdb;
    
    $body = json_decode( $request->get_body(), true );
    
    $user_id = intval( $body['user_id'] ?? 0 );
    $matricula = sanitize_text_field( $body['matricula'] ?? '' );
    $riesgo_principal = sanitize_text_field( $body['riesgo_principal'] ?? '' );
    
    if ( ! $user_id || empty( $matricula ) ) {
        return new WP_REST_Response( [
            'success' => false,
            'error'   => 'parametros_incompletos',
            'message' => 'Faltan parámetros.',
        ], 400 );
    }
    
    // ======= 🎯 SWITCH DE DERIVACIÓN =======
    
    // OPCIÓN A (ACTIVA): Agente Generativo con OpenAI
    $modo_derivacion = defined( 'GERO_MODO_DERIVACION' ) ? GERO_MODO_DERIVACION : 'generativo';
    
    if ( $modo_derivacion === 'generativo' || $modo_derivacion === 'ia' ) {
        return gero_derivar_modo_generativo_unitec_02( $user_id, $matricula, $riesgo_principal );
    }
    
    // OPCIÓN B (FUTURE): Flujo Estático
    elseif ( $modo_derivacion === 'estatico' ) {
        return gero_derivar_modo_estatico_unitec_02( $user_id, $matricula, $riesgo_principal );
    }
    
    // Default: Generativo
    else {
        return gero_derivar_modo_generativo_unitec_02( $user_id, $matricula, $riesgo_principal );
    }
}

/**
 * OPCIÓN A: Derivar a Agente Generativo (OpenAI)
 * 
 * Prepara contexto y retorna instrucciones para que frontend
 * comience conversación con IA usando system_prompt dinámico
 */
function gero_derivar_modo_generativo_unitec_02( $user_id, $matricula, $riesgo_principal ) {
    return new WP_REST_Response( [
        'success'           => true,
        'modo'              => 'generativo',
        'user_id'           => $user_id,
        'matricula'         => $matricula,
        'riesgo_principal'  => $riesgo_principal,
        'instrucciones'     => [
            'tipo'      => 'openai_chat',
            'endpoint'  => '/wp-json/gero/v1/chat-openai-agente',
            'contexto'  => 'Construye system_prompt usando /wp-json/gero/v1/construir-system-prompt',
            'guardar'   => 'Guarda conversación en /wp-json/gero/v1/guardar-conversacion-agente',
        ],
        'mensaje'           => 'Iniciando conversación con Agente de Retención (Generativo)...',
    ], 200 );
}

/**
 * OPCIÓN B: Derivar a Flujo Estático (Future Implementation)
 * 
 * Ejecuta camino predefinido según hipótesis principal
 * Parámetro de configuración: define( 'GERO_MODO_DERIVACION', 'estatico' );
 */
function gero_derivar_modo_estatico_unitec_02( $user_id, $matricula, $riesgo_principal ) {
    // Mapear riesgo_principal a flujo estático
    $flujos_estaticos = [
        'desorientacion'   => [ 'recurso' => 'kit_psicoeducativo', 'url' => '/resources/desorientacion/' ],
        'preocupacion_economica' => [ 'recurso' => 'asesoria_finanzas', 'url' => '/resources/finanzas/' ],
        'desconexion_social'     => [ 'recurso' => 'conecta_comunidad', 'url' => '/resources/social/' ],
        // ... más flujos según necesidad
    ];
    
    $flujo = $flujos_estaticos[ $riesgo_principal ] ?? [ 'recurso' => 'default', 'url' => '/resources/' ];
    
    return new WP_REST_Response( [
        'success'           => true,
        'modo'              => 'estatico',
        'user_id'           => $user_id,
        'matricula'         => $matricula,
        'riesgo_principal'  => $riesgo_principal,
        'flujo_asignado'    => $flujo,
        'mensaje'           => 'Iniciando flujo estático de intervención para: ' . $riesgo_principal,
    ], 200 );
}

// ========================================
// 🔹 NUEVOS ENDPOINTS - CLASIFICACIÓN DE RIESGOS CON LLM
// ========================================

/**
 * Endpoint: Procesar fin del cuestionario
 * POST /wp-json/gero/v1/procesar-fin-cuestionario
 * 
 * Al finalizar el cuestionario, genera la primera clasificación de riesgos
 * y guarda en byw_agente_retencion
 */
add_action( 'rest_api_init', function () {
    register_rest_route( 'gero/v1', '/procesar-fin-cuestionario', [
        'methods'             => 'POST',
        'callback'            => 'agente_procesar_fin_cuestionario',
        'permission_callback' => '__return_true',
    ] );
} );

function agente_procesar_fin_cuestionario( $request ) {
    global $wpdb;
    
    $raw_body = $request->get_body();
    $params = json_decode( $raw_body, true );
    
    $user_id = isset( $params['user_id'] ) ? intval( $params['user_id'] ) : 0;
    $respuestas_json = isset( $params['respuestas'] ) ? wp_json_encode( $params['respuestas'] ) : '';
    $riesgos_detectados = isset( $params['riesgos'] ) ? wp_json_encode( $params['riesgos'] ) : '[]';
    
    if ( ! $user_id || empty( $respuestas_json ) ) {
        return new WP_Error( 'invalido', 'Faltan parámetros.', [ 'status' => 400 ] );
    }
    
    // Obtener email del usuario
    $tabla_habilitados = 'byw_usuarios_habilitados';
    $user_email = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT cedula_matricula FROM $tabla_habilitados WHERE id = %d LIMIT 1",
            $user_id
        )
    );
    
    if ( ! $user_email ) {
        return new WP_Error( 'invalido', 'Usuario no encontrado.', [ 'status' => 400 ] );
    }
    
    // Generar justificación de cuestionario en BACKGROUND (sin bloquear)
    wp_schedule_single_event( time(), 'gero_generar_clasificacion_cuestionario', [
        'user_id'             => $user_id,
        'user_email'          => $user_email,
        'respuestas_json'     => $respuestas_json,
        'riesgos_detectados'  => $riesgos_detectados,
    ] );
    
    return [ 'success' => true, 'message' => 'Cuestionario recibido. Procesando en background...' ];
}

/**
 * Hook para procesar cuestionario en background
 * Se ejecuta después de que se responda el cuestionario
 */
add_action( 'gero_generar_clasificacion_cuestionario', function ( $user_id, $user_email, $respuestas_json, $riesgos_detectados ) {
    global $wpdb;
    
    // Obtener nombre y carrera del usuario
    $tabla_habilitados = 'byw_usuarios_habilitados';
    $usuario = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT nombre, carrera FROM $tabla_habilitados WHERE id = %d LIMIT 1",
            $user_id
        )
    );
    
    if ( ! $usuario ) {
        error_log( '❌ Usuario no encontrado para clasificación: ' . $user_id );
        return;
    }
    
    try {
        // Extraer información de las respuestas conversacionales
        $respuestas_obj = isset( $params['respuestas'] ) ? $params['respuestas'] : [];
        $conversacion = isset( $params['conversacion'] ) ? $params['conversacion'] : [];
        
        // Extraer datos clave para contexto del LLM
        $motivacion_inicial = isset( $respuestas_obj['1'] ) ? sanitize_text_field( $respuestas_obj['1'] ) : '';
        $tipo_duda = isset( $respuestas_obj['2'] ) ? sanitize_text_field( $respuestas_obj['2'] ) : '';
        $claridad_carrera = isset( $respuestas_obj['3'] ) ? sanitize_text_field( $respuestas_obj['3'] ) : 'N/A';
        $duracion_concern = isset( $respuestas_obj['4'] ) ? sanitize_text_field( $respuestas_obj['4'] ) : '';
        $materias_concern = isset( $respuestas_obj['5'] ) ? sanitize_text_field( $respuestas_obj['5'] ) : '';
        $salida_laboral_concern = isset( $respuestas_obj['6'] ) ? sanitize_text_field( $respuestas_obj['6'] ) : '';
        $motivacion_ayudar = isset( $respuestas_obj['7'] ) ? sanitize_text_field( $respuestas_obj['7'] ) : '';
        $motivacion_demostrarse = isset( $respuestas_obj['8'] ) ? sanitize_text_field( $respuestas_obj['8'] ) : '';
        $motivacion_dinero = isset( $respuestas_obj['9'] ) ? sanitize_text_field( $respuestas_obj['9'] ) : '';
        
        // Construir contexto detallado para el LLM
        $contexto = "
El estudiante {$nombre} de la carrera {$carrera} reportó lo siguiente:

MOTIVACIÓN E INICIO:
- Motivación inicial: {$motivacion_inicial}/5
- Tipo de dudas: {$tipo_duda}
- Claridad de carrera: {$claridad_carrera}/5

PREOCUPACIONES IDENTIFICADAS:
- Duración de la carrera: {$duracion_concern}
- Comprensión de materias: {$materias_concern}
- Salida laboral: {$salida_laboral_concern}

MOTIVACIONES EXPRESADAS:
- Deseo de ayudar a otros: {$motivacion_ayudar}
- Busca demostrarse capacidad: {$motivacion_demostrarse}
- Motivación económica: {$motivacion_dinero}

CONVERSACIÓN:
" . wp_json_encode( $conversacion );
        
        // Llamar a OpenAI para generar justificación del cuestionario
        $justificacion_cuestionario = agente_clasificar_riesgo_con_llm(
            'cuestionario',
            $nombre,
            $carrera,
            $respuestas_obj,
            $contexto
        );
        
        // Crear o actualizar registro en byw_agente_retencion
        $tabla_agente = 'byw_agente_retencion';
        
        $existing = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT ID FROM $tabla_agente WHERE user_email = %s LIMIT 1",
                $user_email
            )
        );
        
        $data = [
            'user_email'      => $user_email,
            'user_id'         => $user_id,
            'prioridad_caso'  => 'pendiente',
            'justificacion'   => wp_json_encode( [ 'cuestionario' => $justificacion_cuestionario ] ),
            'riesgo_detectado' => wp_json_encode( [ 'respuestas_conversacionales' => true ] ),
        ];
        
        if ( $existing ) {
            $wpdb->update(
                $tabla_agente,
                $data,
                [ 'ID' => $existing ],
                [ '%s', '%d', '%s', '%s', '%s' ],
                [ '%d' ]
            );
        } else {
            $wpdb->insert(
                $tabla_agente,
                $data,
                [ '%s', '%d', '%s', '%s', '%s' ]
            );
        }
        
        error_log( '✅ Clasificación de cuestionario guardada para: ' . $user_email );
        
    } catch ( Exception $e ) {
        error_log( '❌ Error en clasificación de cuestionario: ' . $e->getMessage() );
    }
}, 10, 4 );

/**
 * Endpoint: Procesar fin de ruta
 * POST /wp-json/gero/v1/procesar-fin-ruta
 * 
 * Al finalizar la ruta, genera la segunda clasificación y actualiza prioridad_caso
 */
add_action( 'rest_api_init', function () {
    register_rest_route( 'gero/v1', '/procesar-fin-ruta', [
        'methods'             => 'POST',
        'callback'            => 'agente_procesar_fin_ruta',
        'permission_callback' => '__return_true',
    ] );
} );

function agente_procesar_fin_ruta( $request ) {
    global $wpdb;
    
    $raw_body = $request->get_body();
    $params = json_decode( $raw_body, true );
    
    $user_id = isset( $params['user_id'] ) ? intval( $params['user_id'] ) : 0;
    $ruta_seguida = isset( $params['ruta'] ) ? sanitize_text_field( $params['ruta'] ) : '';
    $conversacion = isset( $params['conversacion'] ) ? wp_json_encode( $params['conversacion'] ) : '[]';
    
    if ( ! $user_id || empty( $ruta_seguida ) ) {
        return new WP_Error( 'invalido', 'Faltan parámetros.', [ 'status' => 400 ] );
    }
    
    // Obtener email del usuario
    $tabla_habilitados = 'byw_usuarios_habilitados';
    $user_email = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT cedula_matricula FROM $tabla_habilitados WHERE id = %d LIMIT 1",
            $user_id
        )
    );
    
    if ( ! $user_email ) {
        return new WP_Error( 'invalido', 'Usuario no encontrado.', [ 'status' => 400 ] );
    }
    
    // Generar clasificación de ruta en BACKGROUND
    wp_schedule_single_event( time(), 'gero_generar_clasificacion_ruta', [
        'user_id'       => $user_id,
        'user_email'    => $user_email,
        'ruta_seguida'  => $ruta_seguida,
        'conversacion'  => $conversacion,
    ] );
    
    return [ 'success' => true, 'message' => 'Ruta finalizada. Procesando en background...' ];
}

/**
 * Hook para procesar ruta en background
 * Se ejecuta después de que se finaliza la ruta
 */
add_action( 'gero_generar_clasificacion_ruta', function ( $user_id, $user_email, $ruta_seguida, $conversacion ) {
    global $wpdb;
    
    // Obtener nombre y carrera del usuario
    $tabla_habilitados = 'byw_usuarios_habilitados';
    $usuario = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT nombre, carrera FROM $tabla_habilitados WHERE id = %d LIMIT 1",
            $user_id
        )
    );
    
    if ( ! $usuario ) {
        error_log( '❌ Usuario no encontrado para clasificación de ruta: ' . $user_id );
        return;
    }
    
    try {
        // Obtener justificación anterior del cuestionario
        $tabla_agente = 'byw_agente_retencion';
        $registro = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT justificacion FROM $tabla_agente WHERE user_email = %s LIMIT 1",
                $user_email
            )
        );
        
        // Extraer justificación anterior del JSON
        $justificacion_json = $registro ? json_decode( $registro->justificacion, true ) : [];
        $justificacion_anterior = $justificacion_json['cuestionario'] ?? '';
        
        // Llamar a OpenAI para generar justificación de la ruta
        $justificacion_ruta = agente_clasificar_riesgo_con_llm(
            'ruta',
            $usuario->nombre,
            $usuario->carrera,
            $conversacion,
            $ruta_seguida
        );
        
        // Combinar justificaciones
        $justificacion_completa = [
            'cuestionario' => $justificacion_anterior,
            'ruta'         => $justificacion_ruta,
        ];
        
        // Determinar prioridad basada en la respuesta de la IA
        $prioridad = agente_determinar_prioridad( $justificacion_ruta );
        
        // Actualizar registro con justificación combinada
        $data = [
            'prioridad_caso' => $prioridad,
            'justificacion'  => wp_json_encode( $justificacion_completa ),
        ];
        
        $wpdb->update(
            $tabla_agente,
            $data,
            [ 'user_email' => $user_email ],
            [ '%s', '%s' ],
            [ '%s' ]
        );
        
        error_log( '✅ Clasificación de ruta guardada para: ' . $user_email . ' - Prioridad: ' . $prioridad );
        
    } catch ( Exception $e ) {
        error_log( '❌ Error en clasificación de ruta: ' . $e->getMessage() );
    }
}, 10, 4 );

/**
 * Función para llamar a OpenAI y clasificar riesgos
 * 
 * @param string $etapa 'cuestionario' o 'ruta'
 * @param string $nombre Nombre del estudiante
 * @param string $carrera Carrera del estudiante
 * @param mixed $datos Datos a analizar (JSON string o array)
 * @param string $contexto_adicional Información adicional para el análisis
 * 
 * @return string Justificación del análisis (aprox. 30 palabras)
 */
function agente_clasificar_riesgo_con_llm( $etapa, $nombre, $carrera, $datos, $contexto_adicional = '' ) {
    // Validación de entrada
    if ( empty( $etapa ) || empty( $nombre ) || empty( $carrera ) ) {
        error_log( '❌ Parámetros incompletos para LLM' );
        return 'Error: datos incompletos.';
    }
    
    // Si $datos es string JSON, decodificar
    if ( is_string( $datos ) ) {
        $datos_array = json_decode( $datos, true );
        $datos_str = is_array( $datos_array ) ? wp_json_encode( $datos_array, JSON_PRETTY_PRINT ) : $datos;
    } else {
        $datos_str = is_array( $datos ) ? wp_json_encode( $datos, JSON_PRETTY_PRINT ) : (string) $datos;
    }
    
    // Construir prompt según etapa
    if ( $etapa === 'cuestionario' ) {
        $prompt = <<<PROMPT
Analiza el cuestionario conversacional de un estudiante de {$carrera}.

Nombre: {$nombre}

Información del cuestionario:
{$contexto_adicional}

Basado en las respuestas conversacionales del estudiante, identifica:
1. Su nivel de motivación inicial
2. Si sus dudas son internas (autoconfianza) o externas (carrera)
3. Preocupaciones académicas específicas
4. Motivaciones expresadas (ayudar, demostrarse, ganar dinero)
5. Claridad en su elección de carrera

Proporciona ÚNICAMENTE un JSON válido con esta estructura exacta:
{
    "justificacion": "Análisis de máximo 50 palabras: Resume motivación, tipo de dudas, preocupaciones clave y recomendación inicial de acompañamiento.",
    "riesgos_identificados": ["riesgo1", "riesgo2"]
}

Solo JSON, sin explicación adicional.
PROMPT;
    } else {
        // $etapa === 'ruta'
        $prompt = <<<PROMPT
Analiza la ruta de acompañamiento completada por un estudiante de {$carrera}.

Nombre: {$nombre}
Contexto: {$contexto_adicional}

Evaluación previa del cuestionario:
{$datos_str}

Basado en la intervención realizada durante la ruta, determina:
1. Si la intervención generó claridad o aumentó dudas
2. Cambio en motivación o confianza
3. Recomendaciones de seguimiento
4. Prioridad de intervención (alto/medio/bajo)

Proporciona ÚNICAMENTE un JSON válido con esta estructura exacta:
{
    "justificacion": "Análisis de máximo 50 palabras: Resume impacto de la intervención, cambios detectados y recomendación de prioridad.",
    "prioridad_sugerida": "alto|medio|bajo"
}

Solo JSON, sin explicación adicional.
PROMPT;
    }
    
    // Obtener API Key
    $api_key = defined( 'OPENAI_API_KEY' ) ? OPENAI_API_KEY : null;
    
    if ( ! $api_key ) {
        error_log( '❌ OPENAI_API_KEY no configurada' );
        return 'Error: API key no disponible.';
    }
    
    // Llamar a OpenAI
    $response = wp_remote_post( 'https://api.openai.com/v1/chat/completions', [
        'headers' => [
            'Authorization' => 'Bearer ' . $api_key,
            'Content-Type'  => 'application/json',
        ],
        'body'    => wp_json_encode( [
            'model'       => 'gpt-4o',
            'messages'    => [
                [
                    'role'    => 'system',
                    'content' => 'Eres un analizador de riesgos académicos. SIEMPRE devuelves SOLO un JSON válido sin explicación adicional.',
                ],
                [
                    'role'    => 'user',
                    'content' => $prompt,
                ],
            ],
            'temperature' => 0.5,
        ] ),
        'timeout' => 30,
    ] );
    
    // Manejar errores de conexión
    if ( is_wp_error( $response ) ) {
        error_log( '❌ Error al conectar con OpenAI: ' . $response->get_error_message() );
        return 'Error al conectar con LLM.';
    }
    
    // Parsear respuesta
    $response_body = json_decode( wp_remote_retrieve_body( $response ), true );
    
    if ( ! isset( $response_body['choices'][0]['message']['content'] ) ) {
        error_log( '❌ Respuesta inválida de OpenAI: ' . wp_json_encode( $response_body ) );
        return 'Error al procesar respuesta de LLM.';
    }
    
    $content = $response_body['choices'][0]['message']['content'];
    
    // Intentar parsear JSON desde la respuesta
    try {
        // Limpiar posibles espacios o caracteres de control
        $content = trim( $content );
        
        // Si la respuesta está envuelta en markdown, extraer
        if ( strpos( $content, '```json' ) !== false ) {
            preg_match( '/```json\s*(.*?)\s*```/s', $content, $matches );
            $content = isset( $matches[1] ) ? trim( $matches[1] ) : $content;
        } elseif ( strpos( $content, '```' ) !== false ) {
            preg_match( '/```\s*(.*?)\s*```/s', $content, $matches );
            $content = isset( $matches[1] ) ? trim( $matches[1] ) : $content;
        }
        
        // Parsear JSON
        $json_response = json_decode( $content, true );
        
        if ( json_last_error() !== JSON_ERROR_NONE ) {
            error_log( '⚠️ JSON inválido en respuesta de LLM: ' . $content );
            return 'Análisis completado pero con formato incorrecto.';
        }
        
        // Extraer justificación
        $justificacion = isset( $json_response['justificacion'] ) ? $json_response['justificacion'] : '';
        
        if ( empty( $justificacion ) ) {
            error_log( '⚠️ Justificación vacía en respuesta de LLM' );
            return 'Análisis sin justificación disponible.';
        }
        
        return $justificacion;
        
    } catch ( Exception $e ) {
        error_log( '❌ Excepción al procesar LLM: ' . $e->getMessage() );
        return 'Error al procesar respuesta de LLM.';
    }
}

/**
 * Función para determinar prioridad basada en la justificación
 * Puede ser expandida con lógica más sofisticada
 * 
 * @param string $justificacion Justificación del análisis
 * @return string 'alto', 'medio' o 'bajo'
 */
function agente_determinar_prioridad( $justificacion ) {
    // Palabras clave para cada nivel de prioridad
    $palabras_alto = [ 'crítico', 'urgente', 'grave', 'riesgo alto', 'inmediato', 'emergencia' ];
    $palabras_medio = [ 'moderado', 'importante', 'atención', 'seguimiento', 'monitoreo' ];
    
    $texto_lower = strtolower( $justificacion );
    
    // Contar coincidencias
    $contador_alto = 0;
    foreach ( $palabras_alto as $palabra ) {
        $contador_alto += substr_count( $texto_lower, $palabra );
    }
    
    $contador_medio = 0;
    foreach ( $palabras_medio as $palabra ) {
        $contador_medio += substr_count( $texto_lower, $palabra );
    }
    
    // Determinar prioridad
    if ( $contador_alto > 0 ) {
        return 'alto';
    } elseif ( $contador_medio > 0 ) {
        return 'medio';
    } else {
        return 'bajo';
    }
}

// ========================================
// 🔹 ENDPOINTS EXISTENTES (Compatibilidad)
// ========================================

/**
 * Endpoint existente: Guardar conversación del agente
 * (Mantiene compatibilidad con versión anterior)
 */
add_action( 'rest_api_init', function () {
    register_rest_route( 'gero/v1', '/guardar-conversacion-agente-02', [
        'methods'             => 'POST',
        'callback'            => 'agente_guardar_conversacion_unitec',
        'permission_callback' => '__return_true',
    ] );
} );

function agente_guardar_conversacion_unitec_02( $request ) {
    global $wpdb;
    
    $raw_body = $request->get_body();
    $params = json_decode( $raw_body, true );
    
    $user_id_habilitados = isset( $params['id'] ) ? intval( $params['id'] ) : 0;
    $texto = sanitize_textarea_field( $params['conversacion'] ?? '' );
    
    if ( ! $user_id_habilitados || empty( $texto ) ) {
        return new WP_Error( 'invalido', 'Faltan parámetros.', [ 'status' => 400 ] );
    }
    
    $tabla_habilitados = 'byw_usuarios_habilitados';
    $cedula_matricula = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT cedula_matricula FROM $tabla_habilitados WHERE id = %d LIMIT 1",
            $user_id_habilitados
        )
    );
    
    if ( ! $cedula_matricula ) {
        return new WP_Error( 'invalido', 'Usuario no encontrado.', [ 'status' => 400 ] );
    }
    
    $tabla = 'byw_coach_interacciones';
    $existing = $wpdb->get_var( $wpdb->prepare(
        "SELECT id FROM $tabla WHERE value_validador = %s LIMIT 1",
        $cedula_matricula
    ) );
    
    $data = [
        'value_validador'     => $cedula_matricula,
        'conversation_string' => $texto,
        'created_at'          => current_time( 'mysql', 1 ),
    ];
    
    if ( $existing ) {
        $wpdb->update( $tabla, $data, [ 'id' => $existing ], [ '%s', '%s', '%s' ], [ '%d' ] );
    } else {
        $wpdb->insert( $tabla, $data, [ '%s', '%s', '%s' ] );
    }
    
    return [ 'success' => true ];
}

/**
 * Endpoint: Guardar riesgos detectados en byw_agente_retencion
 */
add_action( 'rest_api_init', function () {
    register_rest_route( 'gero/v1', '/guardar-riesgos-agente-02', [
        'methods'             => 'POST',
        'callback'            => 'agente_guardar_riesgos_unitec',
        'permission_callback' => '__return_true',
    ] );
} );

function agente_guardar_riesgos_unitec_02( $request ) {
    global $wpdb;
    
    $raw_body = $request->get_body();
    $params = json_decode( $raw_body, true );
    
    $user_id = isset( $params['user_id'] ) ? intval( $params['user_id'] ) : 0;
    $riesgos = isset( $params['riesgos'] ) ? $params['riesgos'] : [];
    
    if ( ! $user_id || empty( $riesgos ) ) {
        return new WP_Error( 'invalido', 'Faltan parámetros.', [ 'status' => 400 ] );
    }
    
    // Obtener user_email del usuario desde byw_usuarios_habilitados
    $tabla_habilitados = 'byw_usuarios_habilitados';
    $user_email = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT cedula_matricula FROM $tabla_habilitados WHERE id = %d LIMIT 1",
            $user_id
        )
    );
    
    if ( ! $user_email ) {
        return new WP_Error( 'invalido', 'Usuario no encontrado.', [ 'status' => 400 ] );
    }
    
    // Guardar en byw_agente_retencion usando user_email
    $tabla = 'byw_agente_retencion';
    $riesgo_json = wp_json_encode( $riesgos );
    
    $existing = $wpdb->get_var( $wpdb->prepare(
        "SELECT id FROM $tabla WHERE user_email = %s LIMIT 1",
        $user_email
    ) );
    
    $data = [
        'user_email'         => $user_email,
        'riesgo_detectado'   => $riesgo_json,
        'ultima_actividad'   => current_time( 'mysql', 1 ),
    ];
    
    if ( $existing ) {
        $wpdb->update( $tabla, $data, [ 'id' => $existing ], [ '%s', '%s', '%s' ], [ '%d' ] );
    } else {
        $wpdb->insert( $tabla, $data, [ '%s', '%s', '%s' ] );
    }
    
    return [ 'success' => true, 'message' => 'Riesgos guardados correctamente.' ];
}

/**
 * Endpoint existente: Obtener datos del usuario
 * (Mantiene compatibilidad con versión anterior)
 */
add_action( 'rest_api_init', function () {
    register_rest_route( 'gero/v1', '/usuarios-habilitados-02', [
        'methods'             => 'GET',
        'callback'            => 'gero_usuarios_agente_unitec',
        'permission_callback' => '__return_true',
    ] );
} );

function gero_usuarios_agente_unitec_02( WP_REST_Request $request ) {
    global $wpdb;
    
    $user_id = intval( $request->get_param( 'id' ) );
    
    if ( ! $user_id ) {
        return new WP_REST_Response( [ 'error' => true, 'message' => 'Falta id.' ], 400 );
    }
    
    $tabla = 'byw_usuarios_habilitados';
    $row = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT nombre, carrera FROM $tabla WHERE id = %d LIMIT 1",
            $user_id
        )
    );
    
    if ( ! $row ) {
        return new WP_REST_Response( [ 'error' => true, 'message' => 'Usuario no encontrado.' ], 404 );
    }
    
    return new WP_REST_Response( [
        'nombre' => $row->nombre,
        'carrera' => $row->carrera,
    ], 200 );
}

/**
 * Endpoint existente: Traer última conversación
 * (Mantiene compatibilidad con versión anterior)
 */
add_action( 'rest_api_init', function () {
    register_rest_route( 'gero/v1', '/last-conversation-02', [
        'methods'             => 'GET',
        'callback'            => 'gero_last_conversation_agente_unitec',
        'permission_callback' => '__return_true',
    ] );
} );

function gero_last_conversation_agente_unitec_02( WP_REST_Request $request ) {
    global $wpdb;
    
    $value_validador = sanitize_text_field( $request->get_param( 'value_validador' ) );
    $table = 'byw_coach_interacciones';
    
    if ( empty( $value_validador ) ) {
        return new WP_REST_Response( [ 'success' => false, 'message' => 'Falta value_validador.' ], 400 );
    }
    
    $row = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT conversation_string FROM $table WHERE value_validador = %s LIMIT 1",
            $value_validador
        )
    );
    
    if ( ! $row ) {
        return new WP_REST_Response( [ 'success' => false, 'message' => 'Sin historial previo.' ], 200 );
    }
    
    return new WP_REST_Response( [ 'success' => true, 'conversation_string' => $row->conversation_string ], 200 );
}

/**
 * Endpoint existente: Chat OpenAI (sin cambios)
 */
add_action( 'rest_api_init', function () {
    register_rest_route( 'gero/v1', '/chat-openai-agente-02', [
        'methods'             => 'POST',
        'callback'            => 'gero_chat_openai_agente_unitec',
        'permission_callback' => '__return_true',
    ] );
} );

if ( ! function_exists( 'gero_chat_openai_agente_unitec' ) ) {
    function gero_chat_openai_agente_unitec_02( $request ) {
        global $wpdb;
        
        $body = $request->get_json_params();
        $user_id = intval( $body['user_id'] ?? 0 );
        $matricula = sanitize_text_field( $body['matricula'] ?? '' );
        $message = sanitize_textarea_field( $body['message'] ?? '' );
        
        if ( ! $user_id || empty( $matricula ) || empty( $message ) ) {
            return new WP_REST_Response( [
                'success' => false,
                'error'   => 'parametros_incompletos',
                'message' => 'Faltan parámetros requeridos.',
            ], 400 );
        }
        
        // ======= 🏗️ OBTENER SYSTEM_PROMPT DINÁMICO =======
        $tabla_habilitados = 'byw_usuarios_habilitados';
        $usuario = $wpdb->get_row( $wpdb->prepare(
            "SELECT nombre, carrera FROM $tabla_habilitados WHERE id = %d LIMIT 1",
            $user_id
        ) );
        
        if ( ! $usuario ) {
            return new WP_REST_Response( [
                'success' => false,
                'error'   => 'usuario_no_encontrado',
            ], 404 );
        }
        
        // ======= 📊 OBTENER HIPÓTESIS Y RESPUESTAS =======
        $tabla_agente = 'byw_agente_retencion';
        $registro_agente = $wpdb->get_row( $wpdb->prepare(
            "SELECT respuestas_json, riesgo_detectado FROM $tabla_agente 
             WHERE user_email = %s LIMIT 1",
            $matricula
        ) );
        
        $riesgos = [];
        $resumen_respuestas = '';
        
        if ( $registro_agente ) {
            $riesgos_json = json_decode( $registro_agente->riesgo_detectado, true );
            $riesgos = is_array( $riesgos_json ) ? $riesgos_json : [];
            
            $respuestas_raw = json_decode( $registro_agente->respuestas_json, true );
            if ( is_array( $respuestas_raw ) ) {
                $resumen_respuestas = gero_generar_resumen_respuestas_unitec_02( $respuestas_raw );
            }
        }
        
        // ======= 🏗️ CONSTRUIR SYSTEM_PROMPT =======
        $riesgos_legibles = array_map( 'gero_obtener_etiqueta_hipotesis_unitec', $riesgos );
        $riesgos_lista = implode( ', ', $riesgos_legibles );
        
        $nombre = $usuario->nombre;
        $carrera = $usuario->carrera;
        
        // ======= ✅ DETECTAR SI DEBE SALUDAR =======
        // Saludar solo en sesión nueva o después de 2-3 horas
        $table_interacciones = 'byw_coach_interacciones';
        $ultima_interaccion = $wpdb->get_row( $wpdb->prepare(
            "SELECT fecha_creacion FROM $table_interacciones 
             WHERE user_id = %d AND tipo_interaccion = 'interaccion_agente'
             ORDER BY fecha_creacion DESC LIMIT 1",
            $user_id
        ) );
        
        $debe_saludar = false;
        if ( ! $ultima_interaccion ) {
            // Primera interacción - saludar
            $debe_saludar = true;
        } else {
            // Verificar si han pasado 2+ horas
            $ultima_hora = strtotime( $ultima_interaccion->fecha_creacion );
            $ahora = current_time( 'timestamp' );
            $diferencia_horas = ( $ahora - $ultima_hora ) / 3600;
            
            if ( $diferencia_horas >= 2 ) {
                $debe_saludar = true;
            }
        }
        
        $instruccion_saludo = $debe_saludar 
            ? "Si es el primer mensaje: Comienza con saludo muy breve (máximo 5 palabras), luego directo al punto."
            : "NO saludes. Ve directo al punto continuando el flujo previo.";
        
        $system_prompt = <<<PROMPT
Eres Gero, agente de retención de UNITEC. $nombre, estudiante de $carrera, matrícula $matricula.

HIPÓTESIS (ordenadas por relevancia):
$riesgos_lista

CONTEXTO:
$resumen_respuestas

INSTRUCCIONES CRÍTICAS:
- MÁXIMA BREVEDAD: Preferiblemente 30 palabras. Máximo absoluto 50-60 palabras.
- $instruccion_saludo
- Continúa fluidamente: Si hay conversación previa, mantén el hilo sin repetir.
- Valida hipótesis: ¿Sí/En parte/No?
- Confirma → profundiza y 1-2 acciones concretas.
- Descarta → siguiente hipótesis.
- Pregunta abierta breve al cierre.
- Tono: Cálido, profesional, motivador.
PROMPT;
        
        // ======= 📝 CONSTRUIR MENSAJES PARA OpenAI - INCLUIR HISTORIAL =======
        $messages = [
            [
                'role'    => 'system',
                'content' => $system_prompt,
            ],
        ];
        
        // ======= 📚 LEER HISTORIAL DE CONVERSACIÓN ANTERIOR =======
        $historial = $wpdb->get_results( $wpdb->prepare(
            "SELECT tipo_interaccion, contenido FROM $table_interacciones 
             WHERE user_id = %d AND tipo_interaccion IN ('respuesta_cuestionario', 'interaccion_agente')
             ORDER BY fecha_creacion ASC LIMIT 50",
            $user_id
        ) );
        
        // Agregar mensajes previos al array de mensajes
        if ( ! empty( $historial ) ) {
            foreach ( $historial as $item ) {
                $contenido = json_decode( $item->contenido, true );
                
                // Si es una interacción anterior con el agente
                if ( $item->tipo_interaccion === 'interaccion_agente' && isset( $contenido['usuario'] ) && isset( $contenido['agente'] ) ) {
                    // Agregar mensaje del usuario
                    $messages[] = [
                        'role'    => 'user',
                        'content' => $contenido['usuario'],
                    ];
                    // Agregar respuesta del agente
                    $messages[] = [
                        'role'    => 'assistant',
                        'content' => $contenido['agente'],
                    ];
                }
            }
        }
        
        // Agregar el mensaje actual del usuario
        $messages[] = [
            'role'    => 'user',
            'content' => $message,
        ];
        
        // ======= 🔐 OBTENER API KEY =======
        $api_key = defined( 'OPENAI_API_KEY' ) ? OPENAI_API_KEY : null;
        
        if ( ! $api_key ) {
            error_log( '❌ OPENAI_API_KEY no configurada' );
            return new WP_REST_Response( [
                'success' => false,
                'error'   => 'api_key_no_configurada',
                'message' => 'La API Key de OpenAI no está configurada en el servidor.',
            ], 500 );
        }
        
        // ======= 🌐 LLAMAR A OpenAI =======
        $response = wp_remote_post( 'https://api.openai.com/v1/chat/completions', [
            'headers' => [
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type'  => 'application/json',
            ],
            'body'    => wp_json_encode( [
                'model'    => 'gpt-4o',
                'messages' => $messages,
            ] ),
            'timeout' => 30,
        ] );
        
        if ( is_wp_error( $response ) ) {
            error_log( '❌ Error al conectar con OpenAI: ' . $response->get_error_message() );
            return new WP_REST_Response( [
                'success' => false,
                'error'   => 'error_openai_conexion',
                'message' => 'Error al conectar con OpenAI: ' . $response->get_error_message(),
            ], 500 );
        }
        
        $response_body = json_decode( wp_remote_retrieve_body( $response ), true );
        
        if ( ! isset( $response_body['choices'][0]['message']['content'] ) ) {
            error_log( '❌ Respuesta inválida de OpenAI: ' . wp_json_encode( $response_body ) );
            return new WP_REST_Response( [
                'success' => false,
                'error'   => 'respuesta_openai_invalida',
                'message' => 'No se pudo procesar la respuesta de OpenAI.',
            ], 500 );
        }
        
        $reply = $response_body['choices'][0]['message']['content'];
        
        // ======= 💾 GUARDAR INTERACCIÓN EN BASE DE DATOS =======
        $contenido = [
            'usuario' => $message,
            'agente'  => $reply,
        ];
        
        $wpdb->insert( $table_interacciones, [
            'user_id'           => $user_id,
            'tipo_interaccion'  => 'interaccion_agente',
            'contenido'         => wp_json_encode( $contenido ),
            'riesgo_detectado'  => '',
            'fecha_creacion'    => current_time( 'mysql' ),
        ] );
        
        error_log( "[GERO AGENTE] Interacción guardada - Usuario: #$user_id - Mensaje: " . substr( $message, 0, 50 ) . "..." );
        
        // ======= ✅ RETORNAR RESPUESTA =======
        return new WP_REST_Response( [
            'success'   => true,
            'respuesta' => $reply,
            'message'   => $reply,
        ], 200 );
    }
}

// ========================================
// 🔹 SHORTCODE PARA INCRUSTAR EN WORDPRESS
// ========================================
/**
 * Shortcode: [agente-retencion-unitec-02]
 * 
 * Sirve la aplicación React compilada en /dist/
 * Retorna el HTML completo sin WordPress
 */
add_shortcode( 'agente-retencion-unitec-02', function ( $atts ) {
    // Buscar index.html en diferentes ubicaciones
    $dist_path = null;
    $base_url = null;
    
    // RUTA 1: Dentro del plugin
    if ( file_exists( plugin_dir_path( __FILE__ ) . 'dist/index.html' ) ) {
        $dist_path = plugin_dir_path( __FILE__ ) . 'dist/index.html';
        $base_url = plugin_dir_url( __FILE__ ) . 'dist/';
    }
    // RUTA 2: Alternativa del plugin
    elseif ( file_exists( WP_PLUGIN_DIR . '/agente-retencion-unitec-02/dist/index.html' ) ) {
        $dist_path = WP_PLUGIN_DIR . '/agente-retencion-unitec-02/dist/index.html';
        $base_url = plugins_url( 'dist/', 'agente-retencion-unitec-02/agente-retencion-unitec-02.php' );
    }

    if ( $dist_path && file_exists( $dist_path ) ) {
        // Leer el HTML
        $html = file_get_contents( $dist_path );
        
        // Reescribir rutas de assets para que apunten a la ubicación correcta del plugin
        // Esto reemplaza referencias de /assets/ con la URL correcta del plugin
        if ( $base_url ) {
            // Reemplazar /assets/ por la URL completa del plugin
            $html = str_replace( 'href="/assets/', 'href="' . rtrim( $base_url, '/' ) . '/assets/', $html );
            $html = str_replace( 'src="/assets/', 'src="' . rtrim( $base_url, '/' ) . '/assets/', $html );
            // También manejar rutas relativas ./assets/ (en caso de que existan)
            $html = str_replace( 'href="./assets/', 'href="' . rtrim( $base_url, '/' ) . '/assets/', $html );
            $html = str_replace( 'src="./assets/', 'src="' . rtrim( $base_url, '/' ) . '/assets/', $html );
        }
        
        // Salir de WordPress completamente para evitar conflictos
        @header( 'Content-Type: text/html; charset=utf-8' );
        @header( 'X-Frame-Options: SAMEORIGIN' );
        @header( 'X-Content-Type-Options: nosniff' );
        @header( 'X-UA-Compatible: IE=edge' );
        
        // Prevenir cachés que puedan interferir
        @header( 'Cache-Control: no-cache, no-store, must-revalidate' );
        @header( 'Pragma: no-cache' );
        @header( 'Expires: 0' );
        
        // Retornar el HTML con assets correctamente apuntados
        // Este exit asegura que solo se carga UNITEC, nada más
        echo $html;
        exit();
    }

    // Si no encontró, mostrar error simple
    return '<div style="padding: 20px; background: #fee; border: 2px solid #f00; border-radius: 4px; color: #c33; font-family: monospace;">
        <strong>⚠️ Error: No se encontró /dist/index.html</strong>
    </div>';
} );

/**
 * ========================================
 * 🔹 GUARDAR ESTADO DE CRISIS (SAFETY PROTOCOL)
 * ========================================
 * Guarda el estado de la conversación cuando se detecta una crisis emocional
 * Permite reanudación posterior sin perder contexto
 */
/**
 * Función auxiliar: Generar síntesis de crisis
 */
function gero_generar_sintesis_crisis( $crisis_marker, $conversation_state ) {
    // Palabras clave de crisis extrema
    $keywords_extremo = [
        'suicidio', 'matarme', 'morir', 'muerte', 'no quiero vivir',
        'ending my life', 'quitarme la vida', 'mejor muerto', 'ya no aguanto',
        'no soporto', 'automutilación', 'cortarme', 'autolesión', 'me duele',
        'nadie me quiere', 'estoy solo', 'depresión severa', 'bipolar crítico'
    ];
    
    // Palabras clave de crisis alta
    $keywords_alto = [
        'depresión', 'ansiedad severa', 'pánico', 'ataque', 'miedo',
        'stress extremo', 'acoso', 'violencia', 'abuso', 'trauma',
        'discriminación', 'bullying', 'aislado'
    ];
    
    $input = strtolower( $conversation_state . ' ' . $crisis_marker );
    
    // Detectar tipo de crisis
    $es_extremo = false;
    $es_alto = false;
    
    foreach ( $keywords_extremo as $keyword ) {
        if ( strpos( $input, $keyword ) !== false ) {
            $es_extremo = true;
            break;
        }
    }
    
    if ( ! $es_extremo ) {
        foreach ( $keywords_alto as $keyword ) {
            if ( strpos( $input, $keyword ) !== false ) {
                $es_alto = true;
                break;
            }
        }
    }
    
    // Determinar tipo y síntesis
    $tipo_crisis = $es_extremo ? 'extrema' : ($es_alto ? 'alta' : 'moderada');
    
    // Generar síntesis breve CON tipo de crisis incluido
    if ( $es_extremo ) {
        $sintesis = '[CRISIS EXTREMA] Crisis emocional severa detectada. Riesgo de autolesión o ideación suicida. Requiere atención inmediata.';
    } elseif ( $es_alto ) {
        $sintesis = '[CRISIS ALTA] Situación de estrés emocional significativa detectada. Requiere seguimiento prioritario.';
    } else {
        $sintesis = '[CRISIS MODERADA] Indicadores de malestar emocional identificados. Se requiere atención especializada.';
    }
    
    return [
        'justificacion' => $sintesis,
        'tipo_crisis'   => $tipo_crisis,
    ];
}

add_action( 'rest_api_init', function () {
    register_rest_route( 'gero/v1', '/guardar-conversation-state', [
        'methods'             => 'POST',
        'callback'            => function ( WP_REST_Request $request ) {
            global $wpdb;
            
            $params = $request->get_json_params();
            $user_id = $params['id'] ?? null;
            $conversation_state = $params['conversation_state'] ?? null;
            $crisis_marker = $params['crisis_marker'] ?? '[STATUS: INTERRUPTED_BY_SAFETY]';
            
            if ( ! $user_id || ! $conversation_state ) {
                return new WP_REST_Response( [ 'error' => 'Falta user_id o conversation_state' ], 400 );
            }
            
            // Generar síntesis de la crisis
            $crisis_data = gero_generar_sintesis_crisis( $crisis_marker, $conversation_state );
            
            // Usar tabla existente: byw_agente_retencion
            $table_agente = 'byw_agente_retencion';
            
            // Verificar si existe registro para este user_id
            $existing = $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT ID FROM $table_agente WHERE user_id = %d LIMIT 1",
                    intval( $user_id )
                )
            );
            
            // Preparar datos para guardar
            // justificacion: contiene tipo de crisis + descripción breve
            // prioridad_caso: siempre "alto"
            // riesgo_detectado: NO se modifica (solo para riesgos del questionnaire)
            $data_to_save = [
                'user_id'           => intval( $user_id ),
                'justificacion'     => $crisis_data['justificacion'],
                'prioridad_caso'    => 'alto',
            ];
            
            $data_types = [ '%d', '%s', '%s' ];
            
            // Guardar o actualizar registro en byw_agente_retencion
            if ( $existing ) {
                $wpdb->update(
                    $table_agente,
                    $data_to_save,
                    [ 'ID' => $existing ],
                    $data_types,
                    [ '%d' ]
                );
            } else {
                $wpdb->insert(
                    $table_agente,
                    $data_to_save,
                    $data_types
                );
            }
            
            // Registrar evento en logs para auditoría
            error_log( "[GERO CRISIS] User #$user_id - Tipo: {$crisis_data['tipo_crisis']} - Síntesis: {$crisis_data['justificacion']} - " . date( 'Y-m-d H:i:s' ) );
            
            return new WP_REST_Response( [
                'success'     => true,
                'message'     => 'Crisis registrada con prioridad alto',
                'prioridad'   => 'alto',
                'justificacion' => $crisis_data['justificacion'],
            ], 200 );
        },
        'permission_callback' => '__return_true',
    ] );
} );
/**
 * Detecta palabras clave de crisis en el texto del usuario
 * Sincronizado con crisisSafety.ts del frontend
 * 
 * @param string $texto Texto a analizar
 * @return array Array con ['detected' => true/false, 'level' => 'extreme'|'high'|'none', 'keywords' => []]
 */
function gero_detectar_crisis( $texto ) {
    if ( empty( $texto ) ) {
        return [
            'detected'  => false,
            'level'     => 'none',
            'keywords'  => [],
        ];
    }
    
    // Normalizar texto: convertir a minúsculas y remover acentos
    $texto_normalizado = strtolower( $texto );
    $texto_normalizado = remove_accents( $texto_normalizado );
    
    // Palabras clave de riesgo EXTREMO (Prioridad Máxima)
    $extreme_keywords = [
        'suicidio',
        'suicidarme',
        'suicidate',
        'me quiero suicidar',
        'voy a suicidarme',
        'quiero matarme',
        'matarme',
        'quitarme la vida',
        'no quiero vivir',
        'no quiero volver',
        'desesperacion total',
        'desesperado',
        'desesperada',
        'autolesion',
        'cortarme',
        'lastimarme',
        'hacerme daño',
        'ya no puedo',
        'no puedo mas',
        'no aguanto mas',
        'cansado de vivir',
        'cansada de vivir',
        'no tengo razon para vivir',
        'mejor si no estuviera',
        'mejor muerto',
        'todos estarian mejor sin mi',
        'sin razon para vivir',
        'sin motivo para vivir',
        'vida sin sentido',
        'deseo de morir',
        'quiero desaparecer',
        'quiero irme',
        'acabar con todo',
    ];
    
    // Palabras clave de riesgo ALTO (Depresión/Ansiedad severa)
    $high_keywords = [
        'depresion',
        'deprimido',
        'deprimida',
        'muy deprimido',
        'ansiedad severa',
        'ansiedad extrema',
        'panico',
        'ataque de panico',
        'ataques de panico',
        'panico constante',
        'quiero morir',
        'deseo de morir',
        'pensamientos de muerte',
        'pensando en la muerte',
        'todo es sin sentido',
        'nada tiene sentido',
        'soy un fracaso',
        'soy inutil',
        'soy basura',
        'no sirvo para nada',
        'no merezco vivir',
        'nadie me quiere',
        'nadie me ama',
        'estoy solo/a',
        'estoy sola',
        'estoy solo',
        'me siento solo',
        'me siento sola',
        'me siento muy mal',
        'no aguanto esta vida',
        'no puedo con esto',
        'todo me afecta mucho',
        'he fracasado',
        'he perdido todo',
        'no tengo esperanza',
        'sin esperanza',
        'sin futuro',
        'me duele mucho',
        'es insoportable',
        'insoportable',
        'no veo salida',
        'sin salida',
        'quiero escapar',
        'quiero huir',
    ];
    
    // Buscar palabras clave de riesgo EXTREMO
    $detected_keywords = [];
    foreach ( $extreme_keywords as $keyword ) {
        if ( strpos( $texto_normalizado, $keyword ) !== false ) {
            $detected_keywords[] = $keyword;
        }
    }
    
    if ( ! empty( $detected_keywords ) ) {
        return [
            'detected'  => true,
            'level'     => 'extreme',
            'keywords'  => $detected_keywords,
        ];
    }
    
    // Buscar palabras clave de riesgo ALTO
    foreach ( $high_keywords as $keyword ) {
        if ( strpos( $texto_normalizado, $keyword ) !== false ) {
            $detected_keywords[] = $keyword;
        }
    }
    
    if ( ! empty( $detected_keywords ) ) {
        return [
            'detected'  => true,
            'level'     => 'high',
            'keywords'  => $detected_keywords,
        ];
    }
    
    return [
        'detected'  => false,
        'level'     => 'none',
        'keywords'  => [],
    ];
}

/**
 * Endpoint: Guardar interacciones en tiempo real
 * POST /wp-json/gero/v1/guardar-interacciones
 * 
 * Guarda las interacciones a medida que ocurren en byw_coach_interacciones
 */
add_action( 'rest_api_init', function () {
    register_rest_route( 'gero/v1', '/guardar-interacciones', [
        'methods'             => 'POST',
        'callback'            => 'gero_guardar_interacciones',
        'permission_callback' => '__return_true',
    ] );
} );

function gero_guardar_interacciones( WP_REST_Request $request ) {
    global $wpdb;
    
    $params = $request->get_json_params();
    
    $user_id = isset( $params['user_id'] ) ? intval( $params['user_id'] ) : 0;
    $tipo_interaccion = isset( $params['tipo'] ) ? sanitize_text_field( $params['tipo'] ) : '';
    $contenido = isset( $params['contenido'] ) ? wp_json_encode( $params['contenido'] ) : '';
    $riesgo_detectado = isset( $params['riesgo_detectado'] ) ? wp_json_encode( $params['riesgo_detectado'] ) : '';
    
    if ( ! $user_id || empty( $tipo_interaccion ) ) {
        return new WP_REST_Response( 
            [ 'error' => 'Faltan parámetros requeridos (user_id, tipo)' ], 
            400 
        );
    }
    
    // ========================================
    // 🔹 DETECCIÓN AUTOMÁTICA DE CRISIS
    // ========================================
    // Si el tipo es "crisis_detectada", marcar como tal
    // De lo contrario, analizar el contenido para detectar crisis
    
    if ( $tipo_interaccion !== 'crisis_detectada' && isset( $params['contenido'] ) ) {
        $contenido_obj = $params['contenido'];
        
        // Extraer texto del mensaje para análisis
        $texto_analizar = '';
        
        if ( isset( $contenido_obj['mensaje'] ) ) {
            $texto_analizar = $contenido_obj['mensaje'];
        } elseif ( isset( $contenido_obj['answer'] ) ) {
            $texto_analizar = $contenido_obj['answer'];
        } elseif ( is_string( $contenido_obj ) ) {
            $texto_analizar = $contenido_obj;
        }
        
        // Detectar crisis en el texto
        if ( ! empty( $texto_analizar ) ) {
            $crisis_detection = gero_detectar_crisis( $texto_analizar );
            
            // Si se detecta crisis, actualizar el tipo de interacción
            if ( $crisis_detection['detected'] ) {
                $tipo_interaccion = 'crisis_detectada';
                
                // Actualizar el objeto de riesgo detectado
                $riesgo_detectado = wp_json_encode( [
                    'tipo'        => 'crisis',
                    'nivel'       => $crisis_detection['level'],
                    'palabras_clave' => $crisis_detection['keywords'],
                    'timestamp'   => current_time( 'mysql' ),
                ] );
                
                error_log( "[GERO CRISIS] ¡CRISIS DETECTADA! Nivel: {$crisis_detection['level']}, Usuario: #$user_id, Palabras: " . implode( ', ', $crisis_detection['keywords'] ) );
            }
        }
    }
    
    $table_interacciones = 'byw_coach_interacciones';
    $table_agente = 'byw_agente_retencion';
    
    // Guardar en byw_coach_interacciones
    $data_interacciones = [
        'user_id'           => $user_id,
        'tipo_interaccion'  => $tipo_interaccion,
        'contenido'         => $contenido,
        'riesgo_detectado'  => $riesgo_detectado,
        'fecha_creacion'    => current_time( 'mysql' ),
    ];
    
    $result = $wpdb->insert( $table_interacciones, $data_interacciones );
    
    if ( $result === false ) {
        error_log( '[GERO INTERACCIONES ERROR] Insert failed: ' . $wpdb->last_error );
        return new WP_REST_Response( 
            [ 'error' => 'Error al guardar interacción', 'db_error' => $wpdb->last_error ], 
            500 
        );
    }
    
    // ========================================
    // 🔹 ACTUALIZAR byw_agente_retencion
    // ========================================
    
    // Obtener usuario por ID
    $user_email = $wpdb->get_var(
        $wpdb->prepare( "SELECT user_email FROM $wpdb->users WHERE ID = %d", $user_id )
    );
    
    if ( $user_email ) {
        // Obtener registro existente
        $existing = $wpdb->get_row(
            $wpdb->prepare( "SELECT * FROM $table_agente WHERE user_email = %s LIMIT 1", $user_email ),
            OBJECT
        );
        
        // Generar justificación según tipo de interacción
        $justificacion_nueva = '';
        
        if ( $tipo_interaccion === 'cuestionario_completado' ) {
            // Interpretar respuestas del cuestionario para generar justificación
            $contenido_obj = is_array( $params['contenido'] ) ? $params['contenido'] : [];
            $justificacion_nueva = gero_generar_justificacion_cuestionario( $contenido_obj );
        } elseif ( $tipo_interaccion === 'respuesta_cuestionario' ) {
            // Generar justificación para respuesta individual
            $justificacion_nueva = gero_generar_justificacion_respuesta( $params );
        } elseif ( strpos( $tipo_interaccion, 'ruta' ) !== false ) {
            // Generar justificación para selección de ruta
            $justificacion_nueva = gero_generar_justificacion_ruta( $params );
        } elseif ( $tipo_interaccion === 'crisis_detectada' ) {
            // Generar justificación para crisis detectada
            $crisis_detection = gero_detectar_crisis( isset( $params['contenido']['mensaje'] ) ? $params['contenido']['mensaje'] : '' );
            $nivel = $crisis_detection['level'];
            $mensaje = $params['contenido']['mensaje'] ?? 'Potencial riesgo identificado';
            $justificacion_nueva = "🚨 CRISIS DETECTADA ($nivel): " . substr( $mensaje, 0, 80 ) . "...";
        }
        
        // Combinar con justificaciones anteriores
        $justificacion_existente = [];
        if ( $existing && ! empty( $existing->justificacion ) ) {
            $justificacion_existente = json_decode( $existing->justificacion, true );
            if ( ! is_array( $justificacion_existente ) ) {
                $justificacion_existente = [];
            }
        }
        
        // Agregar nueva justificación a la lista
        if ( ! empty( $justificacion_nueva ) ) {
            if ( ! isset( $justificacion_existente[ $tipo_interaccion ] ) ) {
                $justificacion_existente[ $tipo_interaccion ] = [];
            }
            
            // Si no es un array, convertirlo
            if ( ! is_array( $justificacion_existente[ $tipo_interaccion ] ) ) {
                $justificacion_existente[ $tipo_interaccion ] = [ $justificacion_existente[ $tipo_interaccion ] ];
            }
            
            $justificacion_existente[ $tipo_interaccion ][] = [
                'timestamp' => current_time( 'mysql' ),
                'texto'     => $justificacion_nueva
            ];
        }
        
        // Determinar prioridad del caso basada en todas las justificaciones
        $prioridad_caso = gero_determinar_prioridad_completa( $justificacion_existente, $riesgo_detectado );
        
        // Preparar datos para actualizar
        $data_agente = [
            'justificacion'  => wp_json_encode( $justificacion_existente ),
            'prioridad_caso' => $prioridad_caso,
        ];
        
        if ( $existing ) {
            // Actualizar registro existente
            $wpdb->update(
                $table_agente,
                $data_agente,
                [ 'user_email' => $user_email ],
                [ '%s', '%s' ],
                [ '%s' ]
            );
        } else {
            // Crear nuevo registro
            $data_agente['user_email'] = $user_email;
            $data_agente['user_id'] = $user_id;
            $wpdb->insert( $table_agente, $data_agente );
        }
        
        error_log( "[GERO AGENTE] Actualizado usuario $user_email - Prioridad: $prioridad_caso" );
    }
    
    error_log( "[GERO INTERACCIONES] Guardada: User #$user_id - Tipo: $tipo_interaccion" );
    
    return new WP_REST_Response( [ 
        'success' => true,
        'message' => 'Interacción guardada exitosamente',
        'id' => $wpdb->insert_id
    ], 200 );
}

/**
 * Genera justificación breve para respuesta de cuestionario
 */
function gero_generar_justificacion_cuestionario( $respuestas ) {
    $analisis = [];
    
    // Extraer respuestas principales
    if ( is_array( $respuestas ) ) {
        $respuestas_array = is_array( $respuestas[0] ?? null ) ? $respuestas : [$respuestas];
        
        foreach ( $respuestas_array as $item ) {
            if ( is_array( $item ) && count( $item ) >= 2 ) {
                $pregunta = $item[0] ?? '';
                $respuesta = $item[1] ?? '';
                
                // Detectar palabras clave que indican riesgo
                $respuesta_lower = strtolower( $respuesta );
                
                if ( strpos( $respuesta_lower, 'mucha' ) !== false || 
                     strpos( $respuesta_lower, 'bastante' ) !== false ||
                     strpos( $respuesta_lower, 'crisis' ) !== false ||
                     strpos( $respuesta_lower, 'urgente' ) !== false ) {
                    $analisis[] = "Respuesta crítica detectada";
                }
            }
        }
    }
    
    return ! empty( $analisis ) ? implode( ', ', $analisis ) : 'Cuestionario completado sin riesgos críticos';
}

/**
 * Genera justificación para respuesta individual
 */
function gero_generar_justificacion_respuesta( $params ) {
    $contenido = $params['contenido'] ?? [];
    
    if ( isset( $contenido['answer'] ) ) {
        $answer = strtolower( $contenido['answer'] );
        
        // Detectar palabras de crisis o alto riesgo
        $palabras_crisis = [ 'suicidio', 'muerte', 'quiero morir', 'no puedo', 'abandono' ];
        foreach ( $palabras_crisis as $palabra ) {
            if ( strpos( $answer, $palabra ) !== false ) {
                return "⚠️ Respuesta de alto riesgo: " . substr( $answer, 0, 50 ) . "...";
            }
        }
        
        return "Respuesta: " . substr( $answer, 0, 60 ) . "...";
    }
    
    return '';
}

/**
 * Genera justificación para selección de ruta
 */
function gero_generar_justificacion_ruta( $params ) {
    $ruta = $params['contenido']['ruta'] ?? $params['contenido'] ?? 'Desconocida';
    
    $descripciones_rutas = [
        'RouteA' => 'Estudiante realizó test RIASEC para alineación carrera-intereses',
        'RouteB' => 'Estudiante requiere apoyo en manejo académico y organización',
        'RouteC' => 'Estudiante necesita intervención en bienestar y balance vida-estudio',
        'RouteD' => 'Estudiante requiere apoyo en integración social',
        'RouteE' => 'Estudiante necesita orientación vocacional avanzada',
        'RouteF' => 'Estudiante requiere apoyo en financiamiento',
        'RouteG' => 'Estudiante necesita apoyo en transición académica',
    ];
    
    return $descripciones_rutas[$ruta] ?? "Ruta seleccionada: $ruta";
}

/**
 * Determina prioridad completa del caso basada en justificaciones y riesgos
 */
function gero_determinar_prioridad_completa( $justificaciones, $riesgo_json ) {
    $prioridad = 'bajo';
    
    // Palabras clave para detectar nivel de prioridad
    $palabras_critico = [ 'suicidio', 'muerte', 'quiero morir', '⚠️ crisis', 'emergencia', 'riesgo alto' ];
    $palabras_alto = [ 'crisis', 'grave', 'urgente', 'inmediato', 'crítico', 'riesgo' ];
    $palabras_medio = [ 'moderado', 'importante', 'atención', 'seguimiento', 'monitoreo' ];
    
    $texto_analizar = wp_json_encode( $justificaciones ) . ' ' . $riesgo_json;
    $texto_lower = strtolower( $texto_analizar );
    
    // Detectar nivel de prioridad (de mayor a menor)
    foreach ( $palabras_critico as $palabra ) {
        if ( strpos( $texto_lower, $palabra ) !== false ) {
            return 'critico';
        }
    }
    
    foreach ( $palabras_alto as $palabra ) {
        if ( strpos( $texto_lower, $palabra ) !== false ) {
            $prioridad = 'alto';
            break;
        }
    }
    
    foreach ( $palabras_medio as $palabra ) {
        if ( strpos( $texto_lower, $palabra ) !== false && $prioridad === 'bajo' ) {
            $prioridad = 'medio';
            break;
        }
    }
    
    return $prioridad;
}