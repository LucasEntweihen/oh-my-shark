
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Calendar() {
  const days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const dates = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="bg-surface rounded-xl p-6 border border-surface-hover">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-display font-bold text-lg text-text-primary">Feb 2020</h3>
        <div className="flex gap-2">
          <button className="p-1 text-text-muted hover:text-text-primary"><ChevronLeft className="w-5 h-5"/></button>
          <button className="p-1 text-text-muted hover:text-text-primary"><ChevronRight className="w-5 h-5"/></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4 text-center">
        {days.map(d => (
          <div key={d} className="text-xs font-medium text-text-muted">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-2 gap-x-2 text-center">
        {/* Empty slots for start of month */}
        <div className="p-2"></div>
        <div className="p-2"></div>
        
        {dates.map(date => {
          const isActive = date === 5;
          const hasDot = date === 8 || date === 12 || date === 24;
          
          return (
            <div key={date} className="relative flex justify-center items-center">
              <button 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
                  isActive 
                    ? "bg-alert text-text-primary font-bold shadow-[0_0_12px_rgba(229,57,53,0.4)]" 
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                }`}
              >
                {date}
              </button>
              {hasDot && (
                <div className="absolute bottom-0 w-1 h-1 rounded-full bg-warn"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
