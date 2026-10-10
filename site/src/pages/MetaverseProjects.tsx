
import { AppLayout } from "../components/layout/AppLayout";
import { GalaxySpiral } from "../components/complex-graphics/GalaxySpiral";

export function MetaverseProjects() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="mb-8 relative z-20">
          <h1 className="font-display font-bold text-3xl tracking-tight text-text-primary">Crafty Metaverse</h1>
          <p className="text-text-secondary mt-1">Blockchain and Web3 distributed tasks</p>
          <div className="mt-4">
             <button className="bg-galaxy-core hover:bg-galaxy-glow text-white font-bold py-2 px-6 rounded-md transition-colors shadow-[0_0_15px_rgba(156,39,176,0.5)]">
               Invest Now
             </button>
          </div>
        </header>

        <div className="relative -mt-20 z-10" style={{ maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' }}>
           <GalaxySpiral />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-20 -mt-10">
          <div className="bg-surface p-6 rounded-xl border border-surface-hover">
             <h3 className="font-display font-bold text-lg mb-4 text-text-primary">Smart Contract Audit</h3>
             <p className="text-sm text-text-secondary mb-4">Reviewing the ERC-20 token contract for the new marketplace.</p>
             <div className="flex justify-between items-center text-xs font-mono">
               <span className="text-warn">IN PROGRESS</span>
               <span className="text-text-muted">Due: Tomorrow</span>
             </div>
          </div>
          
          <div className="bg-surface p-6 rounded-xl border border-surface-hover">
             <h3 className="font-display font-bold text-lg mb-4 text-text-primary">Node Synchronization</h3>
             <p className="text-sm text-text-secondary mb-4">Ensuring all validator nodes are synced with the testnet.</p>
             <div className="flex justify-between items-center text-xs font-mono">
               <span className="text-success">SYNCED</span>
               <span className="text-text-muted">Updated: Just now</span>
             </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
