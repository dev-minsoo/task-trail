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
import { fetchArchivedTaskMetricsInRange, type TaskMetricRow } from "@/lib/supabase/tasks";

type DailyPoint = {
  key: string;
  label: string;
  created: number;
  completed: number;
};

type PeriodSummary = {
  created: number;
  completed: number;
};

const RANGE_DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

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

function toRangeBoundaryIso(rangeStart: Date, rangeEnd: Date) {
  const start = new Date(rangeStart);
  start.setHours(0, 0, 0, 0);
  const endExclusive = new Date(rangeEnd);
  endExclusive.setHours(0, 0, 0, 0);
  endExclusive.setDate(endExclusive.getDate() + 1);
  return {
    startInclusiveIso: start.toISOString(),
    endExclusiveIso: endExclusive.toISOString(),
  };
}

function sumPeriod(points: DailyPoint[], fromIndex: number, toIndex: number): PeriodSummary {
  return points.slice(fromIndex, toIndex).reduce(
    (acc, point) => ({
      created: acc.created + point.created,
      completed: acc.completed + point.completed,
    }),
    { created: 0, completed: 0 }
  );
}

function formatDelta(current: number, previous: number) {
  const diff = current - previous;
  const sign = diff > 0 ? "+" : "";
  return `${sign}${diff}`;
}

function ReportsContent() {
  const { tasks, statuses, isBootstrapping } = useTaskTrail();
  const [activeView, setActiveView] = useState<ViewMode>("list");
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    return localStorage.getItem("theme") === "dark" ? "dark" : "light";
  });
  const [rangeDays, setRangeDays] = useState<7 | 30>(7);
  const [archivedMetricRows, setArchivedMetricRows] = useState<TaskMetricRow[]>([]);
  const [isMetricsLoading, setIsMetricsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
  const statusById = useMemo(() => new Map(statuses.map((status) => [status.id, status])), [statuses]);

  const dateRange = useMemo(() => {
    const currentEnd = new Date();
    currentEnd.setHours(0, 0, 0, 0);
    const currentStart = new Date(currentEnd);
    currentStart.setDate(currentEnd.getDate() - (rangeDays - 1));

    const previousEnd = new Date(currentStart);
    previousEnd.setDate(currentStart.getDate() - 1);
    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousEnd.getDate() - (rangeDays - 1));

    return { currentStart, currentEnd, previousStart, previousEnd };
  }, [rangeDays]);

  useEffect(() => {
    let isMounted = true;
    const boundary = toRangeBoundaryIso(dateRange.previousStart, dateRange.currentEnd);
    setIsMetricsLoading(true);
    setErrorMessage(null);

    const load = async () => {
      try {
        const rows = await fetchArchivedTaskMetricsInRange(boundary);
        if (isMounted) {
          setArchivedMetricRows(rows);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load reports");
          setArchivedMetricRows([]);
        }
      } finally {
        if (isMounted) {
          setIsMetricsLoading(false);
        }
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [dateRange.currentEnd, dateRange.previousStart]);

  const isLoading = isBootstrapping || isMetricsLoading;
  const currentRangeLabel = useMemo(
    () => `${RANGE_DATE_FORMATTER.format(dateRange.currentStart)} - ${RANGE_DATE_FORMATTER.format(dateRange.currentEnd)}`,
    [dateRange.currentEnd, dateRange.currentStart]
  );

  const dailySeries = useMemo<DailyPoint[]>(() => {
    const createdCounts = new Map<string, number>();
    const completedCounts = new Map<string, number>();

    const metricRows: Array<Pick<TaskMetricRow, "createdAt" | "completedAt">> = [
      ...tasks.map((task) => ({
        createdAt: task.createdAt,
        completedAt: task.completedAt,
      })),
      ...archivedMetricRows.map((task) => ({
        createdAt: task.createdAt,
        completedAt: task.completedAt,
      })),
    ];

    metricRows.forEach((task) => {
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
    const totalDays = rangeDays * 2;
    for (let i = 0; i < totalDays; i += 1) {
      const date = new Date(dateRange.previousStart);
      date.setDate(dateRange.previousStart.getDate() + i);
      const key = formatDateKey(date);
      points.push({
        key,
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        created: createdCounts.get(key) ?? 0,
        completed: completedCounts.get(key) ?? 0,
      });
    }
    return points;
  }, [archivedMetricRows, dateRange.previousStart, rangeDays, tasks]);

  const previousSummary = useMemo(() => sumPeriod(dailySeries, 0, rangeDays), [dailySeries, rangeDays]);
  const currentSummary = useMemo(
    () => sumPeriod(dailySeries, rangeDays, rangeDays * 2),
    [dailySeries, rangeDays]
  );

  const createdInRange = currentSummary.created;
  const completedInRange = currentSummary.completed;
  const createdDelta = formatDelta(currentSummary.created, previousSummary.created);
  const completedDelta = formatDelta(currentSummary.completed, previousSummary.completed);
  const completionRate = createdInRange > 0 ? Math.round((completedInRange / createdInRange) * 100) : 0;
  const previousCompletionRate =
    previousSummary.created > 0 ? Math.round((previousSummary.completed / previousSummary.created) * 100) : 0;
  const completionRateDelta = formatDelta(completionRate, previousCompletionRate);

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
    const total = tasks.length;
    return Array.from(counts.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [statusById, tasks]);

  const currentSeries = useMemo(() => dailySeries.slice(rangeDays), [dailySeries, rangeDays]);

  const maxDailyValue = useMemo(() => {
    return currentSeries.reduce((max, point) => Math.max(max, point.created, point.completed), 0);
  }, [currentSeries]);

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
                <Badge className="rounded-full border-border bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                  Current range: {currentRangeLabel}
                </Badge>
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
                      <p className="mt-1 text-xs text-muted-foreground">
                        {currentRangeLabel} ({createdDelta} vs previous window)
                      </p>
                    </Card>

                    <Card className="rounded-2xl border border-border bg-card/90 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Completed</p>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="mt-3 text-2xl font-semibold text-foreground">{completedInRange}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {currentRangeLabel} ({completedDelta} vs previous window)
                      </p>
                    </Card>

                    <Card className="rounded-2xl border border-border bg-card/90 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Completion rate</p>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="mt-3 text-2xl font-semibold text-foreground">{completionRate}%</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {currentRangeLabel} ({completionRateDelta}pt vs previous window)
                      </p>
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
                          Created vs completed tasks per day for {currentRangeLabel}
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
                      {currentSeries.map((point) => {
                        const createdWidth = maxDailyValue > 0 ? Math.round((point.created / maxDailyValue) * 100) : 0;
                        const completedWidth =
                          maxDailyValue > 0 ? Math.round((point.completed / maxDailyValue) * 100) : 0;
                        return (
                          <div key={point.key} className="grid grid-cols-[52px_1fr] items-start gap-3">
                            <span className="text-xs text-muted-foreground">{point.label}</span>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="w-16 text-[11px] text-muted-foreground">Created</span>
                                <div className="h-2 flex-1 rounded-full bg-muted">
                                  <div className="h-2 rounded-full bg-sky-500" style={{ width: `${createdWidth}%` }} />
                                </div>
                                <span className="w-8 text-right text-[11px] font-medium text-foreground">
                                  {point.created}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-16 text-[11px] text-muted-foreground">Completed</span>
                                <div className="h-2 flex-1 rounded-full bg-muted">
                                  <div
                                    className="h-2 rounded-full bg-emerald-500"
                                    style={{ width: `${completedWidth}%` }}
                                  />
                                </div>
                                <span className="w-8 text-right text-[11px] font-medium text-foreground">
                                  {point.completed}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  <Card className="rounded-3xl border border-border bg-card/90 p-5">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      KPI definition
                    </h3>
                    <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                      <li>`Created`: tasks with `created_at` in selected period.</li>
                      <li>`Completed`: tasks with `completed_at` in selected period.</li>
                      <li>`Completion rate`: `Completed / Created` for the same period.</li>
                      <li>`Active WIP`: current non-archived tasks in `In Progress`.</li>
                    </ul>
                  </Card>

                  <Card className="rounded-3xl border border-border bg-card/90 p-5">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Active status distribution
                    </h3>
                    <p className="mt-2 text-xs text-muted-foreground">Sorted by task count with active share.</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {activeStatusDistribution.length === 0 ? (
                        <span className="text-sm text-muted-foreground">No active tasks.</span>
                      ) : (
                        activeStatusDistribution.map((item) => (
                          <Badge
                            key={item.name}
                            className="rounded-full border-border bg-muted px-3 py-1 text-xs font-semibold text-foreground"
                          >
                            {item.name}: {item.count} ({item.percentage}%)
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
