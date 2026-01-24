"use client";

import { cn } from "@/lib/utils";

type TaskTab = {
  key: string;
  label: string;
};

type TaskHeaderProps = {
  tabs?: TaskTab[];
  activeTab?: string;
  counts?: Record<string, number>;
  onTabChangeAction?: (tab: string) => void;
  showTabs?: boolean;
};

export default function TaskHeader({
  tabs = [],
  activeTab,
  counts = {},
  onTabChangeAction,
  showTabs = true,
}: TaskHeaderProps) {
  const hasTabs = showTabs && tabs.length > 0 && Boolean(activeTab) && Boolean(onTabChangeAction);
  return (
    <div className="flex flex-col gap-4">
      <div className={cn("flex flex-wrap items-end justify-between gap-4", hasTabs ? "pb-0" : "pb-4")}
      >
        <div>
          <p className="text-base font-semibold uppercase tracking-[0.2em] text-muted-foreground">Tasks</p>
          <p className="mt-2 text-sm text-muted-foreground">Track daily work and keep the flow moving.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3" />
      </div>
      {hasTabs ? (
        <div className="flex flex-wrap items-center gap-6 border-b border-border">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChangeAction?.(tab.key)}
                className={`relative pb-3 text-sm font-medium transition-colors ${
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                <span className="ml-2 text-xs text-muted-foreground">{counts[tab.key] ?? 0}</span>
                <span
                  className={`absolute inset-x-0 -bottom-[1px] h-0.5 rounded-full bg-foreground transition-opacity ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="border-b border-border/50" />
      )}
    </div>
  );
}
