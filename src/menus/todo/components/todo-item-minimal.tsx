import { DragEvent, useState } from "react";
import { Button, Tooltip } from "@heroui/react";
import {
  Archive,
  Edit3,
  Check,
  GripVertical,
  Trash2,
  Calendar as CalendarIcon,
} from "lucide-react";

import { TodoItem, getIntegratedTagPriorityInfo } from "../types";

import { useTodos } from "@/hooks/use-todos";
import { Marquee } from "@/components/ui/marquee";

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

export function TodoItemMinimal({
  todo,
  isDragging = false,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: Props) {
  const { toggleTodo, deleteTodo } = useTodos();
  const [isHovered, setIsHovered] = useState(false);

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
      className={`group relative flex items-center justify-between gap-2.5 px-3 py-2 md:py-2.5 rounded-xl border transition-[background-color,border-color,opacity,transform] duration-150 select-none ${
        isDragging
          ? "opacity-25 bg-transparent border-dashed border-accent/70 scale-[0.98] shadow-none"
          : todo.completed
            ? "bg-surface-secondary/80 border-separator/30 opacity-70"
            : "bg-surface hover:border-separator/70 border-separator/40 shadow-2xs"
      }`}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, todo.id)}
      onDragStart={(e) => onDragStart(e, todo.id)}
      onDrop={(e) => onDrop(e, todo.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag Handle */}
      <span
        aria-label="Drag to reorder"
        className="text-muted/30 group-hover:text-muted/70 cursor-grab active:cursor-grabbing p-0.5 shrink-0 transition-colors"
        title="Drag to reorder"
      >
        <GripVertical className="size-3.5" />
      </span>

      {/* Tactile Checkbox Button */}
      <button
        aria-label={
          todo.completed
            ? `Mark "${todo.title}" as active`
            : `Mark "${todo.title}" as completed`
        }
        className={`size-4.5 md:size-5 rounded-full border-2 transition-[background-color,border-color,transform] duration-200 flex items-center justify-center cursor-pointer shrink-0 ${
          todo.completed
            ? "bg-accent border-accent text-accent-foreground shadow-xs scale-95"
            : "border-muted/50 hover:border-accent hover:scale-110 bg-surface"
        }`}
        type="button"
        onClick={() => toggleTodo(todo.id)}
      >
        {todo.completed && <Check className="size-2.5 md:size-3 stroke-3" />}
      </button>

      {/* Tag / Priority Icon in place of the old dot */}
      {(integratedMeta.hasTag || integratedMeta.hasPriority) && (
        <Tooltip delay={200}>
          <Tooltip.Trigger>
            <span className="flex items-center justify-center shrink-0 cursor-default">
              <integratedMeta.Icon
                className={`size-4 md:size-4.5 shrink-0 transition-colors ${integratedMeta.iconColor}`}
              />
            </span>
          </Tooltip.Trigger>
          <Tooltip.Content className="text-xs px-2.5 py-1.5 rounded-xl bg-surface text-foreground border border-separator shadow-lg">
            {integratedMeta.tooltipText}
          </Tooltip.Content>
        </Tooltip>
      )}

      {/* Task Title (Clicking toggles complete) */}
      <div
        className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer overflow-hidden"
        role="button"
        tabIndex={0}
        onClick={() => toggleTodo(todo.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            toggleTodo(todo.id);
          }
        }}
      >
        <div className="flex-1 min-w-0 overflow-hidden">
          <Marquee
            playOnHover
            align="start"
            className={`text-xs md:text-sm transition-colors text-left font-medium ${
              todo.completed
                ? "line-through text-muted"
                : "text-foreground font-medium"
            }`}
            isHovered={isHovered && !isDragging}
            text={todo.title}
          />
        </div>

        {/* Compact Due Date Indicator */}
        {todo.dueDate && (
          <span
            className={`hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border shrink-0 ${
              isOverdue
                ? "bg-danger/10 text-danger border-danger/30"
                : isDueToday
                  ? "bg-accent/15 text-accent border-accent/40 font-semibold"
                  : "bg-surface-secondary/50 text-muted/80 border-separator/30"
            }`}
          >
            <CalendarIcon className="size-3 opacity-70" />
            <span>{isDueToday ? "Today" : todo.dueDate}</span>
          </span>
        )}
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-0.5 shrink-0 opacity-80 md:opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Edit Button */}
        <Tooltip delay={300}>
          <Tooltip.Trigger>
            <Button
              isIconOnly
              aria-label="Edit task"
              className="size-7 rounded-lg text-muted/60 hover:text-foreground hover:bg-surface-secondary/60 transition-colors cursor-pointer"
              size="sm"
              variant="ghost"
              onPress={() => onEdit(todo)}
            >
              <Edit3 className="size-3.5" />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content className="text-xs px-2 py-1 rounded-lg bg-surface text-foreground border border-separator shadow-md">
            Edit
          </Tooltip.Content>
        </Tooltip>

        {/* Archive Button */}
        <Tooltip delay={300}>
          <Tooltip.Trigger>
            <Button
              isIconOnly
              aria-label="Archive task"
              className="size-7 rounded-lg text-muted/60 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
              size="sm"
              variant="ghost"
              onPress={() => deleteTodo(todo.id)}
            >
              <Archive className="size-3.5" />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content className="text-xs px-2 py-1 rounded-lg bg-surface text-foreground border border-separator shadow-md">
            Archive
          </Tooltip.Content>
        </Tooltip>

        {/* Delete Button */}
        <Tooltip delay={300}>
          <Tooltip.Trigger>
            <Button
              isIconOnly
              aria-label="Delete task permanently"
              className="size-7 rounded-lg text-muted/60 hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
              size="sm"
              variant="ghost"
              onPress={() => onDelete(todo)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content className="text-xs px-2 py-1 rounded-lg bg-surface text-foreground border border-separator shadow-md">
            Delete Permanently
          </Tooltip.Content>
        </Tooltip>
      </div>
    </div>
  );
}
