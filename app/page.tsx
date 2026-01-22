"use client";

import { useEffect, useMemo, useState } from "react";
import AISuggestionModal from "@/components/AISuggestionModal";
import ChatInput from "@/components/ChatInput";
import KanbanBoard from "@/components/KanbanBoard";
import Sidebar from "@/components/Sidebar";
import TaskHeader from "@/components/TaskHeader";
import TopActions, { type ThemeMode, type ViewMode } from "@/components/TopActions";
import TodoList from "@/components/TodoList";
import TaskTrailShell from "@/components/TaskTrailShell";
import { useTaskTrail } from "@/components/TaskTrailContext";
import type { Status } from "@/lib/types";

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
  } = useTaskTrail();

  const [activeView, setActiveView] = useState<ViewMode>("list");
  const [activeListStatus, setActiveListStatus] = useState("inbox");
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

  const applyTheme = (nextTheme: ThemeMode) => {
    const root = document.documentElement;
    root.classList.toggle("dark", nextTheme === "dark");
    localStorage.setItem("theme", nextTheme);
    setThemeMode(nextTheme);
  };

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const resolvedTheme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme: ThemeMode = resolvedTheme ?? (prefersDark ? "dark" : "light");
    applyTheme(initialTheme);
  }, []);

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
    const filtered = allTasks.filter((task) => {
      if (task.statusId !== statusId) {
        return false;
      }
      if (!shouldFilterByDate) {
        return true;
      }
      return task.date === selectedDate;
    });
    return filtered.sort((a, b) => {
      const aTime = new Date(shouldFilterByDate ? a.updatedAt : a.createdAt).getTime();
      const bTime = new Date(shouldFilterByDate ? b.updatedAt : b.createdAt).getTime();
      return bTime - aTime;
    });
  }, [activeListStatus, activeView, allTasks, selectedDate, statusByName]);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <div className="relative flex-1 min-h-0 bg-background">
          <div className="absolute right-6 top-6 z-20">
            <TopActions
              activeView={activeView}
              onViewChangeAction={setActiveView}
              themeMode={themeMode}
              onToggleThemeAction={() => applyTheme(themeMode === "dark" ? "light" : "dark")}
            />
          </div>
          <div className="relative h-full overflow-y-auto [scrollbar-gutter:stable]">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-20 pt-6">
              {activeView === "list" && (
                <TaskHeader
                  tabs={listTabs}
                  activeTab={activeListStatus}
                  counts={listTabCounts}
                  onTabChangeAction={setActiveListStatus}
                />
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
          className="sticky bottom-4 pr-[15px]"
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
