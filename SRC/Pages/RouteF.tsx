// Route F: Baja preparación académica
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/Components/Header";
import { ChatBubble } from "@/Components/Chat/ChatBubble";
import { TypingIndicator } from "@/Components/Chat/TypingIndicator";
import { Chip } from "@/components/Ui/chip";
import { ResourceCard } from "@/Components/Chat/ResourceCard";
import { Button } from "@/Components/Ui/button";
import { GraduationCap, BookOpen, FileText, Calendar } from "lucide-react";
import { useToast } from "@/Hooks/use-toast";

export default function RouteF() {
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
      description: "Sesión con tutor confirmada.",
    });
    setTimeout(() => setStep(4), 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header subtitle="Nivelación académica" />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {step >= 1 && (
          <ChatBubble 
            sender="agent"
            message={`Gracias por estar aquí, ${userName}. Por lo que nos cuentas, puede que llegues con bases disparejas. Es normal al empezar y sí tiene solución. ¿Te parece si hoy damos un paso pequeño para que arranques con más confianza?`}
          />
        )}

        {step >= 2 && (
          <div className="space-y-3 mb-6">
            <Chip onClick={() => setStep(3)} className="w-full justify-center text-left">
              Matemáticas o ciencias exactas
            </Chip>
            <Chip onClick={() => setStep(3)} className="w-full justify-center text-left">
              Lectura y escritura
            </Chip>
            <Chip onClick={() => setStep(3)} className="w-full justify-center">
              Técnicas de estudio
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
              message="Entiendo. Te muestro los apoyos que tenemos para nivelarte:"
            />
            <div className="mt-4 space-y-4">
              <ResourceCard 
                title="Nivelación asistida SIAE"
                description="Programa de apoyo académico personalizado."
                ctaText="Conocer SIAE"
                onAction={() => handleResource("SIAE")}
                icon={<GraduationCap className="w-5 h-5" />}
              />
              <ResourceCard 
                title="Tutorías de refuerzo"
                description="Sesiones grupales por materia."
                ctaText="Ver horarios"
                onAction={() => handleResource("Tutorías")}
                icon={<BookOpen className="w-5 h-5" />}
              />
              <ResourceCard 
                title="Técnicas de estudio efectivas"
                description="Guía descargable con métodos probados."
                ctaText="Descargar guía"
                onAction={() => handleResource("Técnicas de estudio")}
                icon={<FileText className="w-5 h-5" />}
              />
            </div>

            <div className="mt-6">
              <p className="text-sm text-muted-foreground text-center mb-3">
                ¿Prefieres hablar con un tutor?
              </p>
              <Button onClick={handleSchedule} variant="outline" className="w-full">
                <Calendar className="w-4 h-4 mr-2" />
                Sesión con tutor (30')
              </Button>
            </div>
          </>
        )}

        {step >= 4 && (
          <>
            <ChatBubble 
              sender="agent"
              message="Te daremos seguimiento en 72 horas para ver cómo vas.

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
