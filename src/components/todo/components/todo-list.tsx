import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  DragEvent,
} from "react";
import {
  AlertDialog,
  ScrollShadow,
  Separator,
  Typography,
  Button,
} from "@heroui/react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CheckCircle2, Coffee, Search } from "lucide-react";

import { TodoItem } from "../types";

import { TodoItemMinimal } from "./todo-item-minimal";
import { TodoItemDetailed } from "./todo-item-detailed";
import { TodoEditModal } from "./todo-edit-modal";

import { useTodos } from "@/hooks/use-todos";

interface DragOverState {
  id: string;
  position: "top" | "bottom";
}

const PAGE_SIZE = 20;

export function TodoList() {
  const {
    filteredTodos,
    viewMode,
    filter,
    searchQuery,
    selectedTag,
    moveTodoToPosition,
    permanentlyDeleteTodo,
  } = useTodos();
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [deletingTodo, setDeletingTodo] = useState<TodoItem | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // Reset pagination when filter, search, or tag changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter, searchQuery, selectedTag]);

  const visibleTodos = useMemo(
    () => filteredTodos.slice(0, visibleCount),
    [filteredTodos, visibleCount],
  );
  const hasMore = visibleCount < filteredTodos.length;
  const remainingCount = filteredTodos.length - visibleCount;

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverState, setDragOverState] = useState<DragOverState | null>(
    null,
  );

  const draggedIdRef = useRef<string | null>(null);
  const dragOverStateRef = useRef<DragOverState | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const prevIdsRef = useRef<string[]>([]);
  const isInitialMountRef = useRef<boolean>(true);

  // Sync state to refs for immediate synchronous access during drag/drop events
  const updateDragOver = useCallback((state: DragOverState | null) => {
    dragOverStateRef.current = state;
    setDragOverState(state);
  }, []);

  const updateDraggedId = useCallback((id: string | null) => {
    draggedIdRef.current = id;
    setDraggedId(id);
  }, []);

  // Item-level drag handlers
  const handleDragStart = useCallback((e: DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";

    draggedIdRef.current = id;
    // Delay React state update by 0ms so the browser captures the drag image before applying the transparent drag placeholder
    setTimeout(() => {
      setDraggedId(id);
    }, 0);
  }, []);

  const handleItemDragOver = useCallback(
    (e: DragEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "move";

      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const position = e.clientY < midY ? "top" : "bottom";

      updateDragOver({ id, position });
    },
    [updateDragOver],
  );

  // Central commit function: moves item to the target position
  const executeDrop = useCallback(() => {
    const sourceId = draggedIdRef.current;
    const targetState = dragOverStateRef.current;

    if (sourceId && targetState && sourceId !== targetState.id) {
      moveTodoToPosition(sourceId, targetState.id, targetState.position);
    }

    updateDraggedId(null);
    updateDragOver(null);
  }, [moveTodoToPosition, updateDraggedId, updateDragOver]);

  // When mouse is released anywhere (even outside container or outside browser window),
  // place the element where the last indicator was rather than cancelling!
  const handleDragEnd = useCallback(() => {
    executeDrop();
  }, [executeDrop]);

  const handleItemDrop = useCallback(
    (e: DragEvent, targetId: string) => {
      e.preventDefault();
      e.stopPropagation();

      const sourceId =
        e.dataTransfer.getData("text/plain") || draggedIdRef.current;
      const targetState = dragOverStateRef.current;
      const pos = targetState?.position || "bottom";

      if (sourceId && sourceId !== targetId) {
        moveTodoToPosition(sourceId, targetId, pos);
      }

      updateDraggedId(null);
      updateDragOver(null);
    },
    [moveTodoToPosition, updateDraggedId, updateDragOver],
  );

  // Container-level drag over and drop (handles shadows, margins, and empty space)
  const handleContainerDragOver = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      const container = listRef.current;

      if (!container || filteredTodos.length === 0) return;

      // Auto-scroll when near top or bottom edge of the scroll container
      const rect = container.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;

      if (relativeY < 48) {
        container.scrollTop -= 6;
      } else if (relativeY > rect.height - 48) {
        container.scrollTop += 6;
      }

      // If dragging in container space above all items or below all items
      const firstItem = visibleTodos[0];
      const lastItem = visibleTodos[visibleTodos.length - 1];

      if (relativeY < 32 && firstItem) {
        updateDragOver({ id: firstItem.id, position: "top" });
      } else if (relativeY > rect.height - 32 && lastItem) {
        updateDragOver({ id: lastItem.id, position: "bottom" });
      }
    },
    [visibleTodos, updateDragOver],
  );

  const handleContainerDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      executeDrop();
    },
    [executeDrop],
  );

  // Fast GSAP animations: only animate newly added items with zero mount lag
  useGSAP(
    () => {
      const el = listRef.current;

      if (!el) return;

      const currentIds = visibleTodos.map((t) => t.id);

      if (isInitialMountRef.current) {
        isInitialMountRef.current = false;
        prevIdsRef.current = currentIds;

        return;
      }

      // Check if a new item was added
      const newIds = currentIds.filter(
        (id) => !prevIdsRef.current.includes(id),
      );

      prevIdsRef.current = currentIds;

      if (newIds.length > 0) {
        newIds.forEach((id) => {
          const newEl = el.querySelector(`[data-todo-id="${id}"]`);

          if (newEl) {
            gsap.fromTo(
              newEl,
              { opacity: 0, y: -12, scale: 0.96 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.25,
                ease: "power2.out",
                overwrite: "auto",
              },
            );
          }
        });
      }
    },
    { dependencies: [visibleTodos], scope: listRef },
  );

  return (
    <div className="flex flex-col w-full h-full min-h-0 overflow-hidden">
      {filteredTodos.length === 0 ? (
        <div className="flex flex-col items-center justify-center my-auto py-8 px-4 rounded-2xl bg-surface/30 border border-separator/30 text-center gap-3">
          <div className="size-12 rounded-2xl bg-surface flex items-center justify-center text-muted border border-separator/40 shadow-xs">
            {searchQuery ? (
              <Search className="size-5 text-accent" />
            ) : filter === "completed" ? (
              <CheckCircle2 className="size-5 text-accent" />
            ) : (
              <Coffee className="size-5 text-accent" />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Typography
              className="text-sm md:text-base text-foreground font-medium"
              type="h4"
              weight="medium"
            >
              {searchQuery
                ? `No tasks matching "${searchQuery}"`
                : filter === "completed"
                  ? "No completed tasks yet"
                  : filter === "today"
                    ? "No tasks scheduled for today"
                    : "Your list is clean and cozy"}
            </Typography>
            <Typography
              className="text-xs max-w-xs leading-relaxed font-light"
              color="muted"
              type="body-xs"
            >
              {searchQuery
                ? "Try a different search term or clear the filter."
                : filter === "completed"
                  ? "Check off tasks as you finish them to see your progress here."
                  : "Add your first task above to start organizing your day."}
            </Typography>
          </div>
        </div>
      ) : (
        <ScrollShadow
          ref={listRef}
          className="w-full h-full pr-1.5 scroll-smooth py-1"
          orientation="vertical"
          size={32}
          onDragEnd={handleDragEnd}
          onDragOver={handleContainerDragOver}
          onDrop={handleContainerDrop}
        >
          <div
            className={`flex flex-col w-full ${
              viewMode === "minimal" ? "gap-1.5" : "gap-2.5"
            }`}
          >
            {visibleTodos.map((todo, idx) => {
              const isDragOverThis =
                dragOverState?.id === todo.id && draggedId !== todo.id;
              const isDropTop =
                isDragOverThis && dragOverState?.position === "top";
              const isDropBottom =
                isDragOverThis && dragOverState?.position === "bottom";

              const isThisDragging = draggedId === todo.id;

              return (
                <div
                  key={todo.id}
                  className={`todo-item-row w-full flex flex-col gap-1 transition-[opacity,transform] duration-150 ${
                    isThisDragging
                      ? "opacity-25 pointer-events-none scale-[0.99]"
                      : "opacity-100"
                  }`}
                  data-todo-id={todo.id}
                  onDragOver={(e) => handleItemDragOver(e, todo.id)}
                  onDrop={(e) => handleItemDrop(e, todo.id)}
                >
                  {/* Separator indicator above if drop position is top */}
                  {isDropTop && (
                    <div className="py-0.5 px-1 animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                      <Separator className="h-0.5 bg-accent rounded-full shadow-xs" />
                    </div>
                  )}

                  {viewMode === "minimal" ? (
                    <TodoItemMinimal
                      index={idx}
                      isDragging={draggedId === todo.id}
                      todo={todo}
                      onDelete={setDeletingTodo}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleItemDragOver}
                      onDragStart={handleDragStart}
                      onDrop={handleItemDrop}
                      onEdit={setEditingTodo}
                    />
                  ) : (
                    <TodoItemDetailed
                      index={idx}
                      isDragging={draggedId === todo.id}
                      todo={todo}
                      onDelete={setDeletingTodo}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleItemDragOver}
                      onDragStart={handleDragStart}
                      onDrop={handleItemDrop}
                      onEdit={setEditingTodo}
                    />
                  )}

                  {/* Separator indicator below if drop position is bottom */}
                  {isDropBottom && (
                    <div className="py-0.5 px-1 animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                      <Separator className="h-0.5 bg-accent rounded-full shadow-xs" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Load more button at the end of the scroll when there are more items */}
            {hasMore && (
              <div className="flex justify-center pt-2 pb-3">
                <Button
                  className="text-xs font-medium px-4 py-1.5 rounded-full bg-surface-secondary border border-separator/50 hover:bg-surface-secondary/80 hover:border-separator text-muted hover:text-foreground transition-colors cursor-pointer shadow-xs"
                  size="sm"
                  variant="secondary"
                  onPress={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                >
                  Load more ({remainingCount} remaining)
                </Button>
              </div>
            )}
          </div>
        </ScrollShadow>
      )}

      {/* Deep Edit Modal */}
      <TodoEditModal
        isOpen={Boolean(editingTodo)}
        todo={editingTodo}
        onClose={() => setEditingTodo(null)}
      />

      {/* Permanent Delete Confirmation Dialog */}
      {deletingTodo && (
        <AlertDialog.Backdrop
          isOpen={Boolean(deletingTodo)}
          onOpenChange={(open) => !open && setDeletingTodo(null)}
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>
                  Permanently Delete Task?
                </AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <Typography
                  className="leading-relaxed"
                  color="muted"
                  type="body-sm"
                >
                  Are you sure you want to permanently delete{" "}
                  <strong className="text-foreground">
                    &quot;{deletingTodo.title}&quot;
                  </strong>
                  ? This action cannot be undone and will affect your task
                  completion statistics.
                </Typography>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button
                  slot="close"
                  variant="tertiary"
                  onPress={() => setDeletingTodo(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onPress={() => {
                    if (deletingTodo) {
                      permanentlyDeleteTodo(deletingTodo.id);
                      setDeletingTodo(null);
                    }
                  }}
                >
                  Delete Task
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      )}
    </div>
  );
}
