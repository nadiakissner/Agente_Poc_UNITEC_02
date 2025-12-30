import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChatBubble } from "@/Components/Chat/ChatBubble";
import { TypingIndicator } from "@/Components/Chat/TypingIndicator";
import { ArrowLeft } from "lucide-react";
import { validateStorageIntegrity, getCurrentUserId } from "@/Lib/storageManager";
import { 
  detectCrisis, 
  getCrisisContainmentMessage,
  getCrisisResourceMessage,
  getReturnToFlowMessage,
  getPauseMessage,
  getCrisisMarker,
  isPositiveResponse,
  isNegativeResponse,
  type CrisisDetection 
} from "@/Lib/crisisSafety";

export default function Agent() {
  const navigate = useNavigate();
  const [matricula, setMatricula] = useState("");
  const [validated, setValidated] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [nombre, setNombre] = useState<string | null>(null);
  const [carrera, setCarrera] = useState<string | null>(null);
  const [riesgos, setRiesgos] = useState<string[]>([]);
  const [messages, setMessages] = useState<{ sender: 'user'|'agent'; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  
  // Estados para manejo de crisis
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [crisisLevel, setCrisisLevel] = useState<'none' | 'high' | 'extreme'>('none');
  const [crisisPhase, setCrisisPhase] = useState<'evaluation' | 'containment' | 'recovery'>('evaluation');
  const [priorTopic, setPriorTopic] = useState<string>('');

  useEffect(() => {
    // Limpiar datos de usuarios anteriores al inicializar Agent
    validateStorageIntegrity();
    const currentUserId = getCurrentUserId();
    console.log(`✅ Agent inicializado para usuario: ${currentUserId}`);

    // Inicializar con datos del localStorage (desde el flujo de autenticación)
    const storedMatricula = localStorage.getItem("unitec_matricula");
    const storedUserId = localStorage.getItem("unitec_user_id");
    const storedRiesgos = localStorage.getItem("unitec_riesgos_principales");
    const storedNombre = localStorage.getItem("unitec_nombre");

    if (storedMatricula && storedUserId) {
      setMatricula(storedMatricula);
      setUserId(parseInt(storedUserId));
      if (storedNombre) {
        setNombre(storedNombre);
      }
      if (storedRiesgos) {
        setRiesgos(JSON.parse(storedRiesgos));
      }
      // Auto-validar - pasar storedNombre como parámetro
      validateUser(storedMatricula, parseInt(storedUserId), storedNombre || '');
    } else {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const validateUser = async (matriculaInput: string, userIdInput: number, storedNombreParam: string = '') => {
    setLoading(true);
    try {
      // Obtener datos del usuario desde el backend
      const res = await fetch(`/wp-json/gero/v1/usuarios-habilitados?id=${userIdInput}`);
      const data = await res.json();

      if (res.ok) {
        // Usar nombre del localStorage (storedNombreParam) como prioridad, sino del backend, sino fallback
        const nombreParam = storedNombreParam || data.nombre || 'estudiante';
        if (data.nombre) {
          setNombre(data.nombre);
        }
        setCarrera(data.carrera);
        setValidated(true);

        // Cargar último mensaje de la conversación si existe
        try {
          const lastRes = await fetch(`/wp-json/gero/v1/last-conversation?value_validador=${matriculaInput}`);
          const lastData = await lastRes.json();
          
          // Opción 1: Si hay historial previo guardado en localStorage (flujo recurrente)
          const storedLastConv = localStorage.getItem("unitec_last_conversation");
          if (storedLastConv) {
            // Mostrar el historial previo parseado como líneas
            const messages_prev = storedLastConv
              .split('\n')
              .filter(line => line.trim())
              .map(line => {
                const isSender = line.startsWith('Usuario:');
                return {
                  sender: isSender ? 'user' as const : 'agent' as const,
                  text: line.replace(/^(Usuario|Agente):\s*/, '')
                };
              });
            
            setMessages([
              ...messages_prev,
              {
                sender: 'agent',
                text: `¡Hola, ${nombreParam}! ¿Cómo te sientes? ¿En que puedo ayudarte?`
              }
            ]);
            
            localStorage.removeItem("unitec_last_conversation"); // Limpiar después de usar
          }
          else if (lastRes.ok && lastData.conversation_string) {
            setMessages([
              {
                sender: 'agent',
                text: `¡Hola, ${nombreParam}! ¿Cómo te sientes? ¿En que puedo ayudarte?`
              }
            ]);
          }
          else {
            // Opción 3: Primer contacto - mensaje de bienvenida
            setMessages([
              {
                sender: 'agent',
                text: `¡Hola, ${nombreParam}! ¿Cómo te sientes? ¿En que puedo ayudarte?`
              }
            ]);
          }
        } catch (e) {
          console.warn('No se pudo cargar historial:', e);
          // Fallback: mostrar mensaje inicial normal
          setMessages([
            {
              sender: 'agent',
              text: `¡Hola, ${nombreParam}! ¿Cómo te sientes? ¿En que puedo ayudarte?`
            }
          ]);
        }
      } else {
        alert('No se pudo validar la matrícula');
      }
    } catch (e) {
      console.error(e);
      alert('Error validando');
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  };

  const handleValidate = async () => {
    if (!matricula || !userId) return;
    await validateUser(matricula, userId);
  };

  const handleSend = async () => {
    if (!input || !validated) return;
    const text = input.trim();
    setInput("");
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setLoading(true);

    try {
      // PROTOCOLO DE DETECCIÓN CRÍTICA - Prioridad Máxima
      const crisis = detectCrisis(text);

      // PASO 1: DETECCIÓN DE CRISIS
      if (crisis.isCrisis && !crisisDetected) {
        setCrisisDetected(true);
        setCrisisLevel(crisis.riskLevel as 'high' | 'extreme');
        setPriorTopic('nuestra charla anterior');

        // Respuesta de contención (Paso A)
        const containmentMsg = getCrisisContainmentMessage();
        setMessages(prev => [...prev, { sender: 'agent', text: containmentMsg }]);
        
        if (crisis.riskLevel === 'extreme') {
          setCrisisPhase('containment');
          // Guardar estado interrumpido
          await saveCrisisState(text, containmentMsg);
        } else {
          setCrisisPhase('evaluation');
        }
        setLoading(false);
        return;
      }

      // PASO 2: EVALUACIÓN DE PERSISTENCIA (Si ya fue detectada crisis)
      if (crisisDetected && crisisPhase === 'evaluation') {
        // Verificar si mantiene el discurso negativo o muestra mejoría
        const stillInCrisis = detectCrisis(text);
        
        if (stillInCrisis.isCrisis) {
          // Persistencia del riesgo - Entregar recurso obligatorio (Paso B)
          const resourceMsg = getCrisisResourceMessage();
          setMessages(prev => [...prev, { sender: 'agent', text: resourceMsg }]);
          setCrisisPhase('containment');
          
          // Guardar estado interrumpido con marcador para PHP
          await saveCrisisState(text, resourceMsg);
          setLoading(false);
          return;
        } else {
          // Mejoría detectada - Pasar a Paso C (Recovery)
          setCrisisPhase('recovery');
          const recoveryMsg = getReturnToFlowMessage(priorTopic);
          setMessages(prev => [...prev, { sender: 'agent', text: recoveryMsg }]);
          setLoading(false);
          return;
        }
      }

      // PASO 3: RETORNO AL FLUJO (Recovery)
      if (crisisDetected && crisisPhase === 'recovery') {
        if (isPositiveResponse(text)) {
          // Usuario dice SÍ - Retomar conversación normal
          setCrisisDetected(false);
          setCrisisPhase('evaluation');
          // Continuar con flujo normal
        } else if (isNegativeResponse(text)) {
          // Usuario dice NO - Pausa amable
          const pauseMsg = getPauseMessage();
          setMessages(prev => [...prev, { sender: 'agent', text: pauseMsg }]);
          setLoading(false);
          return;
        }
      }

      // FLUJO NORMAL (cuando NO hay crisis)
      const res = await fetch(`/wp-json/gero/v1/chat-openai-agente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          matricula: matricula,
          message: text,
          riesgos_detectados: riesgos,
        }),
      });

      const data = await res.json();
      const reply = data.respuesta || data.message || 'Sin respuesta del agente';
      setMessages(prev => [...prev, { sender: 'agent', text: reply }]);

      // Guardar conversación
      const transcript = messages.concat([
        { sender: 'user', text },
        { sender: 'agent', text: reply }
      ]).map(m => `${m.sender === 'user' ? 'User' : 'Agent'}: ${m.text}`).join('\n');

      if (userId) {
        await fetch(`/wp-json/gero/v1/guardar-conversacion-agente`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: userId,
            conversacion: transcript,
          }),
        });
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { 
        sender: 'agent', 
        text: 'Disculpa, hubo un error. Por favor intenta nuevamente.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Guarda el estado de crisis para reanudación posterior
   */
  const saveCrisisState = async (userInput: string, agentResponse: string) => {
    try {
      const conversationState = {
        isCrisis: true,
        crisisLevel,
        crisisPhase,
        userLastInput: userInput,
        agentLastResponse: agentResponse,
        timestamp: new Date().toISOString(),
      };

      await fetch(`/wp-json/gero/v1/guardar-conversation-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          conversation_state: JSON.stringify(conversationState),
          crisis_marker: getCrisisMarker(),
        }),
      });
    } catch (e) {
      console.error('Error saving crisis state:', e);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBack = () => {
    navigate("/home");
  };

  if (!validated && !initializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 animate-in fade-in duration-300">
            <label className="block text-sm font-medium text-blue-900 mb-3">
              Ingresa tu matrícula para continuar
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                placeholder="Ej: A12345"
                className="flex-1 border border-blue-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                onClick={handleValidate}
                disabled={!matricula.trim() || loading}
                className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Validar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Igual a Questionnaire */}
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

      {/* Main - Igual a Questionnaire */}
      <main className="flex-1 w-full px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 pb-24 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Mostrar confirmación de usuario validado */}
          {validated && nombre && (
            <div className="mb-4 p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200 text-sm animate-in slide-in-from-top duration-300">
              <div className="font-medium text-green-900">{nombre} ({matricula})</div>
              {carrera && <div className="text-green-700 text-xs">{carrera}</div>}
            </div>
          )}

          {/* Historial de mensajes - Igual a Questionnaire */}
          {messages.map((msg, idx) => (
            <ChatBubble
              key={idx}
              sender={msg.sender}
              message={msg.text}
            />
          ))}

          {/* Indicador de carga */}
          {loading && <TypingIndicator />}

          <div ref={messagesRef} />
        </div>
      </main>

      {/* Footer - Igual a Questionnaire */}
      {validated && (
        <footer className="sticky bottom-0 bg-background border-t px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
          <div className="max-w-2xl mx-auto flex gap-2 sm:gap-3 items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe aquí..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 sm:py-3 border border-border rounded-full bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm sm:text-base disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
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
