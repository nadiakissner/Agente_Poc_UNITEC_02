import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { validateStorageIntegrity, getCurrentUserId } from "@/Lib/storageManager";
import { analyzeRisks } from "@/Lib/riskAnalyzer";
import { RiskCategory } from "@/Data/questionnaire";
import { TypingIndicator } from "@/Components/Chat/TypingIndicator";
import { ChatBubble } from "@/Components/Chat/ChatBubble";

interface ChatMessage {
  sender: "user" | "agent";
  message: string;
}

// Mapeo de diagnósticos a rutas
const RISK_TO_ROUTE: Record<string, string> = {
  desorientacion: "/route-a",
  economica: "/route-b",
  emocional: "/route-c",
  baja_preparacion: "/route-d",
  social: "/route-e",
  organizacion: "/route-f",
  tecnologica: "/route-g",
  entorno: "/agent", // Default si no hay coincidencia 
};

export default function Summary() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  useEffect(() => {
    // Validar que no hay datos de usuarios anteriores al entrar a Summary
    validateStorageIntegrity();
    const currentUserId = getCurrentUserId();
    console.log(`✅ Summary inicializado para usuario: ${currentUserId}`);

    const userId = localStorage.getItem("unitec_user_id");
    const userPrefix = userId ? `user_${userId}_` : '';
    
    const answersData = localStorage.getItem(`${userPrefix}unitec_answers`);
    const matricula = localStorage.getItem("unitec_matricula");
    const routeAChatHistory = localStorage.getItem(`${userPrefix}routeA_conversationHistory`);

    // Cargar historial del chat anterior
    if (routeAChatHistory) {
      try {
        setChatHistory(JSON.parse(routeAChatHistory));
      } catch (error) {
        console.error("Error parsing chat history:", error);
      }
    }

    if (!answersData || !matricula || !userId) {
      navigate("/home");
      return;
    }

    // Procesar automáticamente sin mostrar diagnóstico
    const processAnswers = async () => {
      try {
        const answersArray = JSON.parse(answersData) as [string, { text: string; risk?: string; weight?: number }][];
        
        // Normalizar respuestas
        const normalized: Array<[string, { risk?: RiskCategory; weight?: number }]> = answersArray.map(([k, v]) => [k, { risk: v.risk as RiskCategory | undefined, weight: v.weight }]);
        const answersMap = new Map<string, { risk?: RiskCategory; weight?: number }>(normalized);
        const result = analyzeRisks(answersMap);
        
        // Construir objeto de respuestas en formato esperado por backend
        const respuestasFormato: Record<string, string> = {};
        answersArray.forEach(([preguntaId, respuesta]) => {
          respuestasFormato[preguntaId] = respuesta.text || '';
        });

        // 1. Enviar respuestas al backend para procesamiento
        await fetch(
          `/wp-json/gero/v1/procesar-respuestas-cuestionario-02`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: parseInt(userId),
              matricula: matricula,
              respuestas: respuestasFormato,
            }),
          }
        );

        // Guardar datos en localStorage para el agente
        const riesgosArray = [result.primary, ...result.secondary];
        localStorage.setItem("unitec_riesgos_principales", JSON.stringify(riesgosArray));
        
        // 2. Guardar riesgos en la BD
        await fetch(
          `/wp-json/gero/v1/guardar-riesgos-agente-02`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: parseInt(userId),
              riesgos: riesgosArray,
            }),
          }
        );

        // Determinar la ruta según el diagnóstico principal
        const targetRoute = RISK_TO_ROUTE[result.primary] || "/agent";

        // Redirigir a la ruta correspondiente
        setIsProcessing(false);
        setTimeout(() => {
          navigate(targetRoute);
        }, 1000);
      } catch (error) {
        console.error("Error procesando respuestas:", error);
        setIsProcessing(false);
        navigate("/agent");
      }
    };

    processAnswers();
  }, [navigate]);

  // Mostrar chat continuo con el mensaje de procesamiento al final
  return (
    <div className="min-h-screen bg-background flex flex-col p-4">
      <div className="max-w-2xl w-full mx-auto flex flex-col flex-1">
        {/* Mostrar historial de chat previo */}
        <div className="space-y-4 mb-6 flex-1 overflow-y-auto">
          {chatHistory.map((msg, idx) => (
            <ChatBubble
              key={idx}
              sender={msg.sender}
              message={msg.message}
            />
          ))}
        </div>

        {/* Mensaje de procesamiento continuando el chat */}
        {isProcessing && (
          <div className="space-y-4 mt-auto">
            <ChatBubble 
              sender="agent"
              message="Perfecto. Estoy procesando tu información para ofrecerte el acompañamiento más adecuado..."
            />
            <div className="flex justify-start pl-2">
              <TypingIndicator />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
