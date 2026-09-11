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
import {
  TodoItem,
  TodoPriority,
  TodoFilter,
  TodoViewMode,
} from "@/menus/todo/types";
import { storageAdapter, STORAGE_KEYS, AppSettings } from "@/services/storage";

type TodoContextType = {
  todos: TodoItem[];
  filteredTodos: TodoItem[];
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

export function TodoProvider({ children }: { children: ReactNode }) {
  const { playSound } = useSound();
  const [todos, setTodos] = useState<TodoItem[]>(() =>
    storageAdapter.getItem<TodoItem[]>(STORAGE_KEYS.TODOS, DEFAULT_TODOS),
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

  // Sync todos to localStorage
  useEffect(() => {
    storageAdapter.setItem(STORAGE_KEYS.TODOS, todos);
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

  const toggleTodo = useCallback(
    (id: string) => {
      setTodos((prevTodos) =>
        prevTodos.map((todo) => {
          if (todo.id !== id) return todo;
          const nextCompleted = !todo.completed;

          if (nextCompleted) {
            playSound("taskComplete");
          }

          return {
            ...todo,
            completed: nextCompleted,
            completedAt: nextCompleted ? Date.now() : undefined,
          };
        }),
      );
    },
    [playSound],
  );

  const updateTodo = useCallback((id: string, updates: Partial<TodoItem>) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) => (todo.id === id ? { ...todo, ...updates } : todo)),
    );
  }, []);

  // Archive task on delete instead of completely removing
  const deleteTodo = useCallback((id: string) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              archived: true,
              archivedAt: Date.now(),
            }
          : todo,
      ),
    );
  }, []);

  const permanentlyDeleteTodo = useCallback((id: string) => {
    setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
  }, []);

  const restoreTodo = useCallback((id: string) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              archived: false,
              archivedAt: undefined,
            }
          : todo,
      ),
    );
  }, []);

  const clearCompleted = useCallback(() => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.completed
          ? {
              ...todo,
              archived: true,
              archivedAt: Date.now(),
            }
          : todo,
      ),
    );
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

      return arrayMove(prevTodos, oldIndex, newIndex);
    });
  }, []);

  const reorderList = useCallback((reordered: TodoItem[]) => {
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
