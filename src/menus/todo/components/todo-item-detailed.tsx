import { useState, useRef, useEffect, DragEvent } from "react";
import { Button, Tooltip, Typography, TextArea } from "@heroui/react";
import {
  Archive,
  Edit3,
  Calendar,
  AlertCircle,
  Check,
  Trash2,
  FileText,
  Plus,
} from "lucide-react";

import { TodoItem, getIntegratedTagPriorityInfo } from "../types";

import { useTodos } from "@/hooks/use-todos";

type Props = {
  todo: TodoItem;
  index?: number;
  isDragging?: boolean;
  onEdit: (todo: TodoItem) => void;
  onDelete: (todo: TodoItem) => void;
  onDragStart: (e: DragEvent, id: string) => void;
  onDragOver: (e: DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDrop: (e: DragEvent, id: string) => void;
};

export function TodoItemDetailed({
  todo,
  isDragging = false,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: Props) {
  const { toggleTodo, deleteTodo, updateTodo } = useTodos();

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [noteDraft, setNoteDraft] = useState(todo.notes || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setNoteDraft(todo.notes || "");
  }, [todo.notes]);

  useEffect(() => {
    if (isEditingNotes && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditingNotes]);

  const handleSaveNotes = () => {
    updateTodo(todo.id, { notes: noteDraft.trim() || undefined });
    setIsEditingNotes(false);
  };

  const integratedMeta = getIntegratedTagPriorityInfo(
    todo.tag,
    todo.priority || "none",
  );

  const todayStr = new Date().toISOString().split("T")[0];
  const isOverdue =
    Boolean(todo.dueDate) && !todo.completed && (todo.dueDate || "") < todayStr;
  const isDueToday = todo.dueDate === todayStr;

  return (
    <div
      draggable
      className={`group relative flex flex-col gap-2 p-3 md:p-3.5 rounded-2xl border transition-[background-color,border-color,opacity,transform] duration-150 select-none ${
        isDragging
          ? "opacity-25 bg-transparent border-dashed border-accent/70 scale-[0.98] shadow-none"
          : todo.completed
            ? "bg-surface-secondary/80 border-separator/30 opacity-70"
            : "bg-surface hover:border-separator/80 border-separator/40 shadow-xs"
      }`}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, todo.id)}
      onDragStart={(e) => onDragStart(e, todo.id)}
      onDrop={(e) => onDrop(e, todo.id)}
    >
      {/* 1. Top row: Drag Handle, Checkbox, Title, and Action Buttons */}
      <div className="flex items-start justify-between gap-2.5 w-full">
        {/* Tactile Checkbox Button */}
        <div className="pt-0.5 shrink-0">
          <button
            aria-label={
              todo.completed
                ? `Mark "${todo.title}" as active`
                : `Mark "${todo.title}" as completed`
            }
            className={`size-5 md:size-5.5 rounded-full border-2 transition-[background-color,border-color,transform] duration-200 flex items-center justify-center cursor-pointer shrink-0 ${
              todo.completed
                ? "bg-accent border-accent text-accent-foreground shadow-xs scale-95"
                : "border-muted/50 hover:border-accent hover:scale-110 bg-surface"
            }`}
            type="button"
            onClick={() => toggleTodo(todo.id)}
          >
            {todo.completed && <Check className="size-3 stroke-3" />}
          </button>
        </div>

        {/* Title area (Clicking toggles task) */}
        <div
          className="flex flex-col gap-0.5 min-w-0 flex-1 cursor-pointer text-left"
          role="button"
          tabIndex={0}
          onClick={() => toggleTodo(todo.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              toggleTodo(todo.id);
            }
          }}
        >
          <Typography
            className={`text-sm md:text-base leading-snug wrap-break-word transition-colors ${
              todo.completed
                ? "line-through text-muted"
                : "text-foreground font-medium"
            }`}
            type="body"
            weight="medium"
          >
            {todo.title}
          </Typography>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-0.5 shrink-0 opacity-80 md:opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Edit Button */}
          <Tooltip delay={300}>
            <Tooltip.Trigger>
              <Button
                isIconOnly
                aria-label="Edit task"
                className="size-7 md:size-7.5 rounded-xl text-muted/70 hover:text-foreground hover:bg-surface-secondary/70 transition-colors cursor-pointer"
                size="sm"
                variant="ghost"
                onPress={() => onEdit(todo)}
              >
                <Edit3 className="size-3.5 md:size-4" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content className="text-xs px-2.5 py-1.5 rounded-xl bg-surface text-foreground border border-separator shadow-lg">
              Edit Details
            </Tooltip.Content>
          </Tooltip>

          {/* Archive Button */}
          <Tooltip delay={300}>
            <Tooltip.Trigger>
              <Button
                isIconOnly
                aria-label="Archive task"
                className="size-7 md:size-7.5 rounded-xl text-muted/60 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                size="sm"
                variant="ghost"
                onPress={() => deleteTodo(todo.id)}
              >
                <Archive className="size-3.5 md:size-4" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content className="text-xs px-2.5 py-1.5 rounded-xl bg-surface text-foreground border border-separator shadow-lg">
              Archive Task
            </Tooltip.Content>
          </Tooltip>

          {/* Delete Button */}
          <Tooltip delay={300}>
            <Tooltip.Trigger>
              <Button
                isIconOnly
                aria-label="Delete task permanently"
                className="size-7 md:size-7.5 rounded-xl text-muted/60 hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                size="sm"
                variant="ghost"
                onPress={() => onDelete(todo)}
              >
                <Trash2 className="size-3.5 md:size-4" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content className="text-xs px-2.5 py-1.5 rounded-xl bg-surface text-foreground border border-separator shadow-lg">
              Delete Permanently
            </Tooltip.Content>
          </Tooltip>
        </div>
      </div>

      {/* 2. New Dedicated Line: Tag & Priority Badge + Due Date Badge */}
      <div className="flex items-center gap-2 flex-wrap pl-7 pt-0.5">
        {/* Integrated Tag & Priority Badge on New Line */}
        {(integratedMeta.hasTag || integratedMeta.hasPriority) && (
          <Tooltip delay={200}>
            <Tooltip.Trigger>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border shrink-0 transition-colors cursor-default ${integratedMeta.badgeClass}`}
              >
                <integratedMeta.Icon
                  className={`size-4 shrink-0 ${integratedMeta.iconColor}`}
                />
                <span>{integratedMeta.label}</span>
              </span>
            </Tooltip.Trigger>
            <Tooltip.Content className="text-xs px-2.5 py-1.5 rounded-xl bg-surface text-foreground border border-separator shadow-lg">
              {integratedMeta.tooltipText}
            </Tooltip.Content>
          </Tooltip>
        )}

        {/* Due Date Badge on the same metadata line */}
        {todo.dueDate && (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
              isOverdue
                ? "bg-danger/10 text-danger border-danger/30"
                : isDueToday
                  ? "bg-accent/15 text-accent border-accent/40 font-semibold"
                  : "bg-surface-secondary/50 text-muted/90 border-separator/30"
            }`}
          >
            {isOverdue ? (
              <AlertCircle className="size-3.5 text-danger shrink-0" />
            ) : (
              <Calendar className="size-3.5 opacity-70 shrink-0" />
            )}
            <span>
              {isDueToday
                ? "Today"
                : isOverdue
                  ? `Overdue (${todo.dueDate})`
                  : todo.dueDate}
            </span>
          </span>
        )}
      </div>

      {/* 3. Inline Notes Input / Preview Area */}
      <div className="pl-7 pt-1">
        {isEditingNotes ? (
          <div className="flex flex-col gap-1.5 w-full bg-surface-secondary/40 p-2 rounded-xl border border-separator/40">
            <TextArea
              ref={textareaRef}
              className="text-xs bg-transparent border-none placeholder:text-muted/50 focus:outline-none resize-none"
              placeholder="Add notes for this task... (Press Esc or click away to save)"
              rows={2}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  handleSaveNotes();
                } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleSaveNotes();
                }
              }}
            />
            <div className="flex items-center justify-end gap-1.5">
              <Button
                className="h-6 px-2 text-[11px] rounded-lg"
                size="sm"
                variant="ghost"
                onPress={() => {
                  setNoteDraft(todo.notes || "");
                  setIsEditingNotes(false);
                }}
              >
                Cancel
              </Button>
              <Button
                className="h-6 px-2.5 text-[11px] rounded-lg bg-accent text-accent-foreground font-medium"
                size="sm"
                variant="primary"
                onPress={handleSaveNotes}
              >
                Save
              </Button>
            </div>
          </div>
        ) : todo.notes ? (
          <div
            className="flex items-start gap-1.5 text-xs text-muted/80 hover:text-foreground font-light leading-relaxed cursor-pointer group/notes py-0.5"
            role="button"
            tabIndex={0}
            title="Click to edit notes"
            onClick={() => setIsEditingNotes(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setIsEditingNotes(true);
              }
            }}
          >
            <FileText className="size-3.5 opacity-50 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{todo.notes}</span>
          </div>
        ) : (
          <button
            className="inline-flex items-center gap-1 text-[11px] text-muted/50 hover:text-muted py-0.5 cursor-pointer transition-colors"
            type="button"
            onClick={() => setIsEditingNotes(true)}
          >
            <Plus className="size-3 opacity-70" />
            <span>Add note...</span>
          </button>
        )}
      </div>
    </div>
  );
}
