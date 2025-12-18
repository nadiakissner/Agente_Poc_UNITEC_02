// Route B: Preocupación económica
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { ChatBubble } from "@/Components/Chat/ChatBubble";
import { TypingIndicator } from "@/Components/Chat/TypingIndicator";
import { Chip } from "@/Components/Ui/chip";
import { ResourceCard } from "@/Components/Chat/ResourceCard";
import { Button } from "@/Components/Ui/button";
import { DollarSign, CreditCard, TrendingUp, Calendar } from "lucide-react";
import { useToast } from "@/Hooks/use-toast";

export default function RouteB() {
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
      description: `Información sobre ${type} disponible.`,
    });
    setTimeout(() => setStep(4), 1000);
  };

  const handleScheduleAdvisor = () => {
    toast({
      title: "¡Agendado!",
      description: "Asesoría financiera confirmada. Te llegará el link.",
    });
    setTimeout(() => setStep(4), 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header subtitle="Apoyo económico" />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {step >= 1 && (
          <ChatBubble 
            sender="agent"
            message={`Gracias por contarlo, ${userName}. Vemos opciones claras dentro de la Universidad.

¿Qué influye más en tu preocupación?`}
          />
        )}

        {step >= 2 && (
          <div className="space-y-3 mb-6">
            <Chip onClick={() => setStep(3)} className="w-full justify-center text-left">
              Matrícula o pagos mensuales
            </Chip>
            <Chip onClick={() => setStep(3)} className="w-full justify-center text-left">
              Materiales o conectividad
            </Chip>
            <Chip onClick={() => setStep(3)} className="w-full justify-center text-left">
              Ingresos en casa
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
              message="Entiendo. Te muestro las opciones que tenemos:"
            />
            <div className="mt-4 space-y-4">
              <ResourceCard 
                title="Becas y Descuentos UDLA"
                description="Revisa las opciones de financiamiento y becas disponibles para tu situación."
                ctaText="Solicitar apoyo"
                onAction={() => handleResource("becas")}
                icon={<DollarSign className="w-5 h-5" />}
              />
              <ResourceCard 
                title="Plan de pago flexible"
                description="Opciones de pago mensual y regularización disponibles."
                ctaText="Iniciar gestión"
                onAction={() => handleResource("plan de pago")}
                icon={<CreditCard className="w-5 h-5" />}
              />
              <ResourceCard 
                title="ROI: Retorno a la inversión"
                description="Entiende el valor a largo plazo de tu carrera."
                ctaText="Ver ficha"
                onAction={() => handleResource("ROI")}
                icon={<TrendingUp className="w-5 h-5" />}
              />
            </div>

            <div className="mt-6">
              <p className="text-sm text-muted-foreground text-center mb-3">
                ¿Prefieres hablar con un asesor?
              </p>
              <Button onClick={handleScheduleAdvisor} variant="outline" className="w-full">
                <Calendar className="w-4 h-4 mr-2" />
                Agendar asesoría financiera (15')
              </Button>
            </div>
          </>
        )}

        {step >= 4 && (
          <>
            <ChatBubble 
              sender="agent"
              message="Te daremos seguimiento en 24-72 horas para ver cómo avanzaste.

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
              Continuar
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
