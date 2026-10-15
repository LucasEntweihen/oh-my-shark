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
    if (
      path.startsWith("/app") ||
      path.startsWith("/gui") ||
      path.startsWith("/aurora") ||
      hash === "#app" ||
      hash === "#gui" ||
      search.includes("mode=app") ||
      search.includes("mode=gui")
    ) {
      return "app";
    }
    return "landing";
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (
        path.startsWith("/app") ||
        path.startsWith("/gui") ||
        path.startsWith("/aurora") ||
        hash === "#app" ||
        hash === "#gui" ||
        search.includes("mode=app") ||
        search.includes("mode=gui")
      ) {
        setRoute("app");
      } else {
        setRoute("landing");
      }
    };
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handlePopState);
    };
  }, []);

  if (route === "app") {
    return <AuroraApp />;
  }

  return <App />;
}

const root = document.getElementById("root");
if (!root) throw new Error("missing #root element");

createRoot(root).render(
  <StrictMode>
    <RootRouter />
  </StrictMode>,
);
