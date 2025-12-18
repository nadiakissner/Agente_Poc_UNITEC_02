import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/Components/Logo";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/consent");
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-light to-primary-dark flex items-center justify-center p-6">
      <div className="text-center animate-in fade-in zoom-in duration-700">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="bg-white rounded-3xl p-8 shadow-2xl">
              <Logo variant="splash" />
            </div>
            <div className="absolute inset-0 rounded-3xl bg-white/20 animate-ping" />
          </div>
        </div>
        <p className="text-white text-xl font-medium">Te acompañamos en tu inicio universitario</p>
      </div>
    </div>
  );
}
