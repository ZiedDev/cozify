import {
  createContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { toast } from "@heroui/react";

import {
  mobilePipManager,
  isVideoPipSupported,
  isMobileDevice,
} from "./mobile-pip-manager";

import { PipTimerCard } from "@/components/pomodoro";
import { useTimer } from "@/hooks/use-timer";
import { useTheme } from "@/hooks/use-theme";
import { calculateCycleProgressPercent } from "@/menus/pomodoro/logic/cycle-rules";

type PipContextValue = {
  isPipActive: boolean;
  isSupported: boolean;
  openPip: () => Promise<void>;
  closePip: () => void;
  togglePip: () => void;
};

export const PipContext = createContext<PipContextValue | null>(null);

const DEFAULT_PIP_WIDTH = 400;
const DEFAULT_PIP_HEIGHT = 240;

function getSavedPipDimensions(): { width: number; height: number } {
  try {
    const saved = localStorage.getItem("cozify_pip_dimensions");

    if (saved) {
      const parsed = JSON.parse(saved);

      if (
        typeof parsed?.width === "number" &&
        typeof parsed?.height === "number" &&
        parsed.width >= 260 &&
        parsed.height >= 160
      ) {
        return { width: parsed.width, height: parsed.height };
      }
    }
  } catch {
    // Ignore storage parse error
  }

  return { width: DEFAULT_PIP_WIDTH, height: DEFAULT_PIP_HEIGHT };
}

function copyStyles(sourceDoc: Document, targetDoc: Document) {
  targetDoc.title = "Cozify Pomodoro";

  // 1. Copy <link> tags (e.g. fonts, stylesheets)
  const links = sourceDoc.querySelectorAll<HTMLLinkElement>(
    "link[rel='stylesheet'], link[rel='preconnect'], link[rel='dns-prefetch']",
  );

  links.forEach((link) => {
    targetDoc.head.appendChild(link.cloneNode(true));
  });

  // 2. Copy inline <style> tags (e.g. Vite dynamic style injections)
  const styles = sourceDoc.querySelectorAll("style");

  styles.forEach((style) => {
    targetDoc.head.appendChild(style.cloneNode(true));
  });

  // 3. Fallback: inspect document.styleSheets for any compiled rules
  try {
    Array.from(sourceDoc.styleSheets).forEach((sheet) => {
      try {
        if (!sheet.href && sheet.cssRules && sheet.cssRules.length > 0) {
          const styleEl = targetDoc.createElement("style");

          Array.from(sheet.cssRules).forEach((rule) => {
            styleEl.appendChild(targetDoc.createTextNode(rule.cssText));
          });
          targetDoc.head.appendChild(styleEl);
        }
      } catch {
        // Cross-origin stylesheet access guard
      }
    });
  } catch {
    // Ignore enumeration errors
  }

  // 4. Mirror html root class, style, and data attributes (dark mode, CSS variables)
  targetDoc.documentElement.className = sourceDoc.documentElement.className;
  targetDoc.documentElement.style.cssText =
    sourceDoc.documentElement.style.cssText;
  if (sourceDoc.documentElement.hasAttribute("data-theme")) {
    targetDoc.documentElement.setAttribute(
      "data-theme",
      sourceDoc.documentElement.getAttribute("data-theme") || "",
    );
  }

  targetDoc.body.className =
    "bg-background text-foreground m-0 p-0 overflow-hidden select-none font-sans antialiased";
}

export function PipProvider({ children }: { children: ReactNode }) {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [isPipActive, setIsPipActive] = useState<boolean>(false);
  const [isMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;

    return isMobileDevice();
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    mode,
    formattedTime,
    timeLeft,
    durations,
    currentCycle,
    targetCycles,
    isRunning,
    isOvertime,
    start,
    pause,
    addMinutes,
  } = useTimer();

  const progressPercent = calculateCycleProgressPercent(
    mode,
    timeLeft,
    durations.focus,
  );

  const startRef = useRef(start);
  const pauseRef = useRef(pause);
  const addMinutesRef = useRef(addMinutes);

  useEffect(() => {
    if (!isMobile) return;
    startRef.current = start;
    pauseRef.current = pause;
    addMinutesRef.current = addMinutes;
    mobilePipManager.updateCallbacks(
      () => startRef.current(),
      () => pauseRef.current(),
      (seconds) => addMinutesRef.current(seconds >= 0 ? 1 : -1),
    );
  }, [isMobile, start, pause, addMinutes]);

  useEffect(() => {
    if (isMobile && videoRef.current && canvasRef.current) {
      mobilePipManager.init(videoRef.current, canvasRef.current);
    }
  }, [isMobile]);

  const { activeBackground, overlayOpacity, blur, hue } = useTheme();

  const pipTheme = useMemo(() => {
    let accentColor = "#f59e0b";
    let backgroundColor = "#0c0d14";

    if (typeof window !== "undefined") {
      try {
        const style = getComputedStyle(document.documentElement);
        const accent = style.getPropertyValue("--accent").trim();
        const bg = style.getPropertyValue("--background").trim();

        if (accent) accentColor = accent;
        if (bg) backgroundColor = bg;
      } catch {
        // Ignore computed style access guard
      }
    }

    return {
      backgroundUrl: activeBackground?.url || null,
      overlayOpacity,
      blur,
      accentColor,
      backgroundColor,
    };
  }, [activeBackground?.url, overlayOpacity, blur, hue]);

  // Synchronize clock ticks and timer state to the mobile PiP canvas and MediaSession
  useEffect(() => {
    if (!isMobile) return;
    if (isPipActive && mobilePipManager.getActive()) {
      mobilePipManager.updateState({
        formattedTime,
        mode,
        currentCycle,
        targetCycles,
        progressPercent,
        isRunning,
        isOvertime,
        theme: pipTheme,
      });
    }
  }, [
    isMobile,
    isPipActive,
    formattedTime,
    mode,
    currentCycle,
    targetCycles,
    progressPercent,
    isRunning,
    isOvertime,
    pipTheme,
  ]);

  const isSupported =
    typeof window !== "undefined" &&
    (isMobile
      ? isVideoPipSupported()
      : Boolean(
          "documentPictureInPicture" in window &&
          window.documentPictureInPicture,
        ));

  const closePip = useCallback(() => {
    if (pipWindow && !pipWindow.closed) {
      pipWindow.close();
    }
    setPipWindow(null);

    if (mobilePipManager.getActive()) {
      mobilePipManager.closePip();
    }

    setIsPipActive(false);
  }, [pipWindow]);

  const openPip = useCallback(async () => {
    // 1. If already active in Document PiP, focus it
    if (pipWindow && !pipWindow.closed) {
      pipWindow.focus();

      return;
    }

    // 2. Desktop: Document Picture-in-Picture only (completely disabled video pip on desktop)
    if (!isMobile) {
      if (
        "documentPictureInPicture" in window &&
        window.documentPictureInPicture
      ) {
        try {
          const dimensions = getSavedPipDimensions();
          const win = await window.documentPictureInPicture.requestWindow({
            width: dimensions.width,
            height: dimensions.height,
          });

          if (!win) {
            toast.danger("Could not open pop-out window");

            return;
          }

          copyStyles(document, win.document);

          let resizeTimer: ReturnType<typeof setTimeout> | null = null;
          const handleResize = () => {
            if (resizeTimer) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
              if (win && !win.closed) {
                try {
                  localStorage.setItem(
                    "cozify_pip_dimensions",
                    JSON.stringify({
                      width: win.innerWidth,
                      height: win.innerHeight,
                    }),
                  );
                } catch {
                  // Ignore storage errors
                }
              }
            }, 300);
          };

          win.addEventListener("resize", handleResize);

          const observer = new MutationObserver(() => {
            if (win && !win.closed) {
              win.document.documentElement.className =
                document.documentElement.className;
              win.document.documentElement.style.cssText =
                document.documentElement.style.cssText;
              if (document.documentElement.hasAttribute("data-theme")) {
                win.document.documentElement.setAttribute(
                  "data-theme",
                  document.documentElement.getAttribute("data-theme") || "",
                );
              }
            }
          });

          observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class", "style", "data-theme"],
          });

          const handleClose = () => {
            if (resizeTimer) clearTimeout(resizeTimer);
            win?.removeEventListener("resize", handleResize);
            observer.disconnect();
            setPipWindow(null);
            setIsPipActive(false);
          };

          win.addEventListener("pagehide", handleClose);
          win.addEventListener("beforeunload", handleClose);

          setPipWindow(win);
          setIsPipActive(true);
        } catch {
          toast.danger("Failed to open floating window");
        }

        return;
      }

      toast.danger("Floating window is not supported by your desktop browser");

      return;
    }

    // 3. Mobile only: Video Picture-in-Picture fallback (iOS Safari, Android Chrome, etc.)
    if (isVideoPipSupported()) {
      try {
        await mobilePipManager.openPip({
          state: {
            formattedTime,
            mode,
            currentCycle,
            targetCycles,
            progressPercent,
            isRunning,
            isOvertime,
            theme: pipTheme,
          },
          onPlay: () => startRef.current(),
          onPause: () => pauseRef.current(),
          onClose: () => {
            setIsPipActive(false);
          },
        });
        setIsPipActive(true);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Picture-in-Picture failed";

        toast.danger(`Failed to open Picture-in-Picture: ${errorMsg}`);
      }

      return;
    }

    toast.danger("Picture-in-Picture is not supported on this device");
  }, [
    isMobile,
    pipWindow,
    formattedTime,
    mode,
    currentCycle,
    targetCycles,
    progressPercent,
    isRunning,
    isOvertime,
    pipTheme,
  ]);

  const togglePip = useCallback(() => {
    if (
      (isPipActive && pipWindow && !pipWindow.closed) ||
      (isPipActive && mobilePipManager.getActive())
    ) {
      closePip();
    } else {
      openPip();
    }
  }, [isPipActive, pipWindow, closePip, openPip]);

  // Clean up floating window when the main tab/window unloads
  useEffect(() => {
    const handleUnload = () => {
      if (pipWindow && !pipWindow.closed) {
        pipWindow.close();
      }
      if (mobilePipManager.getActive()) {
        mobilePipManager.cleanup();
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      if (pipWindow && !pipWindow.closed) {
        pipWindow.close();
      }
      if (mobilePipManager.getActive()) {
        mobilePipManager.cleanup();
      }
    };
  }, [pipWindow]);

  return (
    <PipContext.Provider
      value={{
        isPipActive,
        isSupported,
        openPip,
        closePip,
        togglePip,
      }}
    >
      {children}

      {/* Mobile Video PiP Bridge (centered in screen behind background so iOS PiP pops up smoothly from center, completely disabled on desktop) */}
      {isMobile && (
        <div
          aria-hidden="true"
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none -z-50 w-[480px] h-[270px] max-w-[85vw] max-h-[85vh] aspect-video overflow-hidden"
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 block w-full h-full"
            height={270}
            width={480}
          />
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 block w-full h-full aspect-video object-cover"
            height={270}
            width={480}
          />
        </div>
      )}
      {/* Desktop Document PiP Portal */}
      {isPipActive &&
        pipWindow &&
        !pipWindow.closed &&
        createPortal(<PipTimerCard />, pipWindow.document.body)}
    </PipContext.Provider>
  );
}

export { usePip } from "@/hooks/use-pip";
