import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/Components/Ui/button";
import { ChatBubble } from "@/Components/Chat/ChatBubble";
import { Chip } from "@/Components/Ui/chip";
import { Clock, Zap, Calendar } from "lucide-react";
import { Header } from "@/Components/Header";

export default function Home() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem("udla_user_name") || "estudiante";
    setUserName(name);
    
    const timer = setTimeout(() => {
      setShowOptions(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header subtitle="Agente de acompañamiento" />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 pb-24">
        <ChatBubble 
          sender="agent"
          message={`Hola, ${userName}. Estoy aquí para acompañarte en este inicio universitario. 

Es completamente normal sentir dudas o incertidumbre al comenzar. Muchos estudiantes pasan por esto, y hay recursos y personas listas para apoyarte.

¿Comenzamos?`}
        />

        {showOptions && (
          <div className="space-y-3 mt-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <Chip 
              onClick={() => navigate("/questionnaire")}
              className="w-full justify-center"
            >
              <Zap className="w-4 h-4 mr-2" />
              Comenzar ahora
            </Chip>
            
            <Chip 
              onClick={() => navigate("/questionnaire")}
              className="w-full justify-center"
            >
              <Clock className="w-4 h-4 mr-2" />
              Tengo prisa (2 min)
            </Chip>
            
            <Chip 
              onClick={() => {
                localStorage.setItem("udla_reminder", "tomorrow");
                alert("Perfecto. Te recordaremos mañana 😊");
              }}
              className="w-full justify-center"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Después
            </Chip>
          </div>
        )}
      </main>
    </div>
  );
}
