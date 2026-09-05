import { useTheme } from "@/hooks/use-theme";

export function BackgroundView() {
  const { activeBackground, overlayOpacity, blur, positionX, positionY, zoom } =
    useTheme();

  // Invert shift direction so sliders intuitively pan the image view
  const posX = 100 - (positionX ?? 50);
  const posY = 100 - (positionY ?? 50);
  const zoomScale = Math.max(1, (zoom ?? 100) / 100);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-background"
    >
      {activeBackground && (
        <>
          {/* Dynamic Responsive Wallpaper with Inverted Position (X, Y) & Smooth Blur */}
          <div
            className="absolute inset-0 bg-cover transition-[background-position,transform,filter] duration-150 ease-out"
            style={{
              backgroundImage: `url(${activeBackground.url})`,
              backgroundPosition: `${posX}% ${posY}%`,
              transform: `scale(${zoomScale})`,
              transformOrigin: `${posX}% ${posY}%`,
              filter: blur > 0 ? `blur(${blur}px)` : "none",
            }}
          />

          {/* Dynamic Contrast Dimming Overlay */}
          <div
            className="absolute inset-0 bg-background transition-opacity duration-300"
            style={{ opacity: overlayOpacity / 100 }}
          />
        </>
      )}
    </div>
  );
}
