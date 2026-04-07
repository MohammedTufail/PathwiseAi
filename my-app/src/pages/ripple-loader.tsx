// ripple-loader.tsx
import React from "react";
import { Ripple } from "../components/ui/ripple";
import { NumberTicker } from "../components/ui/number-ticker";
import { cn } from "../lib/utils";

interface RippleLoaderProps {
  value: number; // number to show, e.g., 0 to 100
  decimalPlaces?: number;
  className?: string;
}

export function RippleLoader({
  value,
  decimalPlaces = 0,
  className,
}: RippleLoaderProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 flex items-center justify-center bg-white dark:bg-black z-[9999]",
        className,
      )}
    >
      {/* Ripple background */}
      <Ripple
        className="absolute inset-0"
        mainCircleSize={150}
        mainCircleOpacity={0.2}
        numCircles={6}
      />

      {/* Number ticker centered */}
      <NumberTicker
        value={value}
        startValue={0}
        decimalPlaces={decimalPlaces}
        className="relative text-6xl font-bold text-black dark:text-green-500"
      />
    </div>
  );
}
