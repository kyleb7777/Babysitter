"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type SitterRow = {
  id: string;
  name: string;
  detail: string;
  priority: number;
};

type ItemState = SitterRow & { include: boolean; immediate: boolean };

function SortableRow({
  row,
  onToggle,
}: {
  row: ItemState;
  onToggle: (id: string, key: "include" | "immediate", value: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="pickRow">
      <button
        type="button"
        className="dragHandle"
        aria-label={`Reorder ${row.name}`}
        {...attributes}
        {...listeners}
      >
        ≡
      </button>
      <div className="pickRowBody">
        <div className="pickRowTitle">
          <strong>{row.name}</strong>
          <span className="muted pickRowPriority">priority {row.priority}</span>
        </div>
        <div className="muted pickRowDetail">{row.detail}</div>
        <div className="pickRowToggles">
          <label className="pickToggle">
            <input
              type="checkbox"
              name="sitterIds"
              value={row.id}
              checked={row.include}
              onChange={(e) => onToggle(row.id, "include", e.target.checked)}
            />
            <span>Include</span>
          </label>
          <label className="pickToggle">
            <input
              type="checkbox"
              name="immediateSitterIds"
              value={row.id}
              checked={row.immediate}
              onChange={(e) => onToggle(row.id, "immediate", e.target.checked)}
            />
            <span>Ask now</span>
          </label>
        </div>
      </div>
    </div>
  );
}

export function SitterOrderList({ sitters }: { sitters: SitterRow[] }) {
  const [items, setItems] = useState<ItemState[]>(() =>
    sitters.map((s) => ({ ...s, include: true, immediate: false })),
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function toggle(id: string, key: "include" | "immediate", value: boolean) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [key]: value } : it)));
  }

  return (
    <div className="pickList">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((row) => (
            <SortableRow key={row.id} row={row} onToggle={toggle} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
