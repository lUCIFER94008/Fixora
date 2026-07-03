"use client";

import React, { ReactNode } from "react";
import LuxuryBackground from "@/components/background/LuxuryBackground";

interface GlobalBackgroundProps {
  children: ReactNode;
}

export default function GlobalBackground({ children }: GlobalBackgroundProps) {
  return (
    <div className="relative min-h-screen w-full bg-[#080808] text-white overflow-x-hidden">
      
      <LuxuryBackground />

      {/* Content wrapper */}
      <main className="relative z-10 w-full min-h-screen flex flex-col">
        {children}
      </main>

    </div>
  );
}
