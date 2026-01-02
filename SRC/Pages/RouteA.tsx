// Route A: Versión Integrada
// Nuevo Flujo Conversacional (Pasos 2-8) con Puntuación C/R
// Determina Rama C (Chat IA) vs Rama R (RIASEC) según puntuación

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/Components/Header";
import { ChatBubble } from "@/Components/Chat/ChatBubble";
import { TypingIndicator } from "@/Components/Chat/TypingIndicator";
import { Chip } from "@/Components/Ui/chip";
import { Button } from "@/Components/Ui/button";
import { Input } from "@/Components/Ui/input";
import { ResourceCard } from "@/Components/Chat/ResourceCard";
import { ArrowRight, ExternalLink, Send, ArrowLeft } from "lucide-react";
import { useToast } from "@/Hooks/use-toast";
import { obtenerRiasecCarrera, verificarAlineacionRiasec } from "@/Data/carreras_riasec";
import { validateStorageIntegrity, getCurrentUserId } from "@/Lib/storageManager";
import { alternativeRoutes } from "@/Data/routes";

const API_BASE = "/wp-json/gero/v1"; 
const ALEX_URL = "https://wa.me/5215596610554?text=Hola%20Alex.%20Tengo%20algunas%20dudas%20sobre%20la%20carrera%20que%20eleg%C3%AD%20y%20quisiera%20conversarlo%20contigo";
const CADE_URL = "https://www.unitec.mx/apoyo-al-desarrollo-estudiantil/?utm_source=BLOG&utm_medium=ORGANIC&utm_campaign=BLG_UG_UNITEC_CONT_C3_242";

// Helper para crear claves de localStorage con user_id para evitar contaminación entre usuarios
const getStorageKey = (baseKey: string, userId: string) => {
  return userId ? `user_${userId}_${baseKey}` : baseKey;
};

export default function RouteA() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [userInput, setUserInput] = useState("");

  // USUARIO
  const [userName] = useState(localStorage.getItem("unitec_nombre") || "estudiante");
  const [userEmail] = useState(localStorage.getItem("unitec_user_email") || "");
  const [matricula] = useState(localStorage.getItem("unitec_matricula") || "");
  const [userId] = useState(localStorage.getItem("unitec_user_id") || "0");
  const [userCarrera] = useState(localStorage.getItem("unitec_carrera") || "");
  const [riesgosDetectados] = useState<string[]>(() => {
    const stored = localStorage.getItem("unitec_riesgos_principales");
    return stored ? JSON.parse(stored) : [];
  });

  // PASO/FLUJO
  const [step, setStep] = useState<number>(() => {
    const saved = localStorage.getItem(getStorageKey("routeA_step", userId));
    return saved ? parseInt(saved) : 0;
  });
  const [typing, setTyping] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // CONVERSACIÓN - Cargar historial de Home primero, luego RouteA si existe
  const [conversationHistory, setConversationHistory] = useState<{sender: 'agent'|'user', message: string}[]>(() => {
    // Primero, intentar cargar historial de Home
    const homeHistory = localStorage.getItem("unitec_home_chat_history");
    const homeMessages = homeHistory ? JSON.parse(homeHistory) : [];
    
    // Luego, intentar cargar historial de RouteA
    const saved = localStorage.getItem(getStorageKey("routeA_conversationHistory", userId));
    const routeAMessages = saved ? JSON.parse(saved) : [];
    
    // Si hay historial de Home, combinar ambos. Si no, usar solo RouteA
    if (homeMessages.length > 0) {
      return [...homeMessages, ...routeAMessages];
    }
    return routeAMessages;
  });

  // PUNTUACIÓN C/R (Determina Rama)
  const [puntuacionC, setPuntuacionC] = useState<number>(() => {
    const saved = localStorage.getItem(getStorageKey("routeA_puntuacionC", userId));
    return saved ? parseInt(saved) : 0;
  });
  const [puntuacionR, setPuntuacionR] = useState<number>(() => {
    const saved = localStorage.getItem(getStorageKey("routeA_puntuacionR", userId));
    return saved ? parseInt(saved) : 0;
  });

  // SISTEMA RIASEC
  const [riasecScores, setRiasecScores] = useState<{R: number, I: number, A: number, S: number, E: number, C: number}>(() => {
    const saved = localStorage.getItem(getStorageKey("routeA_riasecScores", userId));
    return saved ? JSON.parse(saved) : { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  });

  // RAMA R
  const [isRamaRActive, setIsRamaRActive] = useState<boolean>(() => {
    const saved = localStorage.getItem(getStorageKey("routeA_isRamaRActive", userId));
    return saved ? JSON.parse(saved) : false;
  });
  const [ramaRStarted, setRamaRStarted] = useState<boolean>(() => {
    const saved = localStorage.getItem(getStorageKey("routeA_ramaRStarted", userId));
    return saved ? JSON.parse(saved) : false;
  });
  const [ramaRStep, setRamaRStep] = useState<number>(() => {
    const saved = localStorage.getItem(getStorageKey("routeA_ramaRStep", userId));
    return saved ? parseInt(saved) : 0;
  });  const [showOtherRoutes, setShowOtherRoutes] = useState(false);
  // PREGUNTAS RIASEC (12 preguntas - Rama R)
  const ramaRQuestions = [
    {
      id: 1,
      optionA: { text: "Diseñar un poster para un evento", letter: "A" as const },
      optionB: { text: "Analizar resultados de una encuesta", letter: "I" as const }
    },
    {
      id: 2,
      optionA: { text: "Armar o reparar cosas con herramientas", letter: "R" as const },
      optionB: { text: "Acompañar a una persona a resolver un problema personal", letter: "S" as const }
    },
    {
      id: 3,
      optionA: { text: "Liderar un proyecto y persuadir a otros", letter: "E" as const },
      optionB: { text: "Organizar datos y procesos en planillas", letter: "C" as const }
    },
    {
      id: 4,
      optionA: { text: "Entender cómo funcionan las cosas por dentro", letter: "I" as const },
      optionB: { text: "Crear bocetos e ideas visuales", letter: "A" as const }
    },
    {
      id: 5,
      optionA: { text: "Atender a personas de forma directa", letter: "S" as const },
      optionB: { text: "Mejorar un flujo de trabajo", letter: "C" as const }
    },
    {
      id: 6,
      optionA: { text: "Ir a terreno para medir e instalar", letter: "R" as const },
      optionB: { text: "Presentar una propuesta de negocio", letter: "E" as const }
    },
    {
      id: 7,
      optionA: { text: "Programar o prototipar una solución técnica", letter: "I" as const },
      optionB: { text: "Coordinar un equipo para cumplir metas", letter: "E" as const }
    },
    {
      id: 8,
      optionA: { text: "Diseñar o ilustrar una identidad visual", letter: "A" as const },
      optionB: { text: "Ordenar y revisar información", letter: "C" as const }
    },
    {
      id: 9,
      optionA: { text: "Acompañar a alguien en su aprendizaje", letter: "S" as const },
      optionB: { text: "Armar o montar estructuras o dispositivos", letter: "R" as const }
    },
    {
      id: 10,
      optionA: { text: "Investigar un problema y redactar hallazgos", letter: "I" as const },
      optionB: { text: "Gestionar clientes y ventas", letter: "E" as const }
    },
    {
      id: 11,
      optionA: { text: "Crear contenidos visuales para redes", letter: "A" as const },
      optionB: { text: "Gestionar documentación y cumplimiento", letter: "C" as const }
    },
    {
      id: 12,
      optionA: { text: "Escuchar y orientar a un estudiante", letter: "S" as const },
      optionB: { text: "Probar, calibrar y mejorar un equipo técnico", letter: "R" as const }
    },
  ];

  // INPUT Y CHAT IA
  const [sliderValue, setSliderValue] = useState(5);
  const [isAiChatActive, setIsAiChatActive] = useState<boolean>(() => {
    const saved = localStorage.getItem(getStorageKey("routeA_isAiChatActive", userId));
    return saved ? JSON.parse(saved) : false;
  });
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{sender: 'agent'|'user', message: string}[]>(() => {
    const saved = localStorage.getItem(getStorageKey("routeA_chatHistory", userId));
    return saved ? JSON.parse(saved) : [];
  });
  const [isSending, setIsSending] = useState(false);

  // AUTO-SCROLL
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [step, typing, feedbackMsg, chatHistory, isAiChatActive, conversationHistory]);

  // PERSISTENCIA
  useEffect(() => {
    localStorage.setItem(getStorageKey("routeA_step", userId), step.toString());
  }, [step, userId]);

  useEffect(() => {
    localStorage.setItem(getStorageKey("routeA_puntuacionC", userId), puntuacionC.toString());
  }, [puntuacionC, userId]);

  useEffect(() => {
    localStorage.setItem(getStorageKey("routeA_puntuacionR", userId), puntuacionR.toString());
  }, [puntuacionR, userId]);

  useEffect(() => {
    localStorage.setItem(getStorageKey("routeA_riasecScores", userId), JSON.stringify(riasecScores));
  }, [riasecScores, userId]);

  useEffect(() => {
    localStorage.setItem(getStorageKey("routeA_isRamaRActive", userId), JSON.stringify(isRamaRActive));
  }, [isRamaRActive, userId]);

  useEffect(() => {
    localStorage.setItem(getStorageKey("routeA_ramaRStarted", userId), JSON.stringify(ramaRStarted));
  }, [ramaRStarted, userId]);

  useEffect(() => {
    localStorage.setItem(getStorageKey("routeA_ramaRStep", userId), ramaRStep.toString());
  }, [ramaRStep, userId]);

  useEffect(() => {
    localStorage.setItem(getStorageKey("routeA_conversationHistory", userId), JSON.stringify(conversationHistory));
  }, [conversationHistory, userId]);

  useEffect(() => {
    localStorage.setItem(getStorageKey("routeA_isAiChatActive", userId), JSON.stringify(isAiChatActive));
  }, [isAiChatActive, userId]);

  useEffect(() => {
    localStorage.setItem(getStorageKey("routeA_chatHistory", userId), JSON.stringify(chatHistory));
  }, [chatHistory, userId]);

  // INICIO
  useEffect(() => {
    // VALIDAR INTEGRIDAD DE STORAGE PRIMERO
    validateStorageIntegrity();
    
    const currentUserId = getCurrentUserId();
    console.log(`✅ RouteA inicializado para usuario: ${currentUserId}`);
    
    // CARGAR HISTORIAL DE HOME SI EXISTE Y NO ESTÁ EN CONVERSATIONHISTORY
    const homeHistory = localStorage.getItem("unitec_home_chat_history");
    if (homeHistory && conversationHistory.length === 0) {
      try {
        const homeMessages = JSON.parse(homeHistory);
        if (homeMessages.length > 0) {
          setConversationHistory(homeMessages);
          console.log(`📝 Historial de Home cargado: ${homeMessages.length} mensajes`);
        }
      } catch (err) {
        console.error('Error cargando historial de Home:', err);
      }
    }
    
    if (riesgosDetectados.length > 0 && userId) {
      fetch(`${API_BASE}/guardar-riesgos-agente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: parseInt(userId),
          riesgos: riesgosDetectados,
        }),
      })
        .then(res => console.log('Riesgos guardados:', res.status))
        .catch(err => console.error('Error guardando riesgos:', err));
    }
    
    showTyping(400, () => setStep(1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riesgosDetectados, userId]);

  // HELPER
  const showTyping = (duration: number, callback?: () => void) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      if (callback) callback();
    }, duration);
  };

  // Guardar información de RouteA al completarse
  const saveRouteCompletion = (carrera: string, riasecCode: string, hasMatch: boolean) => {
    const userId = localStorage.getItem("unitec_user_id");
    if (!userId) return;

    const contenido = {
      ruta: 'RouteA',
      carrera,
      riasecCode,
      hasMatch,
      timestamp: new Date().toISOString(),
    };

    fetch('/wp-json/gero/v1/guardar-interacciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: parseInt(userId),
        tipo: 'ruta_routea_completada',
        contenido,
        riesgo_detectado: !hasMatch ? { tipo: 'desalineacion_carrera', ruta: 'RouteA' } : {},
      }),
    })
      .then(res => res.json())
      .then(data => console.log('RouteA guardada:', data))
      .catch(err => console.error('Error guardando RouteA:', err));
  };

  // Manejar botón de volver
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setUserInput("");
      setErrorMessage("");
    } else {
      navigate("/home");
    }
  };

  // Manejador central del footer - enruta según el paso actual
  const handleFooterSubmit = () => {
    if (!userInput.trim()) return;

    const input = userInput.trim();
    
    switch (step) {
      case 1:
        handleMotivacionInicial(input);
        break;
      case 2:
        handleTipoDuda(input, input);
        break;
      case 3:
        handleClaridad(input);
        break;
      case 4:
        handleDuracion(input);
        break;
      case 5:
        handleMaterias(input);
        break;
      case 6:
        handleSalidaLaboral(input);
        break;
      case 9:
        handleDecisionFinal(input);
        break;
      default:
        break;
    }
    
    setUserInput("");
  };

  // ========== NUEVO FLUJO (PASOS 1-9) CON PUNTUACIÓN C/R ==========

  // Paso 1: Motivación inicial
  const handleMotivacionInicial = (valor: string) => {
    const questionMsg = "¿Qué tan motivado/a te sientes en este momento sobre estudiar tu carrera? (Responde del 1 al 5)";
    const newHistory = [
      ...conversationHistory, 
      {sender: 'agent' as const, message: questionMsg},
      {sender: 'user' as const, message: `${valor}/5`}
    ];
    setConversationHistory(newHistory);
    
    const num = parseInt(valor);
    let newC = puntuacionC;
    let newR = puntuacionR;
    
    // Scoring: baja motivación suma a R
    if (num <= 2) {
      newR += 2;
      newC += 1;
    } else if (num === 3) {
      newR += 1;
      newC += 1;
    } else {
      newC += 1;
    }
    
    setPuntuacionC(newC);
    setPuntuacionR(newR);
    
    showTyping(400, () => setStep(2));
  };

  // Paso 2: Tipo de duda (BIFURCACIÓN + PUNTUACIÓN)
  const handleTipoDuda = (opcion: string, label: string) => {
    const questionMsg = "¿Sientes que tus dudas tienen más que ver contigo, sobre tu elección de carrera, o ambas?";
    const newHistory = [
      ...conversationHistory, 
      {sender: 'agent' as const, message: questionMsg},
      {sender: 'user' as const, message: label}
    ];
    setConversationHistory(newHistory);
    
    let newC = puntuacionC;
    let newR = puntuacionR;
    
    const lowerOption = opcion.toLowerCase();
    
    // Bifurcación: "ambas" o "carrera" -> Paso 3
    // "conmigo" o "yo" -> Salta a Paso 5
    // Scoring:
    if (lowerOption.includes("ambas") || lowerOption.includes("carrera") || lowerOption.includes("dos")) {
      newR += 2; // Duda sobre carrera suma a R
      setPuntuacionC(newC);
      setPuntuacionR(newR);
      showTyping(400, () => setStep(3));
    } else if (lowerOption.includes("conmigo") || lowerOption.includes("yo") || lowerOption.includes("por mi")) {
      newC += 2; // Duda personal suma a C
      setPuntuacionC(newC);
      setPuntuacionR(newR);
      showTyping(400, () => setStep(4)); // SALTA 3 
    } else {
      // Default
      newR += 2;
      showTyping(400, () => setStep(3));
    }
  };

  // Paso 3: Claridad de decisión
  const handleClaridad = (valor: string) => {
    const questionMsg = "Del 1 al 5, ¿qué tan clara sientes tu decisión de carrera?";
    const newHistory = [
      ...conversationHistory, 
      {sender: 'agent' as const, message: questionMsg},
      {sender: 'user' as const, message: `${valor}/5`}
    ];
    setConversationHistory(newHistory);
    
    const num = parseInt(valor);
    let newC = puntuacionC;
    let newR = puntuacionR;
    
    // Scoring: baja claridad suma a R
    if (num <= 2) {
      newR += 2;
    } else if (num === 3) {
      newR += 1;
    } else {
      newC += 2;
    }
    
    setPuntuacionC(newC);
    setPuntuacionR(newR);
    
    showTyping(400, () => setStep(4));
  };

  // Paso 4: Preocupación duración
  const handleDuracion = (respuesta: string) => {
    const questionMsg = "¿Te preocupa que la carrera sea muy larga?";
    const newHistory = [
      ...conversationHistory, 
      {sender: 'agent' as const, message: questionMsg},
      {sender: 'user' as const, message: respuesta}
    ];
    setConversationHistory(newHistory);
    
    let newC = puntuacionC;
    // let newR = puntuacionR;
    
    if (respuesta.toLowerCase().includes("sí") || respuesta.toLowerCase().includes("si")) {
      newC += 1; // Suma a C
    }
    
    setPuntuacionC(newC);
    // setPuntuacionR(newR);
    
    showTyping(400, () => setStep(5));
  };

  // Paso 5: Preocupación materias
  const handleMaterias = (respuesta: string) => {
    const questionMsg = "¿Te preocupa no entender las materias?";
    const newHistory = [
      ...conversationHistory, 
      {sender: 'agent' as const, message: questionMsg},
      {sender: 'user' as const, message: respuesta}
    ];
    setConversationHistory(newHistory);
    
    let newC = puntuacionC;
    let newR = puntuacionR;
    
    if (respuesta.toLowerCase().includes("sí") || respuesta.toLowerCase().includes("si")) {
      newC += 2; // Preocupación académica suma a C
      newR += 1;
    }
    
    setPuntuacionC(newC);
    setPuntuacionR(newR);
    
    showTyping(400, () => setStep(6));
  };

  // Paso 6: Preocupación salida laboral
  const handleSalidaLaboral = (respuesta: string) => {
    const questionMsg = "¿Tienes dudas sobre la salida laboral de la carrera que elegiste?";
    const newHistory = [
      ...conversationHistory, 
      {sender: 'agent' as const, message: questionMsg},
      {sender: 'user' as const, message: respuesta}
    ];
    setConversationHistory(newHistory);
    
    let newC = puntuacionC;
    let newR = puntuacionR;
    
    if (respuesta.toLowerCase().includes("sí") || respuesta.toLowerCase().includes("si") || respuesta.toLowerCase().includes("se") || respuesta.toLowerCase().includes("pocas")) {
      newR += 1; // Preocupación laboral suma a R
      newC += 2;
      const feedbackMessage = `Es totalmente comprensible. \n\nPuede ser útil que visites el área de Apoyo al Desarrollo Estudiantil (CADE) en UNITEC, donde encontrarás más información sobre carreras y sus oportunidades laborales.\n\n👇 [Accede aquí](${CADE_URL})`;
      const newHistoryWithFeedback = [...newHistory, {sender: 'agent' as const, message: feedbackMessage}];
      setConversationHistory(newHistoryWithFeedback);
      setFeedbackMsg(feedbackMessage);
    } else {
      newC += 1; // Confianza suma a C
      const feedbackMessage = "¡Excelente! Eso es un punto positivo para tu decisión de carrera.";
      const newHistoryWithFeedback = [...newHistory, {sender: 'agent' as const, message: feedbackMessage}];
      setConversationHistory(newHistoryWithFeedback);
      setFeedbackMsg(feedbackMessage);
    }
    
    setPuntuacionC(newC);
    setPuntuacionR(newR);
    
    showTyping(400, () => {
      setFeedbackMsg(null);
      setStep(7);
    });
  };

  // Paso 7: Motivación y Propósito (CONDENSADO de pasos 7 y 8)
  const handleMotivacionPropósito = (opcionIndex: number) => {
    const opciones = [
      "Quiero mejorar mi situación laboral, cambiar mi realidad actual o crecer profesionalmente.",
      "Estoy estudiando porque me interesa aprender algo nuevo y seguir formándome.",
      "Estoy estudiando para cumplir con lo que se espera de mí (mi familia, mi trabajo, etc.).",
      "Estoy cumpliendo un sueño pendiente: estudiar esta carrera o la que siempre quise.",
      "Quiero estudiar en una institución reconocida y demostrarme que soy capaz de lograrlo."
    ];
    
    const questionMsg = "¿Cuál de estas opciones sientes que refleja mejor tu situación actual?";
    const newHistory = [
      ...conversationHistory, 
      {sender: 'agent' as const, message: questionMsg},
      {sender: 'user' as const, message: opciones[opcionIndex]}
    ];
    setConversationHistory(newHistory);
    
    let newC = puntuacionC;
    let newR = puntuacionR;
    
    // Opciones 0, 1, 2 (primeras tres) → +2 R
    if (opcionIndex <= 2) {
      newR += 2;
    } else {
      // Opciones 3, 4 (últimas dos) → +2 C
      newC += 2;
    }
    
    setPuntuacionC(newC);
    setPuntuacionR(newR);
    
    showTyping(400, () => setStep(9)); // Salta directamente a paso 9 (decisión final)
  };

  // AGREGAR PASOS DE: DISFRUTAR TRABAJO, BUSQUEDA DE PLACER, SI LO MOVILIZA UN INTERES

  // Paso 9: Decisión final - Determina Rama
  const handleDecisionFinal = (respuesta: string) => {
    const questionMsg = "Después de todo lo que hablamos, ¿sientes que quieres empezar este primer semestre y ver cómo te sientes?";
    const newHistory = [
      ...conversationHistory, 
      {sender: 'agent' as const, message: questionMsg},
      {sender: 'user' as const, message: respuesta}
    ];
    setConversationHistory(newHistory);
    
    let newC = puntuacionC;
    let newR = puntuacionR;
    
    const lowerRespuesta = respuesta.toLowerCase();
    
    if (lowerRespuesta.includes("si") || lowerRespuesta.includes("sí")) {
      newC += 1; // Decisión afirmativa suma a C
    } else {
      newR += 1; // Indecisión suma a R
    }
    
    setPuntuacionC(newC);
    setPuntuacionR(newR);
    
    // Determinar Rama según puntuación FINAL
    setTimeout(() => {
      if (newR >= newC) {
        // RAMA R: Reorientación - RIASEC test
        console.log(`Rama R activada (R: ${newR}, C: ${newC})`);
        const introMsg = "Entiendo tus dudas y está bien sentirlo así. Antes de mover nada grande, vamos a explorar tus intereses de forma sencilla.\n\nTe haré 12 preguntas simples. En cada una, elegirás cuál opción prefieres o se parece más a ti.";
        const historyWithIntro = [...newHistory, {sender: 'agent' as const, message: introMsg}];
        setConversationHistory(historyWithIntro);
        setIsRamaRActive(true);
        setRamaRStarted(false);
        setRamaRStep(0);
      } else {
        // RAMA C: Compromiso - Chat IA
        console.log(`Rama C activada (R: ${newR}, C: ${newC})`);
        const introMsg = "Perfecto, esa decisión muestra tu compromiso. Vamos a construir un plan juntos que sea realista y adaptado a tu situación. Estoy acá para ayudarte en cada paso.";
        setChatHistory([{ sender: 'agent' as const, message: introMsg }]);
        setIsAiChatActive(true);
      }
    }, 400);
  };

  // Manejador RIASEC
  const handleRiasecResponse = (letter: 'R' | 'I' | 'A' | 'S' | 'E' | 'C', optionText: string) => {
    const question = ramaRQuestions[ramaRStep - 1];
    if (!question) return;

    const newHistory = [...conversationHistory, {sender: 'user' as const, message: optionText}];
    setConversationHistory(newHistory);

    const newScores = { ...riasecScores };
    newScores[letter] += 1;
    setRiasecScores(newScores);

    if (ramaRStep < ramaRQuestions.length) {
      setRamaRStep(ramaRStep + 1);
    } else {
      calculateRiasecResult(newScores);
    }
  };

  // Calcular resultado RIASEC
  const calculateRiasecResult = (scores: typeof riasecScores) => {
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    
    const result: string[] = [];
    let maxPoints = sorted[0][1];
    
    for (const [letter, points] of sorted) {
      if (result.length < 3 || points === maxPoints) {
        result.push(letter);
        maxPoints = points;
      }
      if (result.length >= 3 && points < maxPoints) {
        break;
      }
    }

    const finalCode = result.join('');
    localStorage.setItem(getStorageKey('riasec_result', userId), finalCode);
    console.log('Código RIASEC generado:', finalCode);
    
    showTyping(400, () => {
      // Mostrar resultado del RIASEC
      const resultMsg = `Tu perfil RIASEC es: **${finalCode}**\n\nEsto significa que tus intereses se alinean con actividades relacionadas a: ${finalCode.split('').map(l => {
        const descriptions: {[key: string]: string} = {
          'R': 'Trabajo práctico',
          'I': 'Investigación',
          'A': 'Creatividad',
          'S': 'Social',
          'E': 'Emprendedurismo',
          'C': 'Orden y organización'
        };
        return descriptions[l] || l;
      }).join(', ')}.`;
      
      const historyWithResult = [...conversationHistory, {sender: 'agent' as const, message: resultMsg}];
      setConversationHistory(historyWithResult);
      
      setIsRamaRActive(false);
      setRamaRStep(0);

      if (userCarrera) {
        const riasecCarrera = obtenerRiasecCarrera(userCarrera);
        
        if (riasecCarrera) {
          const { alineado, faltantes } = verificarAlineacionRiasec(finalCode, riasecCarrera);
          
          if (alineado) {
            // MATCH: Derivar a Chat IA
            setTimeout(() => {
              const introMsg = `¡Excelente noticia! Tus intereses y aptitudes están bien alineados con ${userCarrera}.\n\nAhora que hemos confirmado este match, ¿Hay algo específico sobre tu carrera o tu motivación que quieras trabajar juntos?`;
              setChatHistory([{ sender: 'agent' as const, message: introMsg }]);
              setIsAiChatActive(true);
              
              // Guardar resultado de ruta A
              saveRouteCompletion(userCarrera, finalCode, true);
            }, 600);
          } else {
            // NO MATCH: Derivar a ALEX
            setTimeout(() => {
              const msg = `Tus intereses se alinean de forma diferente a ${userCarrera}. Podrías beneficiarte de una conversación más profunda sobre tu camino. Te recomiendo hablar con ALEX para explorar opciones.`;
              
              const historyWithMsg = [...historyWithResult, {sender: 'agent' as const, message: msg}];
              setConversationHistory(historyWithMsg);
              setFeedbackMsg("pending_alex_connection");
              
              // Guardar resultado de ruta A (sin match)
              saveRouteCompletion(userCarrera, finalCode, false);
            }, 600);
          }
        } else {
          // Carrera no encontrada
          setTimeout(() => {
            console.warn('Carrera no encontrada:', userCarrera);
            const msg = `Tu carrera no está en nuestro sistema. Te recomiendo hablar con ALEX para recibir orientación personalizada.`;
            
            const historyWithMsg = [...historyWithResult, {sender: 'agent' as const, message: msg}];
            setConversationHistory(historyWithMsg);
            setFeedbackMsg("pending_alex_connection");
          }, 600);
        }
      }
    });
  };

  // Manejador Chat IA
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isSending) return;

    const userMsg = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { sender: 'user' as const, message: userMsg }]);
    setIsSending(true);

    try {
      const response = await fetch(`${API_BASE}/chat-openai-agente`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          matricula: matricula,
          message: userMsg
        })
      });

      const data = await response.json();
      
      if (data.success && data.respuesta) {
        const updatedChatHistory = [...chatHistory, 
          { sender: 'user' as const, message: userMsg }, 
          { sender: 'agent' as const, message: data.respuesta }
        ];
        setChatHistory(updatedChatHistory);
        saveAiChat(updatedChatHistory);
      } else {
        // toast({ title: "Error", description: "No pude conectar con el agente.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error chat:", error);
      // toast({ title: "Error", description: "Ocurrió un error de conexión.", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const saveAiChat = (chatHistoryToSave: {sender: 'agent'|'user', message: string}[]) => {
    if (!userId || !chatHistoryToSave.length) return;

    const chatTexto = chatHistoryToSave
      .map(msg => `${msg.sender === 'user' ? 'Usuario' : 'Agente'}: ${msg.message}`)
      .join('\n');

    const conversacionCompleta = conversationHistory.length > 0 
      ? conversationHistory.map(msg => `${msg.sender === 'user' ? 'Usuario' : 'Agente'}: ${msg.message}`).join('\n') + '\n\n---CHAT_IA---\n' + chatTexto
      : chatTexto;

    fetch(`${API_BASE}/guardar-conversacion-agente`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: parseInt(userId),
        conversacion: conversacionCompleta,
      }),
    })
      .then(res => {
        console.log('Chat IA guardado:', res.status);
      })
      .catch(err => {
        console.error('Error guardando chat IA:', err);
      });
  };

  // ========== RENDER ==========

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />

      <main className="flex-1 w-full px-4 py-6 md:px-6 md:py-8 pb-24 max-w-2xl mx-auto">
        
        {/* CONEXIÓN CON ALEX - Dentro del flujo de conversación */}
        {feedbackMsg === "pending_alex_connection" && !showOtherRoutes && (
          <div className="space-y-4">
            {/* El mensaje de Alex ya está en conversationHistory, así que solo mostramos el botón */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-400 rounded-lg p-6 space-y-4 shadow-md animate-in fade-in slide-in-from-bottom-3 duration-500">
              <div className="space-y-3">
                <a
                  href={ALEX_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 active:scale-95 gap-2"
                >
                  <ExternalLink className="w-5 h-5" />
                  Hablar con ALEX por WhatsApp
                </a>
                <button
                  onClick={() => {
                    setShowOtherRoutes(true);
                  }}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                >
                  Explorar otras opciones
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OTRAS RUTAS - Cards dinámicas desde data centralizada */}
        {feedbackMsg === "pending_alex_connection" && showOtherRoutes && (
          <div className="space-y-4">
            <ChatBubble sender="agent" message="Entendido, podemos explorar otras opciones mientras tanto. Aquí hay alternativas que podrían interesarte:" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {alternativeRoutes.map((route) => (
                <button
                  key={route.id}
                  onClick={() => navigate(route.path)}
                  className="p-4 rounded-lg border-2 border-border bg-background hover:border-primary/50 hover:shadow-lg transition-all text-left group flex flex-col h-full"
                >
                  <div className="flex-1 flex flex-col">
                    <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {route.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2 flex-1">
                      {route.description}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-3" />
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* HISTORIAL CONVERSACIÓN GENERAL */}
        {/* Solo mostrar si NO está en derivación a Alex */}
        {conversationHistory.length > 0 && feedbackMsg !== "pending_alex_connection" && (
          <div className="space-y-3 pb-4">
            {conversationHistory.map((msg, idx) => (
              <ChatBubble key={idx} sender={msg.sender} message={msg.message} />
            ))}
          </div>
        )}

        {/* PASO 1: Motivación Inicial */}
        {step === 1 && !isRamaRActive && !isAiChatActive && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {!typing && (
              <ChatBubble sender="agent" message="¿Qué tan motivado/a te sientes en este momento sobre estudiar tu carrera? (Responde del 1 al 5)" />
            )}
          </div>
        )}

        {/* PASO 2: Tipo de Duda */}
        {step === 2 && !isRamaRActive && !isAiChatActive && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {!typing && (
              <ChatBubble sender="agent" message="¿Sientes que tus dudas tienen más que ver contigo, sobre tu elección de carrera, o ambas?" />
            )}
          </div>
        )}

        {/* PASO 3: Claridad de Decisión */}
        {step === 3 && !isRamaRActive && !isAiChatActive && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {!typing && (
              <ChatBubble sender="agent" message="Del 1 al 5, ¿qué tan clara sientes tu decisión de carrera?" />
            )}
          </div>
        )}

        {/* PASO 4: Duración */}
        {step === 4 && !isRamaRActive && !isAiChatActive && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {!typing && (
              <ChatBubble sender="agent" message="¿Te preocupa que la carrera sea muy larga?" />
            )}
          </div>
        )}

        {/* PASO 5: Materias */}
        {step === 5 && !isRamaRActive && !isAiChatActive && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {!typing && (
              <ChatBubble sender="agent" message="¿Te preocupa no entender las materias?" />
            )}
          </div>
        )}

        {/* PASO 6: Salida Laboral */}
        {step === 6 && !isRamaRActive && !isAiChatActive && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {!typing && !feedbackMsg && (
              <ChatBubble sender="agent" message="¿Tienes dudas sobre la salida laboral de la carrera que elegiste?" />
            )}
          </div>
        )}

        {/* PASO 7: Motivación y Propósito (CONDENSADO - con Chips) */}
        {step === 7 && !isRamaRActive && !isAiChatActive && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {!typing && (
              <div className="mt-4 space-y-3">
                <ChatBubble sender="agent" message="¿Cuál de estas opciones sientes que refleja mejor tu situación actual?" />
                <div className="space-y-2">
                  <Chip 
                    onClick={() => handleMotivacionPropósito(0)}
                    className="w-full text-left h-auto whitespace-normal py-3"
                  >
                    Quiero mejorar mi situación laboral, cambiar mi realidad actual o crecer profesionalmente.
                  </Chip>
                  <Chip 
                    onClick={() => handleMotivacionPropósito(1)}
                    className="w-full text-left h-auto whitespace-normal py-3"
                  >
                    Estoy estudiando porque me interesa aprender algo nuevo y seguir formándome.
                  </Chip>
                  <Chip 
                    onClick={() => handleMotivacionPropósito(2)}
                    className="w-full text-left h-auto whitespace-normal py-3"
                  >
                    Estoy estudiando para cumplir con lo que se espera de mí (mi familia, mi trabajo, etc.).
                  </Chip>
                  <Chip 
                    onClick={() => handleMotivacionPropósito(3)}
                    className="w-full text-left h-auto whitespace-normal py-3"
                  >
                    Estoy cumpliendo un sueño pendiente: estudiar esta carrera o la que siempre quise.
                  </Chip>
                  <Chip 
                    onClick={() => handleMotivacionPropósito(4)}
                    className="w-full text-left h-auto whitespace-normal py-3"
                  >
                    Quiero estudiar en una institución reconocida y demostrarme que soy capaz de lograrlo.
                  </Chip>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PASO 9: Decisión Final - Determina Rama */}
        {step === 9 && !isRamaRActive && !isAiChatActive && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {!typing && (
              <ChatBubble sender="agent" message="Después de todo lo que hablamos, ¿sientes que quieres empezar este primer semestre y ver cómo te sientes?" />
            )}
          </div>
        )}

        {/* RAMA R: RIASEC TEST */}
        {isRamaRActive && (
          <div className="space-y-6">
            
            {!ramaRStarted && ramaRStep === 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-6 sm:p-8 space-y-4 sm:space-y-6">
                <div className="text-center">
                  <p className="text-sm sm:text-base text-blue-800 mb-3 sm:mb-4">
                    Descubramos tu perfil de intereses profesionales para confirmar tu alineación.
                  </p>
                  <p className="text-xs sm:text-sm text-blue-700">
                    Son solo 12 preguntas de un quiz rápido (≈ 5 min). Nada complicado.
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    setRamaRStarted(true);
                    setRamaRStep(1);
                  }}
                  className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2.5 px-4 sm:py-3 sm:px-6 rounded-lg transition text-sm sm:text-base"
                >
                  Vamos, comenzar
                </button>
              </div>
            )}
            
            {ramaRStarted && ramaRStep > 0 && ramaRStep <= ramaRQuestions.length && (
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="text-sm text-gray-600 mb-4">
                  Pregunta {ramaRStep} de {ramaRQuestions.length}
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-6">
                  ¿Cuál se parece más a ti?
                </h3>
                
                <div className="space-y-3">
                  {ramaRQuestions[ramaRStep - 1] ? (
                    <>
                      <button
                        onClick={() => handleRiasecResponse(
                          ramaRQuestions[ramaRStep - 1].optionA.letter,
                          ramaRQuestions[ramaRStep - 1].optionA.text
                        )}
                        className="w-full p-4 text-left bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-400 transition font-medium text-gray-800"
                      >
                        {ramaRQuestions[ramaRStep - 1].optionA.text}
                      </button>
                      
                      <button
                        onClick={() => handleRiasecResponse(
                          ramaRQuestions[ramaRStep - 1].optionB.letter,
                          ramaRQuestions[ramaRStep - 1].optionB.text
                        )}
                        className="w-full p-4 text-left bg-purple-50 border-2 border-purple-200 rounded-lg hover:bg-purple-100 hover:border-purple-400 transition font-medium text-gray-800"
                      >
                        {ramaRQuestions[ramaRStep - 1].optionB.text}
                      </button>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Cargando pregunta...</p>
                  )}
                </div>
              </div>
            )}
            
            {typing && <TypingIndicator />}
          </div>
        )}

        {/* RAMA C: CHAT IA */}
        {isAiChatActive && (
          <div className="space-y-4">
             {chatHistory.map((msg, idx) => (
                <ChatBubble key={idx} sender={msg.sender} message={msg.message} />
             ))}
             {isSending && <TypingIndicator />}
             <div ref={messagesEndRef} />
          </div>
        )}

        {typing && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </main>

      {/* Footer con Input - Similar a Questionnaire, visible en pasos que no usan chips */}
      {(step === 1 || step === 2 || step === 3 || step === 4 || step === 5 || step === 6 || step === 9) && !isRamaRActive && !isAiChatActive && !feedbackMsg && (
        <footer className="sticky bottom-0 bg-background border-t px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
          <div className="max-w-2xl mx-auto flex gap-2 sm:gap-3 items-center">
            <button
              onClick={handleBack}
              className="flex-shrink-0 p-2 sm:px-3 sm:py-2 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && userInput.trim()) {
                  handleFooterSubmit();
                }
              }}
              placeholder="Escribe aquí..."
              className="flex-1 px-4 py-2.5 sm:py-3 border border-border rounded-full bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm sm:text-base"
              autoFocus
            />
            <button
              onClick={handleFooterSubmit}
              disabled={!userInput.trim()}
              className="flex-shrink-0 p-2 sm:px-4 sm:py-2.5 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </footer>
      )}

      {/* Footer para Chat IA */}
      {isAiChatActive && (
        <footer className="sticky bottom-0 bg-background border-t px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
          <div className="max-w-2xl mx-auto flex gap-2 sm:gap-3 items-center">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && chatInput.trim()) {
                  handleSendMessage();
                }
              }}
              placeholder="Escribe tu respuesta..."
              disabled={isSending}
              className="flex-1 px-4 py-2.5 sm:py-3 border border-border rounded-full bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm sm:text-base"
              autoFocus
            />
            <button
              onClick={handleSendMessage}
              disabled={isSending || !chatInput.trim()}
              className="flex-shrink-0 p-2 sm:px-4 sm:py-2.5 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
