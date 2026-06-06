"use client";

interface VisualBackdropProps {
  variant?: "app" | "auth";
}

export function VisualBackdrop({ variant = "app" }: VisualBackdropProps) {
  return (
    <div className={`axiss-dynamic-backdrop axiss-dynamic-backdrop-${variant}`} aria-hidden="true">
      <div className="axiss-light-field" />
      <div className="axiss-grid-field" />
      <div className="axiss-beam-field" />
      <div className="axiss-noise-field" />
    </div>
  );
}
