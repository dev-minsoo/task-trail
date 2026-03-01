"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TaskTrailShell from "@/components/TaskTrailShell";
import PageHeader from "@/components/PageHeader";
import TopActions, { type ThemeMode, type ViewMode } from "@/components/TopActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTaskTrail } from "@/components/TaskTrailContext";
import {
  fetchArchivedTaskPage,
  restoreArchivedTaskToInbox,
  updateTask,
  type ArchivedTaskQuery,
} from "@/lib/supabase/tasks";
import type { Task } from "@/lib/types";

const PAGE_SIZE = 30;

function getMonthSectionLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long" }).format(new Date(value));
}

function ArchivedContent() {
  const { statuses } = useTaskTrail();
  const [activeView, setActiveView] = useState<ViewMode>("list");
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    return localStorage.getItem("theme") === "dark" ? "dark" : "light";
  });

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [archivedFrom, setArchivedFrom] = useState("");
  const [archivedTo, setArchivedTo] = useState("");

  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [restoringTaskIds, setRestoringTaskIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const statusById = useMemo(() => new Map(statuses.map((status) => [status.id, status])), [statuses]);
  const inboxStatusId = useMemo(
    () => statuses.find((status) => status.name.toLowerCase() === "inbox")?.id ?? null,
    [statuses]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", mode);
  };

  useEffect(() => {
    applyTheme(themeMode);
  }, [themeMode]);

  const loadPage = useCallback(
    async (targetPage: number, append: boolean) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setErrorMessage(null);

      const query: ArchivedTaskQuery = {
        page: targetPage,
        pageSize: PAGE_SIZE,
        search: searchTerm || undefined,
        statusId: statusFilter === "all" ? undefined : statusFilter,
        archivedFrom: archivedFrom || undefined,
        archivedTo: archivedTo || undefined,
        includeCount: !append,
      };

      try {
        const result = await fetchArchivedTaskPage(query);
        if (requestId !== requestIdRef.current) {
          return;
        }
        setArchivedTasks((prev) => (append ? [...prev, ...result.items] : result.items));
        if (!append) {
          setTotalCount(result.total);
        }
        setHasMore(result.hasMore);
        setPage(targetPage);
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : "Failed to load archived tasks");
      } finally {
        if (requestId !== requestIdRef.current) {
          return;
        }
        if (append) {
          setIsLoadingMore(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [archivedFrom, archivedTo, searchTerm, statusFilter]
  );

  useEffect(() => {
    void loadPage(0, false);
  }, [loadPage]);

  const groupedArchivedTasks = useMemo(() => {
    const sections: Array<{ key: string; label: string; items: Task[] }> = [];
    const sectionMap = new Map<string, number>();
    archivedTasks.forEach((task) => {
      const key = task.archivedAt ? task.archivedAt.slice(0, 7) : "unknown";
      if (sectionMap.has(key)) {
        const index = sectionMap.get(key);
        if (index !== undefined) {
          sections[index].items.push(task);
        }
        return;
      }
      const label = task.archivedAt ? getMonthSectionLabel(task.archivedAt) : "Unknown date";
      sectionMap.set(key, sections.length);
      sections.push({ key, label, items: [task] });
    });
    return sections;
  }, [archivedTasks]);

  const handleRestore = useCallback(
    async (taskId: string) => {
      setRestoringTaskIds((prev) => new Set(prev).add(taskId));
      setErrorMessage(null);
      try {
        if (inboxStatusId) {
          await restoreArchivedTaskToInbox(taskId, inboxStatusId);
        } else {
          await updateTask(taskId, { isArchived: false, archivedAt: null });
        }
        setArchivedTasks((prev) => prev.filter((task) => task.id !== taskId));
        setTotalCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to restore task");
      } finally {
        setRestoringTaskIds((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }
    },
    [inboxStatusId]
  );

  const handleLoadMore = () => {
    if (isLoadingMore || isLoading || !hasMore) {
      return;
    }
    void loadPage(page + 1, true);
  };

  const clearFilters = () => {
    setSearchInput("");
    setStatusFilter("all");
    setArchivedFrom("");
    setArchivedTo("");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <div className="relative min-h-0 flex-1 bg-background">
          <div className="absolute right-6 top-6 z-20">
            <TopActions
              activeView={activeView}
              onViewChangeAction={setActiveView}
              themeMode={themeMode}
              onToggleThemeAction={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
              showViewToggle={false}
            />
          </div>
          <div className="scrollbar-thin relative h-full overflow-y-auto [scrollbar-gutter:stable]">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-8 pb-20 pt-6 md:px-12">
              <PageHeader
                title="Archived"
                description="Done tasks are automatically archived after 14 days. Search, filter, and restore them back to Inbox."
              />

              <Card className="rounded-2xl border border-border bg-card/90 p-4">
                <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
                  <label className="relative block">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder="Search archived task title"
                      className="pl-9"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      Status
                    </span>
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                    >
                      <option value="all">All statuses</option>
                      {statuses.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      Archived from
                    </span>
                    <Input type="date" value={archivedFrom} onChange={(event) => setArchivedFrom(event.target.value)} />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      Archived to
                    </span>
                    <Input type="date" value={archivedTo} onChange={(event) => setArchivedTo(event.target.value)} />
                  </label>

                  <div className="flex items-end">
                    <Button type="button" variant="ghost" className="h-9 w-full" onClick={clearFilters}>
                      Reset
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <Badge className="rounded-full border-border bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {totalCount} archived tasks
                  </Badge>
                </div>
              </Card>

              {errorMessage ? (
                <Card className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {errorMessage}
                </Card>
              ) : null}

              {isLoading ? (
                <Card className="rounded-3xl border border-border bg-card/80 px-6 py-10 text-sm text-muted-foreground">
                  Loading archived tasks...
                </Card>
              ) : groupedArchivedTasks.length === 0 ? (
                <Card className="rounded-3xl border border-dashed border-border bg-card/80 px-6 py-10 text-sm text-muted-foreground">
                  No archived tasks match your filters.
                </Card>
              ) : (
                <div className="space-y-6">
                  {groupedArchivedTasks.map((section) => (
                    <section key={section.key} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {section.label}
                        </h2>
                        <span className="h-px flex-1 bg-border" />
                      </div>
                      <div className="space-y-3">
                        {section.items.map((task) => {
                          const statusName = statusById.get(task.statusId)?.name ?? "Unknown";
                          const archivedDate = task.archivedAt
                            ? new Date(task.archivedAt).toLocaleDateString()
                            : "Unknown";

                          return (
                            <Card
                              key={task.id}
                              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card/90 px-4 py-3"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  <Badge className="rounded-full border-border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                                    {statusName}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">Archived {archivedDate}</span>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => void handleRestore(task.id)}
                                disabled={restoringTaskIds.has(task.id)}
                                className="h-8 gap-1 text-xs"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                {restoringTaskIds.has(task.id) ? "Restoring..." : "Restore to Inbox"}
                              </Button>
                            </Card>
                          );
                        })}
                      </div>
                    </section>
                  ))}

                  {hasMore ? (
                    <div className="flex justify-center pt-2">
                      <Button type="button" variant="outline" onClick={handleLoadMore} disabled={isLoadingMore}>
                        {isLoadingMore ? "Loading more..." : "Load more"}
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ArchivedPage() {
  return (
    <TaskTrailShell>
      <ArchivedContent />
    </TaskTrailShell>
  );
}
