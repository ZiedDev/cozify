import { useRef, useState, useEffect, ReactNode } from "react";
import gsap from "gsap";

export type MarqueeProps = {
  /** The text content to display and scroll */
  text: string;
  /** When true, continuously animates (e.g. for playing music tracks) */
  isPlaying?: boolean;
  /** When true, automatically activates marquee on hover if text is overflowing */
  playOnHover?: boolean;
  /** Controlled hover state passed from a parent element */
  isHovered?: boolean;
  /** Tailwind or CSS classes applied to the text span */
  className?: string;
  /** Tailwind or CSS classes applied to the container */
  containerClassName?: string;
  /** Scroll speed in pixels per second. Default: 26 for hover, 12 for isPlaying */
  speed?: number;
  /** Initial delay before scroll starts in seconds. Default: 0.5 for hover, 2.5 for isPlaying */
  startDelay?: number;
  /** Pause duration at the start and end of scroll in seconds. Default: 1.2 for hover, 2.5 for isPlaying */
  pauseDuration?: number;
  /** Text alignment when not overflowing. Default: 'start' */
  align?: "start" | "center";
  /** Optional children to render alongside or after text */
  children?: ReactNode;
};

export function Marquee({
  text,
  isPlaying = false,
  playOnHover = false,
  isHovered,
  className = "",
  containerClassName = "",
  speed,
  startDelay,
  pauseDuration,
  align = "start",
  children,
}: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(0);
  const [internalHover, setInternalHover] = useState(false);

  // Active hover state: prefer controlled isHovered if provided, otherwise internalHover
  const effectiveHover = isHovered !== undefined ? isHovered : internalHover;

  // Determine whether animation should be running
  const shouldAnimate =
    overflow > 0 && (isPlaying || (playOnHover && effectiveHover));

  // Resolved animation timing parameters
  const effectiveSpeed = speed ?? (playOnHover ? 26 : 12);
  const effectiveStartDelay =
    startDelay ?? (playOnHover ? (isPlaying ? 2.5 : 0.5) : 2.5);
  const effectivePause =
    pauseDuration ?? (playOnHover ? (isPlaying ? 2.5 : 1.2) : 2.5);

  // Measure overflow dynamically on text change, container resize, and font loading
  useEffect(() => {
    const checkOverflow = () => {
      if (!containerRef.current || !textRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const textWidth = textRef.current.scrollWidth;
      const diff = textWidth - containerWidth;

      setOverflow(diff > 3 ? Math.ceil(diff) : 0);
    };

    checkOverflow();

    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(checkOverflow);
    }

    const ro = new ResizeObserver(() => {
      checkOverflow();
    });

    if (containerRef.current) {
      ro.observe(containerRef.current);
    }

    return () => ro.disconnect();
  }, [text]);

  // GSAP animation controlling the ping-pong auto-scroll
  useEffect(() => {
    const el = textRef.current;

    if (!el) return;

    if (!shouldAnimate || overflow <= 0) {
      // Smoothly reset back to start position
      gsap.killTweensOf(el);
      gsap.to(el, { x: 0, duration: 0.35, ease: "power2.out" });

      return;
    }

    // Calculate natural scroll duration based on overflow distance and speed
    const scrollDuration = Math.max(1.5, overflow / effectiveSpeed);

    const ctx = gsap.context(() => {
      gsap.killTweensOf(el);
      gsap.set(el, { x: 0 });

      const tl = gsap.timeline({
        repeat: -1,
        delay: effectiveStartDelay,
        repeatDelay: effectivePause,
      });

      tl.to(el, {
        x: -overflow,
        duration: scrollDuration,
        ease: "sine.inOut",
      })
        .to(el, {
          x: -overflow,
          duration: effectivePause,
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
  }, [
    shouldAnimate,
    overflow,
    effectiveSpeed,
    effectiveStartDelay,
    effectivePause,
    text,
  ]);

  const isCentered = align === "center" && overflow <= 0;

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden select-none min-w-0 ${
        isCentered ? "flex justify-center" : "block text-left"
      } ${containerClassName}`}
      title={overflow > 0 ? text : undefined}
      onMouseEnter={() => {
        if (playOnHover) setInternalHover(true);
      }}
      onMouseLeave={() => {
        if (playOnHover) setInternalHover(false);
      }}
    >
      <span
        ref={textRef}
        className={`inline-block will-change-transform whitespace-nowrap ${className}`}
      >
        {text}
        {children}
      </span>
    </div>
  );
}
