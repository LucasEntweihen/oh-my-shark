

interface AvatarProps {
  src?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ src, fallback, size = "md", className = "" }: AvatarProps) {
  let sClass = "w-8 h-8";
  if (size === "sm") sClass = "w-6 h-6";
  if (size === "lg") sClass = "w-10 h-10";

  return (
    <div className={`rounded-full overflow-hidden bg-surface-hover flex items-center justify-center text-xs text-text-secondary font-semibold border-2 border-surface ${sClass} ${className}`}>
      {src ? <img src={src} alt="Avatar" className="w-full h-full object-cover" /> : fallback}
    </div>
  );
}

export function AvatarGroup({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`flex items-center -space-x-3 ${className}`}>
      {children}
    </div>
  );
}
