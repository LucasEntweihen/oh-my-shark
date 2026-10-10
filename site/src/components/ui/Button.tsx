

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({ variant = "primary", size = "md", className = "", children, ...props }: ButtonProps) {
  let vClass = "";
  if (variant === "primary") vClass = "bg-alert text-text-primary hover:bg-alert/90";
  else if (variant === "secondary") vClass = "bg-surface-hover text-text-primary hover:bg-surface-hover/80";
  else if (variant === "ghost") vClass = "bg-transparent text-text-secondary hover:text-text-primary";
  else if (variant === "danger") vClass = "bg-alert text-text-primary hover:bg-alert/90";

  let sClass = "";
  if (size === "sm") sClass = "px-2 py-1 text-xs";
  if (size === "md") sClass = "px-4 py-2 text-sm";
  if (size === "lg") sClass = "px-6 py-3 text-base";

  return (
    <button className={`inline-flex items-center justify-center rounded transition-colors ${vClass} ${sClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
