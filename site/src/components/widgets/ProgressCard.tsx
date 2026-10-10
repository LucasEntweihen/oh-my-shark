
import { Clock } from "lucide-react";

export function ProgressCard() {
  return (
    <div className="bg-surface rounded-xl p-6 border border-surface-hover flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center">
            <span className="font-bold text-info">G</span>
          </div>
          <div>
            <h3 className="font-medium text-text-primary text-sm">Google Redesign</h3>
            <span className="text-xs text-text-secondary">Dashboard UI</span>
          </div>
        </div>
        <button className="text-text-muted hover:text-text-primary p-1">⋮</button>
      </div>

      <div className="flex justify-between items-center font-mono text-xs mt-2">
        <span className="text-text-secondary uppercase tracking-wider">Task Done</span>
        <span className="text-text-primary font-bold">25 / 50</span>
      </div>

      <div className="w-full h-1 bg-surface-hover rounded-full overflow-hidden" role="progressbar" aria-valuenow={50} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-alert rounded-full transition-all duration-500" style={{ width: '50%' }}></div>
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary bg-surface-hover/50 px-2 py-1 rounded">
          <Clock className="w-3 h-3 text-alert" />
          <span className="font-mono text-alert font-medium">Due in 2 days</span>
        </div>
        <div className="flex -space-x-2">
           <div className="w-6 h-6 rounded-full bg-surface-hover border-2 border-surface flex items-center justify-center text-[10px] text-text-secondary">U1</div>
           <div className="w-6 h-6 rounded-full bg-surface-hover border-2 border-surface flex items-center justify-center text-[10px] text-text-secondary">U2</div>
        </div>
      </div>
    </div>
  );
}
