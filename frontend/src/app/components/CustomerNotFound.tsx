"use client";

import React, { useEffect, useRef } from "react";

export default function CustomerNotFound() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      const pos = `${x}px ${y}px`;
      
      overlay.style.maskImage = `radial-gradient(circle 120px at ${pos}, transparent 0%, black 150px)`;
      overlay.style.webkitMaskImage = overlay.style.maskImage;
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="relative w-screen h-screen bg-gray-900 text-white overflow-hidden">
      {/* Main content hidden by default, revealed by spotlight */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <h1 className="text-6xl font-bold mb-4">Stage suspended</h1>
        <p className="text-xl">Use production environment</p>
        <a
          href="http://ta-da.co"
          className="mt-6 px-4 py-2 bg-black text-white hover:bg-white hover:text-black rounded transition-colors"
        >
          Go to production
        </a>
      </div>

      {/* Dark overlay with spotlight mask */}
      <div
        ref={overlayRef}
        id="overlay"
        className="absolute inset-0 bg-black z-20 pointer-events-none"
        style={{
          maskImage: "radial-gradient(circle 120px at 50% 50%, transparent 0%, black 150px)",
          WebkitMaskImage: "radial-gradient(circle 120px at 50% 50%, transparent 0%, black 150px)",
        }}
      />
    </div>
  );
}

