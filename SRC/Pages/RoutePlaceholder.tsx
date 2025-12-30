import { useNavigate } from "react-router-dom";
import { Button } from "@/Components/Ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/Ui/card";
import { Construction } from "lucide-react";

export default function RoutePlaceholder() {
  const navigate = useNavigate();
  const risk = localStorage.getItem("unitec_current_risk") || "";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4 md:p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center p-4 sm:p-5 md:p-6">
          <div className="flex justify-center mb-3 sm:mb-4 md:mb-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Construction className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-lg sm:text-xl md:text-2xl">Ruta en desarrollo</CardTitle>
          <CardDescription className="mt-2 sm:mt-2.5 md:mt-3 text-xs sm:text-sm md:text-base">
            Esta categoría ({risk}) será implementada en la siguiente fase del agente.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
            Por ahora, el POC incluye las tres rutas principales: Desorientación, Preocupación económica, y Desconexión social.
          </p>
          <Button 
            onClick={() => navigate("/summary")} 
            className="w-full h-auto py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base min-h-10 sm:min-h-11 md:min-h-12"
          >
            Volver al resumen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
