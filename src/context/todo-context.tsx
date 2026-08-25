import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

import {
  TodoItem,
  TodoPriority,
  TodoFilter,
  TodoViewMode,
} from "@/components/todo/types";
import { storageAdapter, STORAGE_KEYS } from "@/services/storage";

interface TodoContextType {
  todos: TodoItem[];
  filteredTodos: TodoItem[];
  viewMode: TodoViewMode;
  filter: TodoFilter;
  selectedTag: string | null;
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
  clearCompleted: () => void;
  moveTodo: (id: string, direction: "up" | "down") => void;
  reorderTodos: (startIndex: number, endIndex: number) => void;
  moveTodoToPosition: (
    sourceId: string,
    targetId: string,
    position: "top" | "bottom",
  ) => void;
  setViewMode: (mode: TodoViewMode) => void;
  setFilter: (filter: TodoFilter) => void;
  setSelectedTag: (tag: string | null) => void;
  setSearchQuery: (q: string) => void;
}

const TodoContext = createContext<TodoContextType | null>(null);

const DEFAULT_TODOS: TodoItem[] = [
  {
    id: "todo-welcome-1",
    title: "Welcome to Cozify To-Do ✨",
    completed: false,
    createdAt: Date.now() - 3600000,
    priority: "high",
    tag: "personal",
    notes: "Switch between Minimalist and Detailed modes to find your flow.",
  },
  {
    id: "todo-welcome-2",
    title: "Drag and drop tasks to reorder your priorities 📌",
    completed: false,
    createdAt: Date.now() - 7200000,
    priority: "medium",
    tag: "study",
    notes: "Your top tasks will instantly appear on your cozy sidebar widget!",
  },
];

export function TodoProvider({ children }: { children: React.ReactNode }) {
  const [todos, setTodos] = useState<TodoItem[]>(() =>
    storageAdapter.getItem<TodoItem[]>(STORAGE_KEYS.TODOS, DEFAULT_TODOS),
  );

  const [viewMode, setViewModeState] = useState<TodoViewMode>(() =>
    storageAdapter.getItem<TodoViewMode>(
      STORAGE_KEYS.TODO_VIEW_MODE,
      "detailed",
    ),
  );

  const [filter, setFilter] = useState<TodoFilter>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync todos to localStorage
  useEffect(() => {
    storageAdapter.setItem(STORAGE_KEYS.TODOS, todos);
  }, [todos]);

  // Sync viewMode to localStorage
  const setViewMode = useCallback((mode: TodoViewMode) => {
    setViewModeState(mode);
    storageAdapter.setItem(STORAGE_KEYS.TODO_VIEW_MODE, mode);
  }, []);

  const addTodo = useCallback(
    (data: {
      title: string;
      priority?: TodoPriority;
      dueDate?: string;
      tag?: string;
      notes?: string;
    }) => {
      const newTodo: TodoItem = {
        id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: data.title.trim(),
        completed: false,
        createdAt: Date.now(),
        priority: data.priority || "none",
        dueDate: data.dueDate,
        tag: data.tag,
        notes: data.notes?.trim(),
      };

      setTodos((prev) => [newTodo, ...prev]);

      return newTodo;
    },
    [],
  );

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const nextCompleted = !t.completed;

        return {
          ...t,
          completed: nextCompleted,
          completedAt: nextCompleted ? Date.now() : undefined,
        };
      }),
    );
  }, []);

  const updateTodo = useCallback((id: string, updates: Partial<TodoItem>) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setTodos((prev) => prev.filter((t) => !t.completed));
  }, []);

  const moveTodo = useCallback((id: string, direction: "up" | "down") => {
    setTodos((prev) => {
      const index = prev.findIndex((t) => t.id === id);

      if (index === -1) return prev;

      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const newTodos = [...prev];
      const [moved] = newTodos.splice(index, 1);

      newTodos.splice(targetIndex, 0, moved);

      return newTodos;
    });
  }, []);

  const reorderTodos = useCallback((startIndex: number, endIndex: number) => {
    setTodos((prev) => {
      if (
        startIndex < 0 ||
        startIndex >= prev.length ||
        endIndex < 0 ||
        endIndex >= prev.length
      ) {
        return prev;
      }
      const newTodos = [...prev];
      const [moved] = newTodos.splice(startIndex, 1);

      newTodos.splice(endIndex, 0, moved);

      return newTodos;
    });
  }, []);

  const moveTodoToPosition = useCallback(
    (sourceId: string, targetId: string, position: "top" | "bottom") => {
      setTodos((prev) => {
        const fromIndex = prev.findIndex((t) => t.id === sourceId);
        const toIndex = prev.findIndex((t) => t.id === targetId);

        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex)
          return prev;

        const newTodos = [...prev];
        const [moved] = newTodos.splice(fromIndex, 1);

        let newTargetIndex = newTodos.findIndex((t) => t.id === targetId);

        if (position === "bottom") {
          newTargetIndex += 1;
        }
        newTodos.splice(newTargetIndex, 0, moved);

        return newTodos;
      });
    },
    [],
  );

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Filtered & Searched Todos
  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      // 1. Tag filter
      if (selectedTag && todo.tag !== selectedTag) {
        return false;
      }

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = todo.title.toLowerCase().includes(q);
        const matchesNotes = todo.notes?.toLowerCase().includes(q);
        const matchesTag = todo.tag?.toLowerCase().includes(q);

        if (!matchesTitle && !matchesNotes && !matchesTag) {
          return false;
        }
      }

      // 3. Tab filter
      if (filter === "active") return !todo.completed;
      if (filter === "completed") return todo.completed;
      if (filter === "today") {
        return todo.dueDate === todayStr;
      }

      return true;
    });
  }, [todos, filter, selectedTag, searchQuery, todayStr]);

  // Statistics
  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const active = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, active, percentage };
  }, [todos]);

  const value = useMemo(
    () => ({
      todos,
      filteredTodos,
      viewMode,
      filter,
      selectedTag,
      searchQuery,
      stats,
      addTodo,
      toggleTodo,
      updateTodo,
      deleteTodo,
      clearCompleted,
      moveTodo,
      reorderTodos,
      moveTodoToPosition,
      setViewMode,
      setFilter,
      setSelectedTag,
      setSearchQuery,
    }),
    [
      todos,
      filteredTodos,
      viewMode,
      filter,
      selectedTag,
      searchQuery,
      stats,
      addTodo,
      toggleTodo,
      updateTodo,
      deleteTodo,
      clearCompleted,
      moveTodo,
      reorderTodos,
      moveTodoToPosition,
      setViewMode,
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
