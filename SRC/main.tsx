import * as React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Elemento root único para UNITEC
const rootElement = document.getElementById("agente-unitec-root");

if (rootElement) {
  // Limpiar cualquier contenido previo para asegurar aislamiento
  rootElement.innerHTML = "";
  
  // Inyectar estilos críticos para el contenedor root
  rootElement.style.cssText = `
    display: block !important;
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif !important;
  `;
  
  // Crear root de React
  const root = createRoot(rootElement);
  
  // Renderizar aplicación
  root.render(<App />);
  
  console.log("[UNITEC-02] React mounted successfully in isolated container");
} else {
  console.error("[UNITEC-02] ERROR: Root element #agente-unitec-root not found");
  
  // Crear elemento de error visible
  const errorDiv = document.createElement("div");
  errorDiv.style.cssText = "padding: 20px; background: #fee; border: 2px solid #f00; color: #c33; border-radius: 4px; margin: 10px; font-family: monospace;";
  errorDiv.innerHTML = "<strong>⚠️ UNITEC-02: No se encontró el elemento raíz</strong>";
  document.body.appendChild(errorDiv);
}
