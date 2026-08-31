import { useTheme } from "@/hooks/use-theme";

export function BackgroundView() {
  const { activeBackground, overlayOpacity, blur, positionX, positionY, zoom } =
    useTheme();

  if (!activeBackground) return null;

  // Base scale with zoom factor (minimum 1.15 to ensure smooth pan headroom)
  const effectiveScale = (zoom / 100) * 1.15;

  // Maximum pan percentage so the image edge mathematically caps at the viewport boundary
  const maxShift = ((effectiveScale - 1) / (2 * effectiveScale)) * 100;

  // Pan offsets strictly bounded within [-maxShift, +maxShift]
  const panX = ((positionX - 50) / 50) * maxShift;
  const panY = ((positionY - 50) / 50) * maxShift;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      {/* High Performance Background Image with bounded pan, shift & zoom */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-[transform,filter] duration-300 ease-out"
        style={{
          backgroundImage: `url(${activeBackground.url})`,
          transform: `scale(${effectiveScale}) translate3d(${panX}%, ${panY}%, 0)`,
          transformOrigin: "center center",
          filter: blur > 0 ? `blur(${blur}px)` : "none",
        }}
      />

      {/* Dynamic Contrast Dimming Overlay */}
      <div
        className="absolute inset-0 bg-background transition-opacity duration-300"
        style={{ opacity: overlayOpacity / 100 }}
      />
    </div>
  );
}
