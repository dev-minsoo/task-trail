"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TaskTrailShell from "@/components/TaskTrailShell";
import PageHeader from "../../components/PageHeader";
import TopActions, { type ThemeMode, type ViewMode } from "@/components/TopActions";
import { Card } from "@/components/ui/card";

export default function ReportsPage() {
  const [activeView, setActiveView] = useState<ViewMode>("list");
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    return localStorage.getItem("theme") === "dark" ? "dark" : "light";
  });

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
    <TaskTrailShell>
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
                  title="Reports"
                  description="Reporting views will appear here."
                />
                <Card className="rounded-3xl border border-dashed border-border bg-card/80 px-6 py-10 text-sm text-muted-foreground">
                  No reports yet.
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TaskTrailShell>
  );
}
