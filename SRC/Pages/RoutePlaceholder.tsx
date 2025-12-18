import { useNavigate } from "react-router-dom";
import { Button } from "@/Components/Ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/Ui/card";
import { Construction } from "lucide-react";

export default function RoutePlaceholder() {
  const navigate = useNavigate();
  const risk = localStorage.getItem("udla_current_risk") || "";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Construction className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle>Ruta en desarrollo</CardTitle>
          <CardDescription className="mt-3">
            Esta categoría ({risk}) será implementada en la siguiente fase del agente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Por ahora, el POC incluye las tres rutas principales: Desorientación, Preocupación económica, y Desconexión social.
          </p>
          <Button onClick={() => navigate("/summary")} className="w-full">
            Volver al resumen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
