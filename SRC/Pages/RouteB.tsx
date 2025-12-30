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
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 w-full px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 pb-6">
        <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
          {step >= 1 && (
            <ChatBubble 
              sender="agent"
              message={`Gracias por contarlo, ${userName}. Vemos opciones claras dentro de la Universidad.

¿Qué influye más en tu preocupación?`}
            />
          )}

          {step >= 2 && (
            <div className="space-y-2 sm:space-y-2.5 md:space-y-3 mb-4 sm:mb-6 animate-in fade-in duration-500">
              <Chip 
                onClick={() => setStep(3)} 
                className="w-full justify-start px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base min-h-10 sm:min-h-11 md:min-h-12"
              >
                Matrícula o pagos mensuales
              </Chip>
              <Chip 
                onClick={() => setStep(3)} 
                className="w-full justify-start px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base min-h-10 sm:min-h-11 md:min-h-12"
              >
                Materiales o conectividad
              </Chip>
              <Chip 
                onClick={() => setStep(3)} 
                className="w-full justify-start px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base min-h-10 sm:min-h-11 md:min-h-12"
              >
                Ingresos en casa
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
                message="Entiendo. Te muestro las opciones que tenemos:"
              />
              <div className="space-y-3 sm:space-y-4">
                <ResourceCard 
                  title="Becas y Descuentos UNITEC"
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

              <div className="mt-2 sm:mt-4 md:mt-6 pt-3 sm:pt-4 md:pt-6 border-t">
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground text-center mb-3 sm:mb-4">
                  ¿Prefieres hablar con un asesor?
                </p>
                <Button 
                  onClick={handleScheduleAdvisor} 
                  variant="outline" 
                  className="w-full h-auto py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base min-h-10 sm:min-h-11 md:min-h-12"
                >
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" />
                  <span>Agendar asesoría (15')</span>
                </Button>
              </div>
            </div>
          )}

          {step >= 4 && (
            <div className="animate-in fade-in duration-500 space-y-4 sm:space-y-6">
              <ChatBubble 
                sender="agent"
                message="Te daremos seguimiento en 24-72 horas para ver cómo avanzaste.

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
              Continuar
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
