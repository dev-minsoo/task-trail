"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ChatInput from "@/components/ChatInput";
import KanbanBoard from "@/components/KanbanBoard";
import Sidebar from "@/components/Sidebar";
import TaskHeader from "@/components/TaskHeader";
import TopActions, { type ThemeMode, type ViewMode } from "@/components/TopActions";
import TodoList from "@/components/TodoList";
import TaskTrailShell from "@/components/TaskTrailShell";
import { useTaskTrail } from "@/components/TaskTrailContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Status, Task } from "@/lib/types";

type ParsedTaskItem = {
  id: string;
  title: string;
  isSelected: boolean;
};

type ParseResponse = {
  mode: "ai" | "fallback";
  todo?: string[];
  message?: string;
};

type DateRange = {
  start: string;
  end: string;
};

const getTaskTimestamp = (task: Task, statusKey: string) => {
  if (statusKey === "in progress") {
    return task.startedAt ?? task.createdAt;
  }
  if (statusKey === "done") {
    return task.completedAt ?? task.updatedAt;
  }
  return task.createdAt;
};

const isTaskInRange = (task: Task, statusKey: string, rangeStart: Date | null, rangeEnd: Date | null) => {
  if (statusKey === "inbox") {
    return true;
  }
  if (!rangeStart || !rangeEnd) {
    return true;
  }
  const timestamp = new Date(getTaskTimestamp(task, statusKey)).getTime();
  return timestamp >= rangeStart.getTime() && timestamp <= rangeEnd.getTime();
};

const getTaskSortTime = (task: Task, statusKey: string) =>
  new Date(getTaskTimestamp(task, statusKey)).getTime();

const LIST_TABS = [
  { key: "inbox", label: "Inbox" },
  { key: "in progress", label: "In Progress" },
  { key: "done", label: "Done" },
];

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDefaultDateRange = () => {
  const today = new Date();
  const end = formatDateInput(today);
  const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  startDate.setDate(startDate.getDate() - 6);
  return { start: formatDateInput(startDate), end };
};

const parseDateStart = (value: string) => {
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day);
};

const parseDateEnd = (value: string) => {
  const start = parseDateStart(value);
  if (!start) {
    return null;
  }
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return end;
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
  const [isRangeOpen, setIsRangeOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(() => getDefaultDateRange());
  const [draftRange, setDraftRange] = useState<DateRange>(() => getDefaultDateRange());

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

  useEffect(() => {
    if (isLoading) {
      return;
    }
    inputRef.current?.focus();
  }, [isLoading]);

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

  const listTabs = LIST_TABS;


  const allTasks = useMemo(() => {
    return tasks.filter((task) => !task.isArchived).sort((a, b) => {
      const orderA = statusOrder.get(a.statusId) ?? 0;
      const orderB = statusOrder.get(b.statusId) ?? 0;
      if (orderA === orderB) {
        return a.order - b.order;
      }
      return orderA - orderB;
    });
  }, [tasks, statusOrder]);

  const rangeStart = useMemo(() => parseDateStart(dateRange.start), [dateRange.start]);
  const rangeEnd = useMemo(() => parseDateEnd(dateRange.end), [dateRange.end]);

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
      if (key === "inbox") {
        counts[key] += 1;
        return;
      }
      if (!isTaskInRange(task, key, rangeStart, rangeEnd)) {
        return;
      }
      counts[key] += 1;
    });

    return counts;
  }, [allTasks, listTabs, rangeEnd, rangeStart, statusByName]);

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
      const items = (data.todo ?? [])
        .map((title) => ({
          id: createPreviewId(),
          title: title.trim(),
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

  const handlePreviewCancel = useCallback(() => {
    setPreviewItems([]);
    setAiStatusLabel(null);
    inputRef.current?.focus();
  }, []);

  const handlePreviewConfirm = useCallback(async () => {
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
  }, [addTasks, inboxStatusId, previewItems]);

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

  const rangeFilteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      const statusName = statusById.get(task.statusId)?.name.toLowerCase() ?? "inbox";
      return isTaskInRange(task, statusName, rangeStart, rangeEnd);
    });
  }, [allTasks, rangeEnd, rangeStart, statusById]);

  const activeTasks = useMemo(() => {
    if (activeView !== "list") {
      return rangeFilteredTasks;
    }

    const statusId = statusByName.get(activeListStatus);
    if (!statusId) {
      return rangeFilteredTasks;
    }

    const filtered = rangeFilteredTasks.filter((task) => task.statusId === statusId);
    return filtered.sort((a, b) => {
      const aTime = getTaskSortTime(a, activeListStatus);
      const bTime = getTaskSortTime(b, activeListStatus);
      return bTime - aTime;
    });
  }, [activeListStatus, activeView, rangeFilteredTasks, statusByName]);

  const rangeLabel =
    dateRange.start === dateRange.end ? dateRange.start : `${dateRange.start} – ${dateRange.end}`;

  const handleApplyRange = () => {
    const start = parseDateStart(draftRange.start);
    const end = parseDateStart(draftRange.end);
    if (start && end && start > end) {
      setDateRange({ start: draftRange.end, end: draftRange.start });
    } else {
      setDateRange(draftRange);
    }
    setIsRangeOpen(false);
  };

  const handleClearRange = () => {
    const defaults = getDefaultDateRange();
    setDateRange(defaults);
    setDraftRange(defaults);
    setIsRangeOpen(false);
  };

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
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-8 pb-20 pt-6 md:px-12">
              <TaskHeader
                tabs={listTabs}
                activeTab={activeListStatus}
                counts={listTabCounts}
                onTabChangeAction={setActiveListStatus}
                showTabs={activeView === "list"}
                actions={
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-haspopup="dialog"
                      aria-expanded={isRangeOpen}
                      onClick={() => {
                        setDraftRange(dateRange);
                        setIsRangeOpen((prev) => !prev);
                      }}
                      className="h-9 rounded-full border-border bg-card px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
                    >
                      <span className="mr-2 text-[10px]">Range</span>
                      <span className="text-foreground text-[11px] normal-case tracking-normal">
                        {rangeLabel}
                      </span>
                    </Button>
                    {isRangeOpen ? (
                      <Card className="absolute right-0 z-20 mt-2 w-[320px] border-border bg-card p-4 shadow-lg">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                              Date range
                            </p>
                            <span className="text-[10px] text-muted-foreground">{rangeLabel}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Start</Label>
                              <Input
                                type="date"
                                value={draftRange.start}
                                onChange={(event) =>
                                  setDraftRange((prev) => ({ ...prev, start: event.target.value }))
                                }
                                className="h-9 bg-background text-foreground"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">End</Label>
                              <Input
                                type="date"
                                value={draftRange.end}
                                onChange={(event) =>
                                  setDraftRange((prev) => ({ ...prev, end: event.target.value }))
                                }
                                className="h-9 bg-background text-foreground"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between border-t border-border pt-3">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
                              onClick={handleClearRange}
                            >
                              Reset
                            </Button>
                            <Button type="button" size="sm" onClick={handleApplyRange}>
                              Apply
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ) : null}
                  </div>
                }
              />

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
                <KanbanBoard statuses={statuses} tasks={rangeFilteredTasks} onTaskDragEnd={handleTaskDragEnd} />
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
          className="sticky bottom-4 px-8 md:px-12"
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
