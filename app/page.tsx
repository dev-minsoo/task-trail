"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ChatInput from "@/components/ChatInput";
import KanbanBoard from "@/components/KanbanBoard";
import Sidebar from "@/components/Sidebar";
import TaskHeader from "@/components/TaskHeader";
import TopActions, { type ThemeMode, type ViewMode } from "@/components/TopActions";
import TodoList from "@/components/TodoList";
import TaskTrailShell from "@/components/TaskTrailShell";
import { useTaskTrail } from "@/components/TaskTrailContext";
import type { Status } from "@/lib/types";

type ParsedTaskItem = {
  id: string;
  title: string;
  isSelected: boolean;
};

type ParseResponseItem = {
  title?: string;
};

type ParseResponse = {
  mode: "ai" | "fallback";
  items?: ParseResponseItem[];
  message?: string;
};

function HomeContent() {
  const {
    newTaskTitle,
    setNewTaskTitle,
    addTask,
    addTasks,
    statuses,
    tasks,
    isBootstrapping,
    changeTaskStatus,
    deleteTaskById,
    handleTaskDragEnd,
    selectedDate,
  } = useTaskTrail();

  const [activeView, setActiveView] = useState<ViewMode>("list");
  const [activeListStatus, setActiveListStatus] = useState("inbox");
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const isLoading = isBootstrapping;
  const [previewItems, setPreviewItems] = useState<ParsedTaskItem[]>([]);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSavingPreview, setIsSavingPreview] = useState(false);
  const [aiStatusLabel, setAiStatusLabel] = useState<string | null>(null);
  const [isAiAvailable, setIsAiAvailable] = useState(false);

  const commandItems = useMemo(
    () => [
      {
        id: "ai",
        label: "/summarize",
        description: "Summarize input and split into Tasks",
        displayLabel: "AI Summary",
        placeholder: "Enter text to summarize.",
      },
    ],
    []
  );

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

  useEffect(() => {
    let isMounted = true;

    const fetchAiStatus = async () => {
      try {
        const response = await fetch("/api/ai/status");
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as { enabled?: boolean };
        if (isMounted) {
          setIsAiAvailable(Boolean(data.enabled));
        }
      } catch {
        // no-op: keep AI disabled
      }
    };

    void fetchAiStatus();

    return () => {
      isMounted = false;
    };
  }, []);

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
  const isPreviewing = previewItems.length > 0;

  const createPreviewId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const handleParseInput = async () => {
    if (!trimmedInput || isParsing || isPreviewing) {
      return;
    }

    const aiCommand = "/summarize";
    const isAiCommand = trimmedInput === aiCommand || trimmedInput.startsWith(`${aiCommand} `);

    if (!isAiCommand || !isAiAvailable) {
      if (!inboxStatusId) {
        return;
      }
      const title = trimmedInput.trim();
      if (!title) {
        return;
      }
      setIsParsing(true);
      try {
        await addTask({ title, statusId: inboxStatusId, date: "" });
        setNewTaskTitle("");
        setAiStatusLabel(null);
        inputRef.current?.focus();
      } finally {
        setIsParsing(false);
      }
      return;
    }

    const aiInput = trimmedInput.replace(/^\/summarize\s*/, "").trim();
    if (!aiInput) {
      return;
    }

    setIsParsing(true);
    setAiStatusLabel(null);

    try {
      const response = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiInput }),
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as ParseResponse;
      const items = (data.items ?? [])
        .map((item) => ({
          id: createPreviewId(),
          title: item.title?.trim() ?? "",
          isSelected: true,
        }))
        .filter((item) => item.title.length > 0);

      if (items.length === 0) {
        return;
      }

      setPreviewItems(items);
      setNewTaskTitle("");
      setAiStatusLabel(data.mode === "fallback" ? "AI disabled" : null);
    } finally {
      setIsParsing(false);
    }
  };

  const handlePreviewTitleChange = (id: string, value: string) => {
    setPreviewItems((prev) => prev.map((item) => (item.id === id ? { ...item, title: value } : item)));
  };

  const handlePreviewToggleSelect = (id: string) => {
    setPreviewItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isSelected: !item.isSelected } : item))
    );
  };

  const handlePreviewCancel = () => {
    setPreviewItems([]);
    setAiStatusLabel(null);
    inputRef.current?.focus();
  };

  const handlePreviewConfirm = async () => {
    if (!inboxStatusId) {
      return;
    }

    const selected = previewItems.filter((item) => item.isSelected && item.title.trim());
    if (selected.length === 0) {
      return;
    }

    setIsSavingPreview(true);
    try {
      await addTasks(
        selected.map((item) => ({
          title: item.title,
          statusId: inboxStatusId,
        }))
      );
      setPreviewItems([]);
      setAiStatusLabel(null);
      inputRef.current?.focus();
    } finally {
      setIsSavingPreview(false);
    }
  };

  useEffect(() => {
    if (!isPreviewing) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isSavingPreview || isParsing) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        handlePreviewCancel();
        return;
      }
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void handlePreviewConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePreviewCancel, handlePreviewConfirm, isParsing, isPreviewing, isSavingPreview]);

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
          <div className="scrollbar-thin relative h-full overflow-y-auto [scrollbar-gutter:stable]">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-20 pt-6">
              {activeView === "list" && (
                <TaskHeader
                  tabs={listTabs}
                  activeTab={activeListStatus}
                  counts={listTabCounts}
                  onTabChangeAction={setActiveListStatus}
                />
              )}

              {isLoading ? (
                <div className="flex min-h-[240px] w-full items-center justify-center">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="relative h-4 w-4">
                      <span className="absolute inset-0 rounded-full border border-border/60" />
                      <span className="absolute inset-0 rounded-full border-2 border-border border-t-transparent animate-spin" />
                    </span>
                    <span className="text-sm font-medium">Loading tasks…</span>
                  </div>
                </div>
              ) : activeView === "list" ? (
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
          onSubmit={() => void handleParseInput()}
          placeholder="Drop a task, we’ll keep the trail."
          previewItems={previewItems.map((item) => ({
            id: item.id,
            title: item.title,
            isSelected: item.isSelected,
          }))}
          onPreviewTitleChange={handlePreviewTitleChange}
          onPreviewToggleSelect={handlePreviewToggleSelect}
          onPreviewCancel={handlePreviewCancel}
          onPreviewConfirm={() => void handlePreviewConfirm()}
          isPreviewLoading={isSavingPreview}
          isSubmitDisabled={isParsing || isSavingPreview || isLoading}
          showAiStatusBadge={Boolean(aiStatusLabel)}
          aiStatusLabel={aiStatusLabel ?? undefined}
          commandItems={commandItems}
          isCommandAutocompleteEnabled={isAiAvailable}
          inputRef={inputRef}
          className="sticky bottom-4 pr-[15px]"
        />
      </div>
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
