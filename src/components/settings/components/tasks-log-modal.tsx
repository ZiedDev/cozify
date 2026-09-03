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
  CheckSquare,
  Search,
  Calendar,
  Tag,
  Flag,
  FileText,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Archive,
  Edit3,
  Check,
  X,
} from "lucide-react";

import {
  TodoItem,
  TodoPriority,
  PRESET_TAGS,
  getTagIcon,
} from "@/components/todo/types";
import { storageAdapter, STORAGE_KEYS } from "@/services/storage";

interface TasksLogModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAGE_SIZE = 20;

export function TasksLogModal({ isOpen, onOpenChange }: TasksLogModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<
    "all" | "completed" | "archived" | "active"
  >("all");
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // Edit state
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editPriority, setEditPriority] = useState<TodoPriority>("none");
  const [editTag, setEditTag] = useState<string | undefined>(undefined);
  const [editDueDate, setEditDueDate] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setTodos(storageAdapter.getItem<TodoItem[]>(STORAGE_KEYS.TODOS, []));
      setVisibleCount(PAGE_SIZE);
      setFilterMode("all");
      setEditingTodoId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, filterMode]);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handlePermanentDelete = (id: string) => {
    const next = todos.filter((t) => t.id !== id);

    setTodos(next);
    storageAdapter.setItem(STORAGE_KEYS.TODOS, next);
    setConfirmDeleteId(null);
    if (editingTodoId === id) setEditingTodoId(null);
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("cozify_achievements_changed"));
  };

  const triggerDelete = (id: string, e?: MouseEvent) => {
    if (e?.shiftKey) {
      handlePermanentDelete(id);
    } else {
      setConfirmDeleteId((prev) => (prev === id ? null : id));
      if (editingTodoId === id) setEditingTodoId(null);
    }
  };

  const handleRestoreTodo = (id: string) => {
    const next = todos.map((t) =>
      t.id === id ? { ...t, archived: false, archivedAt: undefined } : t,
    );

    setTodos(next);
    storageAdapter.setItem(STORAGE_KEYS.TODOS, next);
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("cozify_achievements_changed"));
  };

  const handleStartEdit = (t: TodoItem) => {
    setEditingTodoId(t.id);
    setEditTitle(t.title);
    setEditNotes(t.notes || "");
    setEditPriority(t.priority || "none");
    setEditTag(t.tag);
    setEditDueDate(t.dueDate || "");
    setConfirmDeleteId(null);
  };

  const handleSaveEdit = (id: string) => {
    const next = todos.map((t) => {
      if (t.id !== id) return t;

      return {
        ...t,
        title: editTitle.trim() || "Untitled Task",
        notes: editNotes.trim() || undefined,
        priority: editPriority,
        tag: editTag || undefined,
        dueDate: editDueDate || undefined,
      };
    });

    setTodos(next);
    storageAdapter.setItem(STORAGE_KEYS.TODOS, next);
    setEditingTodoId(null);
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("cozify_achievements_changed"));
  };

  const filteredTodos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return todos.filter((t) => {
      // 1. Status Filter Mode
      if (filterMode === "completed" && !t.completed) return false;
      if (filterMode === "archived" && !t.archived) return false;
      if (filterMode === "active" && (t.completed || t.archived)) return false;

      // 2. Search query
      if (q) {
        const matchTitle = (t.title || "").toLowerCase().includes(q);
        const matchNotes = (t.notes || "").toLowerCase().includes(q);
        const matchTag = (t.tag || "").toLowerCase().includes(q);

        if (!matchTitle && !matchNotes && !matchTag) return false;
      }

      return true;
    });
  }, [todos, searchQuery, filterMode]);

  const visibleTodos = useMemo(
    () => filteredTodos.slice(0, visibleCount),
    [filteredTodos, visibleCount],
  );
  const hasMore = visibleCount < filteredTodos.length;
  const remainingCount = filteredTodos.length - visibleCount;

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const archived = todos.filter((t) => t.archived).length;
    const active = todos.filter((t) => !t.completed && !t.archived).length;

    return { total, completed, archived, active };
  }, [todos]);

  const formatDateTime = (timestamp?: number) => {
    if (!timestamp) return "—";
    try {
      const d = new Date(timestamp);

      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "—";
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
              <CheckSquare className="size-5 text-accent" />
            </Modal.Icon>
            <Modal.Heading className="text-base font-semibold">
              Tasks & Archive Log
            </Modal.Heading>
          </Modal.Header>

          <Separator />

          {/* Modal Body: 2-Column Split Structure */}
          <Modal.Body className="p-0 overflow-hidden flex-1 min-h-0 flex flex-col sm:flex-row gap-0">
            {/* Left Sidebar: Search & Summary Stats */}
            <div className="w-full sm:w-56 border-b sm:border-b-0 sm:border-r border-separator/40 p-3 sm:p-4 bg-surface-secondary/40 shrink-0 flex flex-col gap-3">
              <div className="flex flex-col gap-3">
                {/* Search Bar */}
                <div className="flex flex-col gap-1.5 w-full">
                  <Typography
                    className="text-[11px] uppercase r"
                    color="muted"
                    type="body-xs"
                    weight="medium"
                  >
                    Search
                  </Typography>
                  <TextField fullWidth aria-label="Search tasks log">
                    <InputGroup
                      fullWidth
                      className="bg-surface border border-separator/40 rounded-xl h-8"
                    >
                      <InputGroup.Prefix className="pl-2.5 pr-1 text-muted">
                        <Search className="size-3.5" />
                      </InputGroup.Prefix>
                      <InputGroup.Input
                        className="text-xs"
                        placeholder="Filter title, notes, or tag..."
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
                        Total
                      </Typography>
                      <Typography
                        className="text-foreground tabular-nums"
                        type="body-xs"
                        weight="semibold"
                      >
                        {stats.total}
                      </Typography>
                    </div>

                    <div
                      className={`flex items-center justify-between p-2 rounded-xl border transition-colors cursor-pointer select-none ${
                        filterMode === "completed"
                          ? "bg-emerald-500/15 border-emerald-500/50 shadow-2xs"
                          : "bg-surface/70 border-separator/30 hover:bg-surface hover:border-separator/60"
                      }`}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        setFilterMode((prev) =>
                          prev === "completed" ? "all" : "completed",
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setFilterMode((prev) =>
                            prev === "completed" ? "all" : "completed",
                          );
                        }
                      }}
                    >
                      <Typography
                        className={
                          filterMode === "completed"
                            ? "text-emerald-400 font-medium"
                            : "text-muted"
                        }
                        type="body-xs"
                      >
                        Done
                      </Typography>
                      <Typography
                        className="text-emerald-400 tabular-nums"
                        type="body-xs"
                        weight="semibold"
                      >
                        {stats.completed}
                      </Typography>
                    </div>

                    <div
                      className={`flex items-center justify-between p-2 rounded-xl border transition-colors cursor-pointer select-none ${
                        filterMode === "archived"
                          ? "bg-amber-500/15 border-amber-500/50 shadow-2xs"
                          : "bg-surface/70 border-separator/30 hover:bg-surface hover:border-separator/60"
                      }`}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        setFilterMode((prev) =>
                          prev === "archived" ? "all" : "archived",
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setFilterMode((prev) =>
                            prev === "archived" ? "all" : "archived",
                          );
                        }
                      }}
                    >
                      <Typography
                        className={
                          filterMode === "archived"
                            ? "text-amber-400 font-medium"
                            : "text-muted"
                        }
                        type="body-xs"
                      >
                        Archived
                      </Typography>
                      <Typography
                        className="text-amber-400 tabular-nums"
                        type="body-xs"
                        weight="semibold"
                      >
                        {stats.archived}
                      </Typography>
                    </div>

                    <div
                      className={`flex items-center justify-between p-2 rounded-xl border transition-colors cursor-pointer select-none ${
                        filterMode === "active"
                          ? "bg-blue-500/15 border-blue-500/50 shadow-2xs"
                          : "bg-surface/70 border-separator/30 hover:bg-surface hover:border-separator/60"
                      }`}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        setFilterMode((prev) =>
                          prev === "active" ? "all" : "active",
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setFilterMode((prev) =>
                            prev === "active" ? "all" : "active",
                          );
                        }
                      }}
                    >
                      <Typography
                        className={
                          filterMode === "active"
                            ? "text-blue-400 font-medium"
                            : "text-muted"
                        }
                        type="body-xs"
                      >
                        Active
                      </Typography>
                      <Typography
                        className="text-blue-400 tabular-nums"
                        type="body-xs"
                        weight="semibold"
                      >
                        {stats.active}
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Scrollable Task Feed */}
            <ScrollShadow
              className="flex-1 min-h-0 h-full overflow-y-auto p-4 sm:p-5 bg-background/30"
              orientation="vertical"
              size={20}
            >
              {filteredTodos.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
                  <div className="size-12 rounded-2xl bg-surface-secondary/70 border border-separator/40 flex items-center justify-center text-muted mb-3">
                    <CheckSquare className="size-6 opacity-60" />
                  </div>
                  <Typography
                    className="font-medium text-foreground"
                    type="body-sm"
                  >
                    {searchQuery
                      ? "No tasks match your search"
                      : "No tasks recorded yet"}
                  </Typography>
                  <Typography
                    className="mt-1 max-w-xs opacity-70"
                    color="muted"
                    type="body-xs"
                  >
                    {searchQuery
                      ? "Try searching for a different keyword."
                      : "Create your first task to see it logged here."}
                  </Typography>
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleTodos.map((t) => {
                    const tagColor =
                      PRESET_TAGS.find(
                        (p) => p.id === t.tag || p.label === t.tag,
                      )?.color ||
                      "text-muted bg-surface-secondary border-separator/40";
                    const isEditing = editingTodoId === t.id;

                    if (isEditing) {
                      return (
                        <div
                          key={t.id}
                          className="flex flex-col gap-3 p-3.5 rounded-2xl bg-surface border border-accent/60 shadow-sm animate-in fade-in"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-accent flex items-center gap-1.5">
                              <Edit3 className="size-3.5" />
                              Edit Task Record
                            </span>
                            <span className="text-[11px] text-muted font-light">
                              Created {formatDateTime(t.createdAt)}
                            </span>
                          </div>

                          <div className="flex flex-col gap-2">
                            {/* Title */}
                            <div className="flex flex-col gap-1">
                              <label
                                className="text-[10px] uppercase r text-muted font-medium"
                                htmlFor={`task-edit-title-${t.id}`}
                              >
                                Task Title
                              </label>
                              <input
                                className="w-full h-8 px-2.5 rounded-xl bg-surface-secondary border border-separator/40 text-xs text-foreground outline-none focus:border-accent"
                                id={`task-edit-title-${t.id}`}
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                              />
                            </div>

                            {/* Priority & Due Date */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase r text-muted font-medium">
                                  Priority
                                </span>
                                <div className="flex items-center gap-1">
                                  {(
                                    [
                                      "none",
                                      "low",
                                      "medium",
                                      "high",
                                    ] as TodoPriority[]
                                  ).map((p) => (
                                    <button
                                      key={p}
                                      className={`px-2 py-1 rounded-lg text-[11px] font-medium border capitalize flex-1 transition-colors cursor-pointer ${
                                        editPriority === p
                                          ? "bg-accent/15 border-accent text-accent"
                                          : "bg-surface-secondary border-separator/40 text-muted"
                                      }`}
                                      type="button"
                                      onClick={() => setEditPriority(p)}
                                    >
                                      {p}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="flex flex-col gap-1">
                                <label
                                  className="text-[10px] uppercase r text-muted font-medium"
                                  htmlFor={`task-edit-due-${t.id}`}
                                >
                                  Due Date
                                </label>
                                <input
                                  className="w-full h-8 px-2.5 rounded-xl bg-surface-secondary border border-separator/40 text-xs text-foreground outline-none focus:border-accent"
                                  id={`task-edit-due-${t.id}`}
                                  type="date"
                                  value={editDueDate}
                                  onChange={(e) =>
                                    setEditDueDate(e.target.value)
                                  }
                                />
                              </div>
                            </div>

                            {/* Tag */}
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
                                {PRESET_TAGS.map((tag) => {
                                  const TagIconComp = getTagIcon(tag.id);

                                  return (
                                    <button
                                      key={tag.id}
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                                        editTag === tag.id
                                          ? `${tag.color} font-semibold ring-1 ring-accent/30`
                                          : "bg-surface-secondary border-separator/40 text-muted hover:text-foreground"
                                      }`}
                                      type="button"
                                      onClick={() => setEditTag(tag.id)}
                                    >
                                      <TagIconComp className="size-3 opacity-80" />
                                      <span>{tag.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Notes */}
                            <div className="flex flex-col gap-1">
                              <label
                                className="text-[10px] uppercase r text-muted font-medium"
                                htmlFor={`task-edit-notes-${t.id}`}
                              >
                                Notes
                              </label>
                              <textarea
                                className="w-full p-2 rounded-xl bg-surface-secondary border border-separator/40 text-xs text-foreground outline-none focus:border-accent resize-none"
                                id={`task-edit-notes-${t.id}`}
                                placeholder="Task description or notes..."
                                rows={2}
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-separator/30">
                            <Button
                              className="h-7 px-3 text-xs rounded-lg"
                              size="sm"
                              variant="ghost"
                              onPress={() => setEditingTodoId(null)}
                            >
                              <X className="size-3.5 mr-1" />
                              Cancel
                            </Button>
                            <Button
                              className="h-7 px-3 text-xs rounded-lg bg-accent text-accent-foreground"
                              size="sm"
                              variant="primary"
                              onPress={() => handleSaveEdit(t.id)}
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
                        key={t.id}
                        className="group relative flex flex-col gap-2 p-3.5 rounded-2xl bg-surface border border-separator/40 hover:border-separator/80 shadow-xs transition-colors select-none"
                      >
                        {/* Top Row: Title, Badges, Actions */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Typography
                                truncate
                                className={`text-xs sm:text-sm ${
                                  t.completed
                                    ? "line-through text-muted"
                                    : "text-foreground"
                                }`}
                                type="body-sm"
                                weight="semibold"
                              >
                                {t.title}
                              </Typography>

                              {t.completed && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="size-2.5" />
                                  <span>Done</span>
                                </span>
                              )}

                              {t.archived && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                  <Archive className="size-2.5" />
                                  <span>Archived</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2.5 text-[11px] text-muted font-light mt-0.5">
                              <span className="flex items-center gap-1">
                                <Calendar className="size-3 text-muted" />
                                <span>
                                  Created {formatDateTime(t.createdAt)}
                                </span>
                              </span>
                              {t.dueDate && (
                                <span className="flex items-center gap-1 text-accent">
                                  <span>Due: {t.dueDate}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              isIconOnly
                              aria-label="Edit task"
                              className="size-7 rounded-xl text-muted hover:text-foreground hover:bg-surface-secondary transition-colors cursor-pointer"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStartEdit(t)}
                            >
                              <Edit3 className="size-3.5" />
                            </Button>

                            {t.archived && (
                              <Button
                                isIconOnly
                                aria-label="Restore task"
                                className="size-7 rounded-xl text-muted hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                                size="sm"
                                variant="ghost"
                                onPress={() => handleRestoreTodo(t.id)}
                              >
                                <RotateCcw className="size-3.5" />
                              </Button>
                            )}

                            <Button
                              isIconOnly
                              aria-label="Permanently delete task (Hold Shift to skip confirmation)"
                              className={`size-7 rounded-xl transition-colors cursor-pointer ${
                                confirmDeleteId === t.id
                                  ? "text-danger bg-danger/15"
                                  : "text-muted hover:text-danger hover:bg-danger/10"
                              }`}
                              size="sm"
                              variant="ghost"
                              onClick={(e) => triggerDelete(t.id, e)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Confirmation Banner */}
                        {confirmDeleteId === t.id && (
                          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-danger/10 border border-danger/25 text-xs animate-in fade-in zoom-in-95">
                            <span className="text-[11px] text-danger font-medium">
                              Permanently delete this task?
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button
                                className="h-6 px-2.5 text-[11px] font-semibold rounded-lg bg-danger text-danger-foreground hover:bg-danger/90 cursor-pointer"
                                size="sm"
                                variant="primary"
                                onPress={() => handlePermanentDelete(t.id)}
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

                        {/* Metadata row: Priority & Tag */}
                        <div className="flex items-center gap-2 flex-wrap text-[11px] pt-0.5">
                          {t.priority && t.priority !== "none" && (
                            <span
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium ${
                                t.priority === "high"
                                  ? "text-rose-400 bg-rose-500/10 border-rose-500/30"
                                  : t.priority === "medium"
                                    ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
                                    : "text-blue-400 bg-blue-500/10 border-blue-500/30"
                              }`}
                            >
                              <Flag className="size-2.5" />
                              <span className="capitalize">{t.priority}</span>
                            </span>
                          )}

                          {t.tag && (
                            <span
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium ${tagColor}`}
                            >
                              <Tag className="size-2.5" />
                              <span>{t.tag}</span>
                            </span>
                          )}
                        </div>

                        {/* Optional Notes */}
                        {t.notes && (
                          <div className="flex items-start gap-1.5 p-2 rounded-xl bg-surface-secondary/50 border border-separator/20 text-xs text-foreground/80 mt-1">
                            <FileText className="size-3.5 text-muted shrink-0 mt-0.5" />
                            <Typography
                              className="leading-relaxed whitespace-pre-wrap"
                              type="body-xs"
                            >
                              {t.notes}
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
