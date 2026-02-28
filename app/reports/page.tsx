"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, CheckCircle2, ClipboardList, TrendingUp } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TaskTrailShell from "@/components/TaskTrailShell";
import PageHeader from "@/components/PageHeader";
import TopActions, { type ThemeMode, type ViewMode } from "@/components/TopActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTaskTrail } from "@/components/TaskTrailContext";
import { fetchArchivedTasks } from "@/lib/supabase/tasks";
import type { Task } from "@/lib/types";

type DailyPoint = {
  key: string;
  label: string;
  created: number;
  completed: number;
};

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDateKey(value: string | null) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return formatDateKey(date);
}

function ReportsContent() {
  const { tasks, statuses } = useTaskTrail();
  const [activeView, setActiveView] = useState<ViewMode>("list");
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    return localStorage.getItem("theme") === "dark" ? "dark" : "light";
  });
  const [rangeDays, setRangeDays] = useState<7 | 30>(7);
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadArchived = async () => {
      setErrorMessage(null);
      try {
        const data = await fetchArchivedTasks();
        if (isMounted) {
          setArchivedTasks(data);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load reports");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    void loadArchived();
    return () => {
      isMounted = false;
    };
  }, []);

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

  const allTasks = useMemo(() => [...tasks, ...archivedTasks], [archivedTasks, tasks]);
  const statusById = useMemo(() => new Map(statuses.map((status) => [status.id, status])), [statuses]);

  const dateRange = useMemo(() => {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(end.getDate() - (rangeDays - 1));
    return { start, end };
  }, [rangeDays]);

  const dailySeries = useMemo<DailyPoint[]>(() => {
    const createdCounts = new Map<string, number>();
    const completedCounts = new Map<string, number>();

    allTasks.forEach((task) => {
      const createdKey = toDateKey(task.createdAt);
      if (createdKey) {
        createdCounts.set(createdKey, (createdCounts.get(createdKey) ?? 0) + 1);
      }
      const completedKey = toDateKey(task.completedAt);
      if (completedKey) {
        completedCounts.set(completedKey, (completedCounts.get(completedKey) ?? 0) + 1);
      }
    });

    const points: DailyPoint[] = [];
    for (let i = 0; i < rangeDays; i += 1) {
      const date = new Date(dateRange.start);
      date.setDate(dateRange.start.getDate() + i);
      const key = formatDateKey(date);
      points.push({
        key,
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        created: createdCounts.get(key) ?? 0,
        completed: completedCounts.get(key) ?? 0,
      });
    }
    return points;
  }, [allTasks, dateRange.start, rangeDays]);

  const createdInRange = useMemo(
    () => dailySeries.reduce((sum, point) => sum + point.created, 0),
    [dailySeries]
  );
  const completedInRange = useMemo(
    () => dailySeries.reduce((sum, point) => sum + point.completed, 0),
    [dailySeries]
  );
  const completionRate = createdInRange > 0 ? Math.round((completedInRange / createdInRange) * 100) : 0;

  const activeInProgressCount = useMemo(() => {
    const inProgressStatusIds = new Set(
      statuses
        .filter((status) => status.name.toLowerCase() === "in progress")
        .map((status) => status.id)
    );
    return tasks.filter((task) => inProgressStatusIds.has(task.statusId)).length;
  }, [statuses, tasks]);

  const activeStatusDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    tasks.forEach((task) => {
      const name = statusById.get(task.statusId)?.name ?? "Unknown";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
  }, [statusById, tasks]);

  const maxDailyValue = useMemo(() => {
    return dailySeries.reduce((max, point) => Math.max(max, point.created, point.completed), 0);
  }, [dailySeries]);

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
            />
          </div>
          <div className="scrollbar-thin relative h-full overflow-y-auto [scrollbar-gutter:stable]">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-8 pb-20 pt-6 md:px-12">
              <PageHeader title="Reports" description="Track throughput and status distribution over time." />

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={rangeDays === 7 ? "default" : "outline"}
                  onClick={() => setRangeDays(7)}
                >
                  Last 7 days
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={rangeDays === 30 ? "default" : "outline"}
                  onClick={() => setRangeDays(30)}
                >
                  Last 30 days
                </Button>
              </div>

              {errorMessage ? (
                <Card className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {errorMessage}
                </Card>
              ) : null}

              {isLoading ? (
                <Card className="rounded-3xl border border-border bg-card/80 px-6 py-10 text-sm text-muted-foreground">
                  Loading report data...
                </Card>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card className="rounded-2xl border border-border bg-card/90 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Created</p>
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="mt-3 text-2xl font-semibold text-foreground">{createdInRange}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{rangeDays}-day window</p>
                    </Card>

                    <Card className="rounded-2xl border border-border bg-card/90 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Completed</p>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="mt-3 text-2xl font-semibold text-foreground">{completedInRange}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{rangeDays}-day window</p>
                    </Card>

                    <Card className="rounded-2xl border border-border bg-card/90 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Completion rate</p>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="mt-3 text-2xl font-semibold text-foreground">{completionRate}%</p>
                      <p className="mt-1 text-xs text-muted-foreground">completed / created</p>
                    </Card>

                    <Card className="rounded-2xl border border-border bg-card/90 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Active WIP</p>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="mt-3 text-2xl font-semibold text-foreground">{activeInProgressCount}</p>
                      <p className="mt-1 text-xs text-muted-foreground">tasks in progress now</p>
                    </Card>
                  </div>

                  <Card className="rounded-3xl border border-border bg-card/90 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Throughput trend
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Created vs completed tasks per day
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-sky-500" />
                          Created
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          Completed
                        </span>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      {dailySeries.map((point) => {
                        const createdWidth = maxDailyValue > 0 ? Math.round((point.created / maxDailyValue) * 100) : 0;
                        const completedWidth =
                          maxDailyValue > 0 ? Math.round((point.completed / maxDailyValue) * 100) : 0;
                        return (
                          <div key={point.key} className="grid grid-cols-[52px_1fr] items-center gap-3">
                            <span className="text-xs text-muted-foreground">{point.label}</span>
                            <div className="space-y-1.5">
                              <div className="h-2 rounded-full bg-muted">
                                <div className="h-2 rounded-full bg-sky-500" style={{ width: `${createdWidth}%` }} />
                              </div>
                              <div className="h-2 rounded-full bg-muted">
                                <div
                                  className="h-2 rounded-full bg-emerald-500"
                                  style={{ width: `${completedWidth}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  <Card className="rounded-3xl border border-border bg-card/90 p-5">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Active status distribution
                    </h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {activeStatusDistribution.length === 0 ? (
                        <span className="text-sm text-muted-foreground">No active tasks.</span>
                      ) : (
                        activeStatusDistribution.map((item) => (
                          <Badge
                            key={item.name}
                            className="rounded-full border-border bg-muted px-3 py-1 text-xs font-semibold text-foreground"
                          >
                            {item.name}: {item.count}
                          </Badge>
                        ))
                      )}
                    </div>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <TaskTrailShell>
      <ReportsContent />
    </TaskTrailShell>
  );
}
