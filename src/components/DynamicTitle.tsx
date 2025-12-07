import { useState, useRef, useEffect } from "react";

interface DynamicTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const DynamicTitle = ({ children, className = "" }: DynamicTitleProps) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setMousePosition({ x, y });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Generate dynamic gradient based on mouse position
  const hue1 = Math.round(mousePosition.x * 180); // 0-180 (cyan to magenta range)
  const hue2 = Math.round(180 + mousePosition.y * 120); // 180-300 (magenta to purple range)
  const hue3 = Math.round((mousePosition.x + mousePosition.y) * 90); // 0-180

  const gradientStyle = {
    background: `linear-gradient(
      ${90 + mousePosition.x * 90}deg,
      hsl(${hue1}, 100%, 60%),
      hsl(${hue2}, 100%, 60%),
      hsl(${hue3}, 100%, 60%)
    )`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    textShadow: `
      0 0 20px hsla(${hue1}, 100%, 60%, 0.5),
      0 0 40px hsla(${hue2}, 100%, 60%, 0.3),
      0 0 60px hsla(${hue3}, 100%, 60%, 0.2)
    `,
    filter: `drop-shadow(0 0 10px hsla(${hue1}, 100%, 60%, 0.4))`,
  };

  return (
    <div
      ref={containerRef}
      className={`text-center w-full ${className}`}
    >
      <h1
        className="text-5xl md:text-6xl lg:text-7xl font-bold font-orbitron tracking-wider transition-all duration-150"
        style={gradientStyle}
      >
        {children}
      </h1>
    </div>
  );
};
