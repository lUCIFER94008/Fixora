"use client";

import React from "react";
import LuxuryBackground from "@/components/background/LuxuryBackground";

export default function BackgroundWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LuxuryBackground />

      <div className="relative z-10">
        {children}
      </div>
    </>
  );
}
