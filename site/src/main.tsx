import "@fontsource/space-mono/latin-400.css";
import "@fontsource/space-mono/latin-700.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/fira-code/latin-400.css";
import "@fontsource/fira-code/latin-600.css";
import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuroraApp } from "./AuroraApp";
import "./styles.css";

function RootRouter() {
  const [route, setRoute] = useState<"landing" | "app">(() => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();

    // Apenas cai na landing se solicitado explicitamente
    if (
      path.startsWith("/landing") ||
      path.startsWith("/home") ||
      hash === "#landing" ||
      hash === "#home" ||
      search.includes("mode=landing") ||
      search.includes("mode=home")
    ) {
      return "landing";
    }

    // Padrão imediato: GUI do OMSK / CosmoSky
    return "app";
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (
        path.startsWith("/landing") ||
        path.startsWith("/home") ||
        hash === "#landing" ||
        hash === "#home" ||
        search.includes("mode=landing") ||
        search.includes("mode=home")
      ) {
        setRoute("landing");
      } else {
        setRoute("app");
      }
    };
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handlePopState);
    };
  }, []);

  if (route === "landing") {
    return <App />;
  }

  // Padrão: AuroraApp (GUI OMSK)
  return <AuroraApp />;
}

const root = document.getElementById("root");
if (!root) throw new Error("missing #root element");

createRoot(root).render(
  <StrictMode>
    <RootRouter />
  </StrictMode>,
);
