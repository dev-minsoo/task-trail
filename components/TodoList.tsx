"use client";

import { ClipboardList } from "lucide-react";
import TodoItem from "@/components/TodoItem";
import { Card } from "@/components/ui/card";
import type { Status, Task } from "@/lib/types";

interface TodoListProps {
  tasks: Task[];
  statusById: Map<string, Status>;
  getNextStatus: (statusId: string) => { id: string; label: string } | null;
  onStatusChange: (taskId: string, statusId: string) => void;
  onDelete: (taskId: string) => void;
}

export default function TodoList({ tasks, statusById, getNextStatus, onStatusChange, onDelete }: TodoListProps) {
  if (tasks.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-card/80 px-6 py-16 text-center">
        <div className="rounded-full bg-muted p-4 text-muted-foreground">
          <ClipboardList className="h-6 w-6" />
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">No tasks yet</p>
          <p className="text-sm text-muted-foreground">Add something above to get momentum.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => {
        const status = statusById.get(task.statusId);
        const statusLabel = status?.name ?? "Inbox";
        const nextStatus = getNextStatus(task.statusId);

        return (
          <TodoItem
            key={task.id}
            task={task}
            statusLabel={statusLabel}
            nextStatus={nextStatus ?? undefined}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
}
