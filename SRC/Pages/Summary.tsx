import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/Components/Ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/Ui/card";
import { analyzeRisks, RiskAnalysis } from "@/Lib/riskAnalyzer";
import { riskLabels, RiskCategory } from "@/Data/questionnaire";
import { Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Header } from "@/Components/Header";

const riskIcons: Record<RiskCategory, React.ReactNode> = {
  economica: <AlertCircle className="w-5 h-5" />,
  social: <AlertCircle className="w-5 h-5" />,
  baja_preparacion: <AlertCircle className="w-5 h-5" />,
  organizacion: <AlertCircle className="w-5 h-5" />,
  tecnologica: <AlertCircle className="w-5 h-5" />,
  desorientacion: <AlertCircle className="w-5 h-5" />,
  entorno: <AlertCircle className="w-5 h-5" />,
  emocional: <AlertCircle className="w-5 h-5" />,
};

export default function Summary() {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);
  const [showSecondary, setShowSecondary] = useState(false);
  const [analyzing, setAnalyzing] = useState(true);

  useEffect(() => {
    const answersData = localStorage.getItem("udla_answers");
    if (!answersData) {
      navigate("/home");
      return;
    }

    setTimeout(() => {
      const answersArray = JSON.parse(answersData) as [string, { text: string; risk?: string; weight?: number }][];
      // Normalize to the expected shape for analyzeRisks
      const normalized: Array<[string, { risk?: RiskCategory; weight?: number }]> = answersArray.map(([k, v]) => [k, { risk: v.risk as RiskCategory | undefined, weight: v.weight }]);
      const answersMap = new Map<string, { risk?: RiskCategory; weight?: number }>(normalized);
      const result = analyzeRisks(answersMap);
      setAnalysis(result);
      setAnalyzing(false);
    }, 1500);
  }, [navigate]);

  const handleContinue = (risk: RiskCategory) => {
    localStorage.setItem("udla_current_risk", risk);
    
    // Route map for all 7 categories
    const routeMap: Record<RiskCategory, string> = {
      desorientacion: "/route-a",
      economica: "/route-b",
      social: "/route-c",
      organizacion: "/route-d",
      tecnologica: "/route-e",
      baja_preparacion: "/route-f",
      emocional: "/route-g",
      entorno: "/route-placeholder"
    };
    
    navigate(routeMap[risk] || "/route-placeholder");
  };

  if (analyzing || !analysis) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Analizando tus respuestas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header subtitle="Resumen de caracterización" />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <div className="mb-6 text-center animate-in fade-in duration-500">
          <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
          <h2 className="text-2xl font-bold mb-2">¡Gracias por compartir!</h2>
          <p className="text-muted-foreground">
            Aquí está lo que identificamos. Vamos a trabajar juntos en el tema principal.
          </p>
        </div>

        {/* Primary Risk */}
        <Card className="mb-4 border-2 border-primary shadow-lg animate-in slide-in-from-bottom-2 duration-500">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="text-primary mt-1">{riskIcons[analysis.primary]}</div>
              <div className="flex-1">
                <CardTitle className="text-lg">Tema principal detectado</CardTitle>
                <CardDescription className="mt-2 text-base font-medium text-foreground">
                  {riskLabels[analysis.primary]}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => handleContinue(analysis.primary)} 
              className="w-full"
              size="lg"
            >
              Seguir con este tema
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>

        {/* Secondary Risks */}
        {analysis.secondary.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-700 delay-200">
            {!showSecondary ? (
              <Button 
                variant="outline" 
                onClick={() => setShowSecondary(true)}
                className="w-full"
              >
                Ver otros temas detectados
              </Button>
            ) : (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Otros temas que podemos abordar:</h3>
                {analysis.secondary.map((risk) => (
                  <Card key={risk} className="border hover:border-primary/50 transition-colors cursor-pointer" onClick={() => handleContinue(risk)}>
                    <CardHeader className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="text-muted-foreground">{riskIcons[risk]}</div>
                        <CardTitle className="text-sm font-medium">{riskLabels[risk]}</CardTitle>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
