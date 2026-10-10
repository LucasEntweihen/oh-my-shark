
import { LayoutDashboard, BrainCircuit, Orbit, Settings, LogOut, CheckCircle2 } from "lucide-react";

export function Sidebar() {
  const currentPath = window.location.pathname;

  const links = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Neural Insights", path: "/neural-insights", icon: BrainCircuit },
    { name: "Metaverse Projects", path: "/metaverse-projects", icon: Orbit },
  ];

  return (
    <aside className="hidden md:flex flex-col w-[260px] h-full bg-sidebar border-r border-surface-hover">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-surface rounded flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-text-primary" />
        </div>
        <span className="font-display font-bold text-lg tracking-tight">Neuro-Task</span>
      </div>

      <div className="px-4 mb-4">
        <button className="w-full bg-alert hover:bg-alert/90 text-text-primary font-bold py-2 rounded-md transition-colors flex items-center justify-center gap-2">
          DASHBOARD
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-4">
        {links.map((link) => {
          const isActive = currentPath === link.path || (link.path !== "/" && currentPath.startsWith(link.path));
          return (
            <a
              key={link.path}
              href={link.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive ? "bg-surface text-text-primary" : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              }`}
            >
              <link.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{link.name}</span>
            </a>
          );
        })}
      </nav>

      <div className="p-4 border-t border-surface-hover space-y-1">
        <button className="flex items-center gap-3 px-3 py-2 w-full text-left text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-md transition-colors">
          <Settings className="w-5 h-5" />
          <span className="font-medium text-sm">Settings</span>
        </button>
        <button className="flex items-center gap-3 px-3 py-2 w-full text-left text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-md transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
