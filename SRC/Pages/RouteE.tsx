// Route E: Barreras tecnológicas
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/Components/Header";
import { ChatBubble } from "@/Components/Chat/ChatBubble";
import { TypingIndicator } from "@/Components/Chat/TypingIndicator";
import { Chip } from "@/Components/Ui/chip";
import { ResourceCard } from "@/Components/Chat/ResourceCard";
import { Button } from "@/Components/Ui/button";
import { Laptop, Video, HelpCircle, Calendar } from "lucide-react";
import { useToast } from "@/Hooks/use-toast";

export default function RouteE() {
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
      description: `${type} disponible.`,
    });
    setTimeout(() => setStep(4), 1000);
  };

  const handleSchedule = () => {
    toast({
      title: "¡Agendado!",
      description: "Sesión de capacitación confirmada.",
    });
    setTimeout(() => setStep(4), 1000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header  />

      <main className="flex-1 w-full px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
          {step >= 1 && (
            <ChatBubble 
              sender="agent"
              message={`Hola, ${userName}. Si la tecnología te está complicando, lo vemos juntos. ¿Te ayudo?`}
            />
          )}

          {step >= 2 && (
            <div className="space-y-2 sm:space-y-2.5 md:space-y-3 mb-4 sm:mb-6 animate-in fade-in duration-500">
              <Chip 
                onClick={() => setStep(3)} 
                className="w-full justify-start px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base min-h-10 sm:min-h-11 md:min-h-12"
              >
                Problemas de conectividad
              </Chip>
              <Chip 
                onClick={() => setStep(3)} 
                className="w-full justify-start px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base min-h-10 sm:min-h-11 md:min-h-12"
              >
                No sé usar las plataformas
              </Chip>
              <Chip 
                onClick={() => setStep(3)} 
                className="w-full justify-start px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base min-h-10 sm:min-h-11 md:min-h-12"
              >
                No tengo dispositivos
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
                message="Entiendo. Te muestro los recursos que tenemos:"
              />
              <div className="space-y-3 sm:space-y-4">
                <ResourceCard 
                  title="Guía rápida de plataformas UNITEC"
                  description="PDF con pasos básicos para Canvas, Zoom y correo."
                  ctaText="Descargar guía"
                  onAction={() => handleResource("Guía de plataformas")}
                  icon={<Laptop className="w-5 h-5" />}
                />
                <ResourceCard 
                  title="Video: primeros pasos en Canvas"
                  description="Tutorial de 5 minutos para comenzar."
                  ctaText="Ver video"
                  onAction={() => handleResource("Video Canvas")}
                  icon={<Video className="w-5 h-5" />}
                />
                <ResourceCard 
                  title="Soporte técnico UNITEC"
                  description="Contacto directo para problemas técnicos."
                  ctaText="Contactar soporte"
                  onAction={() => handleResource("Soporte técnico")}
                  icon={<HelpCircle className="w-5 h-5" />}
                />
              </div>

              <div className="mt-2 sm:mt-4 md:mt-6 pt-3 sm:pt-4 md:pt-6 border-t">
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground text-center mb-3 sm:mb-4">
                  ¿Prefieres una sesión de capacitación?
                </p>
                <Button 
                  onClick={handleSchedule} 
                  variant="outline" 
                  className="w-full h-auto py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base min-h-10 sm:min-h-11 md:min-h-12"
                >
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" />
                  <span>Sesión de capacitación (30')</span>
                </Button>
              </div>
            </div>
          )}

          {step >= 4 && (
            <div className="animate-in fade-in duration-500 space-y-4 sm:space-y-6">
              <ChatBubble 
                sender="agent"
                message="Te daremos seguimiento en 24 horas para ver cómo te fue.

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
                Sí, ayúdame
              </Chip>
              <Chip 
                onClick={() => {
                  toast({ description: "Te recordaremos mañana." });
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
