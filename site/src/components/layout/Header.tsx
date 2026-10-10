
import { Search, Bell } from "lucide-react";
import { Avatar } from "../ui/Avatar";

export function Header() {
  return (
    <header className="h-[80px] w-full flex items-center justify-between px-6 bg-base border-b border-surface-hover shrink-0">
      <div className="flex-1 max-w-md relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-glitch transition-colors" />
        <input
          type="text"
          placeholder="Search everywhere..."
          className="w-full bg-surface border border-surface-hover rounded-md py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-glitch focus:ring-1 focus:ring-glitch transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-surface-hover text-text-secondary rounded">Cmd</kbd>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-surface-hover text-text-secondary rounded">K</kbd>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative text-text-secondary hover:text-text-primary transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-alert rounded-full border border-base"></span>
        </button>
        <div className="h-8 w-[1px] bg-surface-hover"></div>
        <button className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-glitch rounded-full p-1 -m-1">
          <Avatar fallback="ES" />
        </button>
      </div>
    </header>
  );
}
