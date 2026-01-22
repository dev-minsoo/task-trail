"use client";

import { Trash2, MoveRight, CalendarDays } from "lucide-react";
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
    accent: string;
  }
> = {
  Inbox: {
    badge: "bg-muted text-foreground",
    accent: "from-slate-400 to-slate-500",
  },
  "In Progress": {
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
    accent: "from-sky-500 to-cyan-500",
  },
  Done: {
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
    accent: "from-emerald-500 to-teal-500",
  },
};

export default function TodoItem({ task, statusLabel, nextStatus, onStatusChange, onDelete }: TodoItemProps) {
  const style = statusStyles[statusLabel] ?? statusStyles.Inbox;
  const createdAt = new Date(task.createdAt);

  return (
    <Card
      className={cn(
        "group rounded-3xl border border-border bg-card/80 p-6 transition hover:border-foreground/20 hover:bg-card",
        statusLabel === "Done" && "bg-card/80"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-3">
          <p
            className={cn(
              "text-base font-medium text-foreground break-words",
              statusLabel === "Done" && "text-muted-foreground"
            )}
          >
            {task.title}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge className={cn("rounded-full px-2 py-1 text-[11px] font-semibold", style.badge)}>
              {statusLabel}
            </Badge>
            {task.date && (
              <span className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                <CalendarDays className="h-3 w-3" />
                {task.date}
              </span>
            )}
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
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
              className="h-8 px-3 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
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
            className="h-8 w-8 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className={cn("mt-3 h-1 rounded-full bg-gradient-to-r", style.accent, "opacity-30")} />
    </Card>
  );
}
