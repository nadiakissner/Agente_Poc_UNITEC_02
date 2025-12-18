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
  const [userName] = useState(localStorage.getItem("udla_user_name") || "");

  const showTyping = (duration: number) => {
    setTyping(true);
    setTimeout(() => setTyping(false), duration);
  };

  useEffect(() => {
    showTyping(1000);
    setTimeout(() => setStep(1), 1200);
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
    <div className="min-h-screen bg-background">
      <Header subtitle="Conexión social" />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {step >= 1 && (
          <ChatBubble 
            sender="agent"
            message={`A muchos al inicio les cuesta conectar, ${userName}. Damos un primer paso amable.

¿Qué te ayudaría más?`}
          />
        )}

        {step >= 2 && (
          <>
            <div className="space-y-3 mb-6">
              <Chip onClick={handleKit} className="w-full justify-center text-left">
                <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                Encontrar gente afín
              </Chip>
              <Chip onClick={handleMentorship} className="w-full justify-center text-left">
                <UserPlus className="w-4 h-4 mr-2 flex-shrink-0" />
                Que me acompañen (mentoría)
              </Chip>
              <Chip onClick={handleKit} className="w-full justify-center text-left">
                <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0" />
                Romper el hielo con profes
              </Chip>
              <Chip onClick={() => setStep(2)} className="w-full justify-center">
                No estoy seguro/a
              </Chip>
            </div>
          </>
        )}

        {step >= 3 && (
          <>
            <ChatBubble 
              sender="agent"
              message="Perfecto. Te daremos seguimiento en 24-72 horas para ver cómo te fue.

¿Algo más en lo que pueda ayudarte?"
            />
            <div className="mt-6">
              <Button onClick={() => navigate("/summary")} variant="outline" className="w-full">
                Ver otros temas
              </Button>
            </div>
          </>
        )}

        {typing && <TypingIndicator />}

        {step === 1 && !typing && (
          <div className="animate-in fade-in duration-500 delay-300">
            <Button onClick={() => setStep(2)} className="w-full" size="lg">
              Ver opciones
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
