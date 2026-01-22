"use client";

import { DndContext, closestCenter, useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DragEndEvent } from "@dnd-kit/core";
import type { ReactNode } from "react";
import { Inbox, ListTodo, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Status, Task } from "@/lib/types";

interface KanbanBoardProps {
  statuses: Status[];
  tasks: Task[];
  onTaskDragEnd: (event: DragEndEvent) => void;
}

const columnStyles: Record<
  string,
  {
    icon: ReactNode;
    accent: string;
    softBg: string;
    badge: string;
  }
> = {
  inbox: {
    icon: <Inbox className="h-4 w-4" />,
    accent: "from-slate-500 to-slate-600",
    softBg: "bg-muted/40",
    badge: "bg-muted text-muted-foreground",
  },
  "in progress": {
    icon: <ListTodo className="h-4 w-4" />,
    accent: "from-sky-500 to-cyan-500",
    softBg: "bg-sky-50 dark:bg-sky-950/30",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-200",
  },
  done: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    accent: "from-emerald-500 to-teal-500",
    softBg: "bg-emerald-50 dark:bg-emerald-950/30",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200",
  },
};

function TaskCard({ task, statusId }: { task: Task; statusId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", containerId: statusId },
  });

  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm transition hover:border-foreground/20 hover:bg-muted/40",
        isDragging && "opacity-60"
      )}
      {...attributes}
      {...listeners}
    >
      <p className="font-medium text-foreground">{task.title}</p>
      <Badge className="mt-2 w-fit rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {task.date || "No date"}
      </Badge>
    </Card>
  );
}

function StatusColumn({ status, tasks }: { status: Status; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
    data: { containerId: status.id, type: "column" },
  });

  const tone = columnStyles[status.name.toLowerCase()] ?? columnStyles.inbox;
  const orderedTasks = [...tasks].sort((a, b) => a.order - b.order);

  return (
    <Card
      className={cn(
        "flex min-h-[320px] flex-col gap-4 rounded-3xl border border-border p-5 shadow-sm transition",
        isOver && "border-foreground/40",
        tone.softBg
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("rounded-xl bg-gradient-to-br p-2 text-white shadow", tone.accent)}>{tone.icon}</div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{status.name}</h3>
            <p className="text-xs text-muted-foreground">{orderedTasks.length} tasks</p>
          </div>
        </div>
        <Badge className={cn("rounded-full px-2 py-1 text-[10px] font-semibold uppercase", tone.badge)}>
          {status.order}
        </Badge>
      </div>
      <SortableContext items={orderedTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex flex-1 flex-col gap-3">
          {orderedTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/80 px-4 py-8 text-center text-sm text-muted-foreground">
              Drag tasks here
            </div>
          ) : (
            orderedTasks.map((task) => <TaskCard key={task.id} task={task} statusId={status.id} />)
          )}
        </div>
      </SortableContext>
    </Card>
  );
}

export default function KanbanBoard({ statuses, tasks, onTaskDragEnd }: KanbanBoardProps) {
  const orderedStatuses = [...statuses].sort((a, b) => a.order - b.order);

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={onTaskDragEnd}>
      <div className="grid gap-6 lg:grid-cols-3">
        {orderedStatuses.map((status) => (
          <StatusColumn key={status.id} status={status} tasks={tasks.filter((task) => task.statusId === status.id)} />
        ))}
      </div>
    </DndContext>
  );
}
