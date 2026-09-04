import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { toast } from "@heroui/react";

import { PipTimerCard } from "@/components/pomodoro/pip-timer-card";

interface PipContextValue {
  isPipActive: boolean;
  isSupported: boolean;
  openPip: () => Promise<void>;
  closePip: () => void;
  togglePip: () => void;
}

const PipContext = createContext<PipContextValue | null>(null);

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

  const isSupported =
    typeof window !== "undefined" &&
    ("documentPictureInPicture" in window || typeof window.open === "function");

  const closePip = useCallback(() => {
    if (pipWindow && !pipWindow.closed) {
      pipWindow.close();
    }
    setPipWindow(null);
    setIsPipActive(false);
  }, [pipWindow]);

  const openPip = useCallback(async () => {
    if (pipWindow && !pipWindow.closed) {
      pipWindow.focus();

      return;
    }

    try {
      let win: Window | null = null;
      const dimensions = getSavedPipDimensions();

      if (
        "documentPictureInPicture" in window &&
        window.documentPictureInPicture
      ) {
        // Modern Chromium browsers: OS-level always-on-top Picture-in-Picture window
        win = await window.documentPictureInPicture.requestWindow({
          width: dimensions.width,
          height: dimensions.height,
        });
      } else {
        // Fallback for other browsers: floating popup window
        win = window.open(
          "",
          "CozifyPomodoroPiP",
          `width=${dimensions.width},height=${dimensions.height},menubar=no,toolbar=no,location=no,status=no,resizable=yes`,
        );
      }

      if (!win) {
        toast.danger("Could not open pop-out window. Please allow popups.");

        return;
      }

      copyStyles(document, win.document);

      // Listen for window resize to remember user-preferred dimensions dynamically
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

      // Sync dark mode and theme CSS variable changes in real-time
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
  }, [pipWindow]);

  const togglePip = useCallback(() => {
    if (isPipActive && pipWindow && !pipWindow.closed) {
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
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      if (pipWindow && !pipWindow.closed) {
        pipWindow.close();
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
      {isPipActive &&
        pipWindow &&
        !pipWindow.closed &&
        createPortal(<PipTimerCard />, pipWindow.document.body)}
    </PipContext.Provider>
  );
}

export function usePip() {
  const context = useContext(PipContext);

  if (!context) {
    throw new Error("usePip must be used within a PipProvider");
  }

  return context;
}
