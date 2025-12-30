// Route D: Organización del tiempo
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/Components/Header";
import { ChatBubble } from "@/Components/Chat/ChatBubble";
import { TypingIndicator } from "@/Components/Chat/TypingIndicator";
import { Chip } from "@/Components/Ui/chip";
import { ResourceCard } from "@/Components/Chat/ResourceCard";
import { Button } from "@/Components/Ui/button";
import { Clock, Calendar, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RouteD() {
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

  const handleResource = (type: string) => {
    toast({
      title: "Recurso abierto",
      description: `${type} disponible para ti.`,
    });
    setTimeout(() => setStep(4), 1000);
  };

  const handleSchedule = () => {
    toast({
      title: "¡Agendado!",
      description: "Tutoría de organización confirmada.",
    });
    setTimeout(() => setStep(4), 1000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 w-full px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
          {step >= 1 && (
            <ChatBubble 
              sender="agent"
              message={`Hola, ${userName}. Al inicio es común desordenarse un poco. ¿Te ayudo a ponerlo en orden?`}
            />
          )}

          {step >= 2 && (
            <div className="space-y-2 sm:space-y-2.5 md:space-y-3 mb-4 sm:mb-6 animate-in fade-in duration-500">
              <Chip 
                onClick={() => setStep(3)} 
                className="w-full justify-center px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base min-h-10 sm:min-h-11 md:min-h-12"
              >
                La cantidad de tareas
              </Chip>
              <Chip 
                onClick={() => setStep(3)} 
                className="w-full justify-center px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base min-h-10 sm:min-h-11 md:min-h-12"
              >
                Dificultad para concentrarme
              </Chip>
              <Chip 
                onClick={() => setStep(3)} 
                className="w-full justify-center px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base min-h-10 sm:min-h-11 md:min-h-12"
              >
                Falta de tiempo libre
              </Chip>
              <Chip 
                onClick={() => setStep(3)} 
                className="w-full justify-center px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base min-h-10 sm:min-h-11 md:min-h-12"
              >
                No estoy seguro/a
              </Chip>
            </div>
          )}

          {step >= 3 && (
            <div className="animate-in slide-in-from-bottom duration-300 space-y-3 sm:space-y-4 md:space-y-6">
              <ChatBubble 
                sender="agent"
                message="Entiendo. Te muestro herramientas simples que te pueden ayudar:"
              />
              <div className="space-y-3 sm:space-y-4">
                <ResourceCard 
                  title="Plan semanal simple (3 pasos)"
                  description="Ejercicio de 10 minutos para ordenar tu semana."
                  ctaText="Abrir plan"
                  onAction={() => handleResource("Plan semanal")}
                  icon={<FileText className="w-5 h-5" />}
                />
                <ResourceCard 
                  title="Técnica Pomodoro (20+10)"
                  description="Método de concentración en bloques cortos."
                  ctaText="Ver técnica"
                  onAction={() => handleResource("Técnica Pomodoro")}
                  icon={<Clock className="w-5 h-5" />}
                />
              </div>

              <div className="mt-2 sm:mt-4 md:mt-6 pt-3 sm:pt-4 md:pt-6 border-t">
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground text-center mb-3 sm:mb-4">
                  ¿Prefieres una sesión guiada?
                </p>
                <Button 
                  onClick={handleSchedule} 
                  variant="outline" 
                  className="w-full h-auto py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base min-h-10 sm:min-h-11 md:min-h-12"
                >
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" />
                  <span>Tutoría de organización (20')</span>
                </Button>
              </div>
            </div>
          )}

          {step >= 4 && (
            <div className="animate-in fade-in duration-500 space-y-4 sm:space-y-6">
              <ChatBubble 
                sender="agent"
                message="Te daremos seguimiento en 48 horas para ver cómo avanzaste.

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
            <div className="animate-in fade-in duration-500 delay-300 space-y-2 sm:space-y-2.5 md:space-y-3">
              <Chip 
                onClick={() => setStep(2)} 
                className="w-full justify-center px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base min-h-10 sm:min-h-11 md:min-h-12"
              >
                Sí, por favor
              </Chip>
              <Chip 
                onClick={() => {
                  toast({ description: "Te recordaremos en 3 días." });
                  setTimeout(() => navigate("/summary"), 1000);
                }} 
                className="w-full justify-center px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base min-h-10 sm:min-h-11 md:min-h-12"
              >
                No ahora
              </Chip>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
