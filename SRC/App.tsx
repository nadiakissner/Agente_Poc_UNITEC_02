import { Toaster } from "@/Components/Ui/toaster";
import { Toaster as SonnerToaster } from "@/Components/Ui/sonner";
import { TooltipProvider } from "@/Components/Ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Splash from "./Pages/Splash";
import Consent from "./Pages/Consent";
import Home from "./Pages/Home";
import Questionnaire from "./Pages/Questionnaire";
import Summary from "./Pages/Summary";
import RouteA from "./Pages/RouteA";
import RouteB from "./Pages/RouteB";
import RouteC from "./Pages/RouteC";
import RouteD from "./Pages/RouteD";
import RouteE from "./Pages/RouteE";
import RouteF from "./Pages/RouteF";
import RouteG from "./Pages/RouteG";
import RoutePlaceholder from "./Pages/RoutePlaceholder";
import NotFound from "./Pages/NotFound";
import Agent from "./Pages/Agent";

const queryClient = new QueryClient();

// Función para validar e limpiar localStorage en caso de corrupción
const validarLocalStorage = () => {
  try {
    // Intentar acceder a items clave
    const test = localStorage.getItem("unitec_test");
    localStorage.setItem("unitec_test", "ok");
    localStorage.removeItem("unitec_test");
    
    // Si llegamos aquí, localStorage está funcionando
    return true;
  } catch (e) {
    console.error("⚠️ localStorage corrupto, limpiando...", e);
    
    // Si localStorage está corrupto, limpiar todo
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith("unitec_")) {
          localStorage.removeItem(key);
        }
      });
      console.log("✅ localStorage limpiado");
    } catch (err) {
      console.error("No se pudo limpiar localStorage:", err);
    }
    
    return false;
  }
};

// Validar localStorage al cargar la app
validarLocalStorage();

const AppContent = () => {
  useEffect(() => {
    // Si algo falla en cualquier ruta, limpiar localStorage y recargar
    const handleError = () => {
      console.error("Error detectado, validando localStorage...");
      validarLocalStorage();
    };
    
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);
  
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/consent" element={<Consent />} />
      <Route path="/home" element={<Home />} />
      <Route path="/questionnaire" element={<Questionnaire />} />
      <Route path="/summary" element={<Summary />} />
      <Route path="/route-a" element={<RouteA />} />
      <Route path="/route-b" element={<RouteB />} />
      <Route path="/route-c" element={<RouteC />} />
      <Route path="/route-d" element={<RouteD />} />
      <Route path="/route-e" element={<RouteE />} />
      <Route path="/route-f" element={<RouteF />} />
      <Route path="/route-g" element={<RouteG />} />
      <Route path="/route-placeholder" element={<RoutePlaceholder />} />
      <Route path="/agent" element={<Agent />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <SonnerToaster />
      <HashRouter>
        <AppContent />
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
