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
    <div className="min-h-screen bg-background">
      <Header subtitle="Organización del tiempo" />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {step >= 1 && (
          <ChatBubble 
            sender="agent"
            message={`Hola, ${userName}. Al inicio es común desordenarse un poco. ¿Te ayudo a ponerlo en orden?`}
          />
        )}

        {step >= 2 && (
          <div className="space-y-3 mb-6">
            <Chip onClick={() => setStep(3)} className="w-full justify-center">
              La cantidad de tareas
            </Chip>
            <Chip onClick={() => setStep(3)} className="w-full justify-center">
              Dificultad para concentrarme
            </Chip>
            <Chip onClick={() => setStep(3)} className="w-full justify-center">
              Falta de tiempo libre
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
              message="Entiendo. Te muestro herramientas simples que te pueden ayudar:"
            />
            <div className="mt-4 space-y-4">
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

            <div className="mt-6">
              <p className="text-sm text-muted-foreground text-center mb-3">
                ¿Prefieres una sesión guiada?
              </p>
              <Button onClick={handleSchedule} variant="outline" className="w-full">
                <Calendar className="w-4 h-4 mr-2" />
                Tutoría de organización (20')
              </Button>
            </div>
          </>
        )}

        {step >= 4 && (
          <>
            <ChatBubble 
              sender="agent"
              message="Te daremos seguimiento en 48 horas para ver cómo avanzaste.

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
                Sí, por favor
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
