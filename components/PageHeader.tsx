"use client";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description: string;
  actions?: React.ReactNode;
  showDivider?: boolean;
};

export default function PageHeader({ title, description, actions, showDivider = true }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className={cn("flex flex-wrap items-end justify-between gap-4", showDivider ? "pb-4" : "pb-0")}>
        <div>
          <p className="text-base font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      </div>
      {showDivider ? <div className="border-b border-border/50" /> : null}
    </div>
  );
}
