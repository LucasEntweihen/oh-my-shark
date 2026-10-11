import React from "react";
import type { LucideIcon } from "lucide-react";

export interface IconProps {
  icon: LucideIcon;
  size?: "sm" | "md" | "base" | "lg";
  className?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

const sizeMap = {
  sm: 16,
  md: 20,
  base: 24,
  lg: 32,
};

/**
 * Componente Icon em estrita conformidade com ICON_SYSTEM.md (Sec 1, 2, 7)
 * - Stroke width oficial de 1.5px
 * - Terminações 'round'
 * - Herança de cor via currentColor
 * - aria-hidden="true" e focusable="false" para ícones decorativos
 */
export function Icon({
  icon: IconComponent,
  size = "md",
  className = "",
  strokeWidth = 1.5,
  style,
}: IconProps) {
  return (
    <IconComponent
      size={sizeMap[size]}
      strokeWidth={strokeWidth}
      className={`shrink-0 ${className}`}
      style={style}
      aria-hidden="true"
      focusable="false"
    />
  );
}
