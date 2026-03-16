import { useState, useEffect } from "react";

export default function MouseGlow() {
  const [pos, setPos] = useState({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50"
      style={{
        background: `radial-gradient(
          circle at ${pos.x}px ${pos.y}px,
          rgba(255, 255, 255, 0.25) 0%,
          rgba(0, 0, 0, 0) 50%
        )`,
        mixBlendMode: "soft-light", // blends with your bg gradient
        transition: "background 0.15s ease-out",
      }}
    />
  );
}
