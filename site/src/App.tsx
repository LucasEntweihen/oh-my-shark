import { useState, useEffect } from "react";
import { Dashboard } from "./pages/Dashboard";
import { NeuralInsights } from "./pages/NeuralInsights";
import { MetaverseProjects } from "./pages/MetaverseProjects";

export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    
    // Simple override for pushState and replaceState to trigger re-renders
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      setPath(window.location.pathname);
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      setPath(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    
    // Capture anchor clicks for internal navigation
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      
      if (anchor && anchor.href && anchor.href.startsWith(window.location.origin)) {
        e.preventDefault();
        const url = new URL(anchor.href);
        history.pushState(null, "", url.pathname);
      }
    };
    
    document.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleClick);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  if (path === "/") {
    return <Dashboard />;
  } else if (path.startsWith("/neural-insights")) {
    return <NeuralInsights />;
  } else if (path.startsWith("/metaverse-projects")) {
    return <MetaverseProjects />;
  }

  // Fallback to Dashboard
  return <Dashboard />;
}
