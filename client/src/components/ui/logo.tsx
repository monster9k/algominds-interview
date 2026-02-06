import { cn } from "@/lib/utils";
import { CircuitBoard, Brain } from "lucide-react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  iconOnly?: boolean; // Tùy chọn chỉ hiện icon
}

export function Logo({ className, size = "md", iconOnly = false }: LogoProps) {
  // Map size sang kích thước khung chứa Icon (quan trọng để không bị đè)
  const containerClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-32 h-32",
  };
  // Map size sang kích thước Icon SVG
  const iconClasses = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-16 w-16",
    xl: "h-32 w-32",
  };

  const textClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Container giữ chỗ cho Icon Absolute */}
      <div
        className={cn(
          "relative flex items-center justify-center text-primary",
          containerClasses[size],
        )}
      >
        <Brain
          className={cn("absolute z-10", iconClasses[size])}
          strokeWidth={1.5}
        />
        <CircuitBoard
          className={cn("absolute opacity-40", iconClasses[size])}
          strokeWidth={1}
        />

        {/* Hiệu ứng Glow cho size lớn */}
        {(size === "lg" || size === "xl") && (
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
        )}
      </div>

      {!iconOnly && (
        <div
          className={cn(
            "font-bold tracking-tight leading-none",
            textClasses[size],
          )}
        >
          <span className="bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 bg-clip-text text-transparent">
            ALGO
          </span>
          <span className="text-foreground">MINDS</span>
        </div>
      )}
    </div>
  );
}
