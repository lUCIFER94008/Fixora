"use client";

import React, { useEffect, useState, useRef } from "react";

// Predefined static particle layout for hydration safety
const PARTICLES = [
  { left: "8%", top: "12%", size: 3, delay: "0s", duration: "16s" },
  { left: "15%", top: "42%", size: 2, delay: "-3s", duration: "21s" },
  { left: "22%", top: "78%", size: 4, delay: "-7s", duration: "18s" },
  { left: "34%", top: "28%", size: 2, delay: "-12s", duration: "25s" },
  { left: "41%", top: "62%", size: 3, delay: "-5s", duration: "19s" },
  { left: "48%", top: "15%", size: 1.5, delay: "-2s", duration: "22s" },
  { left: "55%", top: "85%", size: 3.5, delay: "-9s", duration: "17s" },
  { left: "62%", top: "48%", size: 2, delay: "-15s", duration: "24s" },
  { left: "71%", top: "25%", size: 3, delay: "-4s", duration: "20s" },
  { left: "78%", top: "70%", size: 1.8, delay: "-11s", duration: "23s" },
  { left: "85%", top: "12%", size: 4, delay: "-6s", duration: "15s" },
  { left: "92%", top: "52%", size: 2, delay: "-13s", duration: "26s" },
  { left: "5%", top: "65%", size: 3, delay: "-8s", duration: "20s" },
  { left: "18%", top: "88%", size: 1.5, delay: "-14s", duration: "21s" },
  { left: "29%", top: "8%", size: 2.5, delay: "-1s", duration: "19s" },
  { left: "38%", top: "92%", size: 3.5, delay: "-10s", duration: "18s" },
  { left: "67%", top: "82%", size: 2, delay: "-5s", duration: "22s" },
  { left: "81%", top: "94%", size: 1.5, delay: "-3s", duration: "25s" },
  { left: "88%", top: "38%", size: 3, delay: "-16s", duration: "17s" },
  { left: "95%", top: "76%", size: 2, delay: "-7s", duration: "24s" },
];

export function LuxuryBackground() {
  const [mounted, setMounted] = useState(false);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const glow = glowRef.current;
    if (!glow) return;

    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    let frameId: number;
    const updatePosition = () => {
      currentX += (mouseX - currentX) * 0.08;
      currentY += (mouseY - currentY) * 0.08;

      if (glow) {
        glow.style.transform = `translate3d(${currentX - 150}px, ${currentY - 150}px, 0)`;
      }
      frameId = requestAnimationFrame(updatePosition);
    };

    frameId = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(frameId);
    };
  }, [mounted]);

  if (!mounted) {
    return <div className="fixed inset-0 bg-[#050505] -z-50" />;
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-[#050505] overflow-hidden -z-50 pointer-events-none select-none">
      {/* Inline styles for custom keyframe animations */}
      <style>{`
        @keyframes float-blob-1 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          33% { transform: translate3d(120px, -60px, 0) scale(1.12); }
          66% { transform: translate3d(-70px, 90px, 0) scale(0.93); }
        }
        @keyframes float-blob-2 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1.08); }
          50% { transform: translate3d(-100px, 110px, 0) scale(0.88); }
        }
        @keyframes float-blob-3 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(0.92); }
          50% { transform: translate3d(80px, -90px, 0) scale(1.18); }
        }
        @keyframes spotlight-drift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
          33% { transform: translate3d(60px, 30px, 0) scale(1.05) rotate(3deg); }
          66% { transform: translate3d(-40px, -20px, 0) scale(0.95) rotate(-3deg); }
        }
        @keyframes grid-drift {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(80px, 80px, 0); }
        }
        @keyframes particle-drift {
          0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.1; }
          50% { transform: translate3d(30px, -30px, 0); opacity: 0.35; }
        }
        .bg-grid-overlay {
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 80px 80px;
        }
      `}</style>

      {/* Layer 5: Soft Grid Glow (Translating seamlessly and extremely slowly) */}
      <div 
        className="absolute inset-[-100px] w-[calc(100%+200px)] h-[calc(100%+200px)] bg-grid-overlay" 
        style={{
          animation: "grid-drift 120s linear infinite"
        }}
      />

      {/* Layer 1: Ambient Drifting Blobs */}
      <div 
        className="absolute top-[-10%] left-[5%] w-[650px] h-[650px] rounded-full bg-[#FFD400]/[0.06] blur-[150px]" 
        style={{ animation: "float-blob-1 28s ease-in-out infinite" }}
      />
      <div 
        className="absolute bottom-[10%] right-[5%] w-[750px] h-[750px] rounded-full bg-[#FFC300]/[0.05] blur-[170px]" 
        style={{ animation: "float-blob-2 32s ease-in-out infinite" }}
      />
      <div 
        className="absolute top-[35%] left-[30%] w-[500px] h-[500px] rounded-full bg-[#FFFFFF]/[0.02] blur-[130px]" 
        style={{ animation: "float-blob-3 24s ease-in-out infinite" }}
      />

      {/* Layer 3: Animated Radial Spotlight */}
      <div 
        className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none"
        style={{
          animation: "spotlight-drift 30s ease-in-out infinite"
        }}
      >
        <div 
          className="w-[1000px] h-[1000px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255, 212, 0, 0.06) 0%, transparent 65%)"
          }}
        />
      </div>

      {/* Mouse Interaction Layer: Smooth cursor-following glow */}
      <div 
        ref={glowRef}
        className="absolute w-[300px] h-[300px] rounded-full pointer-events-none transition-opacity duration-500"
        style={{
          background: "radial-gradient(circle, rgba(255, 212, 0, 0.08) 0%, transparent 70%)",
          willChange: "transform"
        }}
      />

      {/* Layer 2: Small Glowing Particles */}
      <div className="absolute inset-0 w-full h-full">
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#FFD400] blur-[0.5px]"
            style={{
              left: p.left,
              top: p.top,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animation: `particle-drift ${p.duration} ease-in-out infinite`,
              animationDelay: p.delay,
              willChange: "transform"
            }}
          />
        ))}
      </div>

      {/* Layer 4: Noise Texture Grain Overlay */}
      <div 
        className="absolute inset-0 w-full h-full opacity-[0.02] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Ambient Vignette Border Cover */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          background: "radial-gradient(circle at 50% 50%, transparent 30%, rgba(5, 5, 5, 0.8) 100%)"
        }}
      />
    </div>
  );
}

export default LuxuryBackground;
