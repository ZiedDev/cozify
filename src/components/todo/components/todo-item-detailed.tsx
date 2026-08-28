import React from "react";
import { Button, Tooltip, Typography } from "@heroui/react";
import {
  Trash2,
  Edit3,
  Calendar,
  Tag,
  AlertCircle,
  Check,
  GripVertical,
} from "lucide-react";

import { TodoItem, PRIORITY_CONFIG, PRESET_TAGS } from "../types";

import { useTodos } from "@/hooks/use-todos";

export interface TodoItemDetailedProps {
  todo: TodoItem;
  index?: number;
  isDragging?: boolean;
  onEdit: (todo: TodoItem) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, id: string) => void;
}

export function TodoItemDetailed({
  todo,
  isDragging = false,
  onEdit,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: TodoItemDetailedProps) {
  const { toggleTodo, deleteTodo } = useTodos();

  const priorityConfig = PRIORITY_CONFIG[todo.priority || "none"];
  const tagConfig = PRESET_TAGS.find((t) => t.id === todo.tag);

  const todayStr = new Date().toISOString().split("T")[0];
  const isOverdue =
    Boolean(todo.dueDate) && !todo.completed && (todo.dueDate || "") < todayStr;
  const isDueToday = todo.dueDate === todayStr;

  return (
    <div
      draggable
      className={`group relative flex flex-col gap-2.5 p-3 md:p-3.5 rounded-2xl border transition-all duration-150 select-none ${
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
      {/* Top row: Drag Handle, Checkbox, Title/Notes, and Action Buttons */}
      <div className="flex items-start justify-between gap-2.5 w-full">
        {/* Drag Handle */}
        <div className="pt-0.5 shrink-0">
          <span
            aria-label="Drag to reorder"
            className="text-muted/30 group-hover:text-muted/70 cursor-grab active:cursor-grabbing p-0.5 shrink-0 transition-colors inline-block"
            title="Drag to reorder"
          >
            <GripVertical className="size-3.5" />
          </span>
        </div>

        {/* Tactile Checkbox Button */}
        <div className="pt-0.5 shrink-0">
          <button
            aria-label={
              todo.completed
                ? `Mark "${todo.title}" as active`
                : `Mark "${todo.title}" as completed`
            }
            className={`size-5 md:size-5.5 rounded-full border-2 transition-all duration-200 flex items-center justify-center cursor-pointer shrink-0 ${
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

        {/* Title and Notes area (Clicking toggles task) */}
        <div
          className="flex flex-col gap-1 min-w-0 flex-1 cursor-pointer text-left"
          role="button"
          tabIndex={0}
          onClick={() => toggleTodo(todo.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              toggleTodo(todo.id);
            }
          }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <Typography
              className={`text-sm md:text-base leading-snug break-words transition-all ${
                todo.completed
                  ? "line-through text-muted"
                  : "text-foreground font-medium"
              }`}
              type="body"
              weight="medium"
            >
              {todo.title}
            </Typography>

            {/* Priority Badge */}
            {todo.priority && todo.priority !== "none" && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border shrink-0 ${priorityConfig.badgeClass}`}
              >
                <span
                  className={`size-1.5 rounded-full ${priorityConfig.dotColor}`}
                />
                {priorityConfig.label}
              </span>
            )}
          </div>

          {/* Notes preview */}
          {todo.notes && (
            <Typography
              className="text-xs opacity-80 line-clamp-2 font-light leading-relaxed"
              color="muted"
              type="body-xs"
            >
              {todo.notes}
            </Typography>
          )}
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

          {/* Delete Button */}
          <Tooltip delay={300}>
            <Tooltip.Trigger>
              <Button
                isIconOnly
                aria-label="Delete task"
                className="size-7 md:size-7.5 rounded-xl text-muted/60 hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                size="sm"
                variant="ghost"
                onPress={() => deleteTodo(todo.id)}
              >
                <Trash2 className="size-3.5 md:size-4" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content className="text-xs px-2.5 py-1.5 rounded-xl bg-surface text-danger border border-separator shadow-lg">
              Delete Task
            </Tooltip.Content>
          </Tooltip>
        </div>
      </div>

      {/* Bottom Metadata Badges Row */}
      {(todo.dueDate || todo.tag) && (
        <div className="flex items-center gap-2 flex-wrap pt-1 text-xs border-t border-separator/20 pl-7">
          {/* Due Date Badge */}
          {todo.dueDate && (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                isOverdue
                  ? "bg-danger/10 text-danger border-danger/30"
                  : isDueToday
                    ? "bg-accent/15 text-accent border-accent/40 font-semibold"
                    : "bg-surface-secondary/50 text-muted/90 border-separator/30"
              }`}
            >
              {isOverdue ? (
                <AlertCircle className="size-3 text-danger" />
              ) : (
                <Calendar className="size-3 opacity-70" />
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

          {/* Tag badge */}
          {tagConfig && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${tagConfig.color}`}
            >
              <Tag className="size-2.5 opacity-70" />
              {tagConfig.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
