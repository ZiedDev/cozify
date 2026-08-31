import { CozyMusicCard } from "@/components/music/cozy-music-player";

export function MusicView() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center min-h-0 overflow-y-auto no-scrollbar select-none animate-in fade-in zoom-in-98 duration-200 py-4 px-3">
      <div className="w-full max-w-sm flex flex-col items-center justify-center my-auto">
        <CozyMusicCard />
      </div>
    </div>
  );
}
