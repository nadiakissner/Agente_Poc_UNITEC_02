<?php
/**
 * Plugin Name: Agente de Retencion UNITEC 02
 * Description: Agente de Gero con interfaz de chat - Version UNITEC 02. Motor de hipotesis, chat IA y cuestionario de retencion.
 * Version: 2.0
 * Author: Christian Pflaum
 * License: GPL v2 or later
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * ============================================================================
 * SECTION 1: CONSTANTS & CONFIGURATIONS
 * ============================================================================
 */

// Risk categories (must match questionnaire.ts)
if ( ! defined( 'GERO_RISK_CATEGORIES' ) ) {
    define( 'GERO_RISK_CATEGORIES', [
        'emocional'         => 'Bienestar emocional',
        'desorientacion'    => 'Desorientacion academica',
        'organizacion'      => 'Organizacion del tiempo',
        'baja_preparacion'  => 'Preparacion academica',
        'economica'         => 'Preocupacion economica',
        'social'            => 'Desconexion social',
        'tecnologica'       => 'Barreras tecnologicas',
        'entorno'           => 'Entorno de estudio',
    ] );
}

// Risk priority order (same as questionnaire.ts)
if ( ! defined( 'GERO_RISK_PRIORITY' ) ) {
    define( 'GERO_RISK_PRIORITY', [
        'emocional',
        'desorientacion',
        'organizacion',
        'baja_preparacion',
        'economica',
        'social',
        'tecnologica',
        'entorno',
    ] );
}

// API Routes
if ( ! defined( 'GERO_API_NAMESPACE' ) ) {
    define( 'GERO_API_NAMESPACE', 'gero/v1' );
}
if ( ! defined( 'GERO_API_VERSION' ) ) {
    define( 'GERO_API_VERSION', '2.0' );
}

/**
 * ============================================================================
 * SECTION 2: CORE SCORING ENGINE
 * ============================================================================
 */

/**
 * Calculate risk scores from questionnaire responses
 * 
 * Processes responses with structure: [
 *   'P1' => { 'text' => '3', 'riskWeights' => { 'desorientacion' => 1 } },
 *   ...
 * ]
 * 
 * @param array $respuestas Questionnaire responses with riskWeights
 * @return array Risk scores by category: ['economica' => 5, 'desorientacion' => 8, ...]
 */
function gero_calcular_puntuacion_riesgos_UNITEC_02( $respuestas ) {
    // Initialize all categories with 0
    $puntuaciones = array_fill_keys( array_keys( GERO_RISK_CATEGORIES ), 0 );
    
    if ( ! is_array( $respuestas ) || empty( $respuestas ) ) {
        return $puntuaciones;
    }
    
    // Process each response
    foreach ( $respuestas as $pregunta_id => $respuesta_data ) {
        $texto_respuesta = '';
        $risk_weights = [];
        
        // Extract text and weights from response object
        if ( is_array( $respuesta_data ) ) {
            $texto_respuesta = $respuesta_data['text'] ?? '';
            $risk_weights = $respuesta_data['riskWeights'] ?? [];
        } elseif ( is_string( $respuesta_data ) ) {
            $texto_respuesta = $respuesta_data;
        }
        
        // Apply riskWeights directly
        if ( is_array( $risk_weights ) && ! empty( $risk_weights ) ) {
            foreach ( $risk_weights as $categoria => $peso ) {
                if ( isset( $puntuaciones[ $categoria ] ) && is_numeric( $peso ) ) {
                    $puntuaciones[ $categoria ] += (float) $peso;
                }
            }
        }
        
        // === LoGICA COMENTADA - Preguntas P5/P6 desactivadas por ahora ===
        // Special handling for P5 (text with keywords) - COMENTADO
        /*
        if ( $pregunta_id === 'P5' && ! empty( $texto_respuesta ) ) {
            $texto_lower = strtolower( $texto_respuesta );
            
            // Detect funding source for conditional P6 weights
            $fuente = gero_detectar_fuente_financiamiento_UNITEC_02( $texto_lower );
            
            // Store for P6 conditional processing (if needed)
            $puntuaciones['_p5_fuente'] = $fuente;
        }
        
        // Special handling for P6 (conditional weights based on P5)
        if ( $pregunta_id === 'P6' && isset( $puntuaciones['_p5_fuente'] ) ) {
            $valor_likert = (int) $texto_respuesta;
            $fuente = $puntuaciones['_p5_fuente'];
            
            $conditional_weights = [
                'familia'  => [ 3 => 0, 4 => 1, 5 => 1 ],
                'beca'     => [ 3 => 1, 4 => 3, 5 => 3 ],
                'credito'  => [ 3 => 1, 4 => 3, 5 => 3 ],
                'trabajo'  => [ 3 => 1, 4 => 2, 5 => 2 ],
            ];
            
            if ( isset( $conditional_weights[ $fuente ][ $valor_likert ] ) ) {
                $peso = $conditional_weights[ $fuente ][ $valor_likert ];
                $puntuaciones['economica'] += $peso;
            }
        }
        */
        // === FIN LoGICA COMENTADA ===
    }
    
    // Remove internal keys
    unset( $puntuaciones['_p5_fuente'] );
    
    return $puntuaciones;
}

/**
 * Detect funding source from user input
 * NOTA: Esta funcion esta comentada porque P5 esta desactivada
 * Se mantiene por si se reactiva en el futuro
 * 
 * @param string $texto User input text (lowercased)
 * @return string Detected source: 'familia', 'beca', 'credito', 'trabajo', or 'otra'
 */
function gero_detectar_fuente_financiamiento_UNITEC_02( $texto ) {
    if ( empty( $texto ) ) {
        return 'otra';
    }
    
    $keywords = [
        'familia'  => 'padre|padres|madre|papa|mama|tio|tia|abuelo|abuela|hermano|hermana|parientes|familia',
        'beca'     => 'beca|becado|becada|becarios',
        'credito'  => 'credito|credito|financiamiento|prestamo|prestamo|banco',
        'trabajo'  => 'trabajo|laboral|empleo|trabajando|laburo|laboro',
    ];
    
    foreach ( $keywords as $source => $pattern ) {
        if ( preg_match( "/$pattern/i", $texto ) ) {
            return $source;
        }
    }
    
    return 'otra';
}

/**
 * Determine main hypothesis from risk scores
 * Returns ordered array by priority
 * 
 * @param array $puntuaciones Risk scores by category
 * @return array Ordered hypotheses with scores
 */
function gero_determinar_hipotesis_principales_UNITEC_02( $puntuaciones ) {
    // Filter only categories with scores > 0
    $riesgos_activos = array_filter(
        $puntuaciones,
        function ( $puntos ) {
            return $puntos > 0;
        }
    );
    
    // Order by global risk priority
    $hipotesis = [];
    foreach ( GERO_RISK_PRIORITY as $categoria ) {
        if ( isset( $riesgos_activos[ $categoria ] ) ) {
            $hipotesis[ $categoria ] = $riesgos_activos[ $categoria ];
        }
    }
    
    return $hipotesis;
}

/**
 * Get readable label for risk category
 * 
 * @param string $categoria Risk category key
 * @return string Readable label
 */
function gero_obtener_etiqueta_hipotesis_UNITEC_02( $categoria ) {
    return GERO_RISK_CATEGORIES[ $categoria ] ?? $categoria;
}

/**
 * ============================================================================
 * SECTION 3: UTILITY FUNCTIONS
 * ============================================================================
 */

/**
 * Get user email by ID from habilitados table
 * 
 * @param int $user_id User ID from byw_usuarios_habilitados
 * @return string User email/matricula or empty string
 */
function gero_obtener_email_usuario_UNITEC_02( $user_id ) {
    global $wpdb;
    
    $email = $wpdb->get_var( $wpdb->prepare(
        "SELECT cedula_matricula FROM byw_usuarios_habilitados WHERE id = %d LIMIT 1",
        (int) $user_id
    ) );
    
    return $email ?: '';
}

/**
 * Get user data from habilitados table
 * 
 * @param int $user_id User ID (this is the 'id' from byw_usuarios_habilitados)
 * @return object User data (nombre, carrera) or null
 */
function gero_obtener_datos_usuario_UNITEC_02( $user_id ) {
    global $wpdb;
    
    return $wpdb->get_row( $wpdb->prepare(
        "SELECT id, nombre, apellido, email, cedula_matricula, carrera, campus, modalidad_usuario, tipo_programa, escuela, user_id 
         FROM byw_usuarios_habilitados WHERE id = %d LIMIT 1",
        (int) $user_id
    ) );
}

/**
 * Check if matricula exists in system
 * 
 * @param string $matricula Student matricula
 * @return object User object or null
 */
function gero_validar_matricula_UNITEC_02( $matricula ) {
    global $wpdb;
    
    return $wpdb->get_row( $wpdb->prepare(
        "SELECT id, cedula_matricula, nombre, carrera FROM byw_usuarios_habilitados WHERE cedula_matricula = %s LIMIT 1",
        sanitize_text_field( $matricula )
    ) );
}

/**
 * Check if user has previous interaction history
 * 
 * @param string $matricula Student matricula
 * @return bool True if has history, false if new
 */
function gero_tiene_historial_UNITEC_02( $matricula ) {
    global $wpdb;
    
    $matricula_safe = sanitize_text_field( $matricula );
    
    // Check in interactions table
    $coach = $wpdb->get_var( $wpdb->prepare(
        "SELECT COUNT(*) FROM byw_coach_interacciones WHERE value_validador = %s LIMIT 1",
        $matricula_safe
    ) );
    
    // Check in agent table
    $agente = $wpdb->get_var( $wpdb->prepare(
        "SELECT COUNT(*) FROM byw_agente_retencion WHERE user_email = %s LIMIT 1",
        $matricula_safe
    ) );
    
    return ( (int) $coach > 0 || (int) $agente > 0 );
}

/**
 * Generate summary of questionnaire responses for context
 * 
 * @param array $respuestas Questionnaire responses
 * @return string Formatted summary
 */
function gero_generar_resumen_respuestas_UNITEC_02( $respuestas ) {
    // Etiquetas actuales (P1-P2 activas)
    $preguntas_etiquetas = [
        'P1' => 'Sensacion frente a la universidad',
        'P2' => 'Factor principal de inquietud',
        // Preguntas anteriores comentadas - pueden reactivarse despues
        // 'P3' => 'Preparacion academica para la carrera',
        // 'P4' => 'Capacidad de organizar tiempo y tareas',
        // 'P5' => 'Fuente de financiamiento',
        // 'P6' => 'Dificultad si se acaba el dinero',
        // 'P7' => '¿Termino dificil la preparatoria?',
        // 'P8' => 'Facilidad para hacer amigos',
        // 'P9' => 'Comodidad con herramientas digitales',
    ];
    
    if ( ! is_array( $respuestas ) || empty( $respuestas ) ) {
        return 'Sin respuestas registradas.';
    }
    
    $resumen = '';
    foreach ( $respuestas as $pregunta_id => $respuesta_data ) {
        if ( ! isset( $preguntas_etiquetas[ $pregunta_id ] ) ) {
            continue;
        }
        
        // Extract text from response
        $texto = '';
        if ( is_array( $respuesta_data ) ) {
            $texto = $respuesta_data['text'] ?? '';
        } elseif ( is_string( $respuesta_data ) ) {
            $texto = $respuesta_data;
        }
        
        if ( ! empty( $texto ) ) {
            $resumen .= "- {$preguntas_etiquetas[ $pregunta_id ]}: $texto\n";
        }
    }
    
    return ! empty( $resumen ) ? $resumen : 'Respuestas cargadas sin detalles disponibles.';
}

/**
 * Detect crisis keywords in text
 * Synchronized with frontend crisisSafety.ts
 * 
 * @param string $texto Text to analyze
 * @return array Detection result: ['detected' => bool, 'level' => string, 'keywords' => array]
 */
function gero_detectar_crisis_UNITEC_02( $texto ) {
    if ( empty( $texto ) ) {
        return [
            'detected'  => false,
            'level'     => 'none',
            'keywords'  => [],
        ];
    }
    
    $texto_norm = strtolower( remove_accents( $texto ) );
    
    // EXTREME risk keywords
    $extreme = [
        'suicidio', 'suicidarme', 'me quiero suicidar', 'matarme',
        'quitarme la vida', 'no quiero vivir', 'autolesion', 'cortarme',
        'lastimarme', 'no puedo mas', 'no aguanto mas', 'cansado de vivir',
        'mejor muerto', 'todos estarian mejor sin mi', 'deseo de morir',
        'quiero desaparecer', 'acabar con todo',
    ];
    
    // HIGH risk keywords
    $high = [
        'depresion', 'deprimido', 'ansiedad severa', 'panico',
        'ataque de panico', 'quiero morir', 'pensamientos de muerte',
        'soy un fracaso', 'soy inutil', 'no merezco vivir', 'nadie me quiere',
        'estoy solo', 'muy mal', 'no aguanto', 'sin esperanza', 'sin futuro',
        'insoportable', 'sin salida',
    ];
    
    // Check EXTREME keywords
    $detected = [];
    foreach ( $extreme as $keyword ) {
        if ( strpos( $texto_norm, $keyword ) !== false ) {
            $detected[] = $keyword;
        }
    }
    
    if ( ! empty( $detected ) ) {
        return [
            'detected'  => true,
            'level'     => 'extreme',
            'keywords'  => $detected,
        ];
    }
    
    // Check HIGH keywords
    foreach ( $high as $keyword ) {
        if ( strpos( $texto_norm, $keyword ) !== false ) {
            $detected[] = $keyword;
        }
    }
    
    if ( ! empty( $detected ) ) {
        return [
            'detected'  => true,
            'level'     => 'high',
            'keywords'  => $detected,
        ];
    }
    
    return [
        'detected'  => false,
        'level'     => 'none',
        'keywords'  => [],
    ];
}

/**
 * ============================================================================
 * SECTION 4: REST API ENDPOINTS
 * ============================================================================
 */

/**
 * ENDPOINT: Validate matricula
 * GET /wp-json/gero/v1/validar-matricula
 */
add_action( 'rest_api_init', function () {
    register_rest_route( GERO_API_NAMESPACE, '/validar-matricula', [
        'methods'             => 'GET',
        'callback'            => 'gero_endpoint_validar_matricula_UNITEC_02',
        'permission_callback' => '__return_true',
    ] );
} );

function gero_endpoint_validar_matricula_UNITEC_02( WP_REST_Request $request ) {
    global $wpdb;
    
    $matricula = sanitize_text_field( $request->get_param( 'matricula' ) ?? '' );
    $url_origen = sanitize_text_field( $request->get_param( 'url_origen' ) ?? '' );
    
    if ( empty( $matricula ) ) {
        return new WP_REST_Response( [
            'success' => false,
            'error'   => 'matricula_vacia',
            'message' => 'Por favor ingresa tu matricula.',
        ], 400 );
    }
    
    // Validate matricula
    $usuario = gero_validar_matricula_UNITEC_02( $matricula );
    
    if ( ! $usuario ) {
        // Log failed validation attempt
        $wpdb->insert( 'byw_validacion_cuestionario', [
            'created_at'           => current_time( 'mysql' ),
            'tipo_validacion'      => 'Matricula',
            'valor_validacion'     => $matricula,
            'resultado_validacion' => 'denied',
            'url_origen'           => $url_origen,
            'post_name'            => 'N/A',
        ] );
        
        return new WP_REST_Response( [
            'success' => false,
            'error'   => 'matricula_no_encontrada',
            'message' => 'La matricula ingresada no esta registrada.',
        ], 200 );
    }
    
    $tiene_historial = gero_tiene_historial_UNITEC_02( $matricula );
    
    // Log successful validation
    $wpdb->insert( 'byw_validacion_cuestionario', [
        'created_at'           => current_time( 'mysql' ),
        'tipo_validacion'      => 'Matricula',
        'valor_validacion'     => $matricula,
        'resultado_validacion' => 'allowed',
        'url_origen'           => $url_origen,
        'post_name'            => 'Acceso Permitido',
    ] );
    
    return new WP_REST_Response( [
        'success'             => true,
        'user_id'             => (int) $usuario->id,
        'matricula'           => $matricula,
        'nombre'              => $usuario->nombre,
        'carrera'             => $usuario->carrera,
        'flujo'               => $tiene_historial ? 'recurrente' : 'nuevo',
        'tiene_historial'     => $tiene_historial,
        'estado_cuestionario' => $tiene_historial ? 'completado' : 'pendiente',
        'message'             => 'Matricula validada correctamente.',
    ], 200 );
}

/**
 * ENDPOINT: Process questionnaire responses
 * POST /wp-json/gero/v1/procesar-respuestas-cuestionario
 */
add_action( 'rest_api_init', function () {
    register_rest_route( GERO_API_NAMESPACE, '/procesar-respuestas-cuestionario', [
        'methods'             => 'POST',
        'callback'            => 'gero_endpoint_procesar_cuestionario_UNITEC_02',
        'permission_callback' => '__return_true',
    ] );
} );

function gero_endpoint_procesar_cuestionario_UNITEC_02( WP_REST_Request $request ) {
    global $wpdb;
    
    $body = $request->get_json_params();
    
    $user_id = isset( $body['user_id'] ) ? (int) $body['user_id'] : 0;
    $matricula = sanitize_text_field( $body['matricula'] ?? '' );
    $respuestas = is_array( $body['respuestas'] ?? null ) ? $body['respuestas'] : [];
    
    if ( ! $user_id || empty( $matricula ) || empty( $respuestas ) ) {
        return new WP_REST_Response( [
            'success' => false,
            'error'   => 'parametros_incompletos',
            'message' => 'Faltan parametros: user_id, matricula, respuestas.',
        ], 400 );
    }
    
    // Calculate risk scores
    $puntuaciones = gero_calcular_puntuacion_riesgos_UNITEC_02( $respuestas );
    $hipotesis = gero_determinar_hipotesis_principales_UNITEC_02( $puntuaciones );
    
    // Get readable labels
    $hipotesis_lista = array_map( 'gero_obtener_etiqueta_hipotesis', array_keys( $hipotesis ) );
    
    // Determinar prioridad basada en hipotesis
    $riesgo_principal = array_key_first( $hipotesis ) ?? 'desorientacion';
    $prioridad = 'medio'; // Default
    if ( in_array( $riesgo_principal, [ 'crisis_emocional', 'ideas_abandono' ] ) ) {
        $prioridad = 'critico';
    } elseif ( in_array( $riesgo_principal, [ 'dificultades_academicas', 'problemas_financieros' ] ) ) {
        $prioridad = 'alto';
    } elseif ( in_array( $riesgo_principal, [ 'desorientacion', 'falta_integracion' ] ) ) {
        $prioridad = 'medio';
    } else {
        $prioridad = 'bajo';
    }
    
    // Generar justificacion ejecutiva
    $justificacion = 'Estudiante evaluado con cuestionario inicial. ';
    $justificacion .= 'Hipotesis principales: ' . implode( ', ', array_slice( $hipotesis_lista, 0, 3 ) ) . '. ';
    $justificacion .= 'Prioridad asignada: ' . ucfirst( $prioridad ) . '.';
    
    // Guardar respuestas en conversation_string de byw_coach_interacciones
    $timestamp = current_time( 'Y-m-d H:i:s' );
    $texto_cuestionario = "[{$timestamp}] [cuestionario_completado]\n";
    $texto_cuestionario .= "  respuestas: " . wp_json_encode( $respuestas ) . "\n";
    $texto_cuestionario .= "  puntuaciones: " . wp_json_encode( $puntuaciones ) . "\n";
    $texto_cuestionario .= "  hipotesis: " . wp_json_encode( array_keys( $hipotesis ) ) . "\n";
    $texto_cuestionario .= "  prioridad: {$prioridad}\n";
    $texto_cuestionario .= "---\n";
    
    // Actualizar o insertar en byw_coach_interacciones
    $registro_interacciones = $wpdb->get_row( $wpdb->prepare(
        "SELECT id, conversation_string FROM byw_coach_interacciones WHERE user_id = %d LIMIT 1",
        $user_id
    ) );
    
    if ( $registro_interacciones ) {
        $nuevo_conversation = $registro_interacciones->conversation_string . $texto_cuestionario;
        $wpdb->update(
            'byw_coach_interacciones',
            [ 'conversation_string' => $nuevo_conversation ],
            [ 'id' => $registro_interacciones->id ]
        );
    } else {
        $wpdb->insert(
            'byw_coach_interacciones',
            [
                'user_id'             => $user_id,
                'value_validador'     => $matricula,
                'conversation_string' => $texto_cuestionario,
                'created_at'          => current_time( 'mysql' ),
            ]
        );
    }
    
    // Actualizar byw_agente_retencion (solo columnas que existen)
    $registro_agente = $wpdb->get_row( $wpdb->prepare(
        "SELECT ID FROM byw_agente_retencion WHERE user_id = %d LIMIT 1",
        $user_id
    ) );
    
    $datos_agente = [
        'user_email'       => $matricula,
        'user_id'          => $user_id,
        'riesgo_detectado' => wp_json_encode( array_keys( $hipotesis ) ),
        'prioridad_caso'   => $prioridad,
        'justificacion'    => $justificacion,
        'ultima_actividad' => current_time( 'mysql', 1 ),
    ];
    
    if ( $registro_agente ) {
        $wpdb->update(
            'byw_agente_retencion',
            $datos_agente,
            [ 'ID' => $registro_agente->ID ]
        );
    } else {
        $wpdb->insert( 'byw_agente_retencion', $datos_agente );
    }
    
    error_log( 'Hipotesis calculadas para ' . $matricula . ': ' . implode( ', ', $hipotesis_lista ) . ' - Prioridad: ' . $prioridad );
    
    return new WP_REST_Response( [
        'success'             => true,
        'matricula'           => $matricula,
        'puntuaciones'        => $puntuaciones,
        'hipotesis_ordenadas' => $hipotesis,
        'hipotesis_lista'     => $hipotesis_lista,
        'riesgo_principal'    => array_key_first( $hipotesis ) ?? 'desorientacion',
        'message'             => 'Cuestionario procesado correctamente.',
    ], 200 );
}

/**
 * ENDPOINT: Save interactions
 * POST /wp-json/gero/v1/guardar-interacciones
 */
add_action( 'rest_api_init', function () {
    register_rest_route( GERO_API_NAMESPACE, '/guardar-interacciones', [
        'methods'             => 'POST',
        'callback'            => 'gero_endpoint_guardar_interacciones_UNITEC_02',
        'permission_callback' => '__return_true',
    ] );
} );

function gero_endpoint_guardar_interacciones_UNITEC_02( WP_REST_Request $request ) {
    global $wpdb;
    
    $params = $request->get_json_params();
    
    $user_id = isset( $params['user_id'] ) ? (int) $params['user_id'] : 0;
    $tipo = isset( $params['tipo'] ) ? sanitize_text_field( $params['tipo'] ) : '';
    $contenido = isset( $params['contenido'] ) ? $params['contenido'] : [];
    $matricula = isset( $params['matricula'] ) ? sanitize_text_field( $params['matricula'] ) : '';
    
    if ( ! $user_id || empty( $tipo ) ) {
        return new WP_REST_Response(
            [ 'error' => 'Faltan parametros: user_id, tipo' ],
            400
        );
    }
    
    // Obtener value_validador (matricula) si no viene en params
    if ( empty( $matricula ) ) {
        $usuario = gero_obtener_datos_usuario_UNITEC_02( $user_id );
        $matricula = $usuario->cedula_matricula ?? '';
    }
    
    // Check for crisis
    $texto_analizar = '';
    if ( is_array( $contenido ) ) {
        $texto_analizar = $contenido['mensaje'] ?? $contenido['answer'] ?? $contenido['respuesta'] ?? '';
    } else {
        $texto_analizar = (string) $contenido;
    }
    
    $es_crisis = false;
    $nivel_crisis = '';
    if ( ! empty( $texto_analizar ) && $tipo !== 'crisis_detectada' ) {
        $crisis = gero_detectar_crisis_UNITEC_02( $texto_analizar );
        
        if ( $crisis['detected'] ) {
            $es_crisis = true;
            $nivel_crisis = $crisis['level'];
            error_log( 'CRISIS DETECTADA - Usuario: #' . $user_id . ', Nivel: ' . $crisis['level'] );
        }
    }
    
    // Formatear contenido como texto plano para conversation_string
    $timestamp = current_time( 'Y-m-d H:i:s' );
    $texto_guardar = "[{$timestamp}] [{$tipo}]";
    
    if ( is_array( $contenido ) ) {
        foreach ( $contenido as $key => $value ) {
            if ( is_array( $value ) ) {
                $value = wp_json_encode( $value, JSON_UNESCAPED_UNICODE );
            }
            $texto_guardar .= "\n  {$key}: {$value}";
        }
    } else {
        $texto_guardar .= "\n  " . (string) $contenido;
    }
    
    if ( $es_crisis ) {
        $texto_guardar .= "\n  [CRISIS_DETECTADA: {$nivel_crisis}]";
    }
    
    $texto_guardar .= "\n---\n";
    
    // Buscar si ya existe registro para este usuario
    $registro_existente = $wpdb->get_row( $wpdb->prepare(
        "SELECT id, conversation_string FROM byw_coach_interacciones WHERE user_id = %d LIMIT 1",
        $user_id
    ) );
    
    if ( $registro_existente ) {
        // Append al conversation_string existente
        $nuevo_conversation = $registro_existente->conversation_string . $texto_guardar;
        $resultado = $wpdb->update(
            'byw_coach_interacciones',
            [ 'conversation_string' => $nuevo_conversation ],
            [ 'id' => $registro_existente->id ]
        );
        $insert_id = $registro_existente->id;
    } else {
        // Crear nuevo registro
        $resultado = $wpdb->insert(
            'byw_coach_interacciones',
            [
                'user_id'             => $user_id,
                'value_validador'     => $matricula,
                'conversation_string' => $texto_guardar,
                'created_at'          => current_time( 'mysql' ),
            ]
        );
        $insert_id = $wpdb->insert_id;
    }
    
    if ( $resultado === false ) {
        error_log( 'Error guardar interaccion: ' . $wpdb->last_error );
        return new WP_REST_Response(
            [ 'error' => 'Error al guardar interaccion' ],
            500
        );
    }
    
    error_log( 'Interaccion guardada - Usuario: #' . $user_id . ', Tipo: ' . $tipo );
    
    return new WP_REST_Response( [
        'success'   => true,
        'message'   => 'Interaccion guardada',
        'id'        => $insert_id,
    ], 200 );
}

/**
 * ENDPOINT: Chat with OpenAI agent
 * POST /wp-json/gero/v1/chat-openai-agente
 */
add_action( 'rest_api_init', function () {
    register_rest_route( GERO_API_NAMESPACE, '/chat-openai-agente', [
        'methods'             => 'POST',
        'callback'            => 'gero_endpoint_chat_openai_UNITEC_02',
        'permission_callback' => '__return_true',
    ] );
} );

function gero_endpoint_chat_openai_UNITEC_02( WP_REST_Request $request ) {
    global $wpdb;
    
    $body = $request->get_json_params();
    $user_id = (int) ( $body['user_id'] ?? 0 );
    $matricula = sanitize_text_field( $body['matricula'] ?? '' );
    $message = sanitize_textarea_field( $body['message'] ?? '' );
    
    if ( ! $user_id || empty( $matricula ) || empty( $message ) ) {
        return new WP_REST_Response( [
            'success' => false,
            'error'   => 'parametros_incompletos',
            'message' => 'Faltan parametros.',
        ], 400 );
    }
    
    // Get user and agent data
    $usuario = gero_obtener_datos_usuario_UNITEC_02( $user_id );
    if ( ! $usuario ) {
        error_log( 'Usuario no encontrado - user_id: ' . $user_id );
        return new WP_REST_Response( [
            'success' => false,
            'error'   => 'usuario_no_encontrado',
            'message' => 'Usuario no encontrado con ID: ' . $user_id,
        ], 404 );
    }
    
    error_log( 'Usuario encontrado: ' . $usuario->nombre . ' - Carrera: ' . $usuario->carrera );
    
    // Build system prompt
    $agente = $wpdb->get_row( $wpdb->prepare(
        "SELECT riesgo_detectado, prioridad_caso, justificacion FROM byw_agente_retencion WHERE user_id = %d LIMIT 1",
        $user_id
    ) );
    
    $riesgos = [];
    $resumen = '';
    
    if ( $agente && ! empty( $agente->riesgo_detectado ) ) {
        // riesgo_detectado puede ser un string simple o JSON
        $riesgos_decoded = json_decode( $agente->riesgo_detectado, true );
        if ( is_array( $riesgos_decoded ) ) {
            $riesgos = $riesgos_decoded;
        } else {
            $riesgos = [ $agente->riesgo_detectado ];
        }
        
        // Usar justificacion como resumen si existe
        if ( ! empty( $agente->justificacion ) ) {
            $resumen = $agente->justificacion;
        }
    }
    
    $riesgos_labels = array_map( 'gero_obtener_etiqueta_hipotesis_UNITEC_02', $riesgos );
    $riesgos_lista = ! empty( $riesgos_labels ) ? implode( ', ', $riesgos_labels ) : 'Aun no identificados';
    
    // Obtener historial de conversacion y contar interacciones
    $historial_row = $wpdb->get_row( $wpdb->prepare(
        "SELECT conversation_string FROM byw_coach_interacciones WHERE user_id = %d LIMIT 1",
        $user_id
    ) );
    
    $conversation_string = $historial_row->conversation_string ?? '';
    
    // Contar interacciones del agente buscando el patron [interaccion_agente] en el texto
    $num_interacciones = substr_count( $conversation_string, '[interaccion_agente]' );
    
    // Determinar fase del flujo
    $fase_instruccion = '';
    if ( $num_interacciones === 0 ) {
        $fase_instruccion = 'PRIMERA INTERACCIoN: Saluda brevemente y pregunta como se siente hoy. Solo eso. Se calido pero breve.';
    } elseif ( $num_interacciones < 3 ) {
        $fase_instruccion = 'FASE EXPLORACIoN: Escucha activamente, valida lo que dice, pregunta para entender mejor. NO propongas cuestionario aun.';
    } elseif ( $num_interacciones < 5 ) {
        $fase_instruccion = 'FASE TRANSICIoN: Ya conoces algo del estudiante. Si detectas inquietudes (dudas sobre carrera, nervios, incertidumbre), puedes sugerir de forma natural: "Oye, me gustaria hacerte unas preguntitas para entender mejor como te sientes y como puedo apoyarte mejor. ¿Te late?" Si el estudiante esta tranquilo, sigue conversando normalmente.';
    } else {
        $fase_instruccion = 'FASE PROFUNDA: Ya hay confianza. Continua la conversacion con empatia. Si hay señales de desorientacion sobre la carrera, puedes decir algo como: "Noto que tienes dudas sobre tu eleccion. ¿Que te parece si exploramos juntos que es lo que realmente te mueve?" y ofrecer el test de orientacion.';
    }
    
    // Determinar si hay desorientacion detectada
    $tiene_desorientacion = in_array( 'desorientacion', $riesgos );
    $contexto_desorientacion = '';
    if ( $tiene_desorientacion ) {
        $contexto_desorientacion = '
        ⚠️ ALERTA INTERNA: Se detecto DESORIENTACION como riesgo principal.
        
        ESTRATEGIA ESPECiFICA PARA DESORIENTACIoN:
        1. Normaliza: "Es super normal tener dudas al inicio, muchos pasan por esto"
        2. Explora: "¿Que fue lo que te llamo la atencion de esta carrera cuando la elegiste?"
        3. Ancla en fortalezas: "¿Hay algo de lo que has visto o escuchado de la carrera que te emocione?"
        4. Si las dudas persisten sobre la ELECCIoN de carrera (no sobre miedos personales):
           - Sugiere: "¿Sabes que? Tenemos un test cortito que te puede ayudar a ver como tus intereses se conectan con diferentes carreras. ¿Te gustaria probarlo?"
        5. Refuerza: "Lo chido de UNITEC es que si despues de explorar decides que otra carrera te late mas, hay opciones para hacer el cambio sin perder todo tu avance"
        ';
    }

    $system_prompt = <<<EOD
        # ROLE: Agente de Retención y acompañamiento UNITEC (México)
        Eres consejero académico conversacional de la Universidad Tecnológica de México (UNITEC). Tu propósito es que el estudiante se sienta visto y comprendido, ofreciendo rutas realistas para que continúe sus estudios. 

        ## 1. IDENTIDAD Y MISIÓN
        Tu misión es acompañar al estudiante para que se sienta visto, comprendido y con una ruta realista de permanencia en la universidad
        EXITO: Se mide por la claridad, confianza y alivio que generas en el alumno, activando recursos adecuados y logrando que el alumno siga estudiando en UNITEC.
        NO ERES: Terapueta, vendedor frío, ni bot neutral. Eres acompañante y embajador humano de la comunidad UNITEC. 

        ## 2. PROTOCOLO DE SEGURIDAD (PRIORIDAD MÁXIMA)
        Si detectas riesgo de autolesión, suicidio o violencia extrema: interrumpe el flujo académico
        ACCION: Haz una pregunta más para entender el nivel de riesgo, valida con profunda empatía y recomienda llamar al 911 (México). 
        DERIVACIÓN: Ofrece contacto con CADE (Apoyo Psicológico): https://www.unitec.mx/apoyo-al-desarrollo-estudiantil/ 
        Si no es grave, busca tranquilizar al estudiante y luego preguntar si desea continuar con el flujo académico.

        ## 3. REGLAS DE ORO DE RESPUESTA (ANTI-IVR)
        Para que la charla sea humana y evitar que parezcas un formulario, CADA mensaje (excepto el saludo inicial) DEBE seguir este orden: 
        1. ESPEJO + VALIDACIÓN (1 frase): Devuelve lo que el estudiante dijo. Que quede claro que escuchaste. 
        2. FOCO (1 frase): Define el tema principal (dinero, tiempo, materias) y confírmalo: "¿Va por ahí?". 
        3. UN SOLO PASO: Haz máximo UNA pregunta o propone UNA micro-acción. Nunca hagas listas de preguntas.

        ### RESTRICCIONES TÉCNICAS:
        EXTENSIÓN: Máximo 3 oraciones cortas (aprox. 50 palabras). Sé breve y humano.
        SALUDO ÚNICO: Solo saluda al inicio. Luego usa conectores: "Te leo...", "Gracias por contarme...".
        ESCALAS INVISIBLES: Prohibido usar escalas 1-10. Usa opciones: "¿Te sientes cómodo o te cuesta mucho?".

        ## 3. PRINCIPIOS DE COMPORTAMIENTO 
        TRABAJA CON HIPÓTESIS: No des certezas. Usa: "Parece que influye X... ¿qué te suena más?".
        NO ERES TERAPEUTA: Enfócate en el impacto académico y bienestar funcional.
        FORTALECE AUTOEFICACIA: Ayuda a que el alumno recupere el control; no te presentes como su salvador.
        EMBAJADOR UNITEC: Representa a la institución con orgullo y cercanía, no como una marca lejana. 

        ## 4. CONTEXTO INSTITUCIONAL Y RECURSOS UNITEC: 
        Educación práctica, accesible (becas) y flexible. 
        REGLA DE PRECISIÓN: Si piden costos exactos o % de beca, NO INVENTES. Pide campus/modalidad y canaliza a asesor humano. 

        ### MAPEO DE SOLUCIONES (Derivación Estratégica):
        ECONÓMICO: Becas/Financiamiento. WhatsApp Alex: https://wa.me/5215596610554
        VOCACIONAL: Orientación con Alex: https://wa.me/5215596610554
        ACADÉMICO: Perfect Start / Tutorías. URL: https://www.unitec.mx/alumnos/
        EMOCIONAL: CADE (Psicológico). URL: https://www.unitec.mx/apoyo-al-desarrollo-estudiantil/
        TRÁMITES/TECNOLOGÍA: Ticket en CAE o App Conecta UNITEC. 

        ## 5. GUÍA OPERATIVA (EL HILO CONDUCTOR) 
        Tu secuencia por defecto es: ESCUCHAR → REFLEJAR → HIPOTETIZAR → OPCIONES → ACUERDO → CIERRE.

        DIAGNÓSTICO TEMPRANO: En los primeros 2 turnos, lanza un mini-diagnóstico: "Por lo que me cuentas, el centro es X y te está pegando en Y. ¿Es correcto?".
        NO CAMBIES DE EJE: Si el alumno habla de "dinero", no pases a "materias" sin pedir permiso o hacer un puente explícito.

        ## 6. EJEMPLO DE INTERACCIÓN IDEAL Estudiante: "Siento que el trabajo ya no me deja tiempo de estudiar y voy a reprobar." Agente: "Te escucho: sientes que el ritmo del trabajo le está ganando al estudio y eso te genera mucha presión. Si entiendo bien, el problema principal hoy es tu horario de salida, ¿va por ahí?"

        ## 4. ESTILO DE VOZ (MÉXICO)
        Tono: Cálido, empático, profesional y mexicano (Español neutro de México)
        Prohibido: Usar escalas numéricas (1-10). Usa opciones humanas “¿Sientes que es manejable o te esta costando mucho?”
        Cercanía: Usa el nombre del estudiante si lo conoces.

        ## 5. MAPEO DE RECURSOS (INDICIO -> ACCIÓN)
        Ofrece máximo UN recurso a la vez cuando detectes el problema: 
        ECONOMICO: Área de Becas / WhatsApp Alex: https://wa.me/5215596610554
        EMOCIONAL/ESTRÉS: CADE (Apoyo Psicológico): https://unitec.mx/apoyo-al-desarrollo-estudiantil/
        ACADÉMICO: Perfect Start / Tutorías: https://unitec.mx/alumnos/
        VOCACIONAL: Orientación con Alex: https://wa.me/5215596610554
        TÉCNICO: Ticket en CAE o App Conecta UNITEC.

        ## 6. EJEMPLO DE INTERACCIÓN IDEAL
        Estudiante: "Siento que ya no puedo con la carga de las materias y el trabajo."
        Agente: “Te entiendo, sientes que el ritmo actual te está rebasando y eso es muy cansado. Antes de buscar soluciones, que es lo que te quita más energía hoy: el horario o el nivel de las clases?

        ## 7. MÉTODO OPERATIVO Tu secuencia siempre es: ESCUCHAR -> REFLEJAR -> HIPOTETIZAR -> OPCIONES -> ACUERDO -> CIERRE. EOD;

        ## 8. LECTURA INTERNA DE INDICIOS (PENSAMIENTO ESTRATÉGICO)
        Antes de responder, clasifica mentalmente el relato del estudiante en una de estas categorías para guiar tu intervención: 
        1. **Económico:** Menciona falta de dinero, retraso en pagos, pérdida de empleo o dudas sobre becas. 
        2. **Emocional/Estrés:** Fatiga, ansiedad, insomnio, llanto o sensación de "no poder más". 
        3. **Desconexión Social:** Se siente solo, no encaja en el campus o no tiene amigos.
        4. **Académico:** Miedo a reprobar, no entiende las clases o viene de un sistema diferente.
        5. **Propósito:** No le gusta la carrera o no le ve sentido al estudio (Duda vocacional).
        6. **Logística/Tiempo:** Caos entre trabajo y estudio, traslados largos o problemas familiares.
        7. **Tecnológico:** Problemas con plataformas, falta de equipo o internet.

        **REGLA:** Empatía sin estrategia no retiene; estrategia sin empatía aleja. Usa el indicio para elegir UNA ruta de ayuda. 

        ## 9. MAPEO DE RECURSOS INSTITUCIONALES (USO ESTRATÉGICO) 
        **Reglas de Oro:**
        NUNCA presentes los recursos como una lista fría o un trámite.
        Ofrece **MÁXIMO UN** recurso por respuesta. 
        **Narrativa de Permanencia:** Enmarca el recurso como una herramienta para que el estudiante logre su meta, no como una solución mágica. 

        ### Catálogo de Ayuda (Indicio -> Recurso): 
        **Económico:** Área de Becas y Apoyos. 
        - *Enlace:* https://www.unitec.mx/becas-universitarias/ 
        - *WhatsApp (Alex):* https://wa.me/5215596610554 
            - **Emocional:** CADE (Apoyo Psicológico y Bienestar).
        - *Enlace:* https://www.unitec.mx/apoyo-al-desarrollo-estudiantil/
            - **Académico/Tiempo:** Tutorías, "Perfect Start" o Talleres de Organización.
        - *Enlace:* https://www.unitec.mx/alumnos/
            - **Vocacional:** Orientación con Alex o Revalidaciones.
        - *WhatsApp (Alex):* https://wa.me/5215596610554 
            - **General/Técnico:** Generación de ticket en CAE o App Conecta UNITEC. 

            **Cómo introducirlo:** "Algo que ha ayudado a otros alumnos en tu situación es...", "UNITEC tiene un espacio llamado CADE para que no pases esto solo...".

        ## 7. FUNCIONES OPERATIVAS DEL ROL 
        1. **Traductor Humano:** Convierte procesos institucionales complejos en pasos sencillos y cálidos. 
        2. **Facilitador de Alivio:** Tu prioridad es bajar la ansiedad del estudiante en el momento del contacto. 
        3. **Generador de Acuerdos:** Cada charla termina con un compromiso mínimo (ej. "mañana reviso el link"). 

        ## 8. POLÍTICA DE USO DE HERRAMIENTAS Si en el futuro se activan herramientas (consultas de estatus, tickets):
        No menciones códigos de error ni términos internos.
        Si un dato no está disponible, no inventes. Pide el dato faltante con amabilidad. 

        ## 9. ESTILO DE VOZ Y TONO (MÉXICO) 
        **Personalidad:** Cálido, mexicano, profesional pero cercano.
        **Lenguaje:** "Tú", oraciones cortas, conectores humanos ("Te entiendo", "Claro", "Va").
        **Identidad:** Habla como parte de UNITEC: "Aquí en la comunidad...", "Nuestra intención es...".
        **Anti-Encuesta:** Prohibido usar escalas del 1 al 10. Usa opciones descriptivas ("¿Es algo leve o ya te sientes muy presionado?"). 

        ## 10. CHECKLIST DE AUTO-CORRECCIÓN (ANTES DE ENVIAR) Antes de cada respuesta, verifica: 
        1. ¿Validé la emoción del estudiante antes de proponer algo? 
        2. ¿Mi respuesta tiene menos de 4 oraciones o menos de 60 palabras? 
        3. ¿Hice **solo una** pregunta o propuesta a la vez? 
        4. ¿Evité promesas falsas o datos inventados? 
        5. ¿Mantuve el foco en el problema que él trajo a la mesa? 
        6. ¿Mi cierre deja una sensación de alivio y una dirección clara? 

        **TU NORTE:** Que el estudiante piense: "En UNITEC me escucharon y ya sé qué paso sigue".
        EOD;
            
    // Build messages array with history
    $messages = [
        [
            'role'    => 'system',
            'content' => $system_prompt,
        ],
    ];
    
    // Parsear conversation_string para extraer historial de chat
    // Formato esperado: [timestamp] [interaccion_agente]\n  usuario: ...\n  agente: ...
    if ( ! empty( $conversation_string ) ) {
        // Buscar todas las interacciones del agente
        preg_match_all( '/\[interaccion_agente\]\s*\n\s*usuario:\s*(.+?)\s*\n\s*agente:\s*(.+?)(?=\n---|\z)/s', $conversation_string, $matches, PREG_SET_ORDER );
        
        // Tomar las ultimas 20 interacciones para contexto
        $ultimas = array_slice( $matches, -20 );
        
        foreach ( $ultimas as $match ) {
            $msg_usuario = trim( $match[1] );
            $msg_agente = trim( $match[2] );
            
            if ( ! empty( $msg_usuario ) ) {
                $messages[] = [ 'role' => 'user', 'content' => $msg_usuario ];
            }
            if ( ! empty( $msg_agente ) ) {
                $messages[] = [ 'role' => 'assistant', 'content' => $msg_agente ];
            }
        }
    }
    
    // Add current message
    $messages[] = [ 'role' => 'user', 'content' => $message ];
    
    // Check if initial questionnaire was already completed (buscar patron en conversation_string)
    $cuestionario_inicial_completado = strpos( $conversation_string, '[cuestionario_completado]' ) !== false;
    
    // Check if CR questionnaire was completed
    $cr_completado = strpos( $conversation_string, '[cr_cuestionario_completado]' ) !== false;
    
    // Define tools - start with empty array and add based on context
    $tools = [];
    
    // Tool 1: Cuestionario Inicial (OBLIGATORIO para usuarios nuevos)
    // Solo disponible si NO ha sido completado y estamos en interacciones 1-3
    if ( ! $cuestionario_inicial_completado && $num_interacciones >= 1 && $num_interacciones <= 3 ) {
        $tools[] = [
            'type' => 'function',
            'function' => [
                'name' => 'sugerir_cuestionario_inicial',
                'description' => 'OBLIGATORIO: Sugiere el cuestionario inicial de conocimiento al estudiante. Este cuestionario es ESENCIAL para conocer mejor al estudiante y debe realizarse en las primeras 1-3 interacciones. usalo cuando hayas establecido un minimo rapport (saludo, pregunta inicial respondida) y antes de profundizar en la conversacion.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'mensaje_introduccion' => [
                            'type' => 'string', 
                            'description' => 'Mensaje calido y natural para introducir el cuestionario. Ejemplo: "Para conocerte mejor y saber como puedo acompañarte, me gustaria hacerte unas preguntas breves. ¿Te parece?"'
                        ]
                    ],
                    'required' => ['mensaje_introduccion']
                ]
            ]
        ];
    }
    
    // Tool 2: Cuestionario CR (para desorientacion)
    // Solo disponible si el cuestionario inicial YA fue completado
    if ( $cuestionario_inicial_completado ) {
        $tools[] = [
            'type' => 'function',
            'function' => [
                'name' => 'sugerir_cuestionario_orientacion',
                'description' => 'Sugiere al estudiante un cuestionario breve para explorar si sus dudas son sobre la eleccion de carrera o sobre adaptacion personal. Usar cuando el estudiante expresa desorientacion, dudas sobre su carrera, o incertidumbre sobre si eligio bien. NO usar si el estudiante solo tiene nervios normales de inicio.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'motivo' => [
                            'type' => 'string',
                            'description' => 'Breve explicacion de por que se sugiere el cuestionario'
                        ],
                        'mensaje_introduccion' => [
                            'type' => 'string', 
                            'description' => 'Mensaje calido y natural para introducir el cuestionario al estudiante'
                        ]
                    ],
                    'required' => ['motivo', 'mensaje_introduccion']
                ]
            ]
        ];
    }
    
    // Tool 3: Test RIASEC
    // Verificar si CR fue completado con R >= C buscando en conversation_string
    $puede_sugerir_riasec = false;
    if ( $cr_completado ) {
        // Buscar el resultado del CR en el conversation_string
        // Formato: [cr_cuestionario_completado]...rama: R...
        if ( preg_match( '/\[cr_cuestionario_completado\].*?rama:\s*(R|C)/s', $conversation_string, $cr_match ) ) {
            $puede_sugerir_riasec = ( $cr_match[1] === 'R' );
        }
    }
    
    // Only include RIASEC tool if CR was completed with R >= C
    if ( $puede_sugerir_riasec ) {
        $tools[] = [
            'type' => 'function',
            'function' => [
                'name' => 'sugerir_test_riasec',
                'description' => 'Sugiere el test RIASEC de intereses vocacionales. SOLO usar despues de que el estudiante completo el cuestionario CR y mostro mayor puntuacion R (reorientacion) que C (chat). El test ayuda a explorar como sus intereses se conectan con diferentes carreras.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'mensaje_introduccion' => [
                            'type' => 'string',
                            'description' => 'Mensaje empatico explicando que el test ayudara a ver como sus intereses se alinean con la carrera que eligio.'
                        ]
                    ],
                    'required' => ['mensaje_introduccion']
                ]
            ]
        ];
    }
    
    // Add instruction to system prompt if questionnaire is pending
    if ( ! $cuestionario_inicial_completado && $num_interacciones >= 1 && $num_interacciones <= 3 ) {
        $messages[0]['content'] .= "\n\n⚠️ INSTRUCCIoN PRIORITARIA: El estudiante aun NO ha completado el cuestionario inicial de conocimiento. Despues de responder brevemente a su mensaje, DEBES usar la funcion 'sugerir_cuestionario_inicial' para proponerle las preguntas de manera natural. Es obligatorio conocer mejor al estudiante antes de profundizar en la conversacion.";
    }
    
    // Call OpenAI
    $api_key = defined( 'OPENAI_API_KEY' ) ? OPENAI_API_KEY : null;
    
    if ( ! $api_key ) {
        error_log( 'OPENAI_API_KEY no configurada' );
        return new WP_REST_Response( [
            'success' => false,
            'error'   => 'api_key_no_configurada',
            'message' => 'API Key de OpenAI no configurada.',
        ], 500 );
    }
    
    $response = wp_remote_post( 'https://api.openai.com/v1/chat/completions', [
        'headers' => [
            'Authorization' => 'Bearer ' . $api_key,
            'Content-Type'  => 'application/json',
        ],
        'body'    => wp_json_encode( [
            'model'    => 'gpt-4o',
            'messages' => $messages,
            'tools'    => $tools,
            'tool_choice' => 'auto',
        ] ),
        'timeout' => 30,
    ] );
    
    if ( is_wp_error( $response ) ) {
        error_log( 'Error OpenAI: ' . $response->get_error_message() );
        return new WP_REST_Response( [
            'success' => false,
            'error'   => 'error_openai',
            'message' => 'Error al conectar con OpenAI.',
        ], 500 );
    }
    
    $body_response = json_decode( wp_remote_retrieve_body( $response ), true );
    
    // Check if model wants to use a tool
    $tool_calls = $body_response['choices'][0]['message']['tool_calls'] ?? null;
    $reply = '';
    $action = null;
    
    if ( $tool_calls && count( $tool_calls ) > 0 ) {
        $tool_call = $tool_calls[0];
        $function_name = $tool_call['function']['name'];
        $function_args = json_decode( $tool_call['function']['arguments'], true );
        
        if ( $function_name === 'sugerir_cuestionario_inicial' ) {
            $reply = $function_args['mensaje_introduccion'];
            $action = [
                'type' => 'show_initial_questionnaire',
            ];
            error_log( 'Tool activada: sugerir_cuestionario_inicial' );
        } elseif ( $function_name === 'sugerir_cuestionario_orientacion' ) {
            $reply = $function_args['mensaje_introduccion'];
            $action = [
                'type' => 'show_cr_questionnaire',
                'motivo' => $function_args['motivo'],
            ];
            error_log( 'Tool activada: sugerir_cuestionario_orientacion - ' . $function_args['motivo'] );
        } elseif ( $function_name === 'sugerir_test_riasec' ) {
            $reply = $function_args['mensaje_introduccion'];
            $action = [
                'type' => 'show_riasec_test',
            ];
            error_log( 'Tool activada: sugerir_test_riasec' );
        }
    } else {
        // Normal text response
        if ( ! isset( $body_response['choices'][0]['message']['content'] ) ) {
            error_log( 'Respuesta OpenAI invalida: ' . wp_json_encode( $body_response ) );
            return new WP_REST_Response( [
                'success' => false,
                'error'   => 'respuesta_invalida',
                'message' => 'Respuesta de OpenAI invalida.',
            ], 500 );
        }
        $reply = $body_response['choices'][0]['message']['content'];
    }
    
    // Detectar crisis en el mensaje del usuario
    $crisis = gero_detectar_crisis_UNITEC_02( $message );
    $crisis_detectada = $crisis['detected'];
    $nivel_crisis = $crisis['level'] ?? '';
    
    // Guardar interaccion en conversation_string
    $timestamp = current_time( 'Y-m-d H:i:s' );
    $texto_interaccion = "[{$timestamp}] [interaccion_agente]\n";
    $texto_interaccion .= "  usuario: {$message}\n";
    $texto_interaccion .= "  agente: {$reply}\n";
    if ( $action ) {
        $texto_interaccion .= "  action: " . wp_json_encode( $action ) . "\n";
    }
    if ( $crisis_detectada ) {
        $texto_interaccion .= "  [CRISIS_DETECTADA: {$nivel_crisis}]\n";
        error_log( 'CRISIS en chat - Usuario: #' . $user_id . ' - Nivel: ' . $nivel_crisis );
    }
    $texto_interaccion .= "---\n";
    
    // Buscar si ya existe registro para este usuario
    $registro_existente = $wpdb->get_row( $wpdb->prepare(
        "SELECT id, conversation_string FROM byw_coach_interacciones WHERE user_id = %d LIMIT 1",
        $user_id
    ) );
    
    if ( $registro_existente ) {
        // Append al conversation_string existente
        $nuevo_conversation = $registro_existente->conversation_string . $texto_interaccion;
        $wpdb->update(
            'byw_coach_interacciones',
            [ 'conversation_string' => $nuevo_conversation ],
            [ 'id' => $registro_existente->id ]
        );
    } else {
        // Crear nuevo registro
        $wpdb->insert(
            'byw_coach_interacciones',
            [
                'user_id'             => $user_id,
                'value_validador'     => $matricula,
                'conversation_string' => $texto_interaccion,
                'created_at'          => current_time( 'mysql' ),
            ]
        );
    }
    
    // Si se detecto crisis, actualizar prioridad_caso a critico
    if ( $crisis_detectada ) {
        $justificacion_crisis = 'CRISIS DETECTADA en conversacion (' . current_time( 'Y-m-d H:i' ) . '). ';
        $justificacion_crisis .= 'Nivel: ' . ucfirst( $nivel_crisis ) . '. ';
        $justificacion_crisis .= 'Requiere atencion inmediata del equipo de retencion.';
        
        $registro_agente = $wpdb->get_row( $wpdb->prepare(
            "SELECT ID, justificacion FROM byw_agente_retencion WHERE user_id = %d LIMIT 1",
            $user_id
        ) );
        
        if ( $registro_agente ) {
            // Actualizar a prioridad critica
            $wpdb->update(
                'byw_agente_retencion',
                [
                    'prioridad_caso'   => 'critico',
                    'justificacion'    => $justificacion_crisis . ' | ' . ( $registro_agente->justificacion ?? '' ),
                    'ultima_actividad' => current_time( 'mysql', 1 ),
                ],
                [ 'ID' => $registro_agente->ID ]
            );
        } else {
            // Crear registro con prioridad critica
            $wpdb->insert(
                'byw_agente_retencion',
                [
                    'user_id'          => $user_id,
                    'user_email'       => $matricula,
                    'riesgo_detectado' => wp_json_encode( [ 'crisis_emocional' ] ),
                    'prioridad_caso'   => 'critico',
                    'justificacion'    => $justificacion_crisis,
                    'ultima_actividad' => current_time( 'mysql', 1 ),
                ]
            );
        }
    }
    
    error_log( 'Chat guardado - Usuario: #' . $user_id . ( $action ? ' - Action: ' . $action['type'] : '' ) );
    
    // Build response
    $response_data = [
        'success'   => true,
        'respuesta' => $reply,
        'message'   => $reply,
    ];
    
    // Include action for frontend to handle
    if ( $action ) {
        $response_data['action'] = $action;
    }
    
    return new WP_REST_Response( $response_data, 200 );
}

/**
 * ENDPOINT: Save CR questionnaire result
 * POST /wp-json/gero/v1/guardar-resultado-cr
 * 
 * This endpoint saves the result of the C (Chat) vs R (RIASEC) questionnaire
 * to determine if student needs career reorientation.
 */
add_action( 'rest_api_init', function () {
    register_rest_route( GERO_API_NAMESPACE, '/guardar-resultado-cr', [
        'methods'             => 'POST',
        'callback'            => 'gero_endpoint_guardar_resultado_cr_UNITEC_02',
        'permission_callback' => '__return_true',
    ] );
} );

function gero_endpoint_guardar_resultado_cr_UNITEC_02( WP_REST_Request $request ) {
    global $wpdb;
    
    $body = $request->get_json_params();
    $user_id = (int) ( $body['user_id'] ?? 0 );
    $puntuacion_c = (int) ( $body['puntuacion_c'] ?? 0 );
    $puntuacion_r = (int) ( $body['puntuacion_r'] ?? 0 );
    $respuestas = $body['respuestas'] ?? [];
    
    if ( ! $user_id ) {
        return new WP_REST_Response( [
            'success' => false,
            'error'   => 'user_id_requerido',
        ], 400 );
    }
    
    $rama = $puntuacion_r >= $puntuacion_c ? 'R' : 'C';
    
    // Construir texto para conversation_string
    $timestamp = current_time( 'Y-m-d H:i:s' );
    $texto_cr = "[{$timestamp}] [cr_cuestionario_completado]\n";
    $texto_cr .= "  puntuacion_c: {$puntuacion_c}\n";
    $texto_cr .= "  puntuacion_r: {$puntuacion_r}\n";
    $texto_cr .= "  rama: {$rama}\n";
    $texto_cr .= "  respuestas: " . wp_json_encode( $respuestas ) . "\n";
    if ( $rama === 'R' ) {
        $texto_cr .= "  riesgo: desorientacion_confirmada\n";
    }
    $texto_cr .= "---\n";
    
    // Buscar si ya existe registro para este usuario
    $registro_existente = $wpdb->get_row( $wpdb->prepare(
        "SELECT id, conversation_string FROM byw_coach_interacciones WHERE user_id = %d LIMIT 1",
        $user_id
    ) );
    
    if ( $registro_existente ) {
        // Append al conversation_string existente
        $nuevo_conversation = $registro_existente->conversation_string . $texto_cr;
        $wpdb->update(
            'byw_coach_interacciones',
            [ 'conversation_string' => $nuevo_conversation ],
            [ 'id' => $registro_existente->id ]
        );
    } else {
        // Crear nuevo registro
        $wpdb->insert(
            'byw_coach_interacciones',
            [
                'user_id'             => $user_id,
                'value_validador'     => '',
                'conversation_string' => $texto_cr,
                'created_at'          => current_time( 'mysql' ),
            ]
        );
    }
    
    error_log( "CR Cuestionario - Usuario: #$user_id - C: $puntuacion_c, R: $puntuacion_r - Rama: $rama" );
    
    return new WP_REST_Response( [
        'success'      => true,
        'puntuacion_c' => $puntuacion_c,
        'puntuacion_r' => $puntuacion_r,
        'rama'         => $rama,
        'sugerir_riasec' => $rama === 'R',
        'message'      => $rama === 'R' 
            ? 'Se recomienda explorar intereses con test RIASEC.' 
            : 'Continuar con acompañamiento de chat.',
    ], 200 );
}

/**
 * ENDPOINT: Save RIASEC test result
 * POST /wp-json/gero/v1/guardar-resultado-riasec
 */
add_action( 'rest_api_init', function () {
    register_rest_route( GERO_API_NAMESPACE, '/guardar-resultado-riasec', [
        'methods'             => 'POST',
        'callback'            => 'gero_endpoint_guardar_resultado_riasec_UNITEC_02',
        'permission_callback' => '__return_true',
    ] );
} );

function gero_endpoint_guardar_resultado_riasec_UNITEC_02( WP_REST_Request $request ) {
    global $wpdb;
    
    $body = $request->get_json_params();
    $user_id = (int) ( $body['user_id'] ?? 0 );
    $codigo_riasec = sanitize_text_field( $body['codigo_riasec'] ?? '' );
    $puntajes = $body['puntajes'] ?? [];
    $carrera_actual = sanitize_text_field( $body['carrera_actual'] ?? '' );
    $carreras_afines = $body['carreras_afines'] ?? [];
    $hay_match = (bool) ( $body['hay_match'] ?? false );
    
    if ( ! $user_id || empty( $codigo_riasec ) ) {
        return new WP_REST_Response( [
            'success' => false,
            'error'   => 'parametros_incompletos',
        ], 400 );
    }
    
    // Construir texto para conversation_string
    $timestamp = current_time( 'Y-m-d H:i:s' );
    $texto_riasec = "[{$timestamp}] [riasec_completado]\n";
    $texto_riasec .= "  codigo_riasec: {$codigo_riasec}\n";
    $texto_riasec .= "  puntajes: " . wp_json_encode( $puntajes ) . "\n";
    $texto_riasec .= "  carrera_actual: {$carrera_actual}\n";
    $texto_riasec .= "  carreras_afines: " . wp_json_encode( $carreras_afines ) . "\n";
    $texto_riasec .= "  hay_match: " . ( $hay_match ? 'si' : 'no' ) . "\n";
    if ( ! $hay_match ) {
        $texto_riasec .= "  riesgo: desalineacion_carrera\n";
    }
    $texto_riasec .= "---\n";
    
    // Buscar si ya existe registro para este usuario
    $registro_existente = $wpdb->get_row( $wpdb->prepare(
        "SELECT id, conversation_string FROM byw_coach_interacciones WHERE user_id = %d LIMIT 1",
        $user_id
    ) );
    
    if ( $registro_existente ) {
        // Append al conversation_string existente
        $nuevo_conversation = $registro_existente->conversation_string . $texto_riasec;
        $wpdb->update(
            'byw_coach_interacciones',
            [ 'conversation_string' => $nuevo_conversation ],
            [ 'id' => $registro_existente->id ]
        );
    } else {
        // Crear nuevo registro
        $wpdb->insert(
            'byw_coach_interacciones',
            [
                'user_id'             => $user_id,
                'value_validador'     => '',
                'conversation_string' => $texto_riasec,
                'created_at'          => current_time( 'mysql' ),
            ]
        );
    }
    
    error_log( "RIASEC Completado - Usuario: #$user_id - Codigo: $codigo_riasec - Match: " . ( $hay_match ? 'Si' : 'No' ) );
    
    // Actualizar prioridad_caso si no hay match
    if ( ! $hay_match ) {
        $justificacion_riasec = 'Test RIASEC completado (' . current_time( 'Y-m-d' ) . '). ';
        $justificacion_riasec .= 'Codigo: ' . $codigo_riasec . '. ';
        $justificacion_riasec .= 'NO hay match con carrera actual (' . $carrera_actual . '). ';
        $justificacion_riasec .= 'Carreras afines sugeridas: ' . implode( ', ', array_slice( $carreras_afines, 0, 3 ) ) . '.';
        
        $registro_agente = $wpdb->get_row( $wpdb->prepare(
            "SELECT ID, prioridad_caso, justificacion FROM byw_agente_retencion WHERE user_id = %d LIMIT 1",
            $user_id
        ) );
        
        // Subir a 'alto' si no es ya 'critico'
        if ( $registro_agente ) {
            $nueva_prioridad = $registro_agente->prioridad_caso === 'critico' ? 'critico' : 'alto';
            $wpdb->update(
                'byw_agente_retencion',
                [
                    'prioridad_caso'   => $nueva_prioridad,
                    'riesgo_detectado' => wp_json_encode( [ 'desalineacion_carrera' ] ),
                    'justificacion'    => $justificacion_riasec . ' | ' . ( $registro_agente->justificacion ?? '' ),
                    'ultima_actividad' => current_time( 'mysql', 1 ),
                ],
                [ 'ID' => $registro_agente->ID ]
            );
        } else {
            $wpdb->insert(
                'byw_agente_retencion',
                [
                    'user_id'          => $user_id,
                    'user_email'       => '',
                    'riesgo_detectado' => wp_json_encode( [ 'desalineacion_carrera' ] ),
                    'prioridad_caso'   => 'alto',
                    'justificacion'    => $justificacion_riasec,
                    'ultima_actividad' => current_time( 'mysql', 1 ),
                ]
            );
        }
    }
    
    return new WP_REST_Response( [
        'success'        => true,
        'codigo_riasec'  => $codigo_riasec,
        'hay_match'      => $hay_match,
        'carreras_afines' => $carreras_afines,
        'message'        => $hay_match 
            ? 'Tus intereses se alinean con tu carrera actual.' 
            : 'Exploramos opciones que podrian ajustarse mejor a tus intereses.',
    ], 200 );
}

/**
 * ENDPOINT: Get last conversation
 * GET /wp-json/gero/v1/last-conversation
 */
add_action( 'rest_api_init', function () {
    register_rest_route( GERO_API_NAMESPACE, '/last-conversation', [
        'methods'             => 'GET',
        'callback'            => 'gero_endpoint_last_conversation_UNITEC_02',
        'permission_callback' => '__return_true',
    ] );
} );

function gero_endpoint_last_conversation_UNITEC_02( WP_REST_Request $request ) {
    global $wpdb;
    
    $value_validador = sanitize_text_field( $request->get_param( 'value_validador' ) ?? '' );
    
    if ( empty( $value_validador ) ) {
        return new WP_REST_Response( [
            'success' => false,
            'message' => 'Falta value_validador',
        ], 400 );
    }
    
    $row = $wpdb->get_row( $wpdb->prepare(
        "SELECT conversation_string FROM byw_coach_interacciones WHERE value_validador = %s LIMIT 1",
        $value_validador
    ) );
    
    if ( ! $row ) {
        return new WP_REST_Response( [
            'success' => false,
            'message' => 'Sin historial previo',
        ], 200 );
    }
    
    return new WP_REST_Response( [
        'success'                 => true,
        'conversation_string'     => $row->conversation_string,
    ], 200 );
}

/**
 * ============================================================================
 * SECTION 5: SHORTCODE
 * ============================================================================
 */

/**
 * Shortcode: [agente-retencion-unitec-02]
 * Serves the React application from /dist/index.html
 * PAGINA PUBLICA - La validacion de matricula se hace en el frontend
 */
add_shortcode( 'agente-retencion-unitec-02', function ( $atts ) {
    // Find dist folder
    $dist_path = null;
    $base_url = null;
    
    // Try plugin directory
    if ( file_exists( plugin_dir_path( __FILE__ ) . 'dist/index.html' ) ) {
        $dist_path = plugin_dir_path( __FILE__ ) . 'dist/index.html';
        $base_url = plugin_dir_url( __FILE__ ) . 'dist/';
    }
    // Try alternate location
    elseif ( file_exists( WP_PLUGIN_DIR . '/agente-retencion-unitec-02/dist/index.html' ) ) {
        $dist_path = WP_PLUGIN_DIR . '/agente-retencion-unitec-02/dist/index.html';
        $base_url = plugins_url( 'dist/', 'agente-retencion-unitec-02/agente-retencion-unitec-02.php' );
    }
    
    if ( ! $dist_path || ! file_exists( $dist_path ) ) {
        return '<div style="padding:20px;background:#fee;border:2px solid #f00;border-radius:4px;color:#c33;">
            ⚠️ Error: No se encontro /dist/index.html
        </div>';
    }
    
    // Read and fix paths
    $html = file_get_contents( $dist_path );
    if ( $base_url ) {
        $html = str_replace( [ 'href="/assets/', 'src="/assets/' ], 
                            [ 'href="' . rtrim( $base_url, '/' ) . '/assets/', 
                              'src="' . rtrim( $base_url, '/' ) . '/assets/' ], 
                            $html );
    }
    
    // Output and exit
    @header( 'Content-Type: text/html; charset=utf-8' );
    @header( 'X-UA-Compatible: IE=edge' );
    @header( 'Cache-Control: no-cache, no-store, must-revalidate' );
    @header( 'Pragma: no-cache' );
    @header( 'Expires: 0' );
    
    echo $html;
    exit();
} );
?>

