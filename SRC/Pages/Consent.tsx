import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/Components/Ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/Components/Ui/card";
import { Shield, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { validateMatricula } from "@/Lib/backendAdapter";
import { clearCurrentUserData } from "@/Lib/storageManager";

export default function Consent() {
  const navigate = useNavigate();
  const [matricula, setMatricula] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    if (!matricula.trim()) {
      setError("Por favor ingresa tu matrícula");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Validar matrícula contra el backend
      const result = await validateMatricula(matricula);

      // DEBUG: Log result completo
      console.log('Consent.tsx - Full result:', result);
      console.log('Consent.tsx - result.body?.nombre:', result.body?.nombre);
      console.log('Consent.tsx - result.nombre:', result.nombre);

      // El backend retorna success: true/false en el body, no solo en status HTTP
      if (!result.body?.success) {
        setError(result.body?.message || result.message || "Matrícula no encontrada. Verifica e intenta nuevamente.");
        setLoading(false);
        return;
      }

      // Verificar si el usuario es diferente (usuario nuevo vs recurrente)
      const previousUserId = localStorage.getItem("unitec_user_id");
      const newUserId = String(result.body?.user_id || result.userId || 0);
      
      // Si hay un usuario anterior diferente al nuevo, limpiar datos del usuario anterior
      if (previousUserId && previousUserId !== newUserId) {
        console.log(`🔄 Cambio de usuario detectado: ${previousUserId} → ${newUserId}`);
        console.log('🧹 Limpiando datos del usuario anterior...');
        clearCurrentUserData(); // Limpiar TODOS los datos del usuario anterior
      }

      // Guardar datos en localStorage para el flujo
      localStorage.setItem("unitec_matricula", matricula);
      localStorage.setItem("unitec_user_id", newUserId);
      localStorage.setItem("unitec_flujo", result.body?.flujo || "nuevo");
      localStorage.setItem("unitec_tiene_historial", String(result.body?.tiene_historial || false));
      const nombreGuardar = result.body?.nombre || result.nombre || "";
      localStorage.setItem("unitec_nombre", nombreGuardar);
      localStorage.setItem("unitec_carrera", result.body?.carrera || "");
      console.log('Consent.tsx - Guardando nombre:', nombreGuardar);
      console.log('Consent.tsx - Guardando carrera:', result.body?.carrera);

      // Siempre navegar a la experiencia SPA unificada (chat + cuestionario)
      // Intentar cargar historial previo si existe
      if (result.body?.flujo === "recurrente") {
        try {
          const convResponse = await fetch(`/wp-json/gero/v1/last-conversation?value_validador=${matricula}`);
          const convData = await convResponse.json();
          
          if (convData.success && convData.conversation_string) {
            localStorage.setItem("unitec_last_conversation", convData.conversation_string);
            console.log('Historial previo cargado');
          }
        } catch (err) {
          console.warn('No se pudo cargar historial previo:', err);
        }
      }
      
      // Navegar a la experiencia SPA (tanto nuevos como recurrentes)
      navigate("/chat");
    } catch (err: unknown) {
      setError("Error al validar. Intenta nuevamente.");
      console.error("Validation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && matricula.trim()) {
      handleContinue();
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
          <CardTitle className="text-2xl">¡Bienvenido/a!</CardTitle>
          <CardDescription className="mt-3 text-left">
            Hola, soy GERO, te acompañaré durante tu trayecto en UNITEC. Estoy aquí para apoyarte en tu inicio universitario.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Verifica tu matrícula para continuar.
          </p>

          {error && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="matricula" className="text-sm font-medium">
              Matrícula
            </label>
            <input
              id="matricula"
              type="text"
              value={matricula}
              onChange={(e) => {
                setMatricula(e.target.value);
                setError("");
              }}
              onKeyPress={handleKeyPress}
              placeholder="Ej: A12345"
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg border-2 border-input bg-background focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
            />
          </div>

          <ul className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-lg">
            <li>✓ Tus respuestas son confidenciales</li>
            <li>✓ Acceso seguro a tu perfil estudiantil</li>
            <li>✓ Solo usaré esto para ayudarte mejor</li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleContinue} 
            disabled={!matricula.trim() || loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Validando...
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
