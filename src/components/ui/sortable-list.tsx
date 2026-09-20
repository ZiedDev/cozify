import { ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export { rectSortingStrategy, verticalListSortingStrategy };

interface SortableListProps<T extends { id: any } | string = any> {
  items?: T[];
  onReorder: (activeId: string, overId: string) => void;
  strategy?: typeof verticalListSortingStrategy | typeof rectSortingStrategy;
  children: ReactNode;
}

export function SortableList<T extends { id: any } | string>({
  items,
  onReorder,
  strategy = verticalListSortingStrategy,
  children,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!active || !over || active.id === over.id) return;

    onReorder(String(active.id), String(over.id));
  };

  const itemIds = items
    ? items.map((item) =>
        typeof item === "object" && item !== null && "id" in item
          ? String(item.id)
          : String(item),
      )
    : [];

  return (
    <DndContext
      collisionDetection={closestCenter}
      sensors={sensors}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={strategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

interface SortableItemProps {
  id: string | number;
  index?: number;
  className?: string;
  children: ReactNode;
}

export function SortableItem({ id, className, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(id) });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      className={`touch-none ${
        isDragging ? "opacity-75 z-50 shadow-xl scale-[1.02]" : ""
      } ${className || ""}`}
      data-dragging={isDragging || undefined}
      style={style}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}
