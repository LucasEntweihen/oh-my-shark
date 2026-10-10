import { Pause, MoreVertical } from "lucide-react";

const tasks = [
  { id: "01", title: "Review Wireframes", status: "completed", time: "00:00" },
  { id: "02", title: "Create Styleguide", status: "active", time: "25m 20s" },
  { id: "03", title: "Develop Dashboard", status: "pending", time: "00:00" },
  { id: "04", title: "Testing & QA", status: "pending", time: "00:00" },
];

export function TaskList() {
  return (
    <div className="bg-surface rounded-xl p-6 border border-surface-hover flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display font-bold text-xl tracking-tight text-text-primary">My Tasks</h2>
        <button className="text-text-muted hover:text-text-primary"><MoreVertical className="w-5 h-5"/></button>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {tasks.map((task, i) => (
          <div 
            key={task.id} 
            className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-hover/50 transition-colors group cursor-pointer"
            style={{ animation: `fadeUp 0.3s ease-out ${i * 0.05}s both` }}
          >
            <div className="flex items-center gap-4">
              <span className="font-mono text-text-muted text-sm">{task.id}</span>
              <div className="relative flex items-center justify-center w-5 h-5">
                <input 
                  type="radio" 
                  name="task" 
                  checked={task.status === "completed"} 
                  readOnly
                  className="peer appearance-none w-4 h-4 rounded-full border border-text-muted checked:border-success transition-all cursor-pointer" 
                />
                <div className="absolute w-2 h-2 rounded-full bg-success opacity-0 peer-checked:opacity-100 transition-opacity"></div>
              </div>
              <span className={`font-medium text-sm ${task.status === "completed" ? "text-text-muted line-through" : "text-text-primary"}`}>
                {task.title}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {task.status === "active" && (
                <>
                  <span className="font-mono text-alert text-sm font-bold bg-alert/10 px-2 py-1 rounded">{task.time}</span>
                  <button className="w-8 h-8 rounded-full bg-alert/10 text-alert flex items-center justify-center hover:bg-alert hover:text-text-primary transition-colors">
                    <Pause className="w-4 h-4 fill-current" />
                  </button>
                </>
              )}
              {task.status === "pending" && (
                <div className="w-2 h-2 rounded-full bg-warn shadow-[0_0_8px_rgba(255,179,0,0.5)]"></div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
