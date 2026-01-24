"use client";

import { useEffect, useState } from "react";
import { BarChart3, ChevronLeft, ChevronRight, LayoutList, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { id: "tasks", label: "Tasks", icon: LayoutList },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "[" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable) {
        return;
      }
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === "input" || tagName === "textarea" || tagName === "select") {
        return;
      }
      event.preventDefault();
      setIsCollapsed((prev) => !prev);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <aside
      className={`sticky top-0 h-screen border-r border-border bg-background transition-[width] duration-300 ease-in-out ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex h-full w-full flex-col">
        <div className="px-5 py-4">
          <div className={`flex h-16 w-full items-center ${isCollapsed ? "gap-0" : "gap-3"}`}>
            <div className="rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 p-2 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div
              className={`overflow-hidden whitespace-nowrap transition-opacity duration-150 ${
                isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100"
              }`}
            >
              <h1 className="text-xl font-semibold tracking-tight text-foreground">TaskTrail</h1>
              <p className="text-xs text-muted-foreground">Track every task, leave a trail</p>
            </div>
          </div>
        </div>
        <nav className={`flex-1 space-y-2 overflow-visible ${isCollapsed ? "px-2 py-3" : "px-3 py-4"}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                type="button"
                variant="ghost"
                className={`group relative h-11 w-full text-muted-foreground hover:bg-muted hover:text-foreground ${
                  isCollapsed ? "justify-center px-0" : "justify-start gap-3"
                }`}
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span
                  className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-opacity duration-150 ${
                    isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100"
                  }`}
                >
                  {item.label}
                </span>
                <span
                  className={`pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-full bg-foreground px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-background opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 ${
                    isCollapsed ? "block" : "hidden"
                  }`}
                >
                  {item.label}
                </span>
              </Button>
            );
          })}
        </nav>

        <div
          className={`absolute bottom-4 flex w-full ${
            isCollapsed ? "justify-center" : "justify-end pr-4"
          }`}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="group relative h-8 w-8 rounded-full text-muted-foreground hover:bg-muted"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-full bg-foreground px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {isCollapsed ? "Expand" : "Collapse"} ([)
            </span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
