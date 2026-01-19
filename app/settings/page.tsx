"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import StatusSettings from "@/components/StatusSettings";
import TaskTrailShell from "@/components/TaskTrailShell";
import { useTaskTrail } from "@/components/TaskTrailContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function SettingsContent() {
  const { selectedDate } = useTaskTrail();

  return (
    <div className="min-h-screen bg-slate-50 text-neutral-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_55%)]" />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
        <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Settings</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Refine your statuses</h1>
            <p className="mt-2 text-sm text-slate-600">Tune columns for the day without leaving your flow.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="rounded-full px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
              {selectedDate}
            </Badge>
            <Link href="/">
              <Button
                size="icon"
                variant="outline"
                aria-label="Back to board"
                className="rounded-full text-slate-600 shadow-sm transition hover:border-slate-300"
              >
                <Settings className="h-4 w-4 rotate-180" />
              </Button>
            </Link>
          </div>
        </header>
        <StatusSettings />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <TaskTrailShell>
      <SettingsContent />
    </TaskTrailShell>
  );
}
