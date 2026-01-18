import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Status } from "@/lib/types";
import { useTaskTrail } from "@/components/TaskTrailContext";


function StatusRow({
  status,
  onRename,
  onDelete,
}: {
  status: Status;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: status.id,
    data: { type: "status" },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center justify-between gap-2 rounded border border-neutral-200 px-3 py-2 ${
        isDragging ? "opacity-60" : "opacity-100"
      }`}
    >
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-sm text-neutral-500">Status</span>
        <input
          type="text"
          value={status.name}
          onChange={(event) => onRename(event.target.value)}
          className="rounded border border-neutral-300 px-2 py-1 text-sm"
        />
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={onDelete} className="text-sm text-neutral-500">
          Delete
        </button>
        <button type="button" className="text-sm text-neutral-500" {...attributes} {...listeners}>
          Drag
        </button>
      </div>
    </div>
  );
}

export default function StatusSettings() {
  const {
    statuses,
    newStatusName,
    setNewStatusName,
    addStatus,
    renameStatus,
    deleteStatusById,
    handleStatusDragEnd,
  } = useTaskTrail();

  const orderedStatuses = [...statuses].sort((a, b) => a.order - b.order);

  return (
    <section className="rounded border border-neutral-200 bg-white p-5">
      <div>
        <p className="text-sm text-neutral-500">Statuses</p>
        <h2 className="text-lg font-semibold">Status settings</h2>
        <p className="text-sm text-neutral-600">Create, rename, and reorder your columns.</p>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newStatusName}
            onChange={(event) => setNewStatusName(event.target.value)}
            placeholder="New status"
            className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <button type="button" onClick={() => void addStatus()} className="rounded border border-neutral-300 px-4 py-2 text-sm">
            Add
          </button>
        </div>
        <DndContext collisionDetection={closestCenter} onDragEnd={(event) => void handleStatusDragEnd(event)}>
          <SortableContext items={orderedStatuses.map((status) => status.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {orderedStatuses.map((status) => (
                <StatusRow
                  key={status.id}
                  status={status}
                  onRename={(name) => void renameStatus(status.id, name)}
                  onDelete={() => void deleteStatusById(status.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </section>
  );
}
