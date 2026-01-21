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
      <Card className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-white/70 px-6 py-16 text-center">
        <div className="rounded-full bg-slate-100 p-4 text-slate-400">
          <ClipboardList className="h-6 w-6" />
        </div>
        <div>
          <p className="text-base font-semibold text-slate-600">No tasks yet</p>
          <p className="text-sm text-slate-400">Add something above to get momentum.</p>
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
