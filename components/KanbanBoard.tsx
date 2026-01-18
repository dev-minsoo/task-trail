import { DndContext, closestCenter, useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Status, Task } from "@/lib/types";
import { useTaskTrail } from "@/components/TaskTrailContext";

function TaskCard({ task, statusId }: { task: Task; statusId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", containerId: statusId },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded border border-neutral-200 px-3 py-2 text-sm ${isDragging ? "opacity-60" : "opacity-100"}`}
      {...attributes}
      {...listeners}
    >
      {task.title}
    </div>
  );
}

function StatusColumn({ status, tasks }: { status: Status; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
    data: { containerId: status.id, type: "column" },
  });

  const orderedTasks = [...tasks].sort((a, b) => a.order - b.order);

  return (
    <div className={`flex min-h-[240px] flex-col gap-3 rounded border p-3 ${isOver ? "border-neutral-400" : "border-neutral-200"}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{status.name}</h3>
        <span className="text-sm text-neutral-500">{orderedTasks.length} cards</span>
      </div>
      <SortableContext items={orderedTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex flex-1 flex-col gap-2">
          {orderedTasks.length === 0 ? (
            <div className="rounded border border-dashed border-neutral-300 px-3 py-6 text-sm text-neutral-500">
              Drop tasks here
            </div>
          ) : (
            orderedTasks.map((task) => <TaskCard key={task.id} task={task} statusId={status.id} />)
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function KanbanBoard() {
  const { statuses, tasks, handleTaskDragEnd } = useTaskTrail();
  const orderedStatuses = [...statuses].sort((a, b) => a.order - b.order);

  return (
    <section className="rounded border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">Kanban</p>
          <h2 className="text-lg font-semibold">Flow across statuses</h2>
          <p className="text-sm text-neutral-600">Drag cards to reorder or change status.</p>
        </div>
      </div>
      <DndContext collisionDetection={closestCenter} onDragEnd={(event) => void handleTaskDragEnd(event)}>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {orderedStatuses.map((status) => (
            <StatusColumn key={status.id} status={status} tasks={tasks.filter((task) => task.statusId === status.id)} />
          ))}
        </div>
      </DndContext>
    </section>
  );
}
