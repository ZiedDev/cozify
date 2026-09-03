import { CozyMusicCard } from "./cozy-music-player";

export function MusicView() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center min-h-0 overflow-y-auto sm:overflow-hidden no-scrollbar select-none animate-in fade-in zoom-in-98 duration-200 py-1 sm:py-2 px-2 sm:px-4">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl flex flex-col items-center justify-center my-auto">
        <CozyMusicCard />
      </div>
    </div>
  );
}
