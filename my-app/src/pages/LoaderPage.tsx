// pages/LoaderPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RippleLoader } from "./ripple-loader";

export default function LoaderPage() {
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => navigate("/Overview"), 500); // navigate after loader completes
          return 100;
        }
        return prev + 1;
      });
    }, 20); // speed of increment

    return () => clearInterval(interval);
  }, [navigate]);

  return <RippleLoader value={progress} />;
}
