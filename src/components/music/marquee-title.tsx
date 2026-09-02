import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";

interface MarqueeTitleProps {
  text: string;
  isPlaying?: boolean;
  className?: string;
  speed?: number; // pixels per second (default: 12 for smooth, relaxed reading)
  pauseDuration?: number; // pause at endpoints in seconds (default: 2.5)
  align?: "start" | "center";
}

export function MarqueeTitle({
  text,
  isPlaying = false,
  className = "",
  speed = 12,
  pauseDuration = 2.5,
  align = "start",
}: MarqueeTitleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(0);

  // Measure overflow dynamically on text change and container resize
  useEffect(() => {
    const checkOverflow = () => {
      if (!containerRef.current || !textRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const textWidth = textRef.current.scrollWidth;
      const diff = textWidth - containerWidth;

      setOverflow(diff > 3 ? diff : 0);
    };

    checkOverflow();

    const ro = new ResizeObserver(() => {
      checkOverflow();
    });

    if (containerRef.current) {
      ro.observe(containerRef.current);
    }

    return () => ro.disconnect();
  }, [text]);

  // GSAP animation controlling the natural ping-pong auto-scroll
  useEffect(() => {
    const el = textRef.current;

    if (!el) return;

    if (!isPlaying || overflow <= 0) {
      // If paused or no overflow, smoothly reset to start
      gsap.killTweensOf(el);
      gsap.to(el, { x: 0, duration: 0.4, ease: "power2.out" });

      return;
    }

    // Calculate natural scroll duration based on overflow distance and speed
    const scrollDuration = Math.max(3.5, overflow / speed);

    const ctx = gsap.context(() => {
      gsap.killTweensOf(el);
      gsap.set(el, { x: 0 });

      const tl = gsap.timeline({
        repeat: -1,
        delay: pauseDuration,
        repeatDelay: pauseDuration,
      });

      tl.to(el, {
        x: -overflow,
        duration: scrollDuration,
        ease: "sine.inOut",
      })
        .to(el, {
          x: -overflow,
          duration: pauseDuration,
        })
        .to(el, {
          x: 0,
          duration: scrollDuration,
          ease: "sine.inOut",
        });
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, [isPlaying, overflow, speed, pauseDuration, text]);

  const isCentered = align === "center" && overflow <= 0;

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-hidden select-none pointer-events-none whitespace-nowrap min-w-0 ${
        isCentered ? "flex justify-center" : "block text-left"
      }`}
    >
      <span
        ref={textRef}
        className={`inline-block will-change-transform whitespace-nowrap ${className}`}
      >
        {text}
      </span>
    </div>
  );
}
