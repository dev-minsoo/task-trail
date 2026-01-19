"use client";

import { DndContext, closestCenter, useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Status, Task } from "@/lib/types";
import { useTaskTrail } from "@/components/TaskTrailContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function TaskCard({ task, statusId }: { task: Task; statusId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", containerId: statusId },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 ${
        isDragging ? "opacity-60" : "opacity-100"
      }`}
      {...attributes}
      {...listeners}
    >
      <span className="font-medium text-slate-900">{task.title}</span>
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
    <div
      className={`flex min-h-[260px] flex-col gap-3 rounded-2xl border bg-white/80 p-4 shadow-sm transition ${
        isOver ? "border-slate-400" : "border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{status.name}</h3>
          <span className="text-xs uppercase tracking-wide text-slate-500">{orderedTasks.length} cards</span>
        </div>
      </div>
      <SortableContext items={orderedTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex flex-1 flex-col gap-2">
          {orderedTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-sm text-slate-500">
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
    <Card className="rounded-2xl border-slate-200 bg-white">
      <CardHeader className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <Badge className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Kanban
            </Badge>
            <h2 className="mt-3 text-xl font-semibold text-slate-900">Flow across statuses</h2>
            <p className="mt-1 text-sm text-slate-600">Drag cards to reorder or change status.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Separator className="bg-slate-100" />
        <DndContext collisionDetection={closestCenter} onDragEnd={(event) => void handleTaskDragEnd(event)}>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {orderedStatuses.map((status) => (
              <StatusColumn key={status.id} status={status} tasks={tasks.filter((task) => task.statusId === status.id)} />
            ))}
          </div>
        </DndContext>
      </CardContent>
    </Card>
  );
}
