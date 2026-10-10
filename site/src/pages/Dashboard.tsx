
import { AppLayout } from "../components/layout/AppLayout";
import { ProgressCard } from "../components/widgets/ProgressCard";
import { TaskList } from "../components/widgets/TaskList";
import { Calendar } from "../components/widgets/Calendar";
import { Avatar } from "../components/ui/Avatar";

export function Dashboard() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="mb-8">
          <h1 className="font-display font-bold text-3xl tracking-tight text-text-primary">Dashboard</h1>
          <p className="text-text-secondary mt-1">Manage your neuro-tasks and track progress.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex flex-col gap-6">
            <h2 className="font-display font-bold text-lg text-text-primary mb-2">Projects</h2>
            <ProgressCard />
            <div className="bg-surface rounded-xl p-6 border border-surface-hover flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E5F3FF]/10 flex items-center justify-center">
                    <span className="font-bold text-[#E53935]">S</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-text-primary text-sm">Slack Integration</h3>
                    <span className="text-xs text-text-secondary">API Sync</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center font-mono text-xs mt-2">
                <span className="text-text-secondary uppercase tracking-wider">Task Done</span>
                <span className="text-text-primary font-bold">10 / 40</span>
              </div>
              <div className="w-full h-1 bg-surface-hover rounded-full overflow-hidden">
                <div className="h-full bg-warn rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-1">
            <TaskList />
          </div>

          <div className="flex flex-col gap-6">
            <Calendar />
            <div className="bg-surface rounded-xl p-6 border border-surface-hover">
              <h3 className="font-display font-bold text-lg text-text-primary mb-4">Messages</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar fallback="A" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-text-primary truncate">Alice Freeman</p>
                    <p className="text-xs text-text-secondary truncate">Can you check the new wireframes?</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar fallback="B" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-text-primary truncate">Bob Smith</p>
                    <p className="text-xs text-text-secondary truncate">API is deployed to staging.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
