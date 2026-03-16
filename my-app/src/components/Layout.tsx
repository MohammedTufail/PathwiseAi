// src/components/Layout.tsx
import React from "react";
import MouseGlow from "./MouseGlow";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Mouse Glow on every page */}
      <MouseGlow />

      {/* Page content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
