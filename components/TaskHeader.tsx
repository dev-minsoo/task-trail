"use client";

type TaskTab = {
  key: string;
  label: string;
};

type TaskHeaderProps = {
  tabs: TaskTab[];
  activeTab: string;
  counts: Record<string, number>;
  onTabChangeAction: (tab: string) => void;
};

export default function TaskHeader({ tabs, activeTab, counts, onTabChangeAction }: TaskHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-base font-semibold uppercase tracking-[0.2em] text-muted-foreground">Tasks</p>
          <p className="mt-2 text-sm text-muted-foreground">Track daily work and keep the flow moving.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3" />
      </div>
      <div className="flex flex-wrap items-center gap-6 border-b border-border">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChangeAction(tab.key)}
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
    </div>
  );
}
