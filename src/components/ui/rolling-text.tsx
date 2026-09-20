import { useRef, useEffect, useState, useId } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export interface RollingTextProps {
  /** Text or number to display with rolling animation */
  value: string | number;
  /** Optional container className */
  className?: string;
  /** Optional individual character className */
  charClassName?: string;
  /** Key to trigger a full staggered roll-in (e.g. mode switch, reset) */
  triggerKey?: string | number | boolean;
  /** Stagger delay between characters on entrance (seconds) */
  stagger?: number;
  /** Whether to animate full staggered entrance on initial mount */
  staggerOnMount?: boolean;
  /** Animation duration for digit changes (seconds) */
  duration?: number;
  /** 3D Perspective in px */
  perspective?: number;
}

interface RollingCharProps {
  char: string;
  isSpecial?: boolean;
  duration?: number;
  charClassName?: string;
}

function RollingChar({
  char,
  isSpecial = false,
  duration = 0.45,
  charClassName = "",
}: RollingCharProps) {
  const [currentVal, setCurrentVal] = useState(char);
  const [prevVal, setPrevVal] = useState<string | null>(null);

  const containerRef = useRef<HTMLSpanElement>(null);
  const incomingRef = useRef<HTMLSpanElement>(null);
  const outgoingRef = useRef<HTMLSpanElement>(null);

  // Sync incoming char updates
  useEffect(() => {
    if (char !== currentVal) {
      setPrevVal(currentVal);
      setCurrentVal(char);
    }
  }, [char, currentVal]);

  // 3D cylinder rolling animation
  useGSAP(
    () => {
      if (prevVal === null || !incomingRef.current || !outgoingRef.current) {
        return;
      }

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        setPrevVal(null);

        return;
      }

      const tl = gsap.timeline({
        onComplete: () => {
          setPrevVal(null);
        },
      });

      // Outgoing character curves away downwards along 3D cylinder
      tl.fromTo(
        outgoingRef.current,
        {
          rotateX: 0,
          yPercent: 0,
          opacity: 1,
          scale: 1,
        },
        {
          rotateX: -75,
          yPercent: 85,
          opacity: 0,
          scale: 0.88,
          duration,
          ease: "power2.inOut",
        },
        0,
      );

      // Incoming character curves in downwards from top
      tl.fromTo(
        incomingRef.current,
        {
          rotateX: 75,
          yPercent: -85,
          opacity: 0,
          scale: 0.88,
        },
        {
          rotateX: 0,
          yPercent: 0,
          opacity: 1,
          scale: 1,
          duration,
          ease: "back.out(1.15)",
        },
        0,
      );

      return () => {
        tl.kill();
      };
    },
    { dependencies: [currentVal, prevVal, duration], scope: containerRef },
  );

  // Colons stay steady to avoid visual jitter during clock ticks
  if (isSpecial) {
    return (
      <span
        className={`inline-flex items-center justify-center min-w-[0.28em] h-[1.12em] select-none text-center ${charClassName}`}
      >
        <span className="flex items-center justify-center">{char}</span>
      </span>
    );
  }

  // Preserve whitespace width
  if (char === " ") {
    return <span className="inline-flex w-[0.3em]">&nbsp;</span>;
  }

  const isNumeric = /\d/.test(char);

  return (
    <span
      ref={containerRef}
      className={`relative inline-flex items-center justify-center ${
        isNumeric ? "min-w-[0.58em]" : "min-w-[0.45em]"
      } h-[1.12em] overflow-hidden select-none ${charClassName}`}
      style={{
        perspective: "600px",
        transformStyle: "preserve-3d",
      }}
    >
      {prevVal !== null && (
        <span
          ref={outgoingRef}
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transformOrigin: "50% 50% -0.42em",
            backfaceVisibility: "hidden",
          }}
        >
          {prevVal}
        </span>
      )}
      <span
        ref={incomingRef}
        className="flex items-center justify-center"
        style={{
          transformOrigin: "50% 50% -0.42em",
          backfaceVisibility: "hidden",
        }}
      >
        {currentVal}
      </span>
    </span>
  );
}

export function RollingText({
  value,
  className = "",
  charClassName = "",
  triggerKey,
  stagger = 0.05,
  staggerOnMount = true,
  duration = 0.45,
  perspective = 800,
}: RollingTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const stringValue = String(value);
  const chars = stringValue.split("");
  const totalChars = chars.length;
  const isFirstRender = useRef(true);
  const id = useId();

  // Full staggered entrance animation
  useGSAP(
    () => {
      if (!containerRef.current) return;

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) return;

      if (isFirstRender.current && !staggerOnMount) {
        isFirstRender.current = false;

        return;
      }
      isFirstRender.current = false;

      const digitElements = containerRef.current.children;

      gsap.fromTo(
        digitElements,
        {
          rotateX: 80,
          yPercent: -80,
          opacity: 0,
          scale: 0.85,
        },
        {
          rotateX: 0,
          yPercent: 0,
          opacity: 1,
          scale: 1,
          duration: duration + 0.1,
          stagger,
          ease: "back.out(1.2)",
          overwrite: "auto",
        },
      );
    },
    { dependencies: [triggerKey, duration, stagger], scope: containerRef },
  );

  return (
    <span
      ref={containerRef}
      aria-label={stringValue}
      className={`inline-flex items-center justify-center tabular-nums leading-none ${className}`}
      style={{
        perspective: `${perspective}px`,
        transformStyle: "preserve-3d",
      }}
    >
      {chars.map((char, index) => {
        // Compute reverse index from right so digit columns stay stable in numerical contexts
        const indexFromRight = totalChars - 1 - index;
        const isSpecial = char === ":";
        const key = isSpecial
          ? `${id}-colon-${index}`
          : `${id}-slot-${indexFromRight}`;

        return (
          <RollingChar
            key={key}
            char={char}
            charClassName={charClassName}
            duration={duration}
            isSpecial={isSpecial}
          />
        );
      })}
    </span>
  );
}
