import type { DragEndEvent } from "@dnd-kit/core";

export function reorder<T>(items: T[], startIndex: number, endIndex: number): T[] {
  const updated = [...items];
  const [removed] = updated.splice(startIndex, 1);
  updated.splice(endIndex, 0, removed);
  return updated;
}

export function getActiveContainerId(event: DragEndEvent): string | null {
  const active = event.active;
  const over = event.over;
  if (!over) {
    return null;
  }

  const activeContainer = active.data.current?.containerId;
  const overContainer = over.data.current?.containerId ?? over.id;

  if (typeof activeContainer !== "string" || typeof overContainer !== "string") {
    return null;
  }

  return overContainer;
}
