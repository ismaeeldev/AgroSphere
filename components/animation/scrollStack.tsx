"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, MotionValue } from "framer-motion";

interface ScrollStackProps {
  children: React.ReactNode[];
}

export function ScrollStack({ children }: ScrollStackProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Reduced scroll budget to make transitions faster and more responsive.
  //   - Each section gets 40vh of "reading" scroll (the active phase)
  //   - Each transition gets 30vh
  //   - Total for 3 sections: 3*40 + 2*30 = 180vh (approx 2 screen heights total)
  const n = children.length;
  const totalHeightVh = n * 40 + (n - 1) * 30;
  const totalHeight = `${totalHeightVh}vh`;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Apply incredibly sleek, floaty physics to make the scroll feel luxurious and cinematic.
  // Apply ultra-smooth, production-grade physics. 
  // Lower stiffness and higher damping create a more fluid, "organic" feel.
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 25,
    mass: 1,
    restDelta: 0.0001
  });

  return (
    <div
      ref={containerRef}
      style={{ height: totalHeight }}
      className="relative w-full"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#F8FAF8]">
        {children.map((child, index) => {
          return (
            <ScrollStackItem
              key={index}
              index={index}
              total={children.length}
              progress={smoothProgress}
            >
              {child}
            </ScrollStackItem>
          );
        })}
      </div>
    </div>
  );
}

interface ScrollStackItemProps {
  children: React.ReactNode;
  index: number;
  total: number;
  progress: MotionValue<number>;
}

function ScrollStackItem({ children, index, total, progress }: ScrollStackItemProps) {
  const numPhases = 2 * total - 1;
  const phaseLength = 1 / numPhases;

  const activeStart = (2 * index) * phaseLength;
  const activeEnd = (2 * index + 1) * phaseLength;
  const enterStart = index === 0 ? activeStart : (2 * index - 1) * phaseLength;
  const enterEnd = activeStart;
  const fadeStart = activeEnd;
  const fadeEnd = index === total - 1 ? activeEnd : (2 * index + 2) * phaseLength;

  const getMapping = <T,>(enterVal: T, activeVal: T, fadeVal: T) => {
    if (total === 1) return { in: [0, 1], out: [activeVal, activeVal] };
    if (index === 0) return { in: [activeStart, fadeStart, fadeEnd], out: [activeVal, activeVal, fadeVal] };
    if (index === total - 1) return { in: [enterStart, enterEnd, activeEnd], out: [enterVal, activeVal, activeVal] };
    return { in: [enterStart, enterEnd, fadeStart, fadeEnd], out: [enterVal, activeVal, activeVal, fadeVal] };
  };

  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);

  useEffect(() => {
    if (!contentRef.current) return;

    setContentHeight(contentRef.current.scrollHeight);
    setWindowHeight(window.innerHeight);

    const resizeObserver = new ResizeObserver(() => {
      setContentHeight(contentRef.current?.scrollHeight || 0);
      setWindowHeight(window.innerHeight);
    });

    resizeObserver.observe(contentRef.current);
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [children]);

  const maxScroll = Math.max(0, contentHeight - windowHeight);

  // 1. Scale: Subtle shrink as it goes behind
  const scaleMap = getMapping(1, 1, 0.92);
  const scale = useTransform(progress, scaleMap.in, scaleMap.out);

  // 2. Opacity: Remains solid but the overlay handles the "darkening"
  const opacityMap = getMapping(1, 1, 0.6);
  const opacity = useTransform(progress, opacityMap.in, opacityMap.out);

  // 3. Performance Fix: Replace expensive 'filter: blur' with a simple overlay opacity.
  // This prevents the "fluctuation" and frame drops caused by real-time blurring.
  const overlayOpacityMap = getMapping(0, 0, 0.7);
  const overlayOpacity = useTransform(progress, overlayOpacityMap.in, overlayOpacityMap.out);

  // 4. Parallax entrance: From below the screen to center, then slightly sink back.
  const yMap = getMapping("100vh", "0vh", "-15vh");
  const yOffset = useTransform(progress, yMap.in, yMap.out);

  const innerProgressRange = [activeStart, activeEnd];
  const innerY = useTransform(progress, innerProgressRange, [0, -maxScroll]);

  return (
    <motion.div
      className="absolute top-0 left-0 w-full h-screen origin-top will-change-transform"
      style={{
        scale,
        opacity,
        y: yOffset,
        zIndex: index,
      }}
    >
      <motion.div
        ref={contentRef}
        className="w-full h-auto will-change-transform rounded-t-[3rem] shadow-[0_-40px_100px_rgba(0,0,0,0.12)] bg-white border-t border-white/40 relative overflow-hidden"
        style={{ y: innerY }}
      >
        {/* Performance Overlay: Fades in to darken the card when it goes behind the stack */}
        <motion.div 
          className="absolute inset-0 bg-[#0A1F0B] pointer-events-none z-50"
          style={{ opacity: overlayOpacity }}
        />
        
        {children}
      </motion.div>
    </motion.div>
  );
}
