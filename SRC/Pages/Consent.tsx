import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/Components/Ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/Components/Ui/card";
import { Shield, ArrowRight } from "lucide-react";

export default function Consent() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");

  const handleContinue = () => {
    if (userName.trim()) {
      localStorage.setItem("udla_user_name", userName);
      navigate("/home");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Privacidad y Consentimiento</CardTitle>
          <CardDescription className="mt-3 text-left">
            Hola, soy tu agente de acompañamiento UDLA. Estoy aquí para apoyarte en tu inicio universitario.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Voy a hacerte algunas preguntas breves (toma ~2 minutos) para conocerte mejor y ofrecerte el apoyo más adecuado.
          </p>
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              ¿Cómo te llamas?
            </label>
            <input
              id="name"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full px-4 py-3 rounded-lg border-2 border-input bg-background focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-lg">
            <li>✓ Tus respuestas son confidenciales</li>
            <li>✓ Puedes volver atrás en cualquier momento</li>
            <li>✓ Solo usaremos esto para ayudarte mejor</li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleContinue} 
            disabled={!userName.trim()}
            className="w-full"
            size="lg"
          >
            Continuar
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
