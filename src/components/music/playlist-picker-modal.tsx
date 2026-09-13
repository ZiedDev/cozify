import { useState, useMemo, memo, SubmitEvent } from "react";
import {
  Modal,
  AlertDialog,
  Button,
  TextField,
  InputGroup,
  ScrollShadow,
  Typography,
  Form,
  Input,
  Spinner,
} from "@heroui/react";
import {
  Plus,
  Play,
  Trash2,
  Pencil,
  Check,
  Link2,
  ListMusic,
  Loader2,
  Radio,
} from "lucide-react";
import { useSortable } from "@dnd-kit/react/sortable";

import { useMusic } from "@/context/music-context";
import { Playlist, PRESET_PLAYLISTS } from "@/config/playlists";
import { Marquee } from "@/components/ui/marquee";
import { SortableList } from "@/components/ui/sortable-list";

interface VinylPlaylistItemProps {
  item: Playlist;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  editingId: string | null;
  editTitleText: string;
  setEditingId: (id: string | null) => void;
  setEditTitleText: (text: string) => void;
  handleSaveRename: (id: string) => void;
  playPlaylist: (playlist: Playlist) => void;
  onDelete: (playlist: Playlist) => void;
}

function VinylPlaylistItemComponent({
  item,
  index,
  isActive,
  isPlaying,
  isBuffering,
  editingId,
  editTitleText,
  setEditingId,
  setEditTitleText,
  handleSaveRename,
  playPlaylist,
  onDelete,
}: VinylPlaylistItemProps) {
  const { ref, isDragging } = useSortable({ id: item.id, index });
  const [isHovered, setIsHovered] = useState(false);
  const isEditing = editingId === item.id;

  return (
    <div
      ref={ref}
      className={`group relative flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 ease-out select-none hover:shadow-md ${
        isDragging
          ? "scale-[1.02] shadow-xl border-accent z-30 bg-surface ring-2 ring-accent/30 opacity-95"
          : isActive
            ? "bg-accent/10 border-accent text-accent shadow-xs"
            : "bg-surface-secondary/30 hover:bg-surface-secondary/70 border-separator/40 hover:border-separator/70 text-foreground"
      }`}
      data-dragging={isDragging || undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left: Vinyl Record Jacket + Sliding Vinyl Disc */}
      {isEditing ? (
        <div
          className="flex items-center gap-6 min-w-0 flex-1 text-left"
          onClick={(e) => e.stopPropagation()}
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

          {/* Inline Edit Form */}
          <div className="flex flex-col min-w-0 flex-1">
            <Form
              className="flex items-center gap-1.5"
              onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleSaveRename(item.id);
              }}
            >
              <Input
                autoFocus
                aria-label="Edit playlist title"
                className="w-full h-6 px-2 rounded-full bg-surface border border-accent text-xs text-foreground outline-none"
                value={editTitleText}
                onChange={(event) => setEditTitleText(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  event.stopPropagation();
                  if (event.key === "Escape") setEditingId(null);
                }}
              />
              <Button
                aria-label="Save title"
                className="size-6 rounded-full shrink-0 cursor-pointer"
                size="sm"
                type="submit"
                variant="primary"
              >
                <Check className="size-3" />
              </Button>
            </Form>

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
        </div>
      ) : (
        <button
          className="flex items-center gap-6 min-w-0 flex-1 text-left cursor-pointer outline-none overflow-hidden"
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

          {/* Text details with Marquee Overflow */}
          <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
            <div className="w-full overflow-hidden">
              <Marquee
                playOnHover
                align="start"
                className={`text-xs font-semibold leading-tight ${
                  isActive ? "text-accent font-bold" : "text-foreground"
                }`}
                isHovered={isHovered && !isDragging}
                isPlaying={isActive && isPlaying}
                text={item.title}
              />
            </div>

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
      )}

      {/* Right side: Quick Actions + Play / Active Pill */}
      <div className="flex items-center gap-1 shrink-0 ml-2">
        {/* Custom playlist options */}
        {item.isCustom && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              aria-label="Rename"
              className="rounded-full text-muted hover:text-foreground hover:bg-surface cursor-pointer"
              size="sm"
              variant="ghost"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setEditingId(item.id);
                setEditTitleText(item.title);
              }}
            >
              <Pencil className="size-3" />
            </Button>

            <Button
              aria-label="Delete"
              className="rounded-full text-muted hover:text-danger hover:bg-surface cursor-pointer"
              size="sm"
              variant="ghost"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDelete(item);
              }}
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        )}

        {/* Play Status Pill */}
        {isActive && (isPlaying || isBuffering) ? (
          <div className="flex items-center justify-center gap-1 size-6 rounded-full bg-accent text-accent-foreground text-xs font-semibold shadow-xs">
            {isBuffering ? (
              <Spinner className="size-3 text-accent-foreground" />
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
          </div>
        ) : (
          <Button
            isIconOnly
            aria-label={`Play ${item.title}`}
            className={`size-7 rounded-full transition-transform duration-150 ${
              isActive
                ? "bg-accent/20 text-accent ring-1 ring-accent cursor-pointer"
                : "bg-surface text-muted hover:text-foreground hover:scale-105 cursor-pointer"
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
}

const VinylPlaylistItem = memo(VinylPlaylistItemComponent);

export function PlaylistPickerModal() {
  const {
    isPickerOpen,
    setIsPickerOpen,
    activePlaylistId,
    isPlaying,
    isBuffering,
    isOnline,
    customPlaylists,
    playPlaylist,
    addCustomPlaylist,
    removeCustomPlaylist,
    renameCustomPlaylist,
    reorderCustomPlaylists,
  } = useMusic();

  const [newUrl, setNewUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState("");
  const [deletingPlaylist, setDeletingPlaylist] = useState<Playlist | null>(
    null,
  );

  const allPlaylists = useMemo(() => {
    return [...customPlaylists, ...PRESET_PLAYLISTS];
  }, [customPlaylists]);

  const handleAddPlaylist = async (event?: SubmitEvent) => {
    if (event) event.preventDefault();
    if (!newUrl.trim() || isAdding || !isOnline) return;

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

  const handleClose = () => {
    setIsPickerOpen(false);
    setEditingId(null);
    setDeletingPlaylist(null);
    setNewUrl("");
  };

  const handleReorder = (activeId: string, overId: string) => {
    if (activeId === overId) return;
    reorderCustomPlaylists(activeId, overId);
  };

  if (!isPickerOpen) return null;

  return (
    <>
      <Modal.Backdrop
        isOpen={isPickerOpen}
        onOpenChange={(open) => !open && handleClose()}
      >
        <Modal.Container>
          <Modal.Dialog
            aria-label="Audio Stream Library"
            className="max-sm:mt-0! sm:max-w-3xl w-full h-[85vh] sm:h-140 max-h-[85vh] space-y-5"
          >
            <Modal.Header className="flex-row items-center gap-3">
              <Modal.Icon>
                <ListMusic className="size-4" />
              </Modal.Icon>
              <div>
                <Modal.Heading>Audio Stream Library</Modal.Heading>
                <Typography color="muted" type="body-xs">
                  {!isOnline
                    ? "You are currently offline. You can select a playlist and it will play when reconnected."
                    : "Select a curated background stream or paste your own YouTube / Spotify link below."}
                </Typography>
              </div>
            </Modal.Header>
            <Modal.CloseTrigger />
            <div>
              {/* Direct URL Input Bar */}
              <Form
                className="flex items-center gap-2"
                // @ts-expect-error Type mismatch between SubmitEvent and React FormEvent
                onSubmit={handleAddPlaylist}
              >
                <TextField fullWidth aria-label="Audio stream link">
                  <InputGroup
                    fullWidth
                    className="bg-surface-secondary/70 border border-separator/50 rounded-full h-8.5 text-xs"
                  >
                    <InputGroup.Prefix className="text-muted pl-2.5">
                      <Link2 className="size-3.5" />
                    </InputGroup.Prefix>
                    <InputGroup.Input
                      className="text-xs"
                      disabled={isAdding || !isOnline}
                      placeholder={
                        !isOnline
                          ? "Offline - Reconnect to add new streams..."
                          : "Paste Spotify or YouTube link (details auto-fetched)..."
                      }
                      type="url"
                      value={newUrl}
                      onChange={(event) => setNewUrl(event.target.value)}
                    />
                  </InputGroup>
                </TextField>

                <Button
                  className="h-8.5 px-4 rounded-full text-xs font-semibold shrink-0 cursor-pointer shadow-xs"
                  isDisabled={!newUrl.trim() || isAdding || !isOnline}
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
              </Form>
            </div>

            {/* Modal Body: Tactile Vinyl Record Sleeves Grid */}
            <ScrollShadow
              className="flex-1 min-h-0 h-full overflow-y-auto no-scrollbar"
              orientation="vertical"
              size={20}
            >
              <SortableList onReorder={handleReorder}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1">
                  {allPlaylists.map((item, index) => {
                    const isActive = activePlaylistId === item.id;

                    return (
                      <VinylPlaylistItem
                        key={item.id}
                        editTitleText={editTitleText}
                        editingId={editingId}
                        handleSaveRename={handleSaveRename}
                        index={index}
                        isActive={isActive}
                        isBuffering={isBuffering}
                        isPlaying={isPlaying}
                        item={item}
                        onDelete={setDeletingPlaylist}
                        playPlaylist={playPlaylist}
                        setEditTitleText={setEditTitleText}
                        setEditingId={setEditingId}
                      />
                    );
                  })}
                </div>
              </SortableList>
            </ScrollShadow>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      {/* Remove Playlist Confirmation Dialog */}
      {deletingPlaylist && (
        <AlertDialog.Backdrop
          isOpen={Boolean(deletingPlaylist)}
          onOpenChange={(open) => !open && setDeletingPlaylist(null)}
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Remove Playlist?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <Typography
                  className="leading-relaxed"
                  color="muted"
                  type="body-sm"
                >
                  Are you sure you want to remove{" "}
                  <strong className="text-foreground">
                    &quot;{deletingPlaylist.title}&quot;
                  </strong>{" "}
                  from your collection?
                </Typography>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button
                  slot="close"
                  variant="tertiary"
                  onPress={() => setDeletingPlaylist(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onPress={() => {
                    if (deletingPlaylist) {
                      removeCustomPlaylist(deletingPlaylist.id);
                      setDeletingPlaylist(null);
                    }
                  }}
                >
                  Remove
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      )}
    </>
  );
}
