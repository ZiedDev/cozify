import { ReactNode } from "react";
import { DragDropProvider, PointerSensor } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { PointerActivationConstraints } from "@dnd-kit/dom";

interface SortableListProps<T extends { id: any }> {
  items?: T[];
  onReorder: (activeId: string, overId: string) => void;
  children: ReactNode;
}

const customSensors = [
  PointerSensor.configure({
    activationConstraints: (event) => {
      if (event.pointerType === "touch") {
        return [
          new PointerActivationConstraints.Delay({ value: 250, tolerance: 5 }),
        ];
      }

      return [new PointerActivationConstraints.Distance({ value: 8 })];
    },
    preventActivation: (event) => {
      const target = event.target as HTMLElement | null;

      if (!target) return false;

      return Boolean(
        target.closest("input, textarea, select, [contenteditable='true']"),
      );
    },
  }),
];

export function SortableList<T extends { id: any }>({
  onReorder,
  children,
}: SortableListProps<T>) {
  return (
    <DragDropProvider
      sensors={customSensors}
      onDragEnd={(event) => {
        const { source, target, canceled } = event.operation;

        if (canceled || !source || !target || source.id === target.id) return;
        onReorder(String(source.id), String(target.id));
      }}
    >
      {children}
    </DragDropProvider>
  );
}

interface SortableItemProps {
  id: string | number;
  index: number;
  className?: string;
  children: ReactNode;
}

export function SortableItem({
  id,
  index,
  className,
  children,
}: SortableItemProps) {
  const { ref, isDragging } = useSortable({ id, index });

  return (
    <div
      ref={ref}
      className={`transition-scale duration-150 ${
        isDragging ? "scale-[1.03] shadow-lg z-30 rounded-xl" : ""
      } ${className || ""}`}
      data-dragging={isDragging || undefined}
    >
      {children}
    </div>
  );
}
