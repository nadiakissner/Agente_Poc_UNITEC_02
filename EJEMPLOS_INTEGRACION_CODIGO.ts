// ========================================
// 🔹 EJEMPLOS DE INTEGRACIÓN EN ROUTEA.TSX
// ========================================

/**
 * Ejemplo 1: Enviar cuestionario cuando se completa paso 8 (Decisión)
 * 
 * Ubicación en RouteA.tsx: dentro de la función handleDecision
 */

import { useState } from 'react';

// Función auxiliar para enviar análisis
const enviarAnalisisCuestionario = async (
  userId: string,
  respuestas: Record<string, any>,
  riesgos: string[]
) => {
  try {
    const response = await fetch('/wp-json/gero/v1/procesar-fin-cuestionario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: parseInt(userId),
        respuestas: respuestas,
        riesgos: riesgos,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Cuestionario enviado para análisis:', data.message);
    } else {
      console.warn('⚠️ Error al enviar cuestionario:', data);
    }
  } catch (error) {
    console.error('❌ Error en análisis de cuestionario:', error);
    // NO detener el flujo - el análisis es background
  }
};

// Integración en handleDecision
const handleDecision = (tipo: 'intentar' | 'pensar', userLabel: string) => {
  const newHistory = [...conversationHistory, { sender: 'user' as const, message: userLabel }];
  setConversationHistory(newHistory);
  saveConversationIncremental(newHistory);

  // Scoring...
  let newC = puntuacionC;
  let newR = puntuacionR;

  if (tipo === 'intentar') {
    newC += 1;
  } else {
    newR += 2;
  }

  setPuntuacionC(newC);
  setPuntuacionR(newR);

  const ramaDestino = newR >= newC ? 'R' : 'C';

  if (ramaDestino === 'C') {
    // RAMA C: Chat IA
    
    // ⭐ AGREGAR AQUÍ: Enviar cuestionario para análisis
    enviarAnalisisCuestionario(
      userId,
      {
        P1: localStorage.getItem('routeA_respuesta_P1') || '',
        P2: localStorage.getItem('routeA_respuesta_P2') || '',
        P3: localStorage.getItem('routeA_respuesta_P3') || '',
        P4: localStorage.getItem('routeA_respuesta_P4') || '',
        P5: localStorage.getItem('routeA_respuesta_P5') || '',
        P6: localStorage.getItem('routeA_respuesta_P6') || '',
        P7: localStorage.getItem('routeA_respuesta_P7') || '',
        P8: localStorage.getItem('routeA_respuesta_P8') || '',
      },
      riesgosDetectados // Ya tienes esta variable
    );

    showTyping(400, () => {
      const introMsg =
        'Perfecto, esa decisión muestra tu compromiso. Vamos a construir un plan juntos...';
      setChatHistory([{ sender: 'agent' as const, message: introMsg }]);
      setIsAiChatActive(true);
    });
  } else {
    // RAMA R: Reorientación
    // En este caso también puedes enviar el análisis
    enviarAnalisisCuestionario(
      userId,
      { /* respuestas */ },
      riesgosDetectados
    );

    // Resto del código...
  }
};

// ========================================
// 🔹 EJEMPLO 2: ENVIAR ANÁLISIS DE RUTA AL FINALIZAR
// ========================================

/**
 * Función para enviar análisis cuando se finaliza una ruta
 * Se puede usar en Agent.tsx, Summary.tsx o cualquier componente
 */

const enviarAnalisisRuta = async (
  userId: string,
  rutaNombre: string,
  historialConversacion: Array<{ sender: 'agent' | 'user'; message: string }>
) => {
  try {
    const response = await fetch('/wp-json/gero/v1/procesar-fin-ruta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: parseInt(userId),
        ruta: rutaNombre,
        conversacion: historialConversacion,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Ruta enviada para análisis final:', data.message);
      return { success: true };
    } else {
      console.warn('⚠️ Error en análisis de ruta:', data);
      return { success: false, error: data };
    }
  } catch (error) {
    console.error('❌ Error en análisis de ruta:', error);
    // El análisis falló, pero continuamos de todas formas
    return { success: false, error };
  }
};

// Uso en Agent.tsx:
const handleFinalizarConversacion = async () => {
  // Guardar conversación
  await saveConversation();

  // ⭐ AGREGAR AQUÍ: Enviar análisis de ruta
  await enviarAnalisisRuta(
    userId,
    'Agent', // O el nombre de la ruta actual
    chatHistory
  );

  // Mostrar resumen o navegar
  navigate('/thank-you');
};

// ========================================
// 🔹 EJEMPLO 3: HOOK PERSONALIZADO
// ========================================

/**
 * Hook para manejar análisis de forma más limpia
 * Uso: const analytics = useAnalytics();
 */

import { useCallback } from 'react';

function useAnalytics() {
  const enviarCuestionario = useCallback(
    async (
      userId: string,
      respuestas: Record<string, any>,
      riesgos: string[]
    ) => {
      try {
        const response = await fetch('/wp-json/gero/v1/procesar-fin-cuestionario', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: parseInt(userId),
            respuestas,
            riesgos,
          }),
        });

        return await response.json();
      } catch (error) {
        console.error('Error en análisis:', error);
        return { success: false };
      }
    },
    []
  );

  const enviarRuta = useCallback(
    async (
      userId: string,
      ruta: string,
      conversacion: Array<{ sender: string; message: string }>
    ) => {
      try {
        const response = await fetch('/wp-json/gero/v1/procesar-fin-ruta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: parseInt(userId),
            ruta,
            conversacion,
          }),
        });

        return await response.json();
      } catch (error) {
        console.error('Error en análisis de ruta:', error);
        return { success: false };
      }
    },
    []
  );

  return { enviarCuestionario, enviarRuta };
}

// Uso en componente:
export default function MiComponente() {
  const { enviarCuestionario, enviarRuta } = useAnalytics();

  const manejarFin = async () => {
    await enviarCuestionario('123', { P1: '...' }, ['riesgo1']);
    navigate('/next');
  };

  return <button onClick={manejarFin}>Finalizar</button>;
}

// ========================================
// 🔹 EJEMPLO 4: EN AGENT.TSX
// ========================================

/**
 * Integración en Agent.tsx (componente del chat IA)
 */

import { useState, useEffect } from 'react';

export default function Agent() {
  const [chatHistory, setChatHistory] = useState<
    Array<{ sender: 'agent' | 'user'; message: string }>
  >([]);
  const userId = localStorage.getItem('unitec_user_id') || '0';

  // Cuando se finaliza el chat
  const handleFinalizar = async () => {
    try {
      // Primero guardar la conversación como siempre
      await fetch('/wp-json/gero/v1/guardar-conversacion-agente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: parseInt(userId),
          conversacion: chatHistory.map((m) => `${m.sender}: ${m.message}`).join('\n'),
        }),
      });

      // ⭐ AGREGAR AQUÍ: Enviar análisis de ruta
      const analysisResponse = await fetch('/wp-json/gero/v1/procesar-fin-ruta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: parseInt(userId),
          ruta: 'Agent', // Nombre de la ruta
          conversacion: chatHistory,
        }),
      });

      const analysisData = await analysisResponse.json();
      console.log('✅ Análisis enviado:', analysisData);

      // Navegar sin esperar al análisis (es background)
      navigate('/thank-you');
    } catch (error) {
      console.error('Error finalizando:', error);
      // Aun así navegar
      navigate('/thank-you');
    }
  };

  return (
    <div>
      {/* Chat UI */}
      <button onClick={handleFinalizar}>Finalizar Conversación</button>
    </div>
  );
}

// ========================================
// 🔹 EJEMPLO 5: VALIDACIÓN ANTES DE ENVIAR
// ========================================

/**
 * Validar que los datos sean correctos antes de enviar
 */

function validarDatosParaAnalisis(userId: string, datos: any): boolean {
  if (!userId || isNaN(parseInt(userId))) {
    console.error('❌ User ID inválido');
    return false;
  }

  if (typeof datos !== 'object' || Object.keys(datos).length === 0) {
    console.error('❌ Datos vacíos');
    return false;
  }

  return true;
}

// Uso:
const handleEnviar = async () => {
  if (!validarDatosParaAnalisis(userId, respuestas)) {
    console.warn('Saltando análisis - datos inválidos');
    return;
  }

  await enviarAnalisisCuestionario(userId, respuestas, riesgos);
};

// ========================================
// 🔹 EJEMPLO 6: CON MANEJO DE ERRORES ROBUSTO
// ========================================

/**
 * Versión robusta con reintentos
 */

async function enviarAnalisisConReintentos(
  endpoint: string,
  payload: any,
  maxReintentos: number = 3
) {
  for (let intento = 1; intento <= maxReintentos; intento++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeout: 30000, // 30 segundos
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Intento ${intento}: Éxito`);
        return data;
      } else {
        console.warn(`⚠️ Intento ${intento}: Status ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Intento ${intento}: ${error}`);

      if (intento < maxReintentos) {
        // Esperar antes de reintentar (exponencial backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * intento));
      }
    }
  }

  console.error(`❌ Falló después de ${maxReintentos} intentos`);
  return { success: false, error: 'Max retries exceeded' };
}

// Uso:
const resultado = await enviarAnalisisConReintentos(
  '/wp-json/gero/v1/procesar-fin-cuestionario',
  { user_id: 123, respuestas: {} },
  3
);

// ========================================
// 🔹 CONFIGURACIÓN RECOMENDADA
// ========================================

/**
 * Constantes para los endpoints
 */

const ENDPOINTS = {
  PROCESAR_CUESTIONARIO: '/wp-json/gero/v1/procesar-fin-cuestionario',
  PROCESAR_RUTA: '/wp-json/gero/v1/procesar-fin-ruta',
};

const CONFIG = {
  TIMEOUT_MS: 30000,
  REINTENTOS: 3,
  ESPERAR_BACKGROUND: false, // No esperar respuesta (es background)
};

// Uso:
const enviarAnalisis = async () => {
  const promise = fetch(ENDPOINTS.PROCESAR_CUESTIONARIO, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });

  if (!CONFIG.ESPERAR_BACKGROUND) {
    // Fire and forget
    promise.catch((err) => console.warn('⚠️ Análisis background:', err));
  } else {
    // Esperar resultado
    const resultado = await promise;
    return await resultado.json();
  }
};
