import { useState, useMemo, useEffect, MouseEvent } from "react";
import {
  Modal,
  TextField,
  InputGroup,
  ScrollShadow,
  Separator,
  Typography,
  Button,
} from "@heroui/react";
import {
  History,
  Search,
  Calendar,
  Clock,
  Zap,
  FileText,
  Target,
  Trash2,
  Tag,
  Edit3,
  Check,
  X,
} from "lucide-react";

import {
  storageAdapter,
  STORAGE_KEYS,
  SessionRecord,
} from "@/services/storage";
import { PRESET_TAGS } from "@/menus/todo/types";
import { getTagIcon } from "@/config/tags";
import { formatMinutesDisplay } from "@/menus/stats/logic/stats-calculator";

const PAGE_SIZE = 20;

export function SessionsLogModal({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<
    "all" | "cycles" | "overtime" | "notes"
  >("all");
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // Edit state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editFocusMinutes, setEditFocusMinutes] = useState<number>(25);
  const [editOvertimeMinutes, setEditOvertimeMinutes] = useState<number>(0);
  const [editTag, setEditTag] = useState<string | undefined>(undefined);
  const [editNotes, setEditNotes] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setSessions(
        storageAdapter.getItem<SessionRecord[]>(
          STORAGE_KEYS.SESSIONS_HISTORY,
          [],
        ),
      );
      setVisibleCount(PAGE_SIZE);
      setFilterMode("all");
      setEditingSessionId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, filterMode]);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDeleteSession = (id: string) => {
    const next = sessions.filter((s) => s.id !== id);

    setSessions(next);
    storageAdapter.setItem(STORAGE_KEYS.SESSIONS_HISTORY, next);
    setConfirmDeleteId(null);
    if (editingSessionId === id) setEditingSessionId(null);
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("cozify_achievements_changed"));
  };

  const triggerDelete = (id: string, e?: MouseEvent) => {
    if (e?.shiftKey) {
      handleDeleteSession(id);
    } else {
      setConfirmDeleteId((prev) => (prev === id ? null : id));
      if (editingSessionId === id) setEditingSessionId(null);
    }
  };

  const handleStartEdit = (s: SessionRecord) => {
    setEditingSessionId(s.id);
    setEditTitle(s.title || "Focus Session");
    setEditFocusMinutes(s.focusMinutes ?? 25);
    setEditOvertimeMinutes(s.overtimeMinutes ?? 0);
    setEditTag(s.tag);
    setEditNotes(s.notes ?? "");
    setConfirmDeleteId(null);
  };

  const handleSaveEdit = (id: string) => {
    const next = sessions.map((s) => {
      if (s.id !== id) return s;

      return {
        ...s,
        title: editTitle.trim() || "Focus Session",
        focusMinutes: Math.max(1, editFocusMinutes),
        overtimeMinutes: Math.max(0, editOvertimeMinutes),
        tag: editTag || undefined,
        notes: editNotes.trim() || undefined,
      };
    });

    setSessions(next);
    storageAdapter.setItem(STORAGE_KEYS.SESSIONS_HISTORY, next);
    setEditingSessionId(null);
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("cozify_achievements_changed"));
  };

  const filteredSessions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return sessions.filter((s) => {
      // 1. Status Filter Mode
      if (
        filterMode === "cycles" &&
        Number(s.cyclesCompleted ?? (s.sprintsCompleted || 0)) <= 1
      )
        return false;
      if (filterMode === "overtime" && Number(s.overtimeMinutes || 0) <= 0)
        return false;
      if (filterMode === "notes" && !(s.notes && s.notes.trim())) return false;

      // 2. Search query
      if (q) {
        const matchTitle = (s.title || "").toLowerCase().includes(q);
        const matchNotes = (s.notes || "").toLowerCase().includes(q);
        const matchTag = (s.tag || "").toLowerCase().includes(q);

        if (!matchTitle && !matchNotes && !matchTag) return false;
      }

      return true;
    });
  }, [sessions, searchQuery, filterMode]);

  const visibleSessions = useMemo(
    () => filteredSessions.slice(0, visibleCount),
    [filteredSessions, visibleCount],
  );
  const hasMore = visibleCount < filteredSessions.length;
  const remainingCount = filteredSessions.length - visibleCount;

  const multiCycleCount = useMemo(
    () =>
      sessions.filter(
        (s) => Number(s.cyclesCompleted ?? (s.sprintsCompleted || 0)) > 1,
      ).length,
    [sessions],
  );

  const overtimeCount = useMemo(
    () => sessions.filter((s) => Number(s.overtimeMinutes || 0) > 0).length,
    [sessions],
  );

  const notesCount = useMemo(
    () => sessions.filter((s) => Boolean(s.notes && s.notes.trim())).length,
    [sessions],
  );

  const formatSessionDateTime = (dateVal?: number | string) => {
    if (!dateVal) return { date: "—", time: "—" };
    try {
      const d = new Date(dateVal);
      const date = d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const time = d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });

      return { date, time };
    } catch {
      return { date: "—", time: "—" };
    }
  };

  if (!isOpen) return null;

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container size="lg">
        <Modal.Dialog className="max-sm:mt-0! sm:max-w-195 md:max-w-210 w-full h-[85vh] sm:h-140 max-h-[88vh] flex flex-col overflow-hidden p-0 rounded-2xl sm:rounded-3xl border border-separator/50 bg-surface shadow-2xl">
          <Modal.CloseTrigger />

          {/* Modal Header */}
          <Modal.Header className="px-5 sm:px-6 py-3.5 sm:py-4 gap-2.5">
            <Modal.Icon>
              <History className="size-5 text-accent" />
            </Modal.Icon>
            <Modal.Heading className="text-base font-semibold">
              Focus Sessions Log
            </Modal.Heading>
          </Modal.Header>

          <Separator />

          {/* Modal Body: Responsive 2-Column Split Structure */}
          <Modal.Body className="p-0 overflow-hidden flex-1 min-h-0 flex flex-col sm:flex-row gap-0">
            {/* Left Sidebar: Search & Summary Stats */}
            <div className="w-full sm:w-56 border-b sm:border-b-0 sm:border-r border-separator/40 p-3 sm:p-4 bg-surface-secondary/40 shrink-0 flex flex-col gap-3">
              <div className="flex flex-col gap-3">
                {/* Search Bar InputGroup */}
                <div className="flex flex-col gap-1.5 w-full">
                  <Typography
                    className="text-[11px] uppercase r"
                    color="muted"
                    type="body-xs"
                    weight="medium"
                  >
                    Search
                  </Typography>
                  <TextField fullWidth aria-label="Search focus sessions">
                    <InputGroup
                      fullWidth
                      className="bg-surface border border-separator/40 rounded-xl h-8"
                    >
                      <InputGroup.Prefix className="pl-2.5 pr-1 text-muted">
                        <Search className="size-3.5" />
                      </InputGroup.Prefix>
                      <InputGroup.Input
                        className="text-xs"
                        placeholder="Filter title or notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </InputGroup>
                  </TextField>
                </div>

                <Separator />

                {/* Summary Stats Breakdown */}
                <div className="flex flex-col gap-2">
                  <Typography
                    className="text-[11px] uppercase r"
                    color="muted"
                    type="body-xs"
                    weight="medium"
                  >
                    Summary
                  </Typography>

                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-1.5 text-xs">
                    <div
                      className={`flex items-center justify-between p-2 rounded-xl border transition-colors cursor-pointer select-none ${
                        filterMode === "all"
                          ? "bg-accent/15 border-accent/50 text-foreground shadow-2xs"
                          : "bg-surface/70 border-separator/30 hover:bg-surface hover:border-separator/60 text-muted"
                      }`}
                      role="button"
                      tabIndex={0}
                      onClick={() => setFilterMode("all")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          setFilterMode("all");
                      }}
                    >
                      <Typography
                        color={filterMode === "all" ? "default" : "muted"}
                        type="body-xs"
                      >
                        Total Sessions
                      </Typography>
                      <Typography
                        className="text-foreground tabular-nums"
                        type="body-xs"
                        weight="semibold"
                      >
                        {sessions.length}
                      </Typography>
                    </div>

                    <div
                      className={`flex items-center justify-between p-2 rounded-xl border transition-colors cursor-pointer select-none ${
                        filterMode === "cycles"
                          ? "bg-purple-500/15 border-purple-500/50 shadow-2xs"
                          : "bg-surface/70 border-separator/30 hover:bg-surface hover:border-separator/60"
                      }`}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        setFilterMode((prev) =>
                          prev === "cycles" ? "all" : "cycles",
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setFilterMode((prev) =>
                            prev === "cycles" ? "all" : "cycles",
                          );
                        }
                      }}
                    >
                      <Typography
                        className={
                          filterMode === "cycles"
                            ? "text-purple-400 font-medium"
                            : "text-muted"
                        }
                        type="body-xs"
                      >
                        Multi-Cycle
                      </Typography>
                      <Typography
                        className="text-purple-400 tabular-nums"
                        type="body-xs"
                        weight="semibold"
                      >
                        {multiCycleCount}
                      </Typography>
                    </div>

                    <div
                      className={`flex items-center justify-between p-2 rounded-xl border transition-colors cursor-pointer select-none ${
                        filterMode === "overtime"
                          ? "bg-amber-500/15 border-amber-500/50 shadow-2xs"
                          : "bg-surface/70 border-separator/30 hover:bg-surface hover:border-separator/60"
                      }`}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        setFilterMode((prev) =>
                          prev === "overtime" ? "all" : "overtime",
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setFilterMode((prev) =>
                            prev === "overtime" ? "all" : "overtime",
                          );
                        }
                      }}
                    >
                      <Typography
                        className={
                          filterMode === "overtime"
                            ? "text-amber-400 font-medium"
                            : "text-muted"
                        }
                        type="body-xs"
                      >
                        With Overtime
                      </Typography>
                      <Typography
                        className="text-amber-400 tabular-nums"
                        type="body-xs"
                        weight="semibold"
                      >
                        {overtimeCount}
                      </Typography>
                    </div>

                    <div
                      className={`flex items-center justify-between p-2 rounded-xl border transition-colors cursor-pointer select-none ${
                        filterMode === "notes"
                          ? "bg-blue-500/15 border-blue-500/50 shadow-2xs"
                          : "bg-surface/70 border-separator/30 hover:bg-surface hover:border-separator/60"
                      }`}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        setFilterMode((prev) =>
                          prev === "notes" ? "all" : "notes",
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setFilterMode((prev) =>
                            prev === "notes" ? "all" : "notes",
                          );
                        }
                      }}
                    >
                      <Typography
                        className={
                          filterMode === "notes"
                            ? "text-blue-400 font-medium"
                            : "text-muted"
                        }
                        type="body-xs"
                      >
                        With Notes
                      </Typography>
                      <Typography
                        className="text-blue-400 tabular-nums"
                        type="body-xs"
                        weight="semibold"
                      >
                        {notesCount}
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Scrollable Sessions Feed */}
            <ScrollShadow
              className="flex-1 min-h-0 h-full overflow-y-auto p-4 sm:p-5 bg-background/30"
              orientation="vertical"
              size={20}
            >
              {filteredSessions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
                  <div className="size-12 rounded-2xl bg-surface-secondary/70 border border-separator/40 flex items-center justify-center text-muted mb-3">
                    <History className="size-6 opacity-60" />
                  </div>
                  <Typography
                    className="font-medium text-foreground"
                    type="body-sm"
                  >
                    {searchQuery
                      ? "No sessions match your search"
                      : "No sessions recorded yet"}
                  </Typography>
                  <Typography
                    className="mt-1 max-w-xs opacity-70"
                    color="muted"
                    type="body-xs"
                  >
                    {searchQuery
                      ? "Try searching for a different keyword."
                      : "Complete your first focus session to see it logged here."}
                  </Typography>
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleSessions.map((s) => {
                    const { date, time } = formatSessionDateTime(s.createdAt);
                    const totalMins =
                      (Number(s.focusMinutes) || 0) +
                      (Number(s.overtimeMinutes) || 0);
                    const cycleCount = s.cyclesCompleted ?? s.sprintsCompleted;
                    const isEditing = editingSessionId === s.id;

                    if (isEditing) {
                      return (
                        <div
                          key={s.id}
                          className="flex flex-col gap-3 p-3.5 rounded-2xl bg-surface border border-accent/60 shadow-sm animate-in fade-in"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-accent flex items-center gap-1.5">
                              <Edit3 className="size-3.5" />
                              Edit Session Record
                            </span>
                            <span className="text-[11px] text-muted font-light">
                              {date} · {time}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {/* Title */}
                            <div className="sm:col-span-1 flex flex-col gap-1">
                              <label
                                className="text-[10px] uppercase r text-muted font-medium"
                                htmlFor={`session-edit-title-${s.id}`}
                              >
                                Title
                              </label>
                              <input
                                className="w-full h-8 px-2.5 rounded-xl bg-surface-secondary border border-separator/40 text-xs text-foreground outline-none focus:border-accent"
                                id={`session-edit-title-${s.id}`}
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                              />
                            </div>

                            {/* Focus Minutes */}
                            <div className="flex flex-col gap-1">
                              <label
                                className="text-[10px] uppercase r text-muted font-medium"
                                htmlFor={`session-edit-focus-${s.id}`}
                              >
                                Focus (Mins)
                              </label>
                              <input
                                className="w-full h-8 px-2.5 rounded-xl bg-surface-secondary border border-separator/40 text-xs text-foreground outline-none focus:border-accent"
                                id={`session-edit-focus-${s.id}`}
                                min={1}
                                type="number"
                                value={editFocusMinutes}
                                onChange={(e) =>
                                  setEditFocusMinutes(
                                    Math.max(1, Number(e.target.value) || 1),
                                  )
                                }
                              />
                            </div>

                            {/* Overtime Minutes */}
                            <div className="flex flex-col gap-1">
                              <label
                                className="text-[10px] uppercase r text-muted font-medium"
                                htmlFor={`session-edit-ot-${s.id}`}
                              >
                                Overtime (Mins)
                              </label>
                              <input
                                className="w-full h-8 px-2.5 rounded-xl bg-surface-secondary border border-separator/40 text-xs text-foreground outline-none focus:border-accent"
                                id={`session-edit-ot-${s.id}`}
                                min={0}
                                type="number"
                                value={editOvertimeMinutes}
                                onChange={(e) =>
                                  setEditOvertimeMinutes(
                                    Math.max(0, Number(e.target.value) || 0),
                                  )
                                }
                              />
                            </div>
                          </div>

                          {/* Tag selector */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase r text-muted font-medium">
                              Tag
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                                  !editTag
                                    ? "bg-accent/15 border-accent text-accent"
                                    : "bg-surface-secondary border-separator/40 text-muted"
                                }`}
                                type="button"
                                onClick={() => setEditTag(undefined)}
                              >
                                None
                              </button>
                              {PRESET_TAGS.map((t) => {
                                const TagIconComp = getTagIcon(t.id);

                                return (
                                  <button
                                    key={t.id}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                                      editTag === t.id
                                        ? `${t.color} font-semibold`
                                        : "bg-surface-secondary border-separator/40 text-muted hover:text-foreground"
                                    }`}
                                    type="button"
                                    onClick={() => setEditTag(t.id)}
                                  >
                                    <TagIconComp className="size-3 opacity-80" />
                                    <span>{t.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="flex flex-col gap-1">
                            <label
                              className="text-[10px] uppercase r text-muted font-medium"
                              htmlFor={`session-edit-notes-${s.id}`}
                            >
                              Notes
                            </label>
                            <textarea
                              className="w-full p-2 rounded-xl bg-surface-secondary border border-separator/40 text-xs text-foreground outline-none focus:border-accent resize-none"
                              id={`session-edit-notes-${s.id}`}
                              placeholder="Session notes or reflections..."
                              rows={2}
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                            />
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-separator/30">
                            <Button
                              className="h-7 px-3 text-xs rounded-lg"
                              size="sm"
                              variant="ghost"
                              onPress={() => setEditingSessionId(null)}
                            >
                              <X className="size-3.5 mr-1" />
                              Cancel
                            </Button>
                            <Button
                              className="h-7 px-3 text-xs rounded-lg bg-accent text-accent-foreground"
                              size="sm"
                              variant="primary"
                              onPress={() => handleSaveEdit(s.id)}
                            >
                              <Check className="size-3.5 mr-1" />
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={s.id}
                        className="group relative flex flex-col gap-2 p-3.5 rounded-2xl bg-surface border border-separator/40 hover:border-separator/80 shadow-xs transition-colors select-none"
                      >
                        {/* Top Row: Title, Date & Time, Duration Pill + Actions */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col min-w-0">
                            <Typography
                              truncate
                              className="text-xs sm:text-sm text-foreground"
                              type="body-sm"
                              weight="semibold"
                            >
                              {s.title || "Focus Session"}
                            </Typography>
                            <div className="flex items-center gap-2.5 text-[11px] text-muted font-light mt-0.5">
                              <span className="flex items-center gap-1">
                                <Calendar className="size-3 text-accent" />
                                <span>{date}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="size-3 text-muted" />
                                <span>{time}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-2.5 py-1 rounded-full bg-accent/15 border border-accent/30 text-xs font-semibold text-accent tabular-nums mr-1">
                              {formatMinutesDisplay(totalMins)}
                            </span>
                            <Button
                              isIconOnly
                              aria-label="Edit session"
                              className="size-7 rounded-xl text-muted hover:text-foreground hover:bg-surface-secondary transition-colors cursor-pointer"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStartEdit(s)}
                            >
                              <Edit3 className="size-3.5" />
                            </Button>
                            <Button
                              isIconOnly
                              aria-label="Delete session (Hold Shift to skip confirmation)"
                              className={`size-7 rounded-xl transition-colors cursor-pointer ${
                                confirmDeleteId === s.id
                                  ? "text-danger bg-danger/15"
                                  : "text-muted hover:text-danger hover:bg-danger/10"
                              }`}
                              size="sm"
                              variant="ghost"
                              onClick={(e) => triggerDelete(s.id, e)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Confirmation Banner */}
                        {confirmDeleteId === s.id && (
                          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-danger/10 border border-danger/25 text-xs animate-in fade-in zoom-in-95">
                            <span className="text-[11px] text-danger font-medium">
                              Delete this focus session?
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button
                                className="h-6 px-2.5 text-[11px] font-semibold rounded-lg bg-danger text-danger-foreground hover:bg-danger/90 cursor-pointer"
                                size="sm"
                                variant="primary"
                                onPress={() => handleDeleteSession(s.id)}
                              >
                                Delete
                              </Button>
                              <Button
                                className="h-6 px-2 text-[11px] rounded-lg text-muted hover:text-foreground cursor-pointer"
                                size="sm"
                                variant="ghost"
                                onPress={() => setConfirmDeleteId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Sub-details row: Cycles, Overtime, Tag */}
                        <div className="flex items-center gap-2 flex-wrap text-[11px] pt-0.5">
                          {cycleCount !== undefined && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-secondary text-muted border border-separator/30">
                              <Target className="size-3 text-purple-400" />
                              <span>
                                {cycleCount}{" "}
                                {cycleCount === 1 ? "cycle" : "cycles"}
                              </span>
                            </span>
                          )}

                          {s.overtimeMinutes !== undefined &&
                            s.overtimeMinutes > 0 && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <Zap className="size-3" />
                                <span>
                                  +{formatMinutesDisplay(s.overtimeMinutes)}{" "}
                                  overtime
                                </span>
                              </span>
                            )}

                          {s.tag && (
                            <span
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium ${
                                PRESET_TAGS.find(
                                  (p) => p.id === s.tag || p.label === s.tag,
                                )?.color ||
                                "text-muted bg-surface-secondary border-separator/40"
                              }`}
                            >
                              <Tag className="size-2.5" />
                              <span className="capitalize">{s.tag}</span>
                            </span>
                          )}
                        </div>

                        {/* Optional Notes */}
                        {s.notes && (
                          <div className="flex items-start gap-1.5 p-2 rounded-xl bg-surface-secondary/50 border border-separator/20 text-xs text-foreground/80 mt-1">
                            <FileText className="size-3.5 text-muted shrink-0 mt-0.5" />
                            <Typography
                              className="leading-relaxed whitespace-pre-wrap"
                              type="body-xs"
                            >
                              {s.notes}
                            </Typography>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Load more button */}
                  {hasMore && (
                    <div className="flex justify-center pt-2 pb-3">
                      <Button
                        className="text-xs font-medium px-4 py-1.5 rounded-full bg-surface-secondary border border-separator/50 hover:bg-surface-secondary/80 hover:border-separator text-muted hover:text-foreground transition-colors cursor-pointer shadow-xs"
                        size="sm"
                        variant="secondary"
                        onPress={() =>
                          setVisibleCount((prev) => prev + PAGE_SIZE)
                        }
                      >
                        Load more ({remainingCount} remaining)
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </ScrollShadow>
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
