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

interface CanvasSlotState {
  char: string;
  prevChar: string | null;
  startTime: number;
  duration: number;
}

const canvasSlots = new Map<string, CanvasSlotState>();
let lastFormattedTime: string | null = null;
let lastCanvasMode: string | null = null;

function easeOutBack(t: number): number {
  const c1 = 1.15;
  const c3 = c1 + 1;

  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

let cachedBlurCanvas: HTMLCanvasElement | null = null;
let cachedBlurKey = "";

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = w / h;
  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;

  if (imgRatio > targetRatio) {
    sw = img.naturalHeight * targetRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / targetRatio;
    sy = (img.naturalHeight - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
}

function fastBoxBlur(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  radius: number,
) {
  const r = Math.min(25, Math.max(1, Math.round(radius)));
  const imgData = ctx.getImageData(0, 0, w, h);
  const pixels = imgData.data;
  const temp = new Uint8ClampedArray(pixels.length);
  const windowSize = 2 * r + 1;

  // 2 passes of box blur = smooth Gaussian approximation
  for (let pass = 0; pass < 2; pass++) {
    // Horizontal pass: pixels -> temp
    for (let y = 0; y < h; y++) {
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let aSum = 0;
      const rowOffset = y * w * 4;

      for (let x = -r; x < r; x++) {
        const clampedX = Math.min(w - 1, Math.max(0, x));
        const idx = rowOffset + clampedX * 4;

        rSum += pixels[idx];
        gSum += pixels[idx + 1];
        bSum += pixels[idx + 2];
        aSum += pixels[idx + 3];
      }

      for (let x = 0; x < w; x++) {
        const inX = Math.min(w - 1, x + r);
        const inIdx = rowOffset + inX * 4;

        rSum += pixels[inIdx];
        gSum += pixels[inIdx + 1];
        bSum += pixels[inIdx + 2];
        aSum += pixels[inIdx + 3];

        const targetIdx = rowOffset + x * 4;

        temp[targetIdx] = (rSum / windowSize) | 0;
        temp[targetIdx + 1] = (gSum / windowSize) | 0;
        temp[targetIdx + 2] = (bSum / windowSize) | 0;
        temp[targetIdx + 3] = (aSum / windowSize) | 0;

        const outX = Math.max(0, x - r);
        const outIdx = rowOffset + outX * 4;

        rSum -= pixels[outIdx];
        gSum -= pixels[outIdx + 1];
        bSum -= pixels[outIdx + 2];
        aSum -= pixels[outIdx + 3];
      }
    }

    // Vertical pass: temp -> pixels
    for (let x = 0; x < w; x++) {
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let aSum = 0;

      for (let y = -r; y < r; y++) {
        const clampedY = Math.min(h - 1, Math.max(0, y));
        const idx = (clampedY * w + x) * 4;

        rSum += temp[idx];
        gSum += temp[idx + 1];
        bSum += temp[idx + 2];
        aSum += temp[idx + 3];
      }

      for (let y = 0; y < h; y++) {
        const inY = Math.min(h - 1, y + r);
        const inIdx = (inY * w + x) * 4;

        rSum += temp[inIdx];
        gSum += temp[inIdx + 1];
        bSum += temp[inIdx + 2];
        aSum += temp[inIdx + 3];

        const targetIdx = (y * w + x) * 4;

        pixels[targetIdx] = (rSum / windowSize) | 0;
        pixels[targetIdx + 1] = (gSum / windowSize) | 0;
        pixels[targetIdx + 2] = (bSum / windowSize) | 0;
        pixels[targetIdx + 3] = (aSum / windowSize) | 0;

        const outY = Math.max(0, y - r);
        const outIdx = (outY * w + x) * 4;

        rSum -= temp[outIdx];
        gSum -= temp[outIdx + 1];
        bSum -= temp[outIdx + 2];
        aSum -= temp[outIdx + 3];
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

function getBlurredBg(
  img: HTMLImageElement,
  blurPx: number,
  w: number,
  h: number,
): HTMLCanvasElement | HTMLImageElement {
  const key = `${img.src}_${blurPx}_${w}_${h}`;

  if (cachedBlurCanvas && cachedBlurKey === key) return cachedBlurCanvas;

  if (!cachedBlurCanvas) {
    cachedBlurCanvas = document.createElement("canvas");
  }
  cachedBlurKey = key;
  cachedBlurCanvas.width = w;
  cachedBlurCanvas.height = h;
  const bctx = cachedBlurCanvas.getContext("2d", { willReadFrequently: true });

  if (!bctx) return img;

  if (blurPx <= 0) {
    drawCoverImage(bctx, img, w, h);

    return cachedBlurCanvas;
  }

  // 1. Native GPU filter first (full resolution, zero pixelation)
  try {
    if ("filter" in bctx) {
      bctx.filter = `blur(${blurPx}px)`;
      if (bctx.filter && bctx.filter !== "none") {
        drawCoverImage(bctx, img, w, h);
        bctx.filter = "none";

        return cachedBlurCanvas;
      }
    }
  } catch {}

  // 2. High-performance box blur fallback (smooth full-res blur adhering strictly to blurPx)
  drawCoverImage(bctx, img, w, h);
  fastBoxBlur(bctx, w, h, blurPx);

  return cachedBlurCanvas;
}

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

/**
 * Draws the timer frame to the canvas with 3D rolling cylinder text.
 * Returns true if an animation is still in progress, false when settled.
 */
export function drawTimerToCanvas(
  canvas: HTMLCanvasElement,
  state: CanvasTimerState,
): boolean {
  let hasActiveAnimation = false;

  try {
    const ctx = canvas.getContext("2d");

    if (!ctx) return false;

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
      const blurPx = Math.max(0, Math.min(25, theme?.blur ?? 0));
      const sourceToDraw = getBlurredBg(bgImg, blurPx, width, height);

      ctx.drawImage(sourceToDraw, 0, 0, width, height);

      // Contrast Dimming Overlay matching user's overlayOpacity and theme background
      const overlayAlpha =
        Math.max(0, Math.min(100, theme?.overlayOpacity ?? 45)) / 100;

      ctx.save();
      ctx.globalAlpha = overlayAlpha;
      ctx.fillStyle = defaultBg;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // 3. Ambient radial glow behind large time digits (using globalAlpha to support oklch/rgb/hex)
    ctx.save();
    ctx.globalAlpha = 0.22;
    const glow = ctx.createRadialGradient(cx, 104, 10, cx, 104, 180);

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

    // 5. 3D Rolling Digital Timer Digits (Center)
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const chars = formattedTime.split("");
    const totalChars = chars.length;

    // Detect mode switch for staggered entrance
    const isModeChanged = lastCanvasMode !== null && lastCanvasMode !== mode;

    lastCanvasMode = mode;

    // Detect time string change
    const isTimeChanged =
      lastFormattedTime !== null && lastFormattedTime !== formattedTime;

    lastFormattedTime = formattedTime;

    chars.forEach((char, i) => {
      const fromRight = totalChars - 1 - i;
      const isColon = char === ":";
      const key = isColon ? `colon-${i}` : `slot-${fromRight}`;
      let slot = canvasSlots.get(key);

      if (!slot) {
        slot = {
          char,
          prevChar: null,
          startTime: now,
          duration: 450,
        };
        canvasSlots.set(key, slot);
      } else if (isModeChanged) {
        slot.prevChar = slot.char;
        slot.char = char;
        slot.startTime = now + i * 45;
        slot.duration = 450;
      } else if (isTimeChanged && slot.char !== char) {
        if (!isColon) {
          slot.prevChar = slot.char;
          slot.char = char;
          slot.startTime = now;
          slot.duration = 450;
        } else {
          slot.char = char;
          slot.prevChar = null;
        }
      }
    });

    ctx.font = `86px ${fontSans}`;
    ctx.fillStyle = isOvertime ? accentColor : "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const cy = 104;
    const clipTop = 44;
    const clipHeight = 104;

    // Fixed-width monospace slots preventing horizontal jitter
    const charWidths = chars.map((c) =>
      c === ":" ? 24 : c === "+" || c === "-" ? 36 : 52,
    );
    const totalW = charWidths.reduce((sum, w) => sum + w, 0);
    let startX = cx - totalW / 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(cx - totalW / 2 - 12, clipTop, totalW + 24, clipHeight);
    ctx.clip();

    chars.forEach((char, i) => {
      const fromRight = totalChars - 1 - i;
      const isColon = char === ":";
      const key = isColon ? `colon-${i}` : `slot-${fromRight}`;
      const slot = canvasSlots.get(key);
      const slotW = charWidths[i];
      const charX = startX + slotW / 2;

      startX += slotW;

      if (!slot || isColon) {
        ctx.fillText(char, charX, cy);

        return;
      }

      const elapsed = now - slot.startTime;
      const isAnimating =
        slot.prevChar !== null && elapsed >= 0 && elapsed < slot.duration;

      if (!isAnimating) {
        if (slot.prevChar !== null && elapsed >= slot.duration) {
          slot.prevChar = null;
        }
        ctx.fillText(slot.char, charX, cy);

        return;
      }

      hasActiveAnimation = true;
      const rawT = Math.min(1, Math.max(0, elapsed / slot.duration));
      const outT = easeInOutQuad(rawT);
      const inT = easeOutBack(rawT);

      // Outgoing digit curves downwards along cylinder
      if (slot.prevChar) {
        ctx.save();
        const outAngle = outT * 1.35;
        const outY = cy + Math.sin(outAngle) * 138;
        const outScaleY = Math.max(0.05, Math.cos(outAngle));
        const outScaleX = 1;
        const outAlpha = Math.max(0, 1 - outT * 1.25);

        ctx.translate(charX, outY);
        ctx.scale(outScaleX, outScaleY);
        ctx.globalAlpha = outAlpha;
        ctx.fillText(slot.prevChar, 0, 0);
        ctx.restore();
      }

      // Incoming digit rolls down from top curve with snap settle
      ctx.save();
      const inAngle = (1 - Math.min(1, Math.max(0, inT))) * 1.35;
      const inY = cy - Math.sin(inAngle) * 38;
      const inScaleY = Math.max(0.05, Math.cos(inAngle));
      const inScaleX = 1;
      const inAlpha = Math.min(1, rawT * 1.4);

      ctx.translate(charX, inY);
      ctx.scale(inScaleX, inScaleY);
      ctx.globalAlpha = inAlpha;
      ctx.fillText(slot.char, 0, 0);
      ctx.restore();
    });

    ctx.restore();

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

  return hasActiveAnimation;
}
