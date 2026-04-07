import React, {
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from "react";
import { cn } from "../../lib/utils";

interface RippleProps extends ComponentPropsWithoutRef<"div"> {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
}

export const Ripple = React.memo(function Ripple({
  mainCircleSize = 500, // 🔥 bigger base
  mainCircleOpacity = 0.8,
  numCircles = 5,
  className,
  ...props
}: RippleProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden select-none",
        className,
      )}
      {...props}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 180; // 🔥 much larger spacing
        const opacity = mainCircleOpacity - i * 0.04;
        const animationDelay = `${i * 0.4}s`; // 🔥 smoother stagger

        return (
          <div
            key={i}
            className="absolute rounded-full border animate-ripple"
            style={
              {
                width: `${size}px`,
                height: `${size}px`,
                opacity,
                animationDelay,
                borderWidth: "2px",
                borderColor: "var(--foreground)",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
});

Ripple.displayName = "Ripple";
