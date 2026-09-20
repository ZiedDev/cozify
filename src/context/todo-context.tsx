import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { arrayMove } from "@dnd-kit/sortable";

import { useSound } from "@/context/sound-context";
import { useAuth } from "@/services/supabase/auth-context";
import {
  TodoItem,
  TodoPriority,
  TodoFilter,
  TodoViewMode,
} from "@/menus/todo/types";
import { storageAdapter, STORAGE_KEYS, AppSettings } from "@/services/storage";
import { StatsRollupEngine } from "@/services/stats-rollup-engine";
import { syncEngine } from "@/services/db/sync-engine";
import { db } from "@/services/db";

type TodoContextType = {
  todos: TodoItem[];
  filteredTodos: TodoItem[];
  isLoading: boolean;
  viewMode: TodoViewMode;
  filter: TodoFilter;
  selectedTag: string | null;
  selectedPriority: TodoPriority | "all" | null;
  searchQuery: string;
  stats: {
    total: number;
    completed: number;
    active: number;
    percentage: number;
  };
  addTodo: (data: {
    title: string;
    priority?: TodoPriority;
    dueDate?: string;
    tag?: string;
    notes?: string;
  }) => TodoItem;
  toggleTodo: (id: string) => void;
  updateTodo: (id: string, updates: Partial<TodoItem>) => void;
  deleteTodo: (id: string) => void;
  permanentlyDeleteTodo: (id: string) => void;
  restoreTodo: (id: string) => void;
  clearCompleted: () => void;
  resetToDefaultTodos: () => void;
  moveTodoToPosition: (
    sourceId: string,
    targetId: string,
    position: "top" | "bottom",
  ) => void;
  reorderTodos: (activeId: string, overId: string) => void;
  reorderList: (reordered: TodoItem[]) => void;
  setViewMode: (mode: TodoViewMode) => void;
  setFilter: (filter: TodoFilter) => void;
  setSelectedTag: (tag: string | null) => void;
  setSelectedPriority: (priority: TodoPriority | "all" | null) => void;
  setSearchQuery: (query: string) => void;
};

const TodoContext = createContext<TodoContextType | null>(null);

const DEFAULT_INITIAL_TODOS: TodoItem[] = [
  {
    id: "cozify-welcome-task-1",
    title: "Welcome to Cozify To-Do ✨",
    completed: false,
    createdAt: 1700000000000,
    priority: "high",
    tag: "personal",
    notes: "Switch between Minimalist and Detailed modes to find your flow.",
  },
  {
    id: "cozify-welcome-task-2",
    title: "Drag and drop tasks to reorder your priorities 📌",
    completed: false,
    createdAt: 1700000001000,
    priority: "medium",
    tag: "study",
    notes: "Your top tasks will instantly appear on your cozy sidebar widget!",
  },
];

function applyTodoOrdering(todos: TodoItem[]): TodoItem[] {
  if (!Array.isArray(todos) || todos.length <= 1) return todos;

  try {
    const rawOrder = localStorage.getItem("cozify_todo_order_ids");

    if (!rawOrder) return todos;
    const orderIds = JSON.parse(rawOrder);

    if (!Array.isArray(orderIds) || orderIds.length === 0) return todos;

    const orderMap = new Map<string, number>();

    orderIds.forEach((id: string, index: number) => {
      orderMap.set(id, index);
    });

    return [...todos].sort((a, b) => {
      const indexA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999999;
      const indexB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999999;

      if (indexA !== indexB) {
        return indexA - indexB;
      }

      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  } catch {
    return todos;
  }
}

function getInitialTodos(): TodoItem[] {
  if (typeof window === "undefined") return [];

  const saved = storageAdapter.getItem<TodoItem[] | null>(
    STORAGE_KEYS.TODOS,
    null,
  );

  if (saved !== null && Array.isArray(saved) && saved.length > 0) {
    const valid = saved.filter(
      (item) => !item.archived && !(item as any).isDeleted,
    );

    return applyTodoOrdering(valid);
  }

  try {
    const raw = localStorage.getItem("todos");

    if (raw) {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed) && parsed.length > 0) {
        const valid = parsed.filter(
          (item: any) => !item.archived && !item.isDeleted,
        );

        return applyTodoOrdering(valid);
      }
    }
  } catch {}

  const hasInitialized = localStorage.getItem("cozify_has_initialized_todos");

  if (!hasInitialized) {
    try {
      localStorage.setItem("cozify_has_initialized_todos", "true");
    } catch {}

    return DEFAULT_INITIAL_TODOS;
  }

  return [];
}

export function TodoProvider({ children }: { children: ReactNode }) {
  const { playSound } = useSound();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [todos, setTodos] = useState<TodoItem[]>(() => getInitialTodos());
  const [isInitialSyncPending, setIsInitialSyncPending] = useState<boolean>(
    () => {
      return !syncEngine.getHasCompletedInitialSync();
    },
  );

  const [viewMode, setViewModeState] = useState<TodoViewMode>(() => {
    const settings = storageAdapter.getItem<AppSettings>(
      STORAGE_KEYS.SETTINGS,
      {},
    );

    return (settings.todo?.mode as TodoViewMode) || "detailed";
  });

  const [filter, setFilterState] = useState<TodoFilter>(() =>
    storageAdapter.getItem<TodoFilter>("cozify_todo_filter", "all"),
  );
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<
    TodoPriority | "all" | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");

  const setFilter = useCallback((nextFilter: TodoFilter) => {
    setFilterState(nextFilter);
    storageAdapter.setItem("cozify_todo_filter", nextFilter);
  }, []);

  // Listen to remote sync and data reset events to update local React state
  useEffect(() => {
    const handleSyncOrReset = () => {
      const current = storageAdapter.getItem<TodoItem[]>(
        STORAGE_KEYS.TODOS,
        [],
      );

      setTodos(applyTodoOrdering(current));
      setIsInitialSyncPending(false);
    };

    const handleSyncEnd = () => {
      setIsInitialSyncPending(false);
    };

    window.addEventListener("cozify_remote_synced", handleSyncOrReset);
    window.addEventListener("cozify_data_reset", handleSyncOrReset);
    window.addEventListener("cozify_sync_end", handleSyncEnd);

    if (syncEngine.getHasCompletedInitialSync()) {
      setIsInitialSyncPending(false);
    }

    return () => {
      window.removeEventListener("cozify_remote_synced", handleSyncOrReset);
      window.removeEventListener("cozify_data_reset", handleSyncOrReset);
      window.removeEventListener("cozify_sync_end", handleSyncEnd);
    };
  }, []);

  // Show loading skeleton ONLY when we have 0 cached local items and initial auth/sync is still underway
  const isLoading =
    todos.length === 0 &&
    (isAuthLoading || (Boolean(user) && isInitialSyncPending));

  // Debounced stats rollup updates on todo changes without blocking the UI thread
  useEffect(() => {
    StatsRollupEngine.recordTodoChange(todos);
  }, [todos]);

  // Sync viewMode to settings in localStorage
  const setViewMode = useCallback((mode: TodoViewMode) => {
    setViewModeState(mode);
    const settings = storageAdapter.getItem<AppSettings>(
      STORAGE_KEYS.SETTINGS,
      {},
    );

    storageAdapter.setItem(STORAGE_KEYS.SETTINGS, {
      ...settings,
      todo: {
        ...settings.todo,
        mode,
      },
    });
  }, []);

  const addTodo = useCallback(
    (data: {
      title: string;
      priority?: TodoPriority;
      dueDate?: string;
      tag?: string;
      notes?: string;
    }) => {
      const now = Date.now();
      const newTodo: TodoItem = {
        id: crypto.randomUUID(),
        title: data.title.trim(),
        completed: false,
        createdAt: now,
        updatedAt: now,
        priority: data.priority || "none",
        dueDate: data.dueDate,
        tag: data.tag,
        notes: data.notes?.trim(),
      };

      db.todos.save(newTodo);
      setTodos((prev) => {
        const updated = [newTodo, ...prev];

        try {
          localStorage.setItem(
            "cozify_todo_order_ids",
            JSON.stringify(updated.map((t) => t.id)),
          );
        } catch {}

        return updated;
      });

      return newTodo;
    },
    [],
  );

  const toggleTodo = useCallback(
    (id: string) => {
      setTodos((prevTodos) =>
        prevTodos.map((todo) => {
          if (todo.id !== id) return todo;
          const nextCompleted = !todo.completed;

          if (nextCompleted) {
            playSound("taskComplete");
          }

          const updated: TodoItem = {
            ...todo,
            completed: nextCompleted,
            completedAt: nextCompleted ? Date.now() : undefined,
            updatedAt: Date.now(),
          };

          db.todos.save(updated);

          return updated;
        }),
      );
    },
    [playSound],
  );

  const updateTodo = useCallback((id: string, updates: Partial<TodoItem>) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) => {
        if (todo.id !== id) return todo;
        const updated: TodoItem = {
          ...todo,
          ...updates,
          updatedAt: Date.now(),
        };

        db.todos.save(updated);

        return updated;
      }),
    );
  }, []);

  // Archive task on delete instead of completely removing
  const deleteTodo = useCallback((id: string) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) => {
        if (todo.id !== id) return todo;
        const updated: TodoItem = {
          ...todo,
          archived: true,
          archivedAt: Date.now(),
          updatedAt: Date.now(),
        };

        db.todos.save(updated);

        return updated;
      }),
    );
  }, []);

  const permanentlyDeleteTodo = useCallback((id: string) => {
    db.todos.delete(id);
    setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
  }, []);

  const restoreTodo = useCallback((id: string) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) => {
        if (todo.id !== id) return todo;
        const updated: TodoItem = {
          ...todo,
          archived: false,
          archivedAt: undefined,
          updatedAt: Date.now(),
        };

        db.todos.save(updated);

        return updated;
      }),
    );
  }, []);

  const clearCompleted = useCallback(() => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) => {
        if (!todo.completed) return todo;
        const updated: TodoItem = {
          ...todo,
          archived: true,
          archivedAt: Date.now(),
          updatedAt: Date.now(),
        };

        db.todos.save(updated);

        return updated;
      }),
    );
  }, []);

  const resetToDefaultTodos = useCallback(() => {
    setTodos(DEFAULT_INITIAL_TODOS);
  }, []);

  const moveTodoToPosition = useCallback(
    (sourceId: string, targetId: string, position: "top" | "bottom") => {
      setTodos((prevTodos) => {
        const sourceIndex = prevTodos.findIndex((todo) => todo.id === sourceId);
        const targetIndex = prevTodos.findIndex((todo) => todo.id === targetId);

        if (sourceIndex === -1 || targetIndex === -1) return prevTodos;

        const updated = [...prevTodos];
        const [moved] = updated.splice(sourceIndex, 1);

        let insertIndex = targetIndex;

        if (sourceIndex < targetIndex) {
          insertIndex = position === "bottom" ? targetIndex : targetIndex - 1;
        } else {
          insertIndex = position === "bottom" ? targetIndex + 1 : targetIndex;
        }

        updated.splice(Math.max(0, insertIndex), 0, moved);
        db.todos.saveAll(updated);

        return updated;
      });
    },
    [],
  );

  const reorderTodos = useCallback((activeId: string, overId: string) => {
    if (activeId === overId) return;
    setTodos((prevTodos) => {
      const oldIndex = prevTodos.findIndex((todo) => todo.id === activeId);
      const newIndex = prevTodos.findIndex((todo) => todo.id === overId);

      if (oldIndex === -1 || newIndex === -1) return prevTodos;

      const reordered = arrayMove(prevTodos, oldIndex, newIndex);
      const orderIds = reordered.map((t) => t.id);

      try {
        localStorage.setItem("cozify_todo_order_ids", JSON.stringify(orderIds));
      } catch {}

      db.todos.saveAll(reordered);
      storageAdapter.setItem(STORAGE_KEYS.TODOS, reordered);

      return reordered;
    });
  }, []);

  const reorderList = useCallback((reordered: TodoItem[]) => {
    const orderIds = reordered.map((t) => t.id);

    try {
      localStorage.setItem("cozify_todo_order_ids", JSON.stringify(orderIds));
    } catch {}

    db.todos.saveAll(reordered);
    storageAdapter.setItem(STORAGE_KEYS.TODOS, reordered);
    setTodos(reordered);
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Active unarchived todos list
  const activeTodos = useMemo(() => {
    return todos.filter((todo) => !todo.archived);
  }, [todos]);

  // Derived filtered todos list
  const filteredTodos = useMemo(() => {
    return activeTodos.filter((todo) => {
      // 1. Tag filter
      if (
        selectedTag &&
        selectedTag !== "all" &&
        todo.tag?.toLowerCase() !== selectedTag.toLowerCase()
      ) {
        return false;
      }

      // 2. Priority filter
      if (selectedPriority && selectedPriority !== "all") {
        const taskPriority = todo.priority || "none";

        if (taskPriority !== selectedPriority) {
          return false;
        }
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = todo.title.toLowerCase().includes(query);
        const matchesNotes = todo.notes?.toLowerCase().includes(query);
        const matchesTag = todo.tag?.toLowerCase().includes(query);

        if (!matchesTitle && !matchesNotes && !matchesTag) {
          return false;
        }
      }

      // 4. Tab filter
      if (filter === "active") return !todo.completed;
      if (filter === "completed") return todo.completed;
      if (filter === "today") {
        return todo.dueDate === todayStr;
      }

      return true;
    });
  }, [
    activeTodos,
    filter,
    selectedTag,
    selectedPriority,
    searchQuery,
    todayStr,
  ]);

  // Statistics on active unarchived todos
  const stats = useMemo(() => {
    const total = activeTodos.length;
    const completed = activeTodos.filter((todo) => todo.completed).length;
    const active = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, active, percentage };
  }, [activeTodos]);

  const value = useMemo(
    () => ({
      todos: activeTodos,
      filteredTodos,
      isLoading,
      viewMode,
      filter,
      selectedTag,
      selectedPriority,
      searchQuery,
      stats,
      addTodo,
      toggleTodo,
      updateTodo,
      deleteTodo,
      permanentlyDeleteTodo,
      restoreTodo,
      clearCompleted,
      resetToDefaultTodos,
      moveTodoToPosition,
      reorderTodos,
      reorderList,
      setViewMode,
      setFilter,
      setSelectedTag,
      setSelectedPriority,
      setSearchQuery,
    }),
    [
      activeTodos,
      filteredTodos,
      isLoading,
      viewMode,
      filter,
      selectedTag,
      selectedPriority,
      searchQuery,
      stats,
      addTodo,
      toggleTodo,
      updateTodo,
      deleteTodo,
      permanentlyDeleteTodo,
      restoreTodo,
      clearCompleted,
      resetToDefaultTodos,
      moveTodoToPosition,
      reorderTodos,
      reorderList,
      setViewMode,
      setFilter,
    ],
  );

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
}

export function useTodos() {
  const context = useContext(TodoContext);

  if (!context) {
    throw new Error("useTodos must be used within a TodoProvider");
  }

  return context;
}
