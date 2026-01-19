"use client";

import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Status } from "@/lib/types";
import { useTaskTrail } from "@/components/TaskTrailContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

function StatusRow({
  status,
  onRename,
  onDelete,
}: {
  status: Status;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: status.id,
    data: { type: "status" },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 ${
        isDragging ? "opacity-60" : "opacity-100"
      }`}
    >
      <div className="flex flex-1 flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
        <Input
          type="text"
          value={status.name}
          onChange={(event) => onRename(event.target.value)}
          className="h-10 rounded-lg text-sm text-slate-700"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onDelete}
          className="h-8 rounded-lg px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
        >
          Delete
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:border-slate-300"
          {...attributes}
          {...listeners}
        >
          Drag
        </Button>
      </div>
    </div>
  );
}

export default function StatusSettings() {
  const {
    statuses,
    newStatusName,
    setNewStatusName,
    addStatus,
    renameStatus,
    deleteStatusById,
    handleStatusDragEnd,
  } = useTaskTrail();

  const orderedStatuses = [...statuses].sort((a, b) => a.order - b.order);

  return (
    <Card className="rounded-2xl border-slate-200 bg-white">
      <CardHeader className="p-6">
        <div>
          <Badge className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Statuses
          </Badge>
          <h2 className="mt-3 text-xl font-semibold text-slate-900">Status settings</h2>
          <p className="mt-1 text-sm text-slate-600">Create, rename, and reorder your columns.</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Input
            type="text"
            value={newStatusName}
            onChange={(event) => setNewStatusName(event.target.value)}
            placeholder="New status"
            className="h-10 flex-1 rounded-xl text-sm text-slate-700"
          />
          <Button
            type="button"
            onClick={() => void addStatus()}
            className="rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wide"
          >
            Add
          </Button>
        </div>
        <Separator className="bg-slate-100" />
        <DndContext collisionDetection={closestCenter} onDragEnd={(event) => void handleStatusDragEnd(event)}>
          <SortableContext items={orderedStatuses.map((status) => status.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-3">
              {orderedStatuses.map((status) => (
                <StatusRow
                  key={status.id}
                  status={status}
                  onRename={(name) => void renameStatus(status.id, name)}
                  onDelete={() => void deleteStatusById(status.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}
