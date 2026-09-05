export interface CanvasTimerTheme {
  backgroundUrl?: string | null;
  overlayOpacity?: number; // 0 to 100
  blur?: number; // px
  accentColor?: string;
  backgroundColor?: string;
}

export interface CanvasTimerState {
  formattedTime: string;
  mode: "focus" | "shortBreak" | "longBreak";
  currentCycle: number;
  targetCycles: number;
  progressPercent: number; // 0 to 100
  isRunning: boolean;
  isOvertime: boolean;
  theme?: CanvasTimerTheme;
}

export const CANVAS_PIP_WIDTH = 480;
export const CANVAS_PIP_HEIGHT = 270;

let cachedBgImage: HTMLImageElement | null = null;
let cachedBgUrl: string | null = null;

function getOrLoadBgImage(
  url: string | null | undefined,
  onLoaded?: () => void,
): HTMLImageElement | null {
  if (!url) {
    cachedBgUrl = null;
    cachedBgImage = null;

    return null;
  }
  if (url === cachedBgUrl && cachedBgImage) {
    return cachedBgImage;
  }
  cachedBgUrl = url;
  const img = new Image();

  img.crossOrigin = "anonymous";
  img.onload = () => {
    cachedBgImage = img;
    onLoaded?.();
  };
  img.onerror = () => {
    cachedBgImage = null;
  };
  img.src = url;

  return null;
}

export function drawTimerToCanvas(
  canvas: HTMLCanvasElement,
  state: CanvasTimerState,
) {
  try {
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const {
      formattedTime,
      mode,
      currentCycle,
      targetCycles,
      progressPercent,
      isOvertime,
      theme,
    } = state;

    const width = canvas.width || CANVAS_PIP_WIDTH;
    const height = canvas.height || CANVAS_PIP_HEIGHT;
    const cx = width / 2;

    // Font family matching Cozify's typography
    const fontSans =
      "'Varela Round', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    // User's customized theme accent color (matching the app's CSS --accent variable)
    const accentColor = theme?.accentColor || "#f59e0b";
    const modeLabels: Record<string, string> = {
      focus: "Focus",
      shortBreak: "Short Break",
      longBreak: "Long Break",
    };
    const modeLabel = modeLabels[mode] || "Focus";

    // 1. Solid Base Background Color
    const defaultBg = theme?.backgroundColor || "#0c0d14";

    ctx.fillStyle = defaultBg;
    ctx.fillRect(0, 0, width, height);

    // 2. Customized Background Wallpaper (with User's Blur & Dimming)
    const bgImg = getOrLoadBgImage(theme?.backgroundUrl, () => {
      drawTimerToCanvas(canvas, state);
    });

    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      ctx.save();
      const blurPx = Math.max(0, Math.min(25, theme?.blur ?? 0));

      try {
        if (blurPx > 0) {
          ctx.filter = `blur(${blurPx}px)`;
        }
      } catch {
        // Ignore filter syntax error
      }

      // Aspect cover positioning
      const imgRatio = bgImg.naturalWidth / bgImg.naturalHeight;
      const canvasRatio = width / height;
      let renderW = width;
      let renderH = height;
      let renderX = 0;
      let renderY = 0;

      if (imgRatio > canvasRatio) {
        renderW = height * imgRatio;
        renderX = (width - renderW) / 2;
      } else {
        renderH = width / imgRatio;
        renderY = (height - renderH) / 2;
      }

      const bleed = blurPx > 0 ? blurPx * 2 : 0;

      ctx.drawImage(
        bgImg,
        renderX - bleed,
        renderY - bleed,
        renderW + bleed * 2,
        renderH + bleed * 2,
      );
      ctx.restore();

      // Contrast Dimming Overlay matching user's overlayOpacity
      const overlayAlpha =
        Math.max(0, Math.min(100, theme?.overlayOpacity ?? 45)) / 100;

      ctx.fillStyle = `rgba(12, 13, 20, ${overlayAlpha})`;
      ctx.fillRect(0, 0, width, height);
    }

    // 3. Ambient radial glow behind large time digits (using globalAlpha to support oklch/rgb/hex)
    ctx.save();
    ctx.globalAlpha = 0.22;
    const glow = ctx.createRadialGradient(cx, 110, 10, cx, 110, 180);

    glow.addColorStop(0, accentColor);
    glow.addColorStop(1, "rgba(12, 13, 20, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // 4. Mode Pill Badge (Top - Solid filled accent pill with white text, matching Pomo menu tabs)
    ctx.font = `600 12px ${fontSans}`;
    const textMetrics = ctx.measureText(modeLabel);
    const pillW = Math.max(90, Math.ceil(textMetrics.width + 32));
    const pillH = 26;
    const pillX = cx - pillW / 2;
    const pillY = 16;
    const pillR = 13;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, pillR);
    ctx.fillStyle = accentColor;
    ctx.fill();
    ctx.restore();

    ctx.font = `600 12px ${fontSans}`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(modeLabel, cx, pillY + pillH / 2 + 0.5);

    // 5. Large Bold Digital Timer Digits (Center, Expanded to 92px!)
    ctx.font = `bold 92px ${fontSans}`;
    ctx.fillStyle = isOvertime ? accentColor : "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(formattedTime, cx, 108);

    // 6. Minutes & Seconds Indicators (Subtle uppercase sub-labels)
    ctx.font = `600 10px ${fontSans}`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("MINUTES", cx - 72, 158);
    ctx.fillText("SECONDS", cx + 72, 158);

    // 7. Cozify Mini Cycle Tracker (Individual rounded capsule pills at bottom)
    const totalCycles = Math.max(1, Math.min(12, targetCycles));
    const capsuleW = totalCycles > 8 ? 28 : totalCycles > 5 ? 38 : 50;
    const capsuleH = 8;
    const capsuleR = 4;
    const gap = 8;
    const totalBarW = totalCycles * capsuleW + (totalCycles - 1) * gap;
    let startCapsuleX = cx - totalBarW / 2;
    const capsuleY = 200;

    for (let i = 1; i <= totalCycles; i++) {
      const isCurrent = i === currentCycle;
      const isCompleted = i < currentCycle;

      if (isCurrent) {
        // Active cycle: highlight outer halo ring
        ctx.beginPath();
        ctx.roundRect(
          startCapsuleX - 2.5,
          capsuleY - 2.5,
          capsuleW + 5,
          capsuleH + 5,
          capsuleR + 2.5,
        );
        ctx.save();
        ctx.globalAlpha = 0.65;
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // Active track background
        ctx.beginPath();
        ctx.roundRect(startCapsuleX, capsuleY, capsuleW, capsuleH, capsuleR);
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.fill();

        // Active progress fill
        const pct = Math.max(0, Math.min(100, progressPercent));
        const fillW = Math.max(capsuleR * 2, (pct / 100) * capsuleW);

        ctx.beginPath();
        ctx.roundRect(startCapsuleX, capsuleY, fillW, capsuleH, capsuleR);
        ctx.fillStyle = accentColor;
        ctx.fill();
      } else if (isCompleted) {
        // Completed cycle: solid accent capsule
        ctx.beginPath();
        ctx.roundRect(startCapsuleX, capsuleY, capsuleW, capsuleH, capsuleR);
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = accentColor;
        ctx.fill();
        ctx.restore();
      } else {
        // Future cycle: subtle translucent capsule
        ctx.beginPath();
        ctx.roundRect(startCapsuleX, capsuleY, capsuleW, capsuleH, capsuleR);
        ctx.fillStyle = "rgba(255, 255, 255, 0.10)";
        ctx.fill();
      }

      startCapsuleX += capsuleW + gap;
    }
  } catch {
    // Prevent any canvas rendering errors from rejecting PiP transitions
  }
}
