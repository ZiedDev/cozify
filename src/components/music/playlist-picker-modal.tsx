import React, { useState, useMemo } from "react";
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
  Music,
  Plus,
  Play,
  Trash2,
  Pencil,
  Check,
  ChevronUp,
  ChevronDown,
  Radio,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";

import { useMusic } from "@/context/music-context";
import { PRESET_PLAYLISTS } from "@/config/playlists";

export function PlaylistPickerModal() {
  const {
    isPickerOpen,
    setIsPickerOpen,
    activeUrl,
    activePlaylistId,
    isPlaying,
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

  const handleAddPlaylist = async (e?: React.FormEvent) => {
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
        <Modal.Dialog className="max-sm:mt-0! sm:max-w-180 md:max-w-195 w-full h-[80vh] sm:h-135 max-h-[85vh] flex flex-col overflow-hidden p-0 rounded-3xl border border-separator/50 bg-surface shadow-2xl">
          <Modal.CloseTrigger />

          {/* Modal Header */}
          <Modal.Header className="px-5 sm:px-6 py-3.5 gap-2.5">
            <Modal.Icon>
              <Music className="size-5 text-accent" />
            </Modal.Icon>
            <div className="flex flex-col">
              <Modal.Heading className="text-base font-semibold">
                Music & Playlists
              </Modal.Heading>
              <Typography className="text-[11px]" color="muted" type="body-xs">
                Pick a stream or add your favorite Spotify / YouTube playlist
              </Typography>
            </div>
          </Modal.Header>

          <Separator />

          {/* Add Custom Playlist Bar with Automated Metadata & Artwork Fetching */}
          <div className="p-3 sm:px-6 bg-surface-secondary/30 border-b border-separator/20">
            <form
              className="flex items-center gap-2"
              onSubmit={handleAddPlaylist}
            >
              <TextField fullWidth aria-label="Playlist URL" className="flex-1">
                <InputGroup
                  fullWidth
                  className="bg-surface border border-separator/40 rounded-full h-8 text-xs"
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
                className="h-8 px-4 rounded-full text-xs font-semibold shrink-0 cursor-pointer"
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
                    Add
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Modal Body: Sleek Grid of Pill-styled Playlists */}
          <ScrollShadow
            className="flex-1 min-h-0 h-full overflow-y-auto p-4 sm:p-5 no-scrollbar"
            orientation="vertical"
            size={20}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {allPlaylists.map((item) => {
                const isActive =
                  activePlaylistId === item.id || activeUrl === item.url;
                const isEditing = editingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`group relative flex items-center justify-between gap-2.5 px-3 py-2 rounded-full border transition-[background-color,border-color,transform,box-shadow] duration-200 ease-out select-none hover:scale-[1.01] active:scale-[0.99] ${
                      isActive
                        ? "bg-accent/15 border-accent text-accent shadow-xs ring-1 ring-accent/30"
                        : "bg-surface-secondary/40 hover:bg-surface-secondary/80 border-separator/40 hover:border-separator/80 text-foreground"
                    }`}
                  >
                    {/* Left side: Artwork circle + Title/Author */}
                    <button
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer outline-none"
                      type="button"
                      onClick={() => playPlaylist(item)}
                    >
                      {/* Circular Thumbnail */}
                      <div className="size-8 rounded-full overflow-hidden bg-black shrink-0 relative border border-separator/40 shadow-xs">
                        {item.coverUrl ? (
                          <img
                            alt={item.title}
                            className="w-full h-full object-cover"
                            src={item.coverUrl}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-surface text-muted">
                            <Music className="size-4" />
                          </div>
                        )}
                      </div>

                      {/* Text details */}
                      <div className="flex flex-col min-w-0 flex-1">
                        {isEditing ? (
                          <form
                            className="flex items-center gap-1"
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

                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Typography
                            truncate
                            className="text-[10px] text-muted leading-tight"
                            type="body-xs"
                          >
                            {item.author}
                          </Typography>
                          <span className="text-[9px] text-muted/60">•</span>
                          <span className="text-[9px] text-muted font-medium uppercase">
                            {item.platform}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Right side: Quick Actions + Play Pill */}
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
                            className="p-1 rounded-full text-muted hover:text-danger hover:bg-danger/10 cursor-pointer"
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

                      {/* Play Action Button */}
                      <Button
                        isIconOnly
                        aria-label={isActive && isPlaying ? "Playing" : "Play"}
                        className={`size-7 rounded-full cursor-pointer ${
                          isActive
                            ? "bg-accent text-accent-foreground shadow-xs"
                            : "bg-surface text-foreground hover:bg-accent/20 hover:text-accent border border-separator/40"
                        }`}
                        size="sm"
                        variant={isActive ? "primary" : "secondary"}
                        onPress={() => playPlaylist(item)}
                      >
                        {isActive && isPlaying ? (
                          <Radio className="size-3" />
                        ) : (
                          <Play className="size-3 fill-current ml-0.5" />
                        )}
                      </Button>
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
