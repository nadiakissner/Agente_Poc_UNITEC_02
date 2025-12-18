import { Toaster } from "@/Components/Ui/toaster";
import { Toaster as Sonner } from "@/Components/Ui/sonner";
import { TooltipProvider } from "@/Components/Ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
