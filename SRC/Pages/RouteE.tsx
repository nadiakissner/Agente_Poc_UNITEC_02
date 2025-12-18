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
  const [userName] = useState(localStorage.getItem("udla_user_name") || "");

  const showTyping = (duration: number) => {
    setTyping(true);
    setTimeout(() => setTyping(false), duration);
  };

  useEffect(() => {
    showTyping(1000);
    setTimeout(() => setStep(1), 1200);
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
    <div className="min-h-screen bg-background">
      <Header subtitle="Apoyo tecnológico" />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {step >= 1 && (
          <ChatBubble 
            sender="agent"
            message={`Hola, ${userName}. Si la tecnología te está complicando, lo vemos juntos. ¿Te ayudo?`}
          />
        )}

        {step >= 2 && (
          <div className="space-y-3 mb-6">
            <Chip onClick={() => setStep(3)} className="w-full justify-center text-left">
              Problemas de conectividad
            </Chip>
            <Chip onClick={() => setStep(3)} className="w-full justify-center text-left">
              No sé usar las plataformas
            </Chip>
            <Chip onClick={() => setStep(3)} className="w-full justify-center text-left">
              No tengo los dispositivos necesarios
            </Chip>
            <Chip onClick={() => setStep(3)} className="w-full justify-center">
              No estoy seguro/a
            </Chip>
          </div>
        )}

        {step >= 3 && (
          <>
            <ChatBubble 
              sender="agent"
              message="Entiendo. Te muestro los recursos que tenemos:"
            />
            <div className="mt-4 space-y-4">
              <ResourceCard 
                title="Guía rápida de plataformas UDLA"
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
                title="Soporte técnico UDLA"
                description="Contacto directo para problemas técnicos."
                ctaText="Contactar soporte"
                onAction={() => handleResource("Soporte técnico")}
                icon={<HelpCircle className="w-5 h-5" />}
              />
            </div>

            <div className="mt-6">
              <p className="text-sm text-muted-foreground text-center mb-3">
                ¿Prefieres una sesión de capacitación?
              </p>
              <Button onClick={handleSchedule} variant="outline" className="w-full">
                <Calendar className="w-4 h-4 mr-2" />
                Sesión de capacitación (30')
              </Button>
            </div>
          </>
        )}

        {step >= 4 && (
          <>
            <ChatBubble 
              sender="agent"
              message="Te daremos seguimiento en 24 horas para ver cómo te fue.

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
            <div className="space-y-3">
              <Chip onClick={() => setStep(2)} className="w-full justify-center">
                Sí, ayúdame
              </Chip>
              <Chip onClick={() => {
                toast({ description: "Te recordaremos mañana." });
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
