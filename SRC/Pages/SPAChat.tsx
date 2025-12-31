import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChatBubble } from "@/Components/Chat/ChatBubble";
import { TypingIndicator } from "@/Components/Chat/TypingIndicator";
import { Chip } from "@/Components/Ui/chip";
import { ArrowLeft } from "lucide-react";
import { validateStorageIntegrity, getCurrentUserId } from "@/Lib/storageManager";
import { questionnaireData, Question, RiskCategory } from "@/Data/questionnaire";
import { 
  detectCrisis, 
  getCrisisContainmentMessage,
  getCrisisResourceMessage,
  getReturnToFlowMessage,
  getPauseMessage,
  getCrisisMarker,
  isPositiveResponse,
  isNegativeResponse,
} from "@/Lib/crisisSafety";

type ChatMessage = {
  sender: 'agent' | 'user';
  message: string;
};

type AnswerValue = {
  text: string | string[];
  risk?: RiskCategory | RiskCategory[];
  weight?: number;
  riskWeights?: Partial<Record<RiskCategory, number>>;
};

type FlowPhase = 
  | 'chat'           // Chat libre con el agente generativo
  | 'transition'     // Preguntando si puede hacer preguntas
  | 'questionnaire'  // Realizando el cuestionario
  | 'cr_questionnaire' // Cuestionario C/R para determinar rama
  | 'riasec_test'    // Test RIASEC de intereses vocacionales
  | 'completed';     // Cuestionario completado

type AgentAction = {
  type: 'show_initial_questionnaire' | 'show_cr_questionnaire' | 'show_riasec_test';
  motivo?: string;
} | null;

// Preguntas del Cuestionario C/R (determina Rama C = Chat vs Rama R = RIASEC)
type CRQuestion = {
  id: number;
  text: string;
  type: 'slider' | 'chips' | 'multi-chips';
  options?: { text: string; scoreC: number; scoreR: number }[];
  sliderConfig?: { min: number; max: number; scoreLogic: (value: number) => { c: number; r: number } };
};

const crQuestions: CRQuestion[] = [
  {
    id: 1,
    text: "¿Qué tan motivado/a te sientes en este momento sobre estudiar tu carrera? (1 = Nada motivado, 5 = Muy motivado)",
    type: 'chips',
    options: [
      { text: "1", scoreC: 0, scoreR: 2 },
      { text: "2", scoreC: 1, scoreR: 2 },
      { text: "3", scoreC: 1, scoreR: 1 },
      { text: "4", scoreC: 1, scoreR: 0 },
      { text: "5", scoreC: 1, scoreR: 0 },
    ]
  },
  {
    id: 2,
    text: "¿Sientes que tus dudas tienen más que ver contigo, sobre tu elección de carrera, o ambas?",
    type: 'chips',
    options: [
      { text: "Conmigo", scoreC: 2, scoreR: 0 },
      { text: "Con mi carrera", scoreC: 0, scoreR: 2 },
      { text: "Ambas", scoreC: 1, scoreR: 2 },
    ]
  },
  {
    id: 3,
    text: "Del 1 al 5, ¿qué tan clara sientes tu decisión de carrera?",
    type: 'chips',
    options: [
      { text: "1", scoreC: 0, scoreR: 2 },
      { text: "2", scoreC: 0, scoreR: 2 },
      { text: "3", scoreC: 0, scoreR: 1 },
      { text: "4", scoreC: 2, scoreR: 0 },
      { text: "5", scoreC: 2, scoreR: 0 },
    ]
  },
  {
    id: 4,
    text: "¿Te preocupa que la carrera sea muy larga?",
    type: 'chips',
    options: [
      { text: "Sí", scoreC: 1, scoreR: 0 },
      { text: "No", scoreC: 0, scoreR: 0 },
      { text: "Un poco", scoreC: 1, scoreR: 0 },
    ]
  },
  {
    id: 5,
    text: "¿Te preocupa no entender las materias?",
    type: 'chips',
    options: [
      { text: "Sí", scoreC: 2, scoreR: 1 },
      { text: "No", scoreC: 0, scoreR: 0 },
      { text: "Un poco", scoreC: 1, scoreR: 0 },
    ]
  },
  {
    id: 6,
    text: "¿Tienes dudas sobre la salida laboral de la carrera que elegiste?",
    type: 'chips',
    options: [
      { text: "Sí, tengo muchas dudas", scoreC: 2, scoreR: 1 },
      { text: "Algunas dudas", scoreC: 1, scoreR: 1 },
      { text: "No, estoy tranquilo/a", scoreC: 1, scoreR: 0 },
    ]
  },
  {
    id: 7,
    text: "¿Cuál de estas opciones refleja mejor tu situación actual?",
    type: 'multi-chips',
    options: [
      { text: "Quiero mejorar mi situación laboral o crecer profesionalmente", scoreC: 0, scoreR: 2 },
      { text: "Me interesa aprender algo nuevo y seguir formándome", scoreC: 0, scoreR: 2 },
      { text: "Estudio para cumplir con lo que se espera de mí", scoreC: 0, scoreR: 2 },
      { text: "Estoy cumpliendo un sueño pendiente", scoreC: 2, scoreR: 0 },
      { text: "Quiero demostrarme que soy capaz de lograrlo", scoreC: 2, scoreR: 0 },
    ]
  },
];

// Preguntas RIASEC (12 preguntas de elección A/B)
type RiasecLetter = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
type RiasecQuestion = {
  id: number;
  optionA: { text: string; letter: RiasecLetter };
  optionB: { text: string; letter: RiasecLetter };
};

const riasecQuestions: RiasecQuestion[] = [
  { id: 1, optionA: { text: "Diseñar un poster para un evento", letter: "A" }, optionB: { text: "Analizar resultados de una encuesta", letter: "I" } },
  { id: 2, optionA: { text: "Armar o reparar cosas con herramientas", letter: "R" }, optionB: { text: "Acompañar a una persona a resolver un problema personal", letter: "S" } },
  { id: 3, optionA: { text: "Liderar un proyecto y persuadir a otros", letter: "E" }, optionB: { text: "Organizar datos y procesos en planillas", letter: "C" } },
  { id: 4, optionA: { text: "Entender cómo funcionan las cosas por dentro", letter: "I" }, optionB: { text: "Crear bocetos e ideas visuales", letter: "A" } },
  { id: 5, optionA: { text: "Atender a personas de forma directa", letter: "S" }, optionB: { text: "Mejorar un flujo de trabajo", letter: "C" } },
  { id: 6, optionA: { text: "Ir a terreno para medir e instalar", letter: "R" }, optionB: { text: "Presentar una propuesta de negocio", letter: "E" } },
  { id: 7, optionA: { text: "Programar o prototipar una solución técnica", letter: "I" }, optionB: { text: "Coordinar un equipo para cumplir metas", letter: "E" } },
  { id: 8, optionA: { text: "Diseñar o ilustrar una identidad visual", letter: "A" }, optionB: { text: "Ordenar y revisar información", letter: "C" } },
  { id: 9, optionA: { text: "Acompañar a alguien en su aprendizaje", letter: "S" }, optionB: { text: "Armar o montar estructuras o dispositivos", letter: "R" } },
  { id: 10, optionA: { text: "Investigar un problema y redactar hallazgos", letter: "I" }, optionB: { text: "Gestionar clientes y ventas", letter: "E" } },
  { id: 11, optionA: { text: "Crear contenidos visuales para redes", letter: "A" }, optionB: { text: "Gestionar documentación y cumplimiento", letter: "C" } },
  { id: 12, optionA: { text: "Escuchar y orientar a un estudiante", letter: "S" }, optionB: { text: "Probar, calibrar y mejorar un equipo técnico", letter: "R" } },
];

export default function SPAChat() {
  const navigate = useNavigate();
  
  // Estado del usuario
  const [userName, setUserName] = useState("estudiante");
  const [matricula, setMatricula] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [carrera, setCarrera] = useState<string | null>(null);
  const [riesgos, setRiesgos] = useState<string[]>([]);
  
  // Estado del chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  
  // Estado del flujo SPA
  const [flowPhase, setFlowPhase] = useState<FlowPhase>('chat');
  const [interactionCount, setInteractionCount] = useState(0);
  // Nota: El agente decide cuándo proponer cuestionarios via Function Calling (interacciones 1-3)
  
  // Estado del cuestionario
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, AnswerValue>>(new Map());
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [questionnaireHistory, setQuestionnaireHistory] = useState<number[]>([]);
  const [riskScores, setRiskScores] = useState<Record<string, number>>({});
  const [primaryRisk, setPrimaryRisk] = useState<RiskCategory | null>(null);
  
  // Estado de crisis
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [crisisLevel, setCrisisLevel] = useState<'none' | 'high' | 'extreme'>('none');
  const [crisisPhase, setCrisisPhase] = useState<'evaluation' | 'containment' | 'recovery'>('evaluation');
  const [priorTopic, setPriorTopic] = useState<string>('');
  
  // Estado del cuestionario C/R (determina Rama C vs Rama R)
  const [crQuestionIndex, setCrQuestionIndex] = useState(0);
  const [crAnswers, setCrAnswers] = useState<string[]>([]);
  const [puntuacionC, setPuntuacionC] = useState(0);
  const [puntuacionR, setPuntuacionR] = useState(0);
  
  // Estado del test RIASEC
  const [riasecQuestionIndex, setRiasecQuestionIndex] = useState(0);
  const [riasecAnswers, setRiasecAnswers] = useState<string[]>([]);
  const [riasecScores, setRiasecScores] = useState({ R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 });
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtrar preguntas del cuestionario (omitir checkbox)
  useEffect(() => {
    const filtered = questionnaireData.filter(q => q.type !== 'checkbox');
    setFilteredQuestions(filtered);
  }, []);

  const currentQuestion = filteredQuestions[currentQuestionIndex];

  // Inicialización
  useEffect(() => {
    validateStorageIntegrity();
    const currentUserId = getCurrentUserId();
    console.log(`✅ SPAChat inicializado para usuario: ${currentUserId}`);

    const storedMatricula = localStorage.getItem("unitec_matricula");
    const storedUserId = localStorage.getItem("unitec_user_id");
    const storedNombre = localStorage.getItem("unitec_nombre");
    const storedCarrera = localStorage.getItem("unitec_carrera");
    const storedRiesgos = localStorage.getItem("unitec_riesgos_principales");
    const storedFlujo = localStorage.getItem("unitec_flujo");

    if (!storedMatricula || !storedUserId) {
      navigate("/consent");
      return;
    }

    setMatricula(storedMatricula);
    setUserId(parseInt(storedUserId));
    setUserName(storedNombre || "estudiante");
    setCarrera(storedCarrera || null);
    
    if (storedRiesgos) {
      setRiesgos(JSON.parse(storedRiesgos));
    }

    // Mensaje inicial del agente - solo la primera vez
    const welcomeMessage = storedFlujo === "recurrente" 
      ? `¡Hola de nuevo, ${storedNombre || 'estudiante'}! ¿Cómo te ha ido? ¿En qué puedo apoyarte hoy?`
      : `Hola, ${storedNombre || 'estudiante'}. Soy Gero, tu acompañante en UNITEC. Estoy aquí para apoyarte en lo que necesites.\n\n¿Cómo te sientes hoy?`;

    setMessages([{ sender: 'agent', message: welcomeMessage }]);
    setInitializing(false);
  }, [navigate]);

  // Auto-scroll al final del chat
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages]);

  // Focus en input
  useEffect(() => {
    inputRef.current?.focus();
  }, [flowPhase, currentQuestionIndex]);

  // Enviar mensaje al agente generativo
  const sendToAgent = useCallback(async (userMessage: string): Promise<{ message: string; action: AgentAction }> => {
    try {
      const res = await fetch(`/wp-json/gero/v1/chat-openai-agente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          matricula: matricula,
          message: userMessage,
          riesgos_detectados: riesgos,
        }),
      });

      const data = await res.json();
      
      // Check for HTTP errors
      if (!res.ok) {
        console.error('Error HTTP:', res.status, data);
        return {
          message: data.message || 'Error de comunicación con el servidor. Intenta de nuevo.',
          action: null,
        };
      }
      
      // Check for API errors
      if (data.success === false) {
        console.error('Error API:', data.error, data.message);
        return {
          message: data.message || 'Hubo un problema procesando tu mensaje. Intenta de nuevo.',
          action: null,
        };
      }
      
      return {
        message: data.respuesta || data.message || 'Sin respuesta del agente',
        action: data.action || null,
      };
    } catch (e) {
      console.error('Error al comunicarse con el agente:', e);
      return {
        message: 'Disculpa, hubo un error de conexión. ¿Puedes intentar nuevamente?',
        action: null,
      };
    }
  }, [userId, matricula, riesgos]);

  // Guardar conversación en el backend
  const saveConversation = useCallback(async (transcript: string) => {
    if (!userId) return;
    
    try {
      await fetch(`/wp-json/gero/v1/guardar-conversacion-agente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          conversacion: transcript,
        }),
      });
    } catch (e) {
      console.error('Error guardando conversación:', e);
    }
  }, [userId]);

  // Manejar envío de mensaje en fase de chat
  const handleChatMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { sender: 'user', message: userMessage }]);
    setLoading(true);

    // Detectar crisis
    const crisis = detectCrisis(userMessage);
    
    if (crisis.isCrisis && !crisisDetected) {
      setCrisisDetected(true);
      setCrisisLevel(crisis.riskLevel as 'high' | 'extreme');
      setPriorTopic('nuestra charla anterior');

      const containmentMsg = getCrisisContainmentMessage();
      setMessages(prev => [...prev, { sender: 'agent', message: containmentMsg }]);
      
      if (crisis.riskLevel === 'extreme') {
        setCrisisPhase('containment');
        await saveCrisisState(userMessage, containmentMsg);
      } else {
        setCrisisPhase('evaluation');
      }
      setLoading(false);
      return;
    }

    // Si ya hay crisis detectada
    if (crisisDetected) {
      if (crisisPhase === 'evaluation') {
        const stillInCrisis = detectCrisis(userMessage);
        
        if (stillInCrisis.isCrisis) {
          const resourceMsg = getCrisisResourceMessage();
          setMessages(prev => [...prev, { sender: 'agent', message: resourceMsg }]);
          setCrisisPhase('containment');
          await saveCrisisState(userMessage, resourceMsg);
          setLoading(false);
          return;
        } else {
          setCrisisPhase('recovery');
          const recoveryMsg = getReturnToFlowMessage(priorTopic);
          setMessages(prev => [...prev, { sender: 'agent', message: recoveryMsg }]);
          setLoading(false);
          return;
        }
      }
      
      if (crisisPhase === 'recovery') {
        if (isPositiveResponse(userMessage)) {
          setCrisisDetected(false);
          setCrisisPhase('evaluation');
          // Continuar con flujo normal
        } else if (isNegativeResponse(userMessage)) {
          const pauseMsg = getPauseMessage();
          setMessages(prev => [...prev, { sender: 'agent', message: pauseMsg }]);
          setLoading(false);
          return;
        }
      }
    }

    // Incrementar contador de interacciones
    const newInteractionCount = interactionCount + 1;
    setInteractionCount(newInteractionCount);

    // Flujo normal de chat - el agente decidirá cuándo proponer cuestionarios via Function Calling
    const { message: agentReply, action } = await sendToAgent(userMessage);
    setMessages(prev => [...prev, { sender: 'agent', message: agentReply }]);

    // Manejar acciones del agente (cuestionario inicial, CR, RIASEC)
    if (action) {
      handleAgentAction(action);
      setLoading(false);
      return;
    }

    // Guardar conversación
    const allMessages = [...messages, { sender: 'user' as const, message: userMessage }, { sender: 'agent' as const, message: agentReply }];
    const transcript = allMessages.map(m => `${m.sender === 'user' ? 'User' : 'Agent'}: ${m.message}`).join('\n');
    await saveConversation(transcript);

    setLoading(false);
  };

  // Manejar acciones del agente (mostrar cuestionarios)
  const handleAgentAction = (action: AgentAction) => {
    if (!action) return;
    
    if (action.type === 'show_initial_questionnaire') {
      console.log('📋 Activando cuestionario inicial');
      
      setTimeout(() => {
        // Iniciar el cuestionario principal
        if (filteredQuestions.length > 0) {
          setMessages(prev => [
            ...prev, 
            { sender: 'agent', message: filteredQuestions[0].text }
          ]);
          setFlowPhase('questionnaire');
          setCurrentQuestionIndex(0);
        }
      }, 1500);
    } else if (action.type === 'show_cr_questionnaire') {
      console.log('🔄 Activando cuestionario CR:', action.motivo);
      
      // Mostrar mensaje de transición
      const introMsg = "Para entenderte mejor, me gustaría hacerte algunas preguntas breves sobre cómo te sientes con tu carrera. Son solo 7 preguntas rápidas.";
      setMessages(prev => [...prev, { sender: 'agent', message: introMsg }]);
      
      setTimeout(() => {
        setFlowPhase('cr_questionnaire');
        setCrQuestionIndex(0);
        setCrAnswers([]);
        setPuntuacionC(0);
        setPuntuacionR(0);
        
        // Mostrar primera pregunta
        const firstQ = crQuestions[0];
        setMessages(prev => [...prev, { sender: 'agent', message: firstQ.text }]);
      }, 1500);
    } else if (action.type === 'show_riasec_test') {
      console.log('🧭 Activando test RIASEC');
      
      const introMsg = "Vamos a explorar tus intereses vocacionales. Te haré 12 preguntas donde elegirás entre dos opciones. No hay respuestas correctas o incorrectas.";
      setMessages(prev => [...prev, { sender: 'agent', message: introMsg }]);
      
      setTimeout(() => {
        setFlowPhase('riasec_test');
        setRiasecQuestionIndex(0);
        setRiasecAnswers([]);
        setRiasecScores({ R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 });
        
        // Mostrar primera pregunta
        setMessages(prev => [...prev, { sender: 'agent', message: `Pregunta 1 de 12:\n\n¿Qué prefieres?` }]);
      }, 1500);
    }
  };

  // Manejar selección en cuestionario CR
  const handleCrChipSelection = async (optionText: string) => {
    const currentCrQuestion = crQuestions[crQuestionIndex];
    if (!currentCrQuestion) return;

    const selectedOption = currentCrQuestion.options?.find(opt => opt.text === optionText);
    if (!selectedOption) return;

    // Actualizar puntuaciones
    const newPuntuacionC = puntuacionC + selectedOption.scoreC;
    const newPuntuacionR = puntuacionR + selectedOption.scoreR;
    setPuntuacionC(newPuntuacionC);
    setPuntuacionR(newPuntuacionR);

    // Guardar respuesta
    const newCrAnswers = [...crAnswers, optionText];
    setCrAnswers(newCrAnswers);

    // Agregar al chat
    setMessages(prev => [
      ...prev,
      { sender: 'user', message: optionText }
    ]);

    // Avanzar a la siguiente pregunta o finalizar
    setTimeout(async () => {
      if (crQuestionIndex < crQuestions.length - 1) {
        const nextIndex = crQuestionIndex + 1;
        setCrQuestionIndex(nextIndex);
        setMessages(prev => [
          ...prev,
          { sender: 'agent', message: crQuestions[nextIndex].text }
        ]);
      } else {
        // Finalizar cuestionario CR - determinar rama
        await finalizeCrQuestionnaire(newPuntuacionC, newPuntuacionR);
      }
    }, 500);
  };

  // Finalizar cuestionario CR y determinar rama
  const finalizeCrQuestionnaire = async (finalC: number, finalR: number) => {
    console.log(`📊 CR Finalizado - C: ${finalC}, R: ${finalR}`);
    
    // Guardar resultado en backend
    try {
      await fetch(`/wp-json/gero/v1/guardar-resultado-cr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          puntuacion_c: finalC,
          puntuacion_r: finalR,
          rama: finalR >= finalC ? 'R' : 'C',
        }),
      });
    } catch (e) {
      console.error('Error guardando resultado CR:', e);
    }

    if (finalR >= finalC) {
      // RAMA R: Activar RIASEC
      const transitionMsg = "Entiendo tus dudas y está bien sentirlo así. Antes de mover nada grande, vamos a explorar tus intereses de forma sencilla.\n\nTe haré 12 preguntas simples. En cada una, elegirás cuál opción prefieres o se parece más a ti.";
      setMessages(prev => [
        ...prev,
        { sender: 'agent', message: transitionMsg }
      ]);
      
      setTimeout(() => {
        setFlowPhase('riasec_test');
        setRiasecQuestionIndex(0);
        setRiasecAnswers([]);
        setRiasecScores({ R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 });
        
        // Mostrar primera pregunta RIASEC
        const firstQ = riasecQuestions[0];
        setMessages(prev => [
          ...prev,
          { sender: 'agent', message: `Pregunta 1 de 12:\n\n¿Qué prefieres?` }
        ]);
      }, 2000);
    } else {
      // RAMA C: Continuar con chat IA
      const chatMsg = "Gracias por compartir esto conmigo. Veo que tienes algunas preguntas y dudas, pero también mucho potencial. Vamos a trabajar juntos para que te sientas más seguro/a.\n\n¿Hay algo específico que te gustaría explorar o alguna preocupación que quieras compartir?";
      setMessages(prev => [
        ...prev,
        { sender: 'agent', message: chatMsg }
      ]);
      setFlowPhase('chat');
    }
  };

  // Manejar selección en test RIASEC
  const handleRiasecSelection = (choice: 'A' | 'B') => {
    const currentRiasecQ = riasecQuestions[riasecQuestionIndex];
    if (!currentRiasecQ) return;

    const selectedOption = choice === 'A' ? currentRiasecQ.optionA : currentRiasecQ.optionB;
    const selectedLetter = selectedOption.letter;

    // Actualizar puntuaciones RIASEC
    const newScores = { ...riasecScores };
    newScores[selectedLetter] += 1;
    setRiasecScores(newScores);

    // Guardar respuesta
    const newRiasecAnswers = [...riasecAnswers, choice];
    setRiasecAnswers(newRiasecAnswers);

    // Agregar al chat
    setMessages(prev => [
      ...prev,
      { sender: 'user', message: selectedOption.text }
    ]);

    // Avanzar o finalizar
    setTimeout(async () => {
      if (riasecQuestionIndex < riasecQuestions.length - 1) {
        const nextIndex = riasecQuestionIndex + 1;
        setRiasecQuestionIndex(nextIndex);
        const nextQ = riasecQuestions[nextIndex];
        setMessages(prev => [
          ...prev,
          { sender: 'agent', message: `Pregunta ${nextIndex + 1} de 12:\n\n¿Qué prefieres?` }
        ]);
      } else {
        // Finalizar RIASEC
        await finalizeRiasecTest(newScores);
      }
    }, 500);
  };

  // Finalizar test RIASEC
  const finalizeRiasecTest = async (finalScores: typeof riasecScores) => {
    console.log('🎯 RIASEC Finalizado:', finalScores);
    
    // Calcular código RIASEC (top 3 letras)
    const sorted = Object.entries(finalScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    const codigoRiasec = sorted.map(([letter]) => letter).join('');
    
    // Guardar en backend
    try {
      await fetch(`/wp-json/gero/v1/guardar-resultado-riasec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          codigo_riasec: codigoRiasec,
          puntajes: finalScores,
          carrera_actual: carrera,
        }),
      });
    } catch (e) {
      console.error('Error guardando resultado RIASEC:', e);
    }

    // Mensaje con resultados
    const resultMsg = `¡Listo! 🎉\n\nTu código de intereses es: **${codigoRiasec}**\n\nEsto significa que tus áreas de interés principales son:\n${sorted.map(([letter, score]) => `• ${getRiasecName(letter as RiasecLetter)}: ${score} puntos`).join('\n')}\n\nAhora tengo una mejor idea de tus intereses. ¿Te gustaría explorar cómo estos se relacionan con tu carrera actual o con otras opciones?`;
    
    setMessages(prev => [
      ...prev,
      { sender: 'agent', message: resultMsg }
    ]);
    
    setFlowPhase('chat');
  };

  // Helper para nombres RIASEC
  const getRiasecName = (letter: RiasecLetter): string => {
    const names: Record<RiasecLetter, string> = {
      R: 'Realista (práctico, manual)',
      I: 'Investigativo (analítico, curioso)',
      A: 'Artístico (creativo, expresivo)',
      S: 'Social (ayudar, enseñar)',
      E: 'Emprendedor (liderar, persuadir)',
      C: 'Convencional (organizar, ordenar)',
    };
    return names[letter];
  };

  // Manejar respuesta a la transición (aceptar/rechazar cuestionario)
  const handleTransitionResponse = (accepted: boolean) => {
    if (accepted) {
      setMessages(prev => [
        ...prev, 
        { sender: 'user', message: 'Sí, adelante' },
        { sender: 'agent', message: 'Gracias por la confianza. Son preguntas sencillas, contéstalas como mejor te representen.' }
      ]);
      
      // Iniciar cuestionario después de un breve delay
      setTimeout(() => {
        if (filteredQuestions.length > 0) {
          setMessages(prev => [
            ...prev, 
            { sender: 'agent', message: filteredQuestions[0].text }
          ]);
          setFlowPhase('questionnaire');
        }
      }, 1200);
    } else {
      setMessages(prev => [
        ...prev, 
        { sender: 'user', message: 'Ahora no, gracias' },
        { sender: 'agent', message: `Está bien, sin problema. Cuando quieras retomamos. ¿Hay algo más en lo que pueda apoyarte?` }
      ]);
      setFlowPhase('chat');
      // Resetear contador para preguntar más tarde
      setInteractionCount(0);
    }
  };

  // Manejar selección de chip en cuestionario
  const handleChipSelection = (chipText: string) => {
    if (!currentQuestion) return;
    
    // Buscar la opción seleccionada para obtener los riskWeights
    const selectedOption = currentQuestion.options?.find(opt => opt.text === chipText);
    
    // Guardar respuesta
    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, {
      text: chipText,
      risk: selectedOption?.risk,
      weight: selectedOption?.weight,
      riskWeights: selectedOption?.riskWeights,
    });
    setAnswers(newAnswers);

    // Agregar al chat
    setMessages(prev => [
      ...prev, 
      { sender: 'user', message: chipText }
    ]);

    // Guardar en historial de navegación
    const newHistory = [...questionnaireHistory, currentQuestionIndex];
    setQuestionnaireHistory(newHistory);

    // Guardar interacción
    saveQuestionnaireInteraction(currentQuestion.id, chipText);

    // Avanzar a siguiente pregunta o finalizar
    setTimeout(() => {
      if (currentQuestionIndex < filteredQuestions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setMessages(prev => [
          ...prev, 
          { sender: 'agent', message: filteredQuestions[nextIndex].text }
        ]);
      } else {
        // Finalizar cuestionario
        calculateAndSaveRiskScores(newAnswers);
      }
    }, 500);
  };

  // Validar entrada del cuestionario
  const validateQuestionnaireInput = (inputText: string): { valid: boolean; error?: string } => {
    const trimmed = inputText.trim().toLowerCase();

    // Para chips-text: aceptar texto libre (mínimo 2 caracteres)
    if (currentQuestion?.type === 'chips-text') {
      if (trimmed.length >= 2) {
        return { valid: true };
      }
      return {
        valid: false,
        error: 'Por favor, escribe al menos 2 caracteres o selecciona una opción.'
      };
    }

    // Para P5: aceptar texto libre
    if (currentQuestion?.id === 'P5') {
      if (trimmed.length >= 3) {
        return { valid: true };
      }
      return {
        valid: false,
        error: 'Por favor, escribe al menos 3 caracteres.'
      };
    }

    // Para P7 (yesno): aceptar "si" o "no"
    if (currentQuestion?.id === 'P7' || currentQuestion?.type === 'yesno') {
      if (trimmed === 'si' || trimmed === 'sí' || trimmed === 'no') {
        return { valid: true };
      }
      return {
        valid: false,
        error: 'Por favor, escribe "Sí" o "No".'
      };
    }

    // Para preguntas likert: aceptar números 1-5
    if (currentQuestion?.type === 'likert') {
      if (/^[1-5]$/.test(trimmed)) {
        return { valid: true };
      }

      if (/^\d+$/.test(trimmed)) {
        return {
          valid: false,
          error: 'Por favor, ingresa un número del 1 al 5.'
        };
      }

      return {
        valid: false,
        error: 'Ingresa un número del 1 al 5.'
      };
    }

    // Default: aceptar cualquier texto con mínimo 2 caracteres
    if (trimmed.length >= 2) {
      return { valid: true };
    }

    return {
      valid: false,
      error: 'Por favor, escribe tu respuesta.'
    };
  };

  // Normalizar texto
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Detectar palabras clave
  const detectKeywords = (inputText: string, keywordDetection?: Record<string, { keywords: string[] }>) => {
    if (!keywordDetection) return null;

    const normalizedInput = normalizeText(inputText);
    
    for (const [key, config] of Object.entries(keywordDetection)) {
      for (const keyword of config.keywords) {
        if (normalizedInput.includes(normalizeText(keyword))) {
          return key;
        }
      }
    }
    
    return null;
  };

  // Manejar respuesta del cuestionario
  const handleQuestionnaireResponse = () => {
    if (!input.trim() || !currentQuestion) return;

    const userAnswer = input.trim();
    const validation = validateQuestionnaireInput(userAnswer);

    // Detectar crisis en respuestas
    const crisis = detectCrisis(userAnswer);
    
    if (crisis.isCrisis && !crisisDetected) {
      setCrisisDetected(true);
      setCrisisLevel(crisis.riskLevel as 'high' | 'extreme');

      const containmentMsg = getCrisisContainmentMessage();
      setMessages(prev => [
        ...prev, 
        { sender: 'user', message: userAnswer },
        { sender: 'agent', message: containmentMsg }
      ]);
      setInput("");

      if (crisis.riskLevel === 'extreme') {
        saveCrisisState(userAnswer, containmentMsg);
      }
      return;
    }

    if (!validation.valid) {
      setMessages(prev => [
        ...prev, 
        { sender: 'user', message: userAnswer },
        { sender: 'agent', message: validation.error || 'Error al procesar tu respuesta.' }
      ]);
      setInput("");
      
      // Repetir la pregunta
      setTimeout(() => {
        setMessages(prev => [
          ...prev, 
          { sender: 'agent', message: currentQuestion.text }
        ]);
      }, 800);
      return;
    }

    // Procesar respuesta válida
    let numericAnswer = userAnswer;
    
    if (currentQuestion.id === 'P7') {
      numericAnswer = numericAnswer.toLowerCase() === 'si' || numericAnswer.toLowerCase() === 'sí' ? 'Sí' : 'No';
    }

    // Buscar opción seleccionada y pesos de riesgo
    const selectedOption = currentQuestion.options?.find(
      opt => opt.text === numericAnswer || opt.text.startsWith(numericAnswer + ' ')
    );
    
    let p5RiskWeights: Partial<Record<RiskCategory, number>> | undefined;
    if (currentQuestion.id === 'P5' && currentQuestion.keywordDetection) {
      const detectedKey = detectKeywords(userAnswer, currentQuestion.keywordDetection);
      if (detectedKey) {
        for (const [, data] of Object.entries(currentQuestion.keywordDetection)) {
          if (data.keywords.some(keyword => userAnswer.toLowerCase().includes(keyword))) {
            p5RiskWeights = data.riskWeights;
            break;
          }
        }
      }
    }

    // Guardar respuesta
    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, {
      text: numericAnswer,
      risk: selectedOption?.risk,
      weight: selectedOption?.weight,
      riskWeights: currentQuestion.id === 'P5' 
        ? p5RiskWeights 
        : selectedOption?.riskWeights,
    });
    setAnswers(newAnswers);

    // Agregar al chat
    setMessages(prev => [
      ...prev, 
      { sender: 'user', message: userAnswer }
    ]);

    // Guardar en historial de navegación
    const newHistory = [...questionnaireHistory, currentQuestionIndex];
    setQuestionnaireHistory(newHistory);

    setInput("");

    // Guardar interacción
    saveQuestionnaireInteraction(currentQuestion.id, userAnswer);

    // Avanzar a siguiente pregunta o finalizar
    setTimeout(() => {
      if (currentQuestionIndex < filteredQuestions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setMessages(prev => [
          ...prev, 
          { sender: 'agent', message: filteredQuestions[nextIndex].text }
        ]);
      } else {
        // Finalizar cuestionario
        calculateAndSaveRiskScores(newAnswers);
      }
    }, 500);
  };

  // Guardar interacción del cuestionario
  const saveQuestionnaireInteraction = (questionId: string, answer: string) => {
    if (userId) {
      fetch('/wp-json/gero/v1/guardar-interacciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          tipo: 'respuesta_cuestionario',
          contenido: {
            pregunta_id: questionId,
            respuesta: answer,
            timestamp: new Date().toISOString()
          }
        })
      }).catch(e => console.error('Error guardando interacción:', e));
    }
  };

  // Calcular y guardar puntajes de riesgo
  const calculateAndSaveRiskScores = (allAnswers: Map<string, AnswerValue>) => {
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

    allAnswers.forEach((answer) => {
      if (answer.riskWeights && Object.keys(answer.riskWeights).length > 0) {
        Object.entries(answer.riskWeights).forEach(([category, weight]) => {
          if (category in scores) {
            scores[category as RiskCategory] += weight;
          }
        });
      } else if (answer.risk && answer.weight) {
        if (Array.isArray(answer.risk)) {
          answer.risk.forEach((riskCategory) => {
            scores[riskCategory] += answer.weight || 0;
          });
        } else {
          scores[answer.risk] += answer.weight;
        }
      }
    });

    const entries = Object.entries(scores);
    const primary = entries.reduce((max, current) => 
      current[1] > max[1] ? current : max
    )[0] as RiskCategory;

    setRiskScores(scores);
    setPrimaryRisk(primary);

    // Guardar en localStorage
    const userPrefix = userId ? `user_${userId}_` : '';
    localStorage.setItem(`${userPrefix}unitec_answers`, JSON.stringify(Array.from(allAnswers.entries())));
    localStorage.setItem(`${userPrefix}unitec_risk_scores`, JSON.stringify(scores));
    localStorage.setItem('unitec_riesgos_principales', JSON.stringify([primary]));

    // Guardar en backend
    if (userId) {
      fetch('/wp-json/gero/v1/guardar-interacciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          tipo: 'cuestionario_completado',
          contenido: {
            respuestas: Array.from(allAnswers.entries()),
            puntajes: scores
          },
          riesgo_detectado: {
            principal: primary,
            todos: scores
          }
        })
      }).catch(e => console.error('Error guardando cuestionario completado:', e));
    }

    // Mensaje de finalización - agradecer y continuar conversación
    setMessages(prev => [
      ...prev, 
      { sender: 'agent', message: `Gracias por tu sinceridad, ${userName}. Me ayuda mucho a entender cómo acompañarte mejor en UNITEC.\n\nAhora cuéntame, ¿hay algo que te preocupe o en lo que pueda apoyarte?` }
    ]);
    
    setFlowPhase('completed');
    // Actualizar riesgos en estado
    setRiesgos([primary]);
  };

  // Guardar estado de crisis
  const saveCrisisState = async (userInput: string, agentResponse: string) => {
    try {
      const conversationState = {
        isCrisis: true,
        crisisLevel,
        flowPhase,
        currentQuestion: currentQuestion?.id,
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

  // Manejar envío según la fase actual
  const handleSend = () => {
    if (flowPhase === 'chat' || flowPhase === 'completed') {
      handleChatMessage();
    } else if (flowPhase === 'questionnaire') {
      handleQuestionnaireResponse();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBack = () => {
    navigate("/consent");
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b px-3 py-2 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="h-7 px-2 sm:px-3 text-xs sm:text-sm text-primary hover:bg-primary/5 rounded transition-colors"
            >
              <ArrowLeft className="w-3 h-3 mr-1 inline" />
              <span className="hidden sm:inline">Salir</span>
            </button>
            
            <div className="text-xs text-muted-foreground">
              {userName} • {matricula}
            </div>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 w-full px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 pb-24 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Mensajes */}
          {messages.map((msg, idx) => (
            <ChatBubble
              key={idx}
              sender={msg.sender}
              message={msg.message}
            />
          ))}

          {/* Indicador de carga */}
          {loading && <TypingIndicator />}

          {/* Botones de transición (aceptar/rechazar cuestionario) */}
          {flowPhase === 'transition' && !loading && (
            <div className="flex justify-end mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="w-full space-y-2 sm:space-y-3">
                <Chip 
                  onClick={() => handleTransitionResponse(true)}
                  className="w-full justify-center text-sm sm:text-base py-2 sm:py-3 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Sí, adelante 👍
                </Chip>
                <Chip 
                  onClick={() => handleTransitionResponse(false)}
                  className="w-full justify-center text-sm sm:text-base py-2 sm:py-3 cursor-pointer"
                >
                  Ahora no, gracias
                </Chip>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Footer - Input con chips opcionales */}
      {flowPhase !== 'transition' && (
        <footer className="sticky bottom-0 bg-background border-t px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
          <div className="max-w-2xl mx-auto space-y-3">
            {/* Chips para preguntas tipo 'chips' (solo chips, sin texto) */}
            {flowPhase === 'questionnaire' && currentQuestion?.type === 'chips' && currentQuestion.options && (
              <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {currentQuestion.options.map((option, idx) => (
                  <Chip
                    key={idx}
                    onClick={() => handleChipSelection(option.text)}
                    className="w-full text-left text-xs sm:text-sm py-2 px-3 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {option.text}
                  </Chip>
                ))}
              </div>
            )}

            {/* Chips para preguntas tipo 'chips-text' (chips + opción de texto) */}
            {flowPhase === 'questionnaire' && currentQuestion?.type === 'chips-text' && currentQuestion.options && (
              <div className="flex flex-wrap gap-2 justify-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                {currentQuestion.options.map((option, idx) => (
                  <Chip
                    key={idx}
                    onClick={() => handleChipSelection(option.text)}
                    className="text-xs sm:text-sm py-1.5 px-3 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {option.text}
                  </Chip>
                ))}
              </div>
            )}

            {/* Chips para cuestionario CR */}
            {flowPhase === 'cr_questionnaire' && crQuestions[crQuestionIndex] && (
              <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-sm text-muted-foreground text-center mb-2">
                  Pregunta {crQuestionIndex + 1} de {crQuestions.length}
                </p>
                {crQuestions[crQuestionIndex].options?.map((option, idx) => (
                  <Chip
                    key={idx}
                    onClick={() => handleCrChipSelection(option.text)}
                    className="w-full text-left text-xs sm:text-sm py-2 px-3 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {option.text}
                  </Chip>
                ))}
              </div>
            )}

            {/* Opciones A/B para test RIASEC */}
            {flowPhase === 'riasec_test' && riasecQuestions[riasecQuestionIndex] && (
              <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-sm text-muted-foreground text-center mb-1">
                  Pregunta {riasecQuestionIndex + 1} de {riasecQuestions.length}
                </p>
                <button
                  onClick={() => handleRiasecSelection('A')}
                  className="w-full text-left text-sm py-3 px-4 border border-border rounded-lg hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                >
                  <span className="font-medium mr-2">A)</span>
                  {riasecQuestions[riasecQuestionIndex].optionA.text}
                </button>
                <button
                  onClick={() => handleRiasecSelection('B')}
                  className="w-full text-left text-sm py-3 px-4 border border-border rounded-lg hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                >
                  <span className="font-medium mr-2">B)</span>
                  {riasecQuestions[riasecQuestionIndex].optionB.text}
                </button>
              </div>
            )}
            
            {/* Input de texto - NO mostrar para tipo 'chips' puro ni para CR/RIASEC */}
            {!(flowPhase === 'questionnaire' && currentQuestion?.type === 'chips') && 
             flowPhase !== 'cr_questionnaire' && 
             flowPhase !== 'riasec_test' && (
              <div className="flex gap-2 sm:gap-3 items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    flowPhase === 'questionnaire' 
                      ? currentQuestion?.type === 'likert' 
                        ? "Escribe un número del 1 al 5..." 
                        : currentQuestion?.type === 'chips-text'
                          ? "O escribe con tus propias palabras..."
                          : "Escribe tu respuesta..."
                      : "Escribe tu mensaje..."
                  }
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 sm:py-3 border border-border rounded-full bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm sm:text-base disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="flex-shrink-0 p-2 sm:px-4 sm:py-2.5 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
