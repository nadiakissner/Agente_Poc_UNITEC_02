// Route C: Desconexión social
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/Components/Header";
import { ChatBubble } from "@/Components/Chat/ChatBubble";
import { TypingIndicator } from "@/components/Chat/TypingIndicator";
import { Chip } from "@/Components/Ui/chip";
import { ResourceCard } from "@/Components/Chat/ResourceCard";
import { Button } from "@/Components/Ui/button";
import { Users, MessageSquare, UserPlus } from "lucide-react";
import { useToast } from "@/Hooks/use-toast";

export default function RouteC() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  const [userName] = useState(localStorage.getItem("unitec_nombre") || "");

  const showTyping = (duration: number) => {
    setTyping(true);
    setTimeout(() => setTyping(false), duration);
  };

  useEffect(() => {
    showTyping(400);
    setTimeout(() => setStep(1), 400);
  }, []);

  const handleKit = () => {
    toast({
      title: "Kit recibido",
      description: "Te hemos enviado ideas para dar el primer paso social.",
    });
    setTimeout(() => setStep(3), 1000);
  };

  const handleMentorship = () => {
    toast({
      title: "¡Inscrito!",
      description: "Te emparejaremos con un mentor en las próximas 48h.",
    });
    setTimeout(() => setStep(3), 1000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 w-full px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 pb-6">
        <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
          {step >= 1 && (
            <ChatBubble 
              sender="agent"
              message={`A muchos al inicio les cuesta conectar, ${userName}. Damos un primer paso amable.

¿Qué te ayudaría más?`}
            />
          )}

          {step >= 2 && (
            <div className="space-y-2 sm:space-y-2.5 md:space-y-3 mb-4 sm:mb-6 animate-in fade-in duration-500">
              <Chip 
                onClick={handleKit} 
                className="w-full justify-start px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base min-h-10 sm:min-h-11 md:min-h-12"
              >
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" />
                <span>Encontrar gente afín</span>
              </Chip>
              <Chip 
                onClick={handleMentorship} 
                className="w-full justify-start px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base min-h-10 sm:min-h-11 md:min-h-12"
              >
                <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" />
                <span>Mentoría personalizada</span>
              </Chip>
              <Chip 
                onClick={handleKit} 
                className="w-full justify-start px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base min-h-10 sm:min-h-11 md:min-h-12"
              >
                <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" />
                <span>Conectar con profes</span>
              </Chip>
              <Chip 
                onClick={() => setStep(2)} 
                className="w-full justify-center px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base min-h-10 sm:min-h-11 md:min-h-12"
              >
                No estoy seguro/a
              </Chip>
            </div>
          )}

          {step >= 3 && (
            <div className="animate-in fade-in duration-500 space-y-4 sm:space-y-6">
              <ChatBubble 
                sender="agent"
                message="Perfecto. Te daremos seguimiento en 24-72 horas para ver cómo te fue.

¿Algo más en lo que pueda ayudarte?"
              />
              <Button 
                onClick={() => navigate("/summary")} 
                variant="outline" 
                className="w-full h-auto py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base min-h-10 sm:min-h-11 md:min-h-12"
              >
                Ver otros temas
              </Button>
            </div>
          )}

          {typing && <TypingIndicator />}

          {step === 1 && !typing && (
            <Button 
              onClick={() => setStep(2)} 
              className="w-full h-auto py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base min-h-10 sm:min-h-11 md:min-h-12 animate-in fade-in duration-500 delay-300"
              size="lg"
            >
              Ver opciones
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
