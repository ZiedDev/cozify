import { useState, useMemo, SubmitEvent } from "react";
import {
  Modal,
  Button,
  TextField,
  InputGroup,
  ScrollShadow,
  Separator,
  Typography,
  Tooltip,
} from "@heroui/react";
import {
  Plus,
  Play,
  Trash2,
  Pencil,
  Check,
  ChevronUp,
  ChevronDown,
  Link as LinkIcon,
  Loader2,
  Disc3,
  Radio,
} from "lucide-react";

import { useMusic } from "@/context/music-context";
import { PRESET_PLAYLISTS } from "@/config/playlists";

export function PlaylistPickerModal() {
  const {
    isPickerOpen,
    setIsPickerOpen,
    activePlaylistId,
    isPlaying,
    isBuffering,
    customPlaylists,
    playPlaylist,
    addCustomPlaylist,
    removeCustomPlaylist,
    renameCustomPlaylist,
    moveCustomPlaylist,
  } = useMusic();

  const [newUrl, setNewUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState("");

  const allPlaylists = useMemo(() => {
    return [...customPlaylists, ...PRESET_PLAYLISTS];
  }, [customPlaylists]);

  const handleAddPlaylist = async (e?: SubmitEvent) => {
    if (e) e.preventDefault();
    if (!newUrl.trim() || isAdding) return;

    setIsAdding(true);
    try {
      const success = await addCustomPlaylist(newUrl.trim());

      if (success) {
        setNewUrl("");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleSaveRename = (id: string) => {
    if (editTitleText.trim()) {
      renameCustomPlaylist(id, editTitleText.trim());
    }
    setEditingId(null);
  };

  if (!isPickerOpen) return null;

  return (
    <Modal.Backdrop
      isOpen={isPickerOpen}
      onOpenChange={(open) => !open && setIsPickerOpen(false)}
    >
      <Modal.Container size="lg">
        <Modal.Dialog className="max-sm:mt-0! sm:max-w-190 md:max-w-205 w-full h-[82vh] sm:h-140 max-h-[85vh] flex flex-col overflow-hidden p-0 rounded-3xl border border-separator/50 bg-surface/95 backdrop-blur-2xl shadow-2xl">
          <Modal.CloseTrigger />

          {/* Modal Header */}
          <Modal.Header className="px-5 sm:px-6 py-4 gap-3">
            <div className="flex flex-col">
              <Modal.Heading className="flex gap-2 text-base font-bold tracking-tight">
                <Disc3 className="size-5 text-accent animate-spin-slow" />
                Playlists Vault
              </Modal.Heading>
              <Typography className="text-xs" color="muted" type="body-xs">
                Your collection of records, lofi streams & albums
              </Typography>
            </div>
          </Modal.Header>

          <Separator />

          {/* Add Custom Playlist Bar with Automated Metadata & Artwork Fetching */}
          <div className="p-3 sm:px-6 bg-surface-secondary/20 border-b border-separator/20">
            <form
              className="flex items-center gap-2"
              onSubmit={handleAddPlaylist}
            >
              <TextField fullWidth aria-label="Playlist URL" className="flex-1">
                <InputGroup
                  fullWidth
                  className="bg-surface/80 border border-separator/40 rounded-full h-8.5 text-xs focus-within:border-accent"
                >
                  <InputGroup.Prefix className="pl-3 pr-1 text-muted">
                    <LinkIcon className="size-3.5" />
                  </InputGroup.Prefix>
                  <InputGroup.Input
                    className="text-xs"
                    disabled={isAdding}
                    placeholder="Paste Spotify or YouTube link (details auto-fetched)..."
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                  />
                </InputGroup>
              </TextField>

              <Button
                className="h-8.5 px-4 rounded-full text-xs font-semibold shrink-0 cursor-pointer shadow-xs"
                isDisabled={!newUrl.trim() || isAdding}
                size="sm"
                type="submit"
                variant="primary"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Plus className="size-3.5 mr-1" />
                    Add Record
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Modal Body: Tactile Vinyl Record Sleeves Grid */}
          <ScrollShadow
            className="flex-1 min-h-0 h-full overflow-y-auto p-4 sm:p-5 no-scrollbar"
            orientation="vertical"
            size={20}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allPlaylists.map((item) => {
                const isActive = activePlaylistId === item.id;
                const isEditing = editingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`group relative flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 ease-out select-none hover:shadow-md ${
                      isActive
                        ? "bg-accent/10 border-accent text-accent shadow-xs ring-1 ring-accent/30"
                        : "bg-surface-secondary/30 hover:bg-surface-secondary/70 border-separator/40 hover:border-separator/70 text-foreground"
                    }`}
                  >
                    {/* Left: Vinyl Record Jacket + Sliding Vinyl Disc */}
                    <button
                      className="flex items-center gap-6 min-w-0 flex-1 text-left cursor-pointer outline-none"
                      type="button"
                      onClick={() => playPlaylist(item)}
                    >
                      {/* Vinyl Sleeve + Disc Combo */}
                      <div className="relative size-13 shrink-0 flex items-center">
                        {/* Vinyl Disc peaking out */}
                        <div
                          className={`absolute left-3 size-12 rounded-full bg-[#111] border border-white/20 shadow-md flex items-center justify-center transition-all duration-300 ease-out overflow-hidden ${
                            isActive && (isPlaying || isBuffering)
                              ? "translate-x-3.5 ring-2 ring-accent/60"
                              : "translate-x-0.5 group-hover:translate-x-3 group-hover:rotate-12"
                          }`}
                          style={{
                            WebkitMaskImage:
                              "radial-gradient(circle at center, transparent 4px, black 5px)",
                            maskImage:
                              "radial-gradient(circle at center, transparent 4px, black 5px)",
                          }}
                        >
                          {/* Concentric Grooves */}
                          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.6)_40%,transparent_60%,rgba(0,0,0,0.7)_80%,transparent_100%)] pointer-events-none" />

                          {/* Center Artwork Label */}
                          <div className="size-4.5 rounded-full overflow-hidden border border-white/40 shadow-inner">
                            {item.coverUrl ? (
                              <img
                                alt=""
                                className={`w-full h-full object-cover ${
                                  isActive && isPlaying ? "animate-spin" : ""
                                }`}
                                src={item.coverUrl}
                                style={{
                                  animationDuration: "3s",
                                  animationDirection: "reverse",
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-accent" />
                            )}
                          </div>
                        </div>

                        {/* Front Vinyl Jacket Sleeve */}
                        <div className="relative z-10 size-12 rounded-xl overflow-hidden border border-separator/40 bg-surface shadow-md shrink-0 group-hover:shadow-lg transition-shadow">
                          {item.coverUrl ? (
                            <img
                              alt={item.title}
                              className="w-full h-full object-cover"
                              src={item.coverUrl}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-surface-secondary text-muted">
                              <Radio className="size-5 text-accent" />
                            </div>
                          )}
                          {/* Glossy Jacket overlay */}
                          <div className="absolute inset-0 bg-linear-to-tr from-black/30 via-transparent to-white/20 pointer-events-none" />
                        </div>
                      </div>

                      {/* Text details */}
                      <div className="flex flex-col min-w-0 flex-1">
                        {isEditing ? (
                          <form
                            className="flex items-center gap-1.5"
                            onSubmit={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSaveRename(item.id);
                            }}
                          >
                            <input
                              aria-label="Edit playlist title"
                              className="w-full h-6 px-2 rounded-full bg-surface border border-accent text-xs text-foreground outline-none"
                              value={editTitleText}
                              onChange={(e) => setEditTitleText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Escape") setEditingId(null);
                              }}
                            />
                            <Button
                              isIconOnly
                              aria-label="Save title"
                              className="size-6 rounded-full"
                              size="sm"
                              type="submit"
                              variant="primary"
                            >
                              <Check className="size-3" />
                            </Button>
                          </form>
                        ) : (
                          <Typography
                            truncate
                            className={`text-xs font-semibold leading-tight ${
                              isActive
                                ? "text-accent font-bold"
                                : "text-foreground"
                            }`}
                            type="body-xs"
                          >
                            {item.title}
                          </Typography>
                        )}

                        <div className="flex items-center gap-1.5 mt-1">
                          <Typography
                            truncate
                            className="text-xs text-muted leading-tight"
                            type="body-xs"
                          >
                            {item.author}
                          </Typography>
                          <span className="text-xs text-muted/60">•</span>
                          <span
                            className={`text-xs font-semibold uppercase ${
                              item.platform === "spotify"
                                ? "text-[#1db954]"
                                : "text-[#ff4e4e]"
                            }`}
                          >
                            {item.platform}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Right side: Quick Actions + Play / Active Pill */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Custom playlist options */}
                      {item.isCustom && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Tooltip delay={150}>
                            <Tooltip.Trigger>
                              <button
                                aria-label="Move Up"
                                className="p-1 rounded-full text-muted hover:text-foreground hover:bg-surface cursor-pointer"
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  moveCustomPlaylist(item.id, "up");
                                }}
                              >
                                <ChevronUp className="size-3" />
                              </button>
                            </Tooltip.Trigger>
                            <Tooltip.Content className="text-xs p-1">
                              Move Up
                            </Tooltip.Content>
                          </Tooltip>

                          <Tooltip delay={150}>
                            <Tooltip.Trigger>
                              <button
                                aria-label="Move Down"
                                className="p-1 rounded-full text-muted hover:text-foreground hover:bg-surface cursor-pointer"
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  moveCustomPlaylist(item.id, "down");
                                }}
                              >
                                <ChevronDown className="size-3" />
                              </button>
                            </Tooltip.Trigger>
                            <Tooltip.Content className="text-xs p-1">
                              Move Down
                            </Tooltip.Content>
                          </Tooltip>

                          <button
                            aria-label="Rename"
                            className="p-1 rounded-full text-muted hover:text-foreground hover:bg-surface cursor-pointer"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingId(item.id);
                              setEditTitleText(item.title);
                            }}
                          >
                            <Pencil className="size-3" />
                          </button>

                          <button
                            aria-label="Delete"
                            className="p-1 rounded-full text-muted hover:text-danger hover:bg-surface cursor-pointer"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeCustomPlaylist(item.id);
                            }}
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      )}

                      {/* Play Status Pill */}
                      {isActive && (isPlaying || isBuffering) ? (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold shadow-xs">
                          {isBuffering ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <div className="flex items-end gap-0.5 h-2.5">
                              <span className="w-0.5 h-full bg-current rounded-full animate-bounce" />
                              <span
                                className="w-0.5 h-2/3 bg-current rounded-full animate-bounce"
                                style={{ animationDelay: "150ms" }}
                              />
                              <span
                                className="w-0.5 h-4/5 bg-current rounded-full animate-bounce"
                                style={{ animationDelay: "300ms" }}
                              />
                            </div>
                          )}
                          <span>{isBuffering ? "Loading" : "Playing"}</span>
                        </div>
                      ) : (
                        <Button
                          isIconOnly
                          aria-label={`Play ${item.title}`}
                          className={`size-7 rounded-full cursor-pointer transition-transform duration-150 ${
                            isActive
                              ? "bg-accent/20 text-accent ring-1 ring-accent"
                              : "bg-surface text-muted hover:text-foreground border border-separator/40 hover:scale-105"
                          }`}
                          size="sm"
                          variant="ghost"
                          onClick={() => playPlaylist(item)}
                        >
                          <Play className="size-3 fill-current" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollShadow>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
