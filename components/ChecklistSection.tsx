"use client";

import { useTaskTrail } from "@/components/TaskTrailContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function ChecklistSection() {
  const {
    selectedDate,
    setSelectedDate,
    newTaskTitle,
    setNewTaskTitle,
    addTask,
    tasks,
    statuses,
    changeTaskStatus,
    deleteTaskById,
    openAiModal,
  } = useTaskTrail();

  const statusOrder = new Map(statuses.map((status) => [status.id, status.order]));
  const statusMap = new Map(statuses.map((status) => [status.id, status.name]));
  const orderedTasks = [...tasks].sort((a, b) => {
    const statusDiff = (statusOrder.get(a.statusId) ?? 0) - (statusOrder.get(b.statusId) ?? 0);
    if (statusDiff !== 0) {
      return statusDiff;
    }
    return a.order - b.order;
  });

  return (
    <Card className="rounded-2xl border-slate-200 bg-white">
      <CardHeader className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Checklist
            </Badge>
            <h2 className="mt-3 text-xl font-semibold text-slate-900">Daily focus</h2>
            <p className="mt-1 text-sm text-slate-600">Track tasks by date and keep momentum.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={openAiModal}
            className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300"
          >
            AI Spark
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          Date
          <Input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="h-10 rounded-xl text-sm text-slate-700"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Input
            type="text"
            value={newTaskTitle}
            onChange={(event) => setNewTaskTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void addTask();
              }
            }}
            placeholder="Add a task"
            className="h-10 flex-1 rounded-xl text-sm text-slate-700"
          />
          <Button
            type="button"
            onClick={() => void addTask()}
            className="rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wide"
          >
            Add
          </Button>
        </div>
        <Separator className="bg-slate-100" />
        <div className="flex flex-col gap-3">
          {orderedTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No tasks yet. Add a title to start the list.
            </div>
          ) : (
            orderedTasks.map((task) => (
              <Card
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-slate-200 px-4 py-3 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900">{task.title}</span>
                  <span className="text-xs uppercase tracking-wide text-slate-500">
                    {statusMap.get(task.statusId) ?? "Status"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={task.statusId}
                    onChange={(event) => void changeTaskStatus(task.id, event.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                  >
                    {statuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => void deleteTaskById(task.id)}
                    className="h-8 rounded-lg px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
