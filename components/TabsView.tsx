"use client";

import { useMemo, useState } from "react";
import { useTaskTrail } from "@/components/TaskTrailContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const tabLabels = ["Inbox", "In Progress", "Done"] as const;
type TabKey = (typeof tabLabels)[number];

export default function TabsView() {
  const {
    tasks,
    statuses,
    changeTaskStatus,
    deleteTaskById,
    toggleTaskDone,
  } = useTaskTrail();
  const [activeTab, setActiveTab] = useState<TabKey>("Inbox");
  const [isDoneExpanded, setIsDoneExpanded] = useState(false);

  const statusByName = useMemo(() => {
    const map = new Map<string, string>();
    statuses.forEach((status) => {
      map.set(status.name.toLowerCase(), status.id);
    });
    return map;
  }, [statuses]);

  const inboxStatusId = statusByName.get("inbox");
  const inProgressStatusId = statusByName.get("in progress");
  const doneStatusId = statusByName.get("done");

  const tasksByTab = useMemo(() => {
    const result: Record<TabKey, typeof tasks> = {
      Inbox: [],
      "In Progress": [],
      Done: [],
    };

    tasks.forEach((task) => {
      const statusName = statuses.find((status) => status.id === task.statusId)?.name ?? "";
      if (statusName === "Inbox") {
        result.Inbox.push(task);
      }
      if (statusName === "In Progress") {
        result["In Progress"].push(task);
      }
      if (statusName === "Done") {
        result.Done.push(task);
      }
    });

    tabLabels.forEach((label) => {
      result[label] = [...result[label]].sort((a, b) => a.order - b.order);
    });

    return result;
  }, [tasks, statuses]);

  const activeTasks = tasksByTab[activeTab];

  return (
    <Card className="rounded-2xl border-slate-200 bg-white">
      <CardHeader className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Tabs
            </Badge>
            <h2 className="mt-3 text-xl font-semibold text-slate-900">Inbox, In Progress, Done</h2>
            <p className="mt-1 text-sm text-slate-600">Focus by lane with quick status controls.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-slate-200 bg-slate-50 p-1 shadow-sm">
              <div className="flex flex-wrap gap-1">
                {tabLabels.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setActiveTab(label)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                      activeTab === label
                        ? "bg-white text-slate-900 shadow"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {label}
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      {tasksByTab[label].length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Separator className="bg-slate-100" />
        <div className="mt-5 flex flex-col gap-3">
          {activeTab === "Done" && !isDoneExpanded ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm text-slate-500">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>{tasksByTab.Done.length} completed tasks tucked away.</span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDoneExpanded(true)}
                  className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  Expand done
                </Button>
              </div>
            </div>
          ) : (
            <>
              {activeTab === "Done" && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsDoneExpanded(false)}
                    className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
                  >
                    Collapse done
                  </Button>
                </div>
              )}
              {activeTasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-7 text-sm text-slate-500">
                  No tasks in this lane yet.
                </div>
              ) : (
                activeTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div className="flex min-w-[200px] flex-1 items-start gap-3">
                      <input
                        type="checkbox"
                        checked={task.statusId === doneStatusId}
                        onChange={() => void toggleTaskDone(task.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{task.title}</span>
                        <span className="text-xs uppercase tracking-wide text-slate-500">{task.date || "No date"}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {activeTab === "Inbox" && inProgressStatusId && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void changeTaskStatus(task.id, inProgressStatusId)}
                          className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600"
                        >
                          Move to In Progress
                        </Button>
                      )}
                      {activeTab === "In Progress" && inboxStatusId && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void changeTaskStatus(task.id, inboxStatusId)}
                          className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600"
                        >
                          Back to Inbox
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => void deleteTaskById(task.id)}
                        className="h-8 rounded-lg px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
