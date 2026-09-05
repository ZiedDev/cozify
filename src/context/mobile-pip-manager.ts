import {
  CanvasTimerState,
  drawTimerToCanvas,
  CANVAS_PIP_WIDTH,
  CANVAS_PIP_HEIGHT,
} from "@/components/pomodoro/canvas-timer-renderer";

export function isMobileDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined")
    return false;

  const ua = navigator.userAgent || "";
  const isMobileUa =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isIPad = /Macintosh/i.test(ua) && (navigator.maxTouchPoints ?? 0) > 1;

  return isMobileUa || isIPad;
}

export function isVideoPipSupported(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined")
    return false;

  // Video-based PiP bridge is strictly for mobile devices (iOS Safari, Android Chrome, etc.)
  if (!isMobileDevice()) {
    return false;
  }

  return Boolean(
    document.pictureInPictureEnabled ||
      (HTMLVideoElement.prototype as any).webkitSupportsPresentationMode ||
      (HTMLVideoElement.prototype as any).webkitSetPresentationMode ||
      "pictureInPictureEnabled" in document,
  );
}

export class MobilePipManager {
  private videoEl: HTMLVideoElement | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private stream: MediaStream | null = null;
  private isPipActive = false;
  private currentState: CanvasTimerState | null = null;
  private animFrameId: number | null = null;
  private timerIntervalId: ReturnType<typeof setInterval> | null = null;
  private audioCtx: AudioContext | null = null;
  private onPlayCallback: (() => void) | null = null;
  private onPauseCallback: (() => void) | null = null;
  private onSeekCallback: ((seconds: number) => void) | null = null;
  private onCloseCallback: (() => void) | null = null;
  private isSyncingPlayback = false;

  public init(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    this.videoEl = video;
    this.canvasEl = canvas;

    canvas.width = CANVAS_PIP_WIDTH;
    canvas.height = CANVAS_PIP_HEIGHT;

    // Immediately prime canvas with solid initial frame to avoid transparent WebKit buffer lock
    drawTimerToCanvas(canvas, {
      formattedTime: "25:00",
      mode: "focus",
      currentCycle: 1,
      targetCycles: 4,
      progressPercent: 0,
      isRunning: false,
      isOvertime: false,
    });

    // Configure video element attributes for iOS WebKit inline media presentation
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");

    // Pre-attach stream immediately so WebKit preloads metadata ahead of time.
    // This allows the VERY FIRST tap on the PiP button to open PiP instantly without needing a second toggle.
    try {
      const captureMethod =
        canvas.captureStream || (canvas as any).mozCaptureStream;

      if (captureMethod) {
        this.stream = captureMethod.call(canvas, 30);
        video.srcObject = this.stream;
        const track = this.stream.getVideoTracks()[0] as any;

        try {
          track?.requestFrame?.();
        } catch {}
      }
    } catch {
      // Ignore pre-stream errors
    }

    // Hook native video events triggered by floating PiP window Play / Pause buttons
    video.addEventListener("pause", () => {
      if (this.isSyncingPlayback) return;
      if (this.isPipActive && this.onPauseCallback) {
        this.onPauseCallback();
      }
    });

    video.addEventListener("play", () => {
      if (this.isSyncingPlayback) return;
      if (this.isPipActive && this.onPlayCallback) {
        this.onPlayCallback();
      }
    });

    const handleLeave = () => {
      if (this.isPipActive) {
        this.cleanup();
        if (this.onCloseCallback) {
          this.onCloseCallback();
        }
      }
    };

    video.addEventListener("leavepictureinpicture", handleLeave);

    const v = video as any;

    if (v.webkitSupportsPresentationMode || v.webkitSetPresentationMode) {
      video.addEventListener("webkitpresentationmodechanged", () => {
        if (v.webkitPresentationMode === "inline") {
          handleLeave();
        }
      });
    }
  }

  public updateCallbacks(
    onPlay: () => void,
    onPause: () => void,
    onSeek?: (seconds: number) => void,
  ) {
    this.onPlayCallback = onPlay;
    this.onPauseCallback = onPause;
    if (onSeek) {
      this.onSeekCallback = onSeek;
    }
  }

  public getActive(): boolean {
    return this.isPipActive;
  }

  public updateState(state: CanvasTimerState) {
    this.currentState = state;

    if (this.canvasEl) {
      drawTimerToCanvas(this.canvasEl, state);
    }

    try {
      const track = this.stream?.getVideoTracks()[0] as any;

      if (track && typeof track.requestFrame === "function") {
        track.requestFrame();
      }
    } catch {}

    // Two-way playback state synchronization between app controls and native floating PiP overlay
    if (this.videoEl && this.isPipActive) {
      if (state.isRunning && this.videoEl.paused) {
        this.isSyncingPlayback = true;
        const playPromise = this.videoEl.play();

        if (playPromise !== undefined) {
          playPromise
            .catch(() => {})
            .finally(() => {
              queueMicrotask(() => {
                this.isSyncingPlayback = false;
              });
            });
        } else {
          this.isSyncingPlayback = false;
        }
      } else if (!state.isRunning && !this.videoEl.paused) {
        this.isSyncingPlayback = true;
        this.videoEl.pause();
        queueMicrotask(() => {
          this.isSyncingPlayback = false;
        });
      }
    }

    // Sync mediaSession for system lock screen / control center
    if ("mediaSession" in navigator) {
      try {
        let modeName = "Focus";

        if (state.isOvertime) modeName = "Bonus Flow";
        else if (state.mode === "shortBreak") modeName = "Short Break";
        else if (state.mode === "longBreak") modeName = "Long Break";

        navigator.mediaSession.metadata = new MediaMetadata({
          title: `${state.formattedTime} - ${modeName}`,
          artist: "Cozify Pomodoro",
          album: `Cycle ${state.currentCycle} of ${state.targetCycles}`,
        });

        navigator.mediaSession.playbackState = state.isRunning
          ? "playing"
          : "paused";
      } catch {
        // Ignore mediaSession metadata errors
      }
    }
  }

  private startRenderLoop() {
    this.stopRenderLoop();

    const render = () => {
      if (!this.isPipActive) return;

      if (this.canvasEl && this.currentState) {
        drawTimerToCanvas(this.canvasEl, this.currentState);
        try {
          const track = this.stream?.getVideoTracks()[0] as any;

          if (track && typeof track.requestFrame === "function") {
            track.requestFrame();
          }
        } catch {}
      }
      this.animFrameId = requestAnimationFrame(render);
    };

    this.animFrameId = requestAnimationFrame(render);

    // Fallback interval (keeps pushing frames even when rAF is throttled in background tabs)
    this.timerIntervalId = setInterval(() => {
      if (!this.isPipActive) return;

      if (this.canvasEl && this.currentState) {
        drawTimerToCanvas(this.canvasEl, this.currentState);
        try {
          const track = this.stream?.getVideoTracks()[0] as any;

          if (track && typeof track.requestFrame === "function") {
            track.requestFrame();
          }
        } catch {}
      }
    }, 500);
  }

  private stopRenderLoop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.timerIntervalId !== null) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
  }

  public async openPip(options: {
    state: CanvasTimerState;
    onPlay: () => void;
    onPause: () => void;
    onClose: () => void;
  }): Promise<boolean> {
    if (!this.videoEl || !this.canvasEl) {
      throw new Error("Video or Canvas element not initialized");
    }

    this.onPlayCallback = options.onPlay;
    this.onPauseCallback = options.onPause;
    this.onCloseCallback = options.onClose;
    this.currentState = options.state;

    // 1. Initial draw on canvas with solid background before stream capture
    drawTimerToCanvas(this.canvasEl, options.state);

    // 2. Ensure stream is captured from the already-drawn canvas
    if (!this.stream) {
      const captureMethod =
        this.canvasEl.captureStream || (this.canvasEl as any).mozCaptureStream;

      if (!captureMethod) {
        throw new Error(
          "Canvas stream capture is not supported in this browser",
        );
      }
      this.stream = captureMethod.call(this.canvasEl, 30);
      this.videoEl.srcObject = this.stream;
    }

    // 3. Keep iOS background media pipeline active via Web Audio output
    try {
      if (!this.audioCtx) {
        const AudioCtxClass =
          window.AudioContext || (window as any).webkitAudioContext;

        if (AudioCtxClass) {
          this.audioCtx = new AudioCtxClass();
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          gain.gain.value = 0.0001; // virtually silent
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start();
        }
      }
      if (this.audioCtx && this.audioCtx.state === "suspended") {
        this.audioCtx.resume().catch(() => {});
      }
    } catch {
      // Ignore audio context errors on unsupported platforms
    }

    // 4. Explicitly request frame push
    try {
      const track = this.stream.getVideoTracks()[0] as any;

      if (track && typeof track.requestFrame === "function") {
        track.requestFrame();
      }
    } catch {}

    // 5. Configure video element
    this.videoEl.muted = true;
    this.videoEl.playsInline = true;

    // 5. Setup MediaSession handlers
    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.setActionHandler("play", () => {
          this.onPlayCallback?.();
          this.videoEl?.play().catch(() => {});
        });

        navigator.mediaSession.setActionHandler("pause", () => {
          this.onPauseCallback?.();
          this.videoEl?.pause();
        });

        navigator.mediaSession.setActionHandler("seekbackward", (details) => {
          const skipSeconds = details?.seekOffset || 10;

          this.onSeekCallback?.(-skipSeconds);
        });

        navigator.mediaSession.setActionHandler("seekforward", (details) => {
          const skipSeconds = details?.seekOffset || 10;

          this.onSeekCallback?.(skipSeconds);
        });
      } catch {
        // Ignore
      }
    }

    // 6. Start playback synchronously in user gesture
    const playPromise = this.videoEl.play();

    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }

    // 7. Trigger PiP synchronously WITHOUT awaiting playPromise
    // Awaiting breaks the user gesture activation token on iOS Safari
    const v = this.videoEl as any;

    if (typeof v.webkitSetPresentationMode === "function") {
      // iOS Safari (iPhone / iPad)
      v.webkitSetPresentationMode("picture-in-picture");
    } else if (this.videoEl.requestPictureInPicture) {
      // Android Chrome / Standard W3C PiP
      await this.videoEl.requestPictureInPicture();
    } else {
      throw new Error("Picture in Picture is not supported on this device");
    }

    // 8. Start continuous render loop & interval
    this.isPipActive = true;
    this.startRenderLoop();
    this.updateState(options.state);

    return true;
  }

  public async closePip() {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (
        this.videoEl &&
        (this.videoEl as any).webkitSetPresentationMode
      ) {
        (this.videoEl as any).webkitSetPresentationMode("inline");
      }
    } catch {
      // Ignore exit error
    }
    this.cleanup();
  }

  public cleanup() {
    this.isPipActive = false;
    this.stopRenderLoop();

    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }

    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
      } catch {}
    }
  }
}

export const mobilePipManager = new MobilePipManager();
