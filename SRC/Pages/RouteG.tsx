// Route G: Malestar emocional / estrés
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/Components/Header";
import { ChatBubble } from "@/Components/Chat/ChatBubble";
import { TypingIndicator } from "@/Components/Chat/TypingIndicator";
import { Chip } from "@/Components/Ui/chip";
import { ResourceCard } from "@/Components/Chat/ResourceCard";
import { Button } from "@/Components/Ui/button";
import { Heart, Phone, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/Hooks/use-toast";
import { Alert, AlertDescription } from "@/Components/Ui/alert";

export default function RouteG() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  const [severity, setSeverity] = useState<"verde" | "amarillo" | "rojo" | null>(null);
  const [userName] = useState(localStorage.getItem("udla_user_name") || "");

  const showTyping = (duration: number) => {
    setTyping(true);
    setTimeout(() => setTyping(false), duration);
  };

  useEffect(() => {
    showTyping(1000);
    setTimeout(() => setStep(1), 1200);
  }, []);

  const handleSeverity = (level: "verde" | "amarillo" | "rojo") => {
    setSeverity(level);
    setStep(3);
  };

  const handleResource = (type: string) => {
    toast({
      title: "Recurso abierto",
      description: `${type} disponible.`,
    });
    setTimeout(() => setStep(4), 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header subtitle="Bienestar emocional" />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {step >= 1 && (
          <ChatBubble 
            sender="agent"
            message={`Hola, ${userName}. Gracias por responder. A veces el ánimo pesa más de lo que contamos. ¿Te parece si vemos algo que te ayude hoy?`}
          />
        )}

        {step >= 2 && !severity && (
          <>
            <ChatBubble 
              sender="agent"
              message="¿Cómo describirías lo que sientes ahora?"
            />
            <div className="space-y-3 mb-6 mt-4">
              <Chip 
                onClick={() => handleSeverity("verde")} 
                className="w-full justify-center text-left bg-green-50 hover:bg-green-100 border-green-200"
              >
                🟢 Verde: Solo algo de nervios
              </Chip>
              <Chip 
                onClick={() => handleSeverity("amarillo")} 
                className="w-full justify-center text-left bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
              >
                🟡 Amarillo: Ansiedad, pero puedo trabajarlo
              </Chip>
              <Chip 
                onClick={() => handleSeverity("rojo")} 
                className="w-full justify-center text-left bg-red-50 hover:bg-red-100 border-red-200"
              >
                🔴 Rojo: Me está desbordando, necesito ayuda
              </Chip>
            </div>
          </>
        )}

        {step >= 3 && severity === "verde" && (
          <>
            <ChatBubble 
              sender="agent"
              message="Está bien sentir nervios al inicio. Te comparto herramientas que pueden ayudarte:"
            />
            <div className="mt-4 space-y-4">
              <ResourceCard 
                title="Kit de respiración y pausas activas"
                description="Ejercicios simples para regular el estrés."
                ctaText="Abrir kit"
                onAction={() => handleResource("Kit de respiración")}
                icon={<Heart className="w-5 h-5" />}
              />
              <ResourceCard 
                title="Ejercicios de regulación emocional"
                description="Técnicas para gestionar la ansiedad."
                ctaText="Ver ejercicios"
                onAction={() => handleResource("Ejercicios emocionales")}
                icon={<FileText className="w-5 h-5" />}
              />
            </div>
          </>
        )}

        {step >= 3 && severity === "amarillo" && (
          <>
            <ChatBubble 
              sender="agent"
              message="Te entiendo. Es importante que puedas conversar esto con alguien preparado. Te conecto con Bienestar Estudiantil:"
            />
            <div className="mt-4 space-y-4">
              <Alert>
                <Heart className="h-4 w-4" />
                <AlertDescription>
                  <strong>Bienestar Estudiantil UDLA</strong>
                  <br />
                  Apoyo psicológico profesional para estudiantes.
                  <br />
                  <a 
                    href="https://siae.udla.cl/servicio-al-estudiante/bienestar-estudiantil/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary underline mt-2 inline-block"
                  >
                    Agendar atención →
                  </a>
                </AlertDescription>
              </Alert>
              <ResourceCard 
                title="Ejercicios de regulación emocional"
                description="Mientras tanto, estas técnicas pueden ayudarte."
                ctaText="Ver ejercicios"
                onAction={() => handleResource("Ejercicios emocionales")}
                icon={<FileText className="w-5 h-5" />}
              />
            </div>
          </>
        )}

        {step >= 3 && severity === "rojo" && (
          <>
            <ChatBubble 
              sender="agent"
              message="Gracias por contármelo. Es muy importante que recibas apoyo profesional ahora. Te conectamos directamente:"
            />
            <div className="mt-4 space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  <strong className="text-red-900">Apoyo psicológico inmediato</strong>
                  <br />
                  <span className="text-red-800">
                    Por favor, contacta a Bienestar Estudiantil UDLA lo antes posible.
                  </span>
                  <br />
                  <a 
                    href="https://siae.udla.cl/servicio-al-estudiante/bienestar-estudiantil/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-red-600 underline font-medium mt-2 inline-block"
                  >
                    Acceder a Bienestar Estudiantil →
                  </a>
                </AlertDescription>
              </Alert>
              
              <Alert>
                <Phone className="h-4 w-4" />
                <AlertDescription>
                  <strong>Contacto directo UDLA</strong>
                  <br />
                  WhatsApp: <a href="https://wa.me/56934527028" className="text-primary font-mono">+56 9 3452 7028</a>
                  <br />
                  <span className="text-sm text-muted-foreground">Disponible para apoyo urgente</span>
                </AlertDescription>
              </Alert>
            </div>
          </>
        )}

        {step >= 4 && (
          <>
            <ChatBubble 
              sender="agent"
              message={`Te daremos seguimiento en 24 horas para ver cómo estás.

¿Algo más en lo que pueda ayudarte ahora?`}
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
                toast({ 
                  title: "Te cuidamos",
                  description: "Te recordaremos mañana. Si necesitas ayuda urgente, contacta a Bienestar Estudiantil." 
                });
                setTimeout(() => navigate("/summary"), 1500);
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
