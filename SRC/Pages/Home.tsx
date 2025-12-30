import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChatBubble } from "@/Components/Chat/ChatBubble";
import { Chip } from "@/Components/Ui/chip";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/Components/Header";
import { detectCrisis } from "@/Lib/crisisSafety";
import { validateStorageIntegrity, getCurrentUserId } from "@/Lib/storageManager";

type ChatMessage = {
  sender: 'agent' | 'user';
  message: string;
};

export default function Home() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("estudiante");
  const [step, setStep] = useState(0);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [showTimeout, setShowTimeout] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [crisisLevel, setCrisisLevel] = useState<'none' | 'first' | 'confirmed' | 'severe'>('none');
  const [consecutiveGraveResponses, setConsecutiveGraveResponses] = useState(0);
  const [crisisImprovement, setCrisisImprovement] = useState(false);
  const [lastNormalQuestion, setLastNormalQuestion] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar el timer de inactividad
  const clearInactivityTimeout = () => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
  };

  // Iniciar el timer de 5 minutos
  const startInactivityTimeout = useCallback(() => {
    clearInactivityTimeout();
    inactivityTimeoutRef.current = setTimeout(() => {
      const timeoutMsg = "Tranquilo/a, no hace falta que contestes de inmediato. ¡Te recordaré en breve!";
      setChatHistory(prev => [...prev, { sender: 'agent', message: timeoutMsg }]);
      setShowTimeout(true); // Marcar que se mostró el timeout
      
      // Guardar como recordatorio y volver a consent después de 2 segundos
      localStorage.setItem("unitec_reminder", "tomorrow");
      setTimeout(() => {
        navigate("/consent");
      }, 2000);
    }, 5 * 60 * 1000); // 5 minutos
  }, [navigate]);

  useEffect(() => {
    // VALIDAR INTEGRIDAD DE STORAGE PRIMERO
    validateStorageIntegrity();
    
    // Obtener datos del localStorage (guardados en Consent.tsx)
    const matricula = localStorage.getItem("unitec_matricula") || "";
    const nombre = localStorage.getItem("unitec_nombre") || "";
    const currentUserId = getCurrentUserId();
    
    // Si no hay matrícula, volver a login
    if (!matricula) {
      navigate("/consent");
      return;
    }

    setUserName(nombre || "estudiante");
    
    console.log(`✅ Home inicializado para usuario: ${currentUserId}`);

    // Iniciar el flujo automáticamente
    setTimeout(() => {
      setChatHistory([{
        sender: 'agent',
        message: `Hola, ${nombre || 'estudiante'}. Soy Gero, tu asistente académico.\n\n¿Cómo te sientes hoy, en tus propias palabras?`
      }]);
      setStep(1);
      // Iniciar el timer de 5 minutos cuando se muestra el primer mensaje
      startInactivityTimeout();
    }, 500);
  }, [navigate, startInactivityTimeout]);

  // Auto-scroll al final del chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, step]);

  const handleResponse = (response: string, nextAction: 'questionnaire' | 'reminder') => {
    // Limpiar el timer de inactividad cuando el usuario interactúa
    clearInactivityTimeout();
    
    // Agregar respuesta del usuario al chat
    const newHistory = [...chatHistory, { sender: 'user' as const, message: response }];
    
    // Mostrar mensaje de confirmación del agente
    const confirmMsg = `Perfecto ${userName}! ✨ Vamos a comenzar entonces.`;
    const historyWithConfirm = [...newHistory, { sender: 'agent' as const, message: confirmMsg }];
    
    // Guardar el historial COMPLETO (incluyendo el mensaje de confirmación) en localStorage
    localStorage.setItem("unitec_home_chat_history", JSON.stringify(historyWithConfirm));
    setChatHistory(historyWithConfirm);
    
    // Navegar automáticamente al cuestionario después de 0.6 segundos
    setTimeout(() => {
      navigate("/questionnaire");
    }, 600);
  };

  // Manejar respuesta libre del usuario
  const handleFreeTextResponse = () => {
    if (!userInput.trim()) return;

    // Limpiar el timer de inactividad
    clearInactivityTimeout();
    
    const userMsg = userInput.trim();
    const crisis = detectCrisis(userMsg);
    
    // ========= FLUJO NORMAL (sin crisis detectada) =========
    if (!crisis.isCrisis && crisisLevel === 'none') {
      const newHistory = [...chatHistory, { sender: 'user' as const, message: userMsg }];
      setChatHistory(newHistory);
      setUserInput("");

      setTimeout(() => {
        const transitionMsg = "Gracias por decírmelo. Para conocerte y acompañarte mejor en este inicio, quiero hacerte algunas preguntas breves. ¿Te parece si empezamos ahora?";
        const historyWithTransition = [...newHistory, { sender: 'agent' as const, message: transitionMsg }];
        setChatHistory(historyWithTransition);
        setStep(2);
      }, 600);
      return;
    }
    
    // ========= PRIMER NIVEL: Crisis detectada por primera vez =========
    if (crisis.isCrisis && crisisLevel === 'none') {
      const userId = localStorage.getItem("unitec_user_id");
      if (userId) {
        fetch('/wp-json/gero/v1/guardar-interacciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: parseInt(userId),
            tipo: 'crisis_detectada_validacion',
            contenido: {
              mensaje: userMsg,
              nivel: crisis.riskLevel,
              keywords: crisis.detectedKeywords,
              etapa: 'primera_deteccion'
            },
            riesgo_detectado: {
              tipo: 'crisis',
              nivel: crisis.riskLevel,
              timestamp: new Date().toISOString(),
            }
          })
        }).catch(e => console.error('Error guardando crisis:', e));
      }
      
      const crisisMsg = `${userName}, entiendo que estés atravesando un momento difícil. Aprecio tu confianza.\n\nCuéntame un poco más: ¿Desde cuándo te sientes así? Estoy aquí para apoyarte.`;
      const newHistory = [...chatHistory, 
        { sender: 'user' as const, message: userMsg },
        { sender: 'agent' as const, message: crisisMsg }
      ];
      setChatHistory(newHistory);
      setUserInput("");
      setCrisisDetected(true);
      setCrisisLevel('first');
      setConsecutiveGraveResponses(1);
      setLastNormalQuestion("¿Cuándo comenzó a sentirse así?");
      return;
    }
    
    // ========= VALIDACIÓN DURANTE CRISIS =========
    if (crisisLevel === 'first' || crisisLevel === 'confirmed') {
      if (crisis.isCrisis) {
        // Otra respuesta grave detectada
        const newCount = consecutiveGraveResponses + 1;
        setConsecutiveGraveResponses(newCount);
        setCrisisImprovement(false);
        
        if (newCount >= 5) {
          // 5+ respuestas graves = Derivación inmediata
          const userId = localStorage.getItem("unitec_user_id");
          if (userId) {
            fetch('/wp-json/gero/v1/guardar-interacciones', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: parseInt(userId),
                tipo: 'crisis_grave_confirmada',
                contenido: {
                  mensaje: userMsg,
                  respuestas_graves_consecutivas: newCount,
                  etapa: 'derivacion_necesaria'
                },
                riesgo_detectado: {
                  tipo: 'crisis_grave',
                  timestamp: new Date().toISOString(),
                }
              })
            }).catch(e => console.error('Error guardando crisis grave:', e));
          }

          const severMsg = `${userName}, veo que realmente necesitas apoyo profesional ahora mismo.\n\n🚨 **Por favor contacta:** Línea Nacional de Crisis: 01-800-911-2000\n\n¿Quieres que alguien en UNITEC sepa que necesitas ayuda?`;
          const newHistory = [...chatHistory, 
            { sender: 'user' as const, message: userMsg },
            { sender: 'agent' as const, message: severMsg }
          ];
          setChatHistory(newHistory);
          setUserInput("");
          setCrisisLevel('severe');
          return;
        } else {
          // Menos de 5: Continuar validando, mostrar preocupación
          const followUpMsg = `Entiendo. Quiero asegurarme de que recibas el apoyo que necesitas.\n\n¿Has pensado en hablar con alguien más sobre esto? ¿Hay alguien de confianza en tu vida?`;
          const newHistory = [...chatHistory, 
            { sender: 'user' as const, message: userMsg },
            { sender: 'agent' as const, message: followUpMsg }
          ];
          setChatHistory(newHistory);
          setUserInput("");
          setCrisisLevel('confirmed');
          return;
        }
      } else {
        // Respuesta no grave después de crisis = Señal de mejoría
        setCrisisImprovement(true);
        setConsecutiveGraveResponses(0);
        
        const recoveryMsg = `Me alegra que sientas que puedes hablar de esto. Veo que hay esperanza.\n\n¿Te gustaría retomar nuestro flujo de acompañamiento, o prefieres seguir hablando sobre lo que te preocupa?`;
        const newHistory = [...chatHistory, 
          { sender: 'user' as const, message: userMsg },
          { sender: 'agent' as const, message: recoveryMsg }
        ];
        setChatHistory(newHistory);
        setUserInput("");
        setStep(99); // Paso especial de recuperación
        return;
      }
    }
    
    // ========= DESPUÉS DE CRISIS SEVERA =========
    if (crisisLevel === 'severe') {
      // El usuario responde después de ser derivado
      // Ofrecemos continuidad o apoyo
      const continueMsg = `Está bien si necesitas tiempo. Estaré aquí cuando quieras continuar. ¿Hay algo más en lo que pueda ayudarte?`;
      const newHistory = [...chatHistory, 
        { sender: 'user' as const, message: userMsg },
        { sender: 'agent' as const, message: continueMsg }
      ];
      setChatHistory(newHistory);
      setUserInput("");
      return;
    }
  };

  const handleBack = () => {
    clearInactivityTimeout();
    navigate("/consent");
  };

  // Limpiar timer cuando el componente se desmonta
  useEffect(() => {
    return () => {
      clearInactivityTimeout();
    };
  }, []);

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
          {/* Mostrar historial de chat */}
          {chatHistory.map((msg, idx) => (
            <ChatBubble 
              key={idx} 
              sender={msg.sender} 
              message={msg.message} 
            />
          ))}

          {/* Input de texto libre - Step 1 o durante validación de crisis */}
          {(step === 1 || crisisLevel !== 'none') && !showTimeout && (
            <div className="flex justify-end mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="w-full space-y-2 sm:space-y-3">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleFreeTextResponse()}
                  placeholder={crisisLevel === 'first' ? "Cuéntame más..." : crisisLevel === 'confirmed' ? "Escribe cuando estés listo..." : "Cuéntame cómo te sientes..."}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                <button
                  onClick={handleFreeTextResponse}
                  disabled={!userInput.trim()}
                  className="w-full px-4 py-2 sm:py-3 rounded-lg bg-primary text-primary-foreground text-sm sm:text-base font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Enviar
                </button>
              </div>
            </div>
          )}

          {/* Opciones para el Paso 2 - Solo mostrar si no se ha mostrado el timeout */}
          {step === 2 && !showTimeout && (
            <div className="flex justify-end mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="w-full space-y-2 sm:space-y-3">
                <Chip 
                  onClick={() => handleResponse("Sí, comencemos", "questionnaire")}
                  className="w-full justify-center text-sm sm:text-base py-2 sm:py-3 cursor-pointer"
                >
                  Sí, comencemos.
                </Chip>
              </div>
            </div>
          )}

          {/* Paso 99: Opciones después de mejoría en crisis */}
          {step === 99 && !showTimeout && (
            <div className="flex justify-end mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="w-full space-y-2 sm:space-y-3">
                <Chip 
                  onClick={() => {
                    // Continuar con el cuestionario desde donde quedó
                    setCrisisLevel('none');
                    setCrisisDetected(false);
                    setConsecutiveGraveResponses(0);
                    setCrisisImprovement(false);
                    navigate("/questionnaire");
                  }}
                  className="w-full justify-center text-sm sm:text-base py-2 sm:py-3 cursor-pointer"
                >
                  Sí, retomemos nuestro flujo.
                </Chip>
                <Chip 
                  onClick={() => {
                    setStep(1); // Volver al input libre para continuar hablando
                    setUserInput("");
                  }}
                  className="w-full justify-center text-sm sm:text-base py-2 sm:py-3 cursor-pointer"
                >
                  Prefiero seguir hablando.
                </Chip>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>
    </div>
  );
}
