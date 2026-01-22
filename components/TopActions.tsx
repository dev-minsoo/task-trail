"use client";

import { LayoutGrid, LayoutList, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ViewMode = "list" | "kanban";
export type ThemeMode = "light" | "dark";

type TopActionsProps = {
  activeView: ViewMode;
  onViewChangeAction: (view: ViewMode) => void;
  themeMode: ThemeMode;
  onToggleThemeAction: () => void;
};

export default function TopActions({
  activeView,
  onViewChangeAction,
  themeMode,
  onToggleThemeAction,
}: TopActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-full border border-border bg-background/95 p-1 shadow-sm backdrop-blur">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onViewChangeAction("list")}
          className={`group relative rounded-full hover:bg-transparent ${
            activeView === "list" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label="List view"
        >
          <LayoutList className="h-4 w-4" />
          <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            List
          </span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onViewChangeAction("kanban")}
          className={`group relative rounded-full hover:bg-transparent ${
            activeView === "kanban" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label="Board view"
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            Board
          </span>
        </Button>
      </div>
      <div className="flex items-center rounded-full border border-border bg-background/95 p-1 shadow-sm backdrop-blur">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggleThemeAction}
          className="group relative rounded-full text-muted-foreground hover:text-foreground hover:bg-transparent"
          aria-label={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {themeMode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            {themeMode === "dark" ? "Light" : "Dark"}
          </span>
        </Button>
      </div>
    </div>
  );
}
