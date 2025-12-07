import { useState, useRef, useEffect } from "react";

interface DynamicTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const DynamicTitle = ({ children, className = "" }: DynamicTitleProps) => {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Subtle hue shift based on mouse position
  const hue = Math.round(180 + mousePosition.x * 60 - mousePosition.y * 30); // 150-210 range (cyan to blue)

  return (
    <div
      ref={containerRef}
      className={`text-center w-full ${className}`}
    >
      <h1
        className="text-5xl md:text-6xl lg:text-7xl font-bold font-orbitron tracking-widest transition-all duration-500"
        style={{
          color: `hsla(${hue}, 70%, 70%, 0.9)`,
          textShadow: `0 0 30px hsla(${hue}, 80%, 60%, 0.25)`,
        }}
      >
        {children}
      </h1>
    </div>
  );
};
