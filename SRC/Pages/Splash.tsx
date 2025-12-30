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
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="text-center animate-in fade-in zoom-in duration-700">
        <div className="mb-8 flex justify-center">
          <div className="relative animate-scale-pulse">
            <div className="bg-transparent rounded-3xl p-8 ">
              <Logo variant="splash" />
            </div>
          </div>
        </div>
        {/* <p className="text-primary text-xl font-medium">Te acompañamos en tu inicio universitario</p> */}
      </div>
    </div>
  );
}
