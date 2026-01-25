"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TaskTrailShell from "@/components/TaskTrailShell";
import PageHeader from "../../components/PageHeader";
import TopActions, { type ThemeMode, type ViewMode } from "@/components/TopActions";
import { Card } from "@/components/ui/card";
import { useTaskTrail } from "@/components/TaskTrailContext";
import { fetchArchivedTasks } from "@/lib/supabase/tasks";
import type { Task } from "@/lib/types";

function ArchivedContent() {
  const { statuses } = useTaskTrail();
  const [activeView, setActiveView] = useState<ViewMode>("list");
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    return localStorage.getItem("theme") === "dark" ? "dark" : "light";
  });
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await fetchArchivedTasks();
        if (isMounted) {
          setArchivedTasks(data);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  const statusById = useMemo(() => new Map(statuses.map((status) => [status.id, status])), [statuses]);

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
              onToggleThemeAction={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
            />
          </div>
          <div className="scrollbar-thin relative h-full overflow-y-auto [scrollbar-gutter:stable]">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-8 pb-20 pt-6 md:px-12">
              <PageHeader
                title="Archived"
                description="Done tasks archived after 14 days appear here."
              />
              {isLoading ? (
                <Card className="rounded-3xl border border-border bg-card/80 px-6 py-10 text-sm text-muted-foreground">
                  Loading archived tasks…
                </Card>
              ) : archivedTasks.length === 0 ? (
                <Card className="rounded-3xl border border-dashed border-border bg-card/80 px-6 py-10 text-sm text-muted-foreground">
                  No archived tasks yet.
                </Card>
              ) : (
                <div className="space-y-3">
                  {archivedTasks.map((task) => {
                    const status = statusById.get(task.statusId)?.name ?? "Done";
                    return (
                      <Card
                        key={task.id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card/90 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{task.title}</p>
                          <p className="text-xs text-muted-foreground">{status}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Archived {task.archivedAt ? new Date(task.archivedAt).toLocaleDateString() : ""}
                        </div>
                      </Card>
                    );
                  })}
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
