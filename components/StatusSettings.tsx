"use client";

import { useTaskTrail } from "@/components/TaskTrailContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
export default function StatusSettings() {
  const { statuses } = useTaskTrail();

  const orderedStatuses = [...statuses].sort((a, b) => a.order - b.order);

  return (
    <Card className="rounded-2xl border-slate-200 bg-white">
      <CardHeader className="p-6">
        <div>
          <Badge className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Statuses
          </Badge>
          <h2 className="mt-3 text-xl font-semibold text-slate-900">Status settings</h2>
          <p className="mt-1 text-sm text-slate-600">
            Statuses are fixed to keep the focus on Inbox, In Progress, and Done.
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        {orderedStatuses.map((status) => (
          <Badge key={status.id} className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            {status.name}
          </Badge>
        ))}
      </CardContent>
    </Card>
  );
}
