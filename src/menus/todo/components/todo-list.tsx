import { useState, useRef, useEffect, useMemo } from "react";
import {
  AlertDialog,
  ScrollShadow,
  Typography,
  Button,
  Card,
} from "@heroui/react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CheckCircle2, Coffee, Search } from "lucide-react";

import { TodoItem } from "../types";

import { TodoItemMinimal } from "./todo-item-minimal";
import { TodoItemDetailed } from "./todo-item-detailed";
import { TodoEditModal } from "./todo-edit-modal";

import { useTodos } from "@/hooks/use-todos";
import { SortableList, SortableItem } from "@/components/ui/sortable-list";

const PAGE_SIZE = 20;

export function TodoList() {
  const {
    filteredTodos,
    viewMode,
    filter,
    searchQuery,
    selectedTag,
    reorderTodos,
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

  const listRef = useRef<HTMLDivElement>(null);
  const prevIdsRef = useRef<string[]>([]);
  const isInitialMountRef = useRef<boolean>(true);

  // Animate newly added items with zero mount lag
  useGSAP(
    () => {
      const containerElement = listRef.current;

      if (!containerElement) return;

      const currentIds = visibleTodos.map((todo) => todo.id);

      if (isInitialMountRef.current) {
        isInitialMountRef.current = false;
        prevIdsRef.current = currentIds;

        const rows = containerElement.querySelectorAll(".todo-item-row");

        if (rows.length > 0) {
          gsap.fromTo(
            rows,
            { opacity: 0, y: 10, scale: 0.98 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.35,
              stagger: 0.04,
              ease: "power2.out",
              overwrite: "auto",
            },
          );
        }

        return;
      }

      const newIds = currentIds.filter(
        (id) => !prevIdsRef.current.includes(id),
      );

      prevIdsRef.current = currentIds;

      if (newIds.length > 0) {
        newIds.forEach((id) => {
          const todoElement = containerElement.querySelector(
            `[data-todo-id="${id}"]`,
          );

          if (todoElement) {
            gsap.fromTo(
              todoElement,
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
        <Card className="items-center py-8 px-4 gap-3" variant="transparent">
          <div className="size-12 rounded-2xl bg-surface flex items-center justify-center">
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
              className="text-sm md:text-base text-foreground font-medium text-center"
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
              className="text-xs max-w-xs leading-relaxed font-light text-center"
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
        </Card>
      ) : (
        <ScrollShadow
          ref={listRef}
          className="w-full h-full pr-1.5 scroll-smooth py-2 px-4 overflow-x-hidden"
          orientation="vertical"
          size={32}
        >
          <SortableList onReorder={reorderTodos}>
            <div
              className={`flex flex-col w-full ${
                viewMode === "minimal" ? "gap-1.5" : "gap-2.5"
              }`}
            >
              {visibleTodos.map((todo, index) => (
                <SortableItem key={todo.id} id={todo.id} index={index}>
                  <div className="todo-item-row w-full" data-todo-id={todo.id}>
                    {viewMode === "minimal" ? (
                      <TodoItemMinimal
                        index={index}
                        todo={todo}
                        onDelete={setDeletingTodo}
                        onEdit={setEditingTodo}
                      />
                    ) : (
                      <TodoItemDetailed
                        index={index}
                        todo={todo}
                        onDelete={setDeletingTodo}
                        onEdit={setEditingTodo}
                      />
                    )}
                  </div>
                </SortableItem>
              ))}

              {/* Load more button at the end of the scroll when there are more items */}
              {hasMore && (
                <div className="flex justify-center pt-2 pb-3">
                  <Button
                    className="text-xs font-medium px-4 py-1.5 rounded-full bg-surface-secondary hover:bg-surface-secondary/80 text-muted hover:text-foreground transition-colors cursor-pointer shadow-xs"
                    size="sm"
                    variant="secondary"
                    onPress={() =>
                      setVisibleCount((prevCount) => prevCount + PAGE_SIZE)
                    }
                  >
                    Load more ({remainingCount} remaining)
                  </Button>
                </div>
              )}
            </div>
          </SortableList>
        </ScrollShadow>
      )}

      {/* Deep Edit Modal */}
      {editingTodo && (
        <TodoEditModal
          isOpen={Boolean(editingTodo)}
          todo={editingTodo}
          onClose={() => setEditingTodo(null)}
        />
      )}

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
                      const id = deletingTodo.id;
                      const targetRow = listRef.current?.querySelector(
                        `[data-todo-id="${id}"]`,
                      );

                      if (targetRow) {
                        gsap.to(targetRow, {
                          opacity: 0,
                          x: -24,
                          scale: 0.95,
                          duration: 0.22,
                          ease: "power2.in",
                          onComplete: () => permanentlyDeleteTodo(id),
                        });
                      } else {
                        permanentlyDeleteTodo(id);
                      }
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
