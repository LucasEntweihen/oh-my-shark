export interface AuroraCoreProps {
  size?: number;
  estado?: "ocioso" | "processando" | "respondendo" | "erro";
  className?: string;
  onClick?: () => void;
}

/**
 * Núcleo visual Aurora AI em conformidade com DESIGN.md (Sec 6 e 14.4)
 * - Gradiente espectral em proporção física
 * - Volume luminoso e respiração suave quando ativo
 * - Redução de movimento respeitada via CSS
 */
export function AuroraCore({
  size = 32,
  estado = "ocioso",
  className = "",
  onClick,
}: AuroraCoreProps) {
  return (
    <div
      onClick={onClick}
      className={`aurora-core shrink-0 cursor-default ${className}`}
      data-estado={estado}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      title={`Aurora AI (${estado})`}
      role="img"
      aria-label={`Núcleo Aurora AI no estado ${estado}`}
    />
  );
}
