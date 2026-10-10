
import { AppLayout } from "../components/layout/AppLayout";
import { NeuralBust } from "../components/complex-graphics/NeuralBust";
import { Brain } from "lucide-react";

export function NeuralInsights() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-8 h-8 text-glitch" />
            <h1 className="font-display font-bold text-3xl tracking-tight text-text-primary">Neural Insights</h1>
          </div>
          <p className="text-text-secondary">AI-driven productivity analytics and cognitive load metrics.</p>
        </header>

        <div className="relative rounded-2xl overflow-hidden border border-surface-hover bg-surface p-8">
          <div className="absolute inset-0 bg-[#22242B]/50 mix-blend-luminosity z-0"></div>
          <div className="relative z-10">
             <NeuralBust />
          </div>
          
          <div className="relative z-20 mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-base/80 backdrop-blur-md p-6 rounded-xl border border-surface-hover">
              <h3 className="font-mono text-xs uppercase text-text-secondary mb-2 tracking-wider">Cognitive Load</h3>
              <div className="text-3xl font-display font-bold text-text-primary">78%</div>
              <div className="w-full h-1 bg-surface-hover rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-warn rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
            
            <div className="bg-base/80 backdrop-blur-md p-6 rounded-xl border border-surface-hover">
              <h3 className="font-mono text-xs uppercase text-text-secondary mb-2 tracking-wider">Focus Streak</h3>
              <div className="text-3xl font-display font-bold text-glitch">4.2 hrs</div>
              <p className="text-xs text-text-secondary mt-2">Optimal state detected</p>
            </div>
            
            <div className="bg-base/80 backdrop-blur-md p-6 rounded-xl border border-surface-hover">
              <h3 className="font-mono text-xs uppercase text-text-secondary mb-2 tracking-wider">Task Velocity</h3>
              <div className="text-3xl font-display font-bold text-success">+14%</div>
              <p className="text-xs text-text-secondary mt-2">Compared to last week</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
