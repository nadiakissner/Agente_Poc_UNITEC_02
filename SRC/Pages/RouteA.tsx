// Route A: Desorientación / Bajo propósito
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/Components/Header";
import { ChatBubble } from "@/Components/Chat/ChatBubble";
import { TypingIndicator } from "@/Components/Chat/TypingIndicator";
import { Chip } from "@/Components/Ui/chip";
import { ResourceCard } from "@/Components/Chat/ResourceCard";
import { Button } from "@/Components/Ui/button";
import { Lightbulb, Calendar, Search } from "lucide-react";
import { useToast } from "@/Hooks/use-toast";

export default function RouteA() {
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
      title: "¡Kit descargado!",
      description: "Te hemos enviado el kit para ordenar ideas a tu correo.",
    });
    setTimeout(() => setStep(4), 1000);
  };

  const handleSchedule = () => {
    toast({
      title: "¡Listo!",
      description: "Sesión de orientación agendada. Te llegará confirmación.",
    });
    setTimeout(() => setStep(4), 1000);
  };

  const handleExplore = () => {
    toast({
      title: "Explorador abierto",
      description: "Puedes ver todos los programas disponibles.",
    });
    setTimeout(() => setStep(4), 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header subtitle="Acompañamiento" />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {step >= 1 && (
          <ChatBubble 
            sender="agent"
            message={`Gracias por seguir, ${userName}. Lo que sientes es común al inicio y tiene solución. 

¿Damos un paso corto ahora?`}
          />
        )}

        {step >= 2 && (
          <div className="space-y-3 mb-6">
            <Chip onClick={() => setStep(3)} className="w-full justify-center">
              <Lightbulb className="w-4 h-4 mr-2" />
              Paso corto
            </Chip>
            <Chip onClick={handleSchedule} className="w-full justify-center">
              <Calendar className="w-4 h-4 mr-2" />
              Platicarlo
            </Chip>
            <Chip onClick={handleExplore} className="w-full justify-center">
              <Search className="w-4 h-4 mr-2" />
              Ver opciones UDLA
            </Chip>
          </div>
        )}

        {step >= 3 && (
          <>
            <ResourceCard 
              title="Kit para ordenar ideas"
              description="Ejercicio breve (10-15 min) que te ayuda a clarificar tus motivaciones y próximos pasos."
              ctaText="Abrir kit"
              onAction={handleKit}
              icon={<Lightbulb className="w-5 h-5" />}
            />
          </>
        )}

        {step >= 4 && (
          <>
            <ChatBubble 
              sender="agent"
              message="Perfecto. Te escribiremos en 72 horas para ver cómo vas y si necesitas algo más. 

¿Hay algo más en lo que pueda ayudarte ahora?"
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
            <div className="space-y-3">
              <Chip onClick={() => setStep(2)} className="w-full justify-center">
                Sí, veamos
              </Chip>
              <Chip onClick={() => {
                toast({ description: "Te recordaremos en 3 días." });
                setTimeout(() => navigate("/summary"), 1000);
              }} className="w-full justify-center">
                No ahora
              </Chip>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
