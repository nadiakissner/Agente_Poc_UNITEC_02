import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChatBubble } from "@/Components/Chat/ChatBubble";
import { questionnaireData, Question, RiskCategory, riskLabels } from "@/Data/questionnaire";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { 
  detectCrisis, 
  getCrisisContainmentMessage,
  getCrisisResourceMessage,
  getCrisisMarker,
  type CrisisDetection
} from "@/Lib/crisisSafety";
import { validateStorageIntegrity, getCurrentUserId } from "@/Lib/storageManager";

type AnswerValue = {
  text: string | string[];
  risk?: RiskCategory | RiskCategory[];
  weight?: number;
  riskWeights?: Partial<Record<RiskCategory, number>>;
};

type ChatMessage = {
  sender: 'agent' | 'user';
  message: string;
};

export default function Questionnaire() {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, AnswerValue>>(new Map());
  const [history, setHistory] = useState<number[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isQuestionnaireDone, setIsQuestionnaireDone] = useState(false);
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [primaryRisk, setPrimaryRisk] = useState<RiskCategory | null>(null);
  const [riskScores, setRiskScores] = useState<Record<string, number>>({});
  const [selectedRisk, setSelectedRisk] = useState<RiskCategory | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Estados para crisis
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [crisisLevel, setCrisisLevel] = useState<'none' | 'high' | 'extreme'>('none');

  // Filtrar preguntas (omitir checkbox)
  useEffect(() => {
    const filtered = questionnaireData.filter(q => q.type !== 'checkbox');
    setFilteredQuestions(filtered);
  }, []);

  const currentQuestion = filteredQuestions[currentQuestionIndex];
  const currentAnswer = answers.get(currentQuestion?.id || '');

  // Validar entrada numérica con 3 niveles de error
  const validateNumericInput = (input: string): { valid: boolean; error?: string } => {
    const trimmed = input.trim().toLowerCase();

    // // Para P5 (text): aceptar texto libre sin restricción
    // if (currentQuestion?.id === 'P5') {
    //   if (trimmed.length >= 3) {
    //     return { valid: true };
    //   }
    //   return {
    //     valid: false,
    //     error: 'Por favor, describe tu fuente de financiamiento (mínimo 3 caracteres).'
    //   };
    // }

    // // Para P7 (yesno): aceptar "si" o "no"
    // if (currentQuestion?.id === 'P7') {
    //   if (trimmed === 'si' || trimmed === 'sí' || trimmed === 'no') {
    //     return { valid: true };
    //   }
    //   return {
    //     valid: false,
    //     error: 'Por favor, escribe "Sí" o "No".'
    //   };
    // }

    // // Para preguntas likert: aceptar números 1-5
    // if (/^[1-5]$/.test(trimmed)) {
    //   return { valid: true };
    // }

    // // Si contiene solo dígitos pero está fuera del rango
    // if (/^\d+$/.test(trimmed)) {
    //   return {
    //     valid: false,
    //     error: 'Por favor, ingresa un número del 1 al 5.'
    //   };
    // }

    // // Si es un mensaje corto inválido (contiene caracteres adicionales)
    // if (trimmed.length < 100) {
    //   return {
    //     valid: false,
    //     error: 'Ingresá solo un número del 1 al 5, sin espacios ni otros caracteres.'
    //   };
    // }

    // // Si es un mensaje largo, mostrar contacto
    // return {
    //   valid: false,
    //   error: 'contact'
    // };
  };

  // Normalizar acentos y caracteres especiales
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Detectar palabras clave en respuestas de texto libre
  const detectKeywords = (input: string, keywordDetection?: Record<string, { keywords: string[] }>) => {
    if (!keywordDetection) return null;

    const normalizedInput = normalizeText(input);
    
    for (const [key, config] of Object.entries(keywordDetection)) {
      for (const keyword of config.keywords) {
        if (normalizedInput.includes(normalizeText(keyword))) {
          return key;
        }
      }
    }
    
    return null;
  };

  // Inicializar con historial previo (una sola vez)
  useEffect(() => {
    if (!isInitialized && filteredQuestions.length > 0) {
      // VALIDAR INTEGRIDAD DE STORAGE PRIMERO
      validateStorageIntegrity();
      
      const currentUserId = getCurrentUserId();
      const homeChatHistory = localStorage.getItem("unitec_home_chat_history");
      
      let initialHistory: ChatMessage[] = [];
      
      if (homeChatHistory) {
        try {
          initialHistory = JSON.parse(homeChatHistory);
          localStorage.removeItem("unitec_home_chat_history");
        } catch (e) {
          console.error("Error parsing home chat history:", e);
        }
      }
      
      setChatHistory(initialHistory);
      setIsInitialized(true);
      
      console.log(`✅ Questionnaire inicializado para usuario: ${currentUserId}`);
    }
  }, [filteredQuestions.length, isInitialized]);

  // Focus en el input cuando cambia de pregunta
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentQuestionIndex]);

  // Auto-scroll para mostrar el último mensaje del agente
  useEffect(() => {
    // Pequeño delay para permitir que React renderice
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [chatHistory]);

  // Manejar respuesta numérica
  const handleNumericResponse = () => {
    if (!userInput.trim()) return;

    const validation = validateNumericInput(userInput);

    // PROTOCOLO DE DETECCIÓN CRÍTICA - Prioridad Máxima
    const crisis = detectCrisis(userInput);
    
    if (crisis.isCrisis && !crisisDetected) {
      setCrisisDetected(true);
      setCrisisLevel(crisis.riskLevel as 'high' | 'extreme');

      // Agregar input del usuario
      const userMsg: ChatMessage = { sender: 'user', message: userInput.trim() };
      const containmentMsg: ChatMessage = {
        sender: 'agent',
        message: getCrisisContainmentMessage()
      };

      setChatHistory([...chatHistory, userMsg, containmentMsg]);
      setUserInput("");
      setErrorMessage("");

      // Si es riesgo extremo, guardar estado inmediatamente
      if (crisis.riskLevel === 'extreme') {
        saveCrisisState(userInput, getCrisisContainmentMessage());
      }
      return;
    }

    // Si ya hay crisis detectada y sigue el discurso negativo
    if (crisisDetected && crisis.isCrisis) {
      const userMsg: ChatMessage = { sender: 'user', message: userInput.trim() };
      const resourceMsg: ChatMessage = {
        sender: 'agent',
        message: getCrisisResourceMessage()
      };

      setChatHistory([...chatHistory, userMsg, resourceMsg]);
      setUserInput("");
      setErrorMessage("");
      
      // Guardar estado interrumpido
      saveCrisisState(userInput, getCrisisResourceMessage());
      return;
    }

    // Si la crisis mejora, continuar normalmente
    if (crisisDetected && !crisis.isCrisis) {
      setCrisisDetected(false);
      setCrisisLevel('none');
    }

    if (!validation.valid) {
      // PRIMERO: Agregar el input del usuario al chat
      const userMsg: ChatMessage = {
        sender: 'user',
        message: userInput.trim()
      };
      
      // SEGUNDO: Agregar el mensaje de error/advertencia
      let errorMsg: ChatMessage;
      
      if (validation.error === 'contact') {
        errorMsg = {
          sender: 'agent',
          message: '📞 Teléfono: 11-4567-8901 / ✉️ Email: acompañamiento@universidad.edu'
        };
      } else {
        errorMsg = {
          sender: 'agent',
          message: validation.error || 'Error al procesar tu respuesta.'
        };
      }
      
      setChatHistory([...chatHistory, userMsg, errorMsg]);
      setUserInput("");
      setErrorMessage("");
      return;
    }

    setErrorMessage("");

    // // Respuesta válida: texto para P5, número 1-5 para otras likert, "sí"/"no" para P7
    let numericAnswer = userInput.trim();
    let displayAnswer = userInput.trim();
    
    // // Normalizar respuesta de P5 (texto libre)
    // if (currentQuestion.id === 'P5') {
    //   numericAnswer = userInput.trim();
    //   displayAnswer = userInput.trim();
    // }
    
    // // Normalizar respuesta de P7 (sí/no)
    // if (currentQuestion.id === 'P7') {
    //   numericAnswer = numericAnswer.toLowerCase() === 'si' || numericAnswer.toLowerCase() === 'sí' ? 'Sí' : 'No';
    // }
    
    // Detección de palabras clave para P5 (Financiación - Texto libre)
    const selectedOption = currentQuestion?.options?.find(
      opt => opt.text === numericAnswer || opt.text.startsWith(numericAnswer + ' ')
    );
    
    // // Para P5, detectar riesgo por palabras clave (no por opciones)
    // let p5RiskWeights: Partial<Record<RiskCategory, number>> | undefined;
    // if (currentQuestion.id === 'P5' && currentQuestion.keywordDetection) {
    //   const detectedKey = detectKeywords(userInput, currentQuestion.keywordDetection);
    //   if (detectedKey) {
    //     // Usar los riskWeights de la palabra clave detectada
    //     for (const [categoryName, data] of Object.entries(currentQuestion.keywordDetection)) {
    //       if (data.keywords.some(keyword => userInput.toLowerCase().includes(keyword))) {
    //         p5RiskWeights = data.riskWeights;
    //         break;
    //       }
    //     }
    //   }
    // }

    // // Manejar pesos condicionados para P6 (depende de P5)
    // let conditionalRiskWeights: Partial<Record<RiskCategory, number>> | undefined;
    // if (currentQuestion.id === 'P6' && currentQuestion.conditionalWeights) {
    //   const p5Answer = answers.get('P5');
    //   if (p5Answer) {
    //     // Detectar categoría de P5 usando palabras clave
    //     const p5Text = (Array.isArray(p5Answer.text) ? p5Answer.text.join(' ') : (p5Answer.text || '')).toLowerCase();
    //     let p5Category: string | null = null;
        
    //     // Buscar coincidencias con las palabras clave definidas en questionnaire.ts
    //     const p5Question = questionnaireData.find(q => q.id === 'P5');
    //     if (p5Question?.keywordDetection) {
    //       for (const [category, data] of Object.entries(p5Question.keywordDetection)) {
    //         if (data.keywords.some(keyword => p5Text.includes(keyword))) {
    //           p5Category = category;
    //           break;
    //         }
    //       }
    //     }
        
    //     if (p5Category && currentQuestion.conditionalWeights.P5?.[p5Category]) {
    //       conditionalRiskWeights = currentQuestion.conditionalWeights.P5[p5Category][numericAnswer];
    //     }
    //   }
    // }

    // const newAnswers = new Map(answers);
    // newAnswers.set(currentQuestion.id, {
    //   text: numericAnswer,
    //   risk: selectedOption?.risk,
    //   weight: selectedOption?.weight,
    //   riskWeights: currentQuestion.id === 'P5' 
    //     ? p5RiskWeights 
    //     : (conditionalRiskWeights || selectedOption?.riskWeights),
    // });
    // setAnswers(newAnswers);

    // Guardar la interacción en el backend
    saveQuestionnaireInteraction(currentQuestion.id, displayAnswer);

    // Agregar respuesta al historial de chat
    const newChatHistory = [
      ...chatHistory,
      { sender: 'agent' as const, message: currentQuestion.text },
      { sender: 'user' as const, message: displayAnswer }
    ];
    setChatHistory(newChatHistory);

    // Guardar en historial de navegación
    const newHistory = [...history, currentQuestionIndex];
    setHistory(newHistory);

    // Limpiar input y avanzar
    setUserInput("");

    // Aplicar lógica condicional si existe
    if (currentQuestion.condition) {
      const shouldTrigger = currentQuestion.condition.answers.some(ans => ans === numericAnswer);
      
      if (shouldTrigger && currentQuestion.condition.skipTo) {
        // Condición se cumple: ir a skipTo
        const nextIndex = filteredQuestions.findIndex(q => q.id === currentQuestion.condition!.skipTo);
        if (nextIndex !== -1) {
          setTimeout(() => setCurrentQuestionIndex(nextIndex), 300);
          return;
        }
      } else if (!shouldTrigger && currentQuestion.id === 'P1') {
        // Condición NO se cumple en P1: saltarse a P3
        const p3Index = filteredQuestions.findIndex(q => q.id === 'P3');
        if (p3Index !== -1) {
          setTimeout(() => setCurrentQuestionIndex(p3Index), 300);
          return;
        }
      }
    }

    // Avanzar a la siguiente pregunta
    setTimeout(() => {
      if (currentQuestionIndex < filteredQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Finalizar cuestionario - calcular puntajes por categoría
        calculateAndSaveRiskScores(newAnswers, newChatHistory);
      }
    }, 300);
  };

  /**
   * Guarda el estado de crisis para reanudación posterior
   */
  const saveCrisisState = async (userInput: string, agentResponse: string) => {
    try {
      const conversationState = {
        isCrisis: true,
        crisisLevel,
        currentQuestion: filteredQuestions[currentQuestionIndex]?.id,
        userLastInput: userInput,
        agentLastResponse: agentResponse,
        timestamp: new Date().toISOString(),
      };

      await fetch(`/wp-json/gero/v1/guardar-conversation-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_state: JSON.stringify(conversationState),
          crisis_marker: getCrisisMarker(),
        }),
      });
    } catch (e) {
      console.error('Error saving crisis state:', e);
    }
  };

  /**
   * Guarda una interacción de respuesta del cuestionario
   */
  const saveQuestionnaireInteraction = (questionId: string, answer: string) => {
    const userId = localStorage.getItem("unitec_user_id");
    if (userId) {
      const interactionData = {
        user_id: parseInt(userId),
        tipo: 'respuesta_cuestionario',
        contenido: {
          pregunta_id: questionId,
          respuesta: answer,
          timestamp: new Date().toISOString()
        }
      };
      
      fetch('/wp-json/gero/v1/guardar-interacciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interactionData)
      }).catch(e => {
        console.error('Error guardando interacción de respuesta:', e);
      });
    }
  };

  // Calcular puntajes de riesgo por categoría
  const calculateAndSaveRiskScores = (allAnswers: Map<string, AnswerValue>, finalChatHistory: ChatMessage[]) => {
    const scores: Record<string, number> = {
      economica: 0,
      social: 0,
      baja_preparacion: 0,
      organizacion: 0,
      tecnologica: 0,
      desorientacion: 0,
      entorno: 0,
      emocional: 0,
    };

    // Recorrer todas las respuestas y sumar los puntajes
    allAnswers.forEach((answer) => {
      // Nuevo sistema: usar riskWeights si está disponible
      if (answer.riskWeights && Object.keys(answer.riskWeights).length > 0) {
        Object.entries(answer.riskWeights).forEach(([category, weight]) => {
          if (category in scores) {
            scores[category as RiskCategory] += weight;
          }
        });
      } else if (answer.risk && answer.weight) {
        // Sistema anterior: si risk y weight existen
        if (Array.isArray(answer.risk)) {
          answer.risk.forEach((riskCategory) => {
            scores[riskCategory] += answer.weight || 0;
          });
        } else {
          scores[answer.risk] += answer.weight;
        }
      }
    });

    // Encontrar riesgo principal
    const entries = Object.entries(scores);
    const primary = entries.reduce((max, current) => 
      current[1] > max[1] ? current : max
    )[0] as RiskCategory;

    setRiskScores(scores);
    setPrimaryRisk(primary);

    // Guardar datos en localStorage con user_id para evitar contaminación entre usuarios
    const userId = localStorage.getItem("unitec_user_id");
    const userPrefix = userId ? `user_${userId}_` : '';
    
    localStorage.setItem(`${userPrefix}unitec_answers`, JSON.stringify(Array.from(allAnswers.entries())));
    localStorage.setItem(`${userPrefix}unitec_risk_scores`, JSON.stringify(scores));
    localStorage.setItem(`${userPrefix}routeA_conversationHistory`, JSON.stringify(finalChatHistory));
    
    // Guardar la interacción en el backend (byw_coach_interacciones)
    if (userId) {
      const interactionData = {
        user_id: parseInt(userId),
        tipo: 'cuestionario_completado',
        contenido: {
          respuestas: Array.from(allAnswers.entries()),
          puntajes: scores
        },
        riesgo_detectado: {
          principal: primary,
          todos: scores
        }
      };
      
      fetch('/wp-json/gero/v1/guardar-interacciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interactionData)
      }).catch(e => {
        console.error('Error guardando interacción:', e);
      });
    }
    
    // Mostrar flujo post-questionnaire
    const userName = localStorage.getItem("unitec_nombre") || "estudiante";
    const newMessages: ChatMessage[] = [
      ...finalChatHistory,
      {
        sender: 'agent',
        message: `Gracias por responder con honestidad, ${userName}. Ahora puedo acompañarte mejor.`
      },
      {
        sender: 'agent',
        message: `Según lo que me compartiste, te recomiendo trabajar en: "${riskLabels[primary]}". Es algo que te puede ayudar desde ahorita. ¿Le entramos a esto o quieres ver más opciones?`
      }
    ];

    setChatHistory(newMessages);
    setIsQuestionnaireDone(true);
  };

  // Manejar Enter key
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNumericResponse();
    }
  };

  const handleStartWithPrimary = () => {
    // Ir directamente a la ruta correspondiente
    navigate("/summary");
  };

  const handleShowAllOptions = () => {
    const newMessage: ChatMessage = {
      sender: 'agent',
      message: `Dale, elige la que más te late y empezamos`
    };
    setChatHistory([...chatHistory, newMessage]);
    setShowAllOptions(true);
  };

  const handleSelectRisk = (risk: RiskCategory) => {
    // Solo marcar como seleccionada, no navegar todavía
    setSelectedRisk(risk);
  };

  const handleConfirmRisk = () => {
    if (selectedRisk) {
      // Guardar el riesgo seleccionado con user_id
      const userId = localStorage.getItem("unitec_user_id");
      const userPrefix = userId ? `user_${userId}_` : '';
      localStorage.setItem(`${userPrefix}unitec_selected_risk`, selectedRisk);
      navigate("/summary");
    }
  };

  const riskOptions = [
    {
      risk: 'economica' as RiskCategory,
      title: 'Plan para tus gastos de estudio',
      description: 'Aclaramos opciones y armamos un plan realista para seguir sin tanta presión.'
    },
    {
      risk: 'baja_preparacion' as RiskCategory,
      title: 'Base académica para arrancar',
      description: 'Identificamos lo que te puede costar al inicio y cómo reforzarlo'
    },
    {
      risk: 'desorientacion' as RiskCategory,
      title: 'Claridad de rumbo',
      description: 'Aterrizamos qué quieres lograr y cómo elegir el siguiente paso.'
    },
    {
      risk: 'social' as RiskCategory,
      title: 'Integrarte y hacer comunidad',
      description: 'Estrategias simples para conectar y no llevar esto solo/a.'
    },
    {
      risk: 'tecnologica' as RiskCategory,
      title: 'Herramientas digitales',
      description: 'Ajustes y prácticas para estudiar bien con plataformas y recursos.'
    },
    {
      risk: 'entorno' as RiskCategory,
      title: 'Condiciones para estudiar mejor',
      description: 'Ordenamos tu entorno, tiempos y acuerdos para que estudiar sea posible.'
    },
    {
      risk: 'organizacion' as RiskCategory,
      title: 'Organización y ritmo de la semana',
      description: 'Un plan breve para cumplir sin sentir que todo se te junta.'
    },
    {
      risk: 'emocional' as RiskCategory,
      title: 'Bienestar y manejo de estrés',
      description: 'Técnicas prácticas para bajar carga y sostener el ritmo.'
    }
  ];

  const handleBack = () => {
    // Si estamos en el panel de selección de opciones, cerrar primero
    if (showAllOptions) {
      setShowAllOptions(false);
      setSelectedRisk(null);
      return;
    }

    if (history.length > 0) {
      const previousIndex = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setCurrentQuestionIndex(previousIndex);
      setUserInput("");
      setErrorMessage("");
      
      // Remover las últimas 2 mensajes del chat (pregunta y respuesta)
      if (chatHistory.length >= 2) {
        setChatHistory(chatHistory.slice(0, -2));
      }
    } else {
      navigate("/home");
    }
  };

  if (!isQuestionnaireDone && !currentQuestion) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background border-b px-3 py-2 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-start">
            <button
              onClick={handleBack}
              className="h-7 px-2 sm:px-3 text-xs sm:text-sm text-primary hover:bg-primary/5 rounded transition-colors"
            >
              <ArrowLeft className="w-3 h-3 mr-1 inline" />
              <span className="hidden sm:inline">Volver</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 pb-24 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Mostrar historial de chat completo */}
          {chatHistory.map((msg, idx) => (
            <ChatBubble 
              key={idx} 
              sender={msg.sender} 
              message={msg.message} 
            />
          ))}

          {/* Si el cuestionario no está done, mostrar pregunta actual */}
          {!isQuestionnaireDone && (
            <ChatBubble sender="agent" message={currentQuestion?.text || ''} />
          )}

          {/* Flujo post-questionnaire */}
          {isQuestionnaireDone && (
            <div className="flex justify-end mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-full space-y-3">
                <button
                  onClick={handleStartWithPrimary}
                  className="w-full px-4 py-3 rounded-lg border-2 border-primary bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-sm sm:text-base"
                >
                  Vamos
                </button>
                {!showAllOptions && (
                  <button
                    onClick={handleShowAllOptions}
                    className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background text-foreground font-medium hover:bg-accent/50 transition-colors text-sm sm:text-base"
                  >
                    Ver otras opciones
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Mostrar todas las opciones de riesgo */}
          {isQuestionnaireDone && showAllOptions && !selectedRisk && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {riskOptions
                .filter((option) => {
                  // Contar cuántos riesgos detectados hay (con puntuación > 0)
                  const detectedRisksCount = Object.values(riskScores).filter(score => score > 0).length;
                  
                  // Si solo hay 1 riesgo detectado, mostrar TODAS las opciones
                  if (detectedRisksCount === 1) {
                    return true;
                  }
                  
                  // Si hay más de 1 riesgo, mostrar solo los detectados (excluyendo el principal)
                  return riskScores[option.risk] && riskScores[option.risk] > 0 && option.risk !== primaryRisk;
                })
                .map((option) => (
                  <button
                    key={option.risk}
                    onClick={() => handleSelectRisk(option.risk)}
                    className="p-4 rounded-lg border-2 border-border bg-background hover:border-primary/50 hover:shadow-lg transition-all text-left group flex flex-col h-full"
                  >
                    <div className="flex-1 flex flex-col">
                      <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                        {option.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-2 flex-1">
                        {option.description}
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-3" />
                  </button>
                ))}
            </div>
          )}

          {/* Mostrar tarjeta seleccionada con botón Vamos */}
          {isQuestionnaireDone && showAllOptions && selectedRisk && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-3">
              {riskOptions
                .filter(option => option.risk === selectedRisk)
                .map(option => (
                  <div key={option.risk} className="p-4 rounded-lg border-2 border-primary bg-background shadow-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base">
                          {option.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          {option.description}
                        </p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    </div>
                    <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                      <button
                        onClick={() => setSelectedRisk(null)}
                        className="flex-1 px-4 py-2.5 rounded-lg border-2 border-border bg-background text-foreground font-medium hover:bg-accent/50 transition-colors text-sm"
                      >
                        Cambiar
                      </button>
                      <button
                        onClick={handleConfirmRisk}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-sm"
                      >
                        Vamos
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Footer con input - Solo visible durante el questionnaire */}
      {!isQuestionnaireDone && (
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
              onKeyPress={handleKeyPress}
              placeholder="Escribe aquí..."
              className="flex-1 px-4 py-2.5 sm:py-3 border border-border rounded-full bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm sm:text-base"
            />
            <button
              onClick={handleNumericResponse}
              disabled={!userInput.trim()}
              className="flex-shrink-0 p-2 sm:px-4 sm:py-2.5 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}