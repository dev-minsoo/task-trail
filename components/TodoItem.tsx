"use client";

import { Trash2, Circle, CheckCircle2, MoveRight, CalendarDays } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";

interface TodoItemProps {
  task: Task;
  statusLabel: string;
  nextStatus?: {
    id: string;
    label: string;
  };
  onStatusChange: (taskId: string, statusId: string) => void;
  onDelete: (taskId: string) => void;
}

const statusStyles: Record<
  string,
  {
    badge: string;
    icon: ReactNode;
    accent: string;
  }
> = {
  Inbox: {
    badge: "bg-slate-100 text-slate-600",
    icon: <Circle className="h-5 w-5 text-slate-400" />,
    accent: "from-slate-400 to-slate-500",
  },
  "In Progress": {
    badge: "bg-sky-100 text-sky-700",
    icon: <Circle className="h-5 w-5 text-sky-500 fill-sky-500" />,
    accent: "from-sky-500 to-cyan-500",
  },
  Done: {
    badge: "bg-emerald-100 text-emerald-700",
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    accent: "from-emerald-500 to-teal-500",
  },
};

export default function TodoItem({ task, statusLabel, nextStatus, onStatusChange, onDelete }: TodoItemProps) {
  const style = statusStyles[statusLabel] ?? statusStyles.Inbox;
  const createdAt = new Date(task.createdAt);

  return (
    <Card
      className={cn(
        "group border border-slate-200 bg-white/90 p-5 transition hover:border-slate-300 hover:bg-white",
        statusLabel === "Done" && "bg-slate-50"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="pt-0.5">{style.icon}</div>
        <div className="flex-1 space-y-3">
          <p
            className={cn(
              "text-base font-medium text-slate-900",
              statusLabel === "Done" && "text-slate-400 line-through"
            )}
          >
            {task.title}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Badge className={cn("rounded-full px-2 py-1 text-[11px] font-semibold", style.badge)}>
              {statusLabel}
            </Badge>
            {task.date && (
              <span className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-400">
                <CalendarDays className="h-3 w-3" />
                {task.date}
              </span>
            )}
            <span className="text-[11px] uppercase tracking-wide text-slate-400">
              {createdAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
          {nextStatus && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange(task.id, nextStatus.id)}
              className="h-8 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              <MoveRight className="mr-1 h-3 w-3" />
              {nextStatus.label}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDelete(task.id)}
            className="h-8 w-8 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className={cn("mt-3 h-1 rounded-full bg-gradient-to-r", style.accent, "opacity-30")} />
    </Card>
  );
}
