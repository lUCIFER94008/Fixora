"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface PerspectiveGridProps {
  className?: string;
  gridSize?: number;
  fadeRadius?: number;
}

export function PerspectiveGrid({ className, gridSize = 20, fadeRadius = 80 }: PerspectiveGridProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, currentX: 0, currentY: 0 });
  const [reduceMotion, setReduceMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mediaQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReduceMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleMotionChange);
    return () => mediaQuery.removeEventListener("change", handleMotionChange);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      mouseRef.current.x = (clientX / innerWidth) - 0.5;
      mouseRef.current.y = (clientY / innerHeight) - 0.5;
    };

    const animate = () => {
      const { x, y, currentX, currentY } = mouseRef.current;
      const ease = 0.05;

      mouseRef.current.currentX += (x - currentX) * ease;
      mouseRef.current.currentY += (y - currentY) * ease;

      if (containerRef.current) {
        const rotX = 35 + mouseRef.current.currentY * 12;
        const rotY = mouseRef.current.currentX * 12;
        containerRef.current.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(0)`;
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [reduceMotion]);

  // Grid size for optimal coverage and performance based on props
  const tiles = useMemo(() => Array.from({ length: gridSize * gridSize }), [gridSize]);

  // Glow hover classes alternating colors matching FIXORA's theme
  const glowClasses = [
    "hover:bg-[#00ffff]/10 hover:border-[#00ffff] hover:shadow-[0_0_15px_rgba(0,255,255,0.4)]",
    "hover:bg-[#ff00ff]/10 hover:border-[#ff00ff] hover:shadow-[0_0_15px_rgba(255,0,255,0.4)]",
    "hover:bg-[#3b82f6]/10 hover:border-[#3b82f6] hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]"
  ];

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#04050B]", className)}>
      <div 
        className="absolute inset-0 w-full h-[150%] origin-center flex items-center justify-center"
        style={{ perspective: "1000px" }}
      >
        <div
          ref={containerRef}
          className={cn(
            "absolute w-[180vw] h-[180vh] origin-center grid will-change-transform",
            reduceMotion ? "" : "animate-grid-drift"
          )}
          style={{
            transform: "rotateX(35deg) translateZ(0)",
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`,
            maskImage: `radial-gradient(ellipse at 50% 40%, black 20%, transparent ${fadeRadius}%)`,
            WebkitMaskImage: `radial-gradient(ellipse at 50% 40%, black 20%, transparent ${fadeRadius}%)`
          }}
        >
          {mounted &&
            tiles.map((_, i) => {
              const glowClass = glowClasses[i % glowClasses.length];
              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-[1px] min-w-[1px] border border-cyan-500/12 bg-transparent pointer-events-auto",
                    "transition-all duration-[1200ms] ease-out hover:duration-0 hover:ease-in",
                    glowClass
                  )}
                />
              );
            })}
        </div>
      </div>
    </div>
  );
}

export default PerspectiveGrid;
