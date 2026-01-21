"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, LayoutList } from "lucide-react";
import AISuggestionModal from "@/components/AISuggestionModal";
import ChatInput from "@/components/ChatInput";
import KanbanBoard from "@/components/KanbanBoard";
import Sidebar from "@/components/Sidebar";
import TodoList from "@/components/TodoList";
import TaskTrailShell from "@/components/TaskTrailShell";
import { useTaskTrail } from "@/components/TaskTrailContext";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Status } from "@/lib/types";

type ViewMode = "list" | "kanban";

function HomeContent() {
  const {
    newTaskTitle,
    setNewTaskTitle,
    addTask,
    statuses,
    tasks,
    changeTaskStatus,
    deleteTaskById,
    handleTaskDragEnd,
    openAiModal,
    selectedDate,
    setSelectedDate,
  } = useTaskTrail();

  const [activeView, setActiveView] = useState<ViewMode>("list");
  const [activeListStatus, setActiveListStatus] = useState("inbox");

  const commandOptions = useMemo(
    () => [
      { command: "/today", label: "Send to In Progress", statusName: "In Progress" },
      { command: "/inbox", label: "Capture in Inbox", statusName: "Inbox" },
    ],
    []
  );

  const statusByName = useMemo(() => {
    const map = new Map<string, string>();
    statuses.forEach((status) => {
      map.set(status.name.toLowerCase(), status.id);
    });
    return map;
  }, [statuses]);

  const statusById = useMemo(() => {
    const map = new Map<string, Status>();
    statuses.forEach((status) => {
      map.set(status.id, status);
    });
    return map;
  }, [statuses]);

  const statusOrder = useMemo(() => {
    const map = new Map<string, number>();
    statuses.forEach((status) => {
      map.set(status.id, status.order);
    });
    return map;
  }, [statuses]);

  const inboxStatusId = statusByName.get("inbox");
  const inProgressStatusId = statusByName.get("in progress");
  const doneStatusId = statusByName.get("done");

  const listTabs = [
    { key: "inbox", label: "Inbox" },
    { key: "in progress", label: "In Progress" },
    { key: "done", label: "Done" },
  ];

  const listTabStyles: Record<string, { active: string; pill: string }> = {
    inbox: {
      active: "bg-slate-100 text-slate-900 border border-slate-200 hover:bg-slate-200",
      pill: "bg-slate-900/10 text-slate-800",
    },
    "in progress": {
      active: "bg-sky-100 text-sky-900 border border-sky-200 hover:bg-sky-200",
      pill: "bg-sky-200/70 text-sky-900",
    },
    done: {
      active: "bg-emerald-100 text-emerald-900 border border-emerald-200 hover:bg-emerald-200",
      pill: "bg-emerald-200/70 text-emerald-900",
    },
  };

  const allTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const orderA = statusOrder.get(a.statusId) ?? 0;
      const orderB = statusOrder.get(b.statusId) ?? 0;
      if (orderA === orderB) {
        return a.order - b.order;
      }
      return orderA - orderB;
    });
  }, [tasks, statusOrder]);

  const listTabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    listTabs.forEach((tab) => {
      counts[tab.key] = 0;
    });

    const keyByStatusId = new Map<string, string>();
    listTabs.forEach((tab) => {
      const statusId = statusByName.get(tab.key);
      if (statusId) {
        keyByStatusId.set(statusId, tab.key);
      }
    });

    allTasks.forEach((task) => {
      const key = keyByStatusId.get(task.statusId);
      if (!key) {
        return;
      }
      if (key !== "inbox" && task.date !== selectedDate) {
        return;
      }
      counts[key] += 1;
    });

    return counts;
  }, [allTasks, listTabs, selectedDate, statusByName]);

  const trimmedInput = newTaskTitle.trim();
  const isCommandMode = trimmedInput.startsWith("/");
  const commandToken = isCommandMode ? trimmedInput.split(" ")[0] : "";
  const matchingCommands = isCommandMode
    ? commandOptions.filter((option) => option.command.startsWith(commandToken))
    : [];
  const showAutocomplete = isCommandMode && matchingCommands.length > 0;
  const showCommandError = isCommandMode && matchingCommands.length === 0 && trimmedInput.length > 1;

  const handleAddTask = async () => {
    if (!trimmedInput) {
      return;
    }

    let title = trimmedInput;
    let statusId: string | undefined;

    if (trimmedInput.startsWith("/")) {
      const [command, ...rest] = trimmedInput.split(" ");
      const match = commandOptions.find((option) => option.command === command);
      if (!match) {
        return;
      }
      title = rest.join(" ").trim();
      if (!title) {
        return;
      }
      statusId = statusByName.get(match.statusName.toLowerCase());
    } else {
      statusId = statusByName.get("inbox");
    }

    await addTask({ title, statusId });
  };

  const getNextStatus = (statusId: string) => {
    if (statusId === inboxStatusId && inProgressStatusId) {
      return { id: inProgressStatusId, label: "Start" };
    }
    if (statusId === inProgressStatusId && doneStatusId) {
      return { id: doneStatusId, label: "Complete" };
    }
    if (statusId === doneStatusId && inboxStatusId) {
      return { id: inboxStatusId, label: "Reset" };
    }
    return null;
  };

  const activeTasks = useMemo(() => {
    if (activeView !== "list") {
      return allTasks;
    }

    const statusId = statusByName.get(activeListStatus);
    if (!statusId) {
      return allTasks;
    }

    const shouldFilterByDate = activeListStatus !== "inbox";
    return allTasks.filter((task) => {
      if (task.statusId !== statusId) {
        return false;
      }
      if (!shouldFilterByDate) {
        return true;
      }
      return task.date === selectedDate;
    });
  }, [activeListStatus, activeView, allTasks, selectedDate, statusByName]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <div className="relative flex-1 min-h-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_55%)]" />
          <div className="absolute right-6 top-6 z-20">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm backdrop-blur">
              <Button
                type="button"
                variant={activeView === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveView("list")}
                className="gap-2 rounded-full px-4"
              >
                <LayoutList className="h-4 w-4" />
                List
              </Button>
              <Button
                type="button"
                variant={activeView === "kanban" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveView("kanban")}
                className="gap-2 rounded-full px-4"
              >
                <LayoutGrid className="h-4 w-4" />
                Board
              </Button>
            </div>
          </div>
          <div className="relative h-full overflow-y-auto">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-28 pt-20">
              {activeView === "list" && (
                <Card className="rounded-3xl border-slate-200 bg-white/90 p-3 shadow-lg backdrop-blur">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {listTabs.map((tab) => (
                        <Button
                          key={tab.key}
                          type="button"
                          variant={activeListStatus === tab.key ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setActiveListStatus(tab.key)}
                          className={`rounded-full px-4 transition-colors ${
                            activeListStatus === tab.key
                              ? listTabStyles[tab.key]?.active ?? "bg-slate-100 text-slate-900"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{tab.label}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                                activeListStatus === tab.key
                                  ? listTabStyles[tab.key]?.pill ?? "bg-slate-900/10 text-slate-800"
                                  : "bg-slate-200/80 text-slate-500"
                              }`}
                            >
                              {listTabCounts[tab.key] ?? 0}
                            </span>
                          </span>
                        </Button>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 shadow-sm">
                        <span>Date</span>
                        <Input
                          type="date"
                          value={selectedDate}
                          onChange={(event) => setSelectedDate(event.target.value)}
                          className="h-7 w-[140px] border-none bg-transparent p-0 text-[11px] font-semibold text-slate-700 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </label>
                      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 shadow-sm">
                        {activeTasks.length} tasks
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {activeView === "list" ? (
                <TodoList
                  tasks={activeTasks}
                  statusById={statusById}
                  getNextStatus={getNextStatus}
                  onStatusChange={changeTaskStatus}
                  onDelete={deleteTaskById}
                />
              ) : (
                <KanbanBoard statuses={statuses} tasks={tasks} onTaskDragEnd={handleTaskDragEnd} />
              )}
            </div>
          </div>
        </div>
        <ChatInput
          value={newTaskTitle}
          onChange={setNewTaskTitle}
          onSubmit={() => void handleAddTask()}
          placeholder="Add a task or /today standup"
          showAutocomplete={showAutocomplete}
          commands={matchingCommands}
          onCommandSelect={(command) => setNewTaskTitle(`${command} `)}
          showCommandError={showCommandError}
          onAiClick={openAiModal}
          className="sticky bottom-4"
        />
      </div>

      <AISuggestionModal />
    </div>
  );
}

export default function Home() {
  return (
    <TaskTrailShell>
      <HomeContent />
    </TaskTrailShell>
  );
}
