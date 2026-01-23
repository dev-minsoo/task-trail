"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Check, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ChatInputPreviewItem {
  id: string;
  title: string;
  dateLabel?: string;
  isSelected?: boolean;
}

interface ChatInputPreviewListProps {
  items?: ChatInputPreviewItem[];
  onTitleChange?: (id: string, value: string) => void;
  onToggleSelect?: (id: string) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  statusText?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  className?: string;
}

export default function ChatInputPreviewList({
  items = [],
  onTitleChange,
  onToggleSelect,
  onConfirm,
  onCancel,
  confirmLabel = "Save",
  cancelLabel = "Cancel",
  statusText,
  isLoading = false,
  isDisabled = false,
  className,
}: ChatInputPreviewListProps) {
  if (items.length === 0) {
    return null;
  }

  const isActionDisabled = isDisabled || isLoading;
  const resolvedConfirmLabel = isLoading ? "Saving..." : confirmLabel;
  const selectedCount = items.filter((item) => item.isSelected).length;
  const resolvedStatusText = statusText ?? `Select tasks to save (${selectedCount}/${items.length})`;
  const containerClassName = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";
  const [editingId, setEditingId] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!editingId) {
      return;
    }
    const handle = requestAnimationFrame(() => {
      inputRefs.current[editingId]?.focus();
    });
    return () => cancelAnimationFrame(handle);
  }, [editingId]);

  const handleToggle = (id: string, event: MouseEvent<HTMLDivElement>) => {
    if (editingId === id) {
      return;
    }
    if (event.detail > 1) {
      return;
    }
    onToggleSelect?.(id);
  };

  return (
    <Card
      className={cn(
        "mt-2 rounded-2xl border-border bg-card/90 p-2.5 shadow-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium uppercase tracking-widest text-foreground">Preview</h3>
          <p className="text-xs text-muted-foreground/90">Choose what to save.</p>
        </div>
      </div>
      <div className={cn("mt-3", containerClassName)}>
        {items.map((item) => {
          const selected = Boolean(item.isSelected);
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={(event) => handleToggle(item.id, event)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onToggleSelect?.(item.id);
                }
              }}
              className={cn(
                "group relative rounded-xl p-[1.5px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                selected
                  ? "bg-gradient-to-br from-sky-400 via-cyan-300 to-emerald-300 shadow-md"
                  : "bg-border shadow-sm hover:-translate-y-0.5"
              )}
            >
              <div
                className={cn(
                  "flex w-full items-center gap-2 rounded-[11px] px-4 py-3",
                  selected ? "bg-accent/60" : "bg-card/95"
                )}
              >
                <Input
                  ref={(node) => {
                    inputRefs.current[item.id] = node;
                  }}
                  value={item.title}
                  onChange={(event) => onTitleChange?.(item.id, event.target.value)}
                  placeholder="Task title"
                  readOnly={editingId !== item.id}
                  onBlur={() => setEditingId(null)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      setEditingId(null);
                    }
                  }}
                  className="h-9 flex-1 rounded-lg border-0 bg-transparent text-sm focus-visible:ring-0"
                />
                {item.dateLabel ? (
                  <Badge className="rounded-full border-border bg-muted px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {item.dateLabel}
                  </Badge>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(event) => {
                    event.stopPropagation();
                    setEditingId(item.id);
                  }}
                  className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                  aria-label="Edit preview item"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        {resolvedStatusText ? (
          <Badge className="rounded-full border-border bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            {resolvedStatusText}
          </Badge>
        ) : (
          <span className="text-[11px] text-muted-foreground">
            Review staged tasks before saving.
          </span>
        )}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isActionDisabled}
            className={cn(
              "h-7 rounded-lg px-3 text-[11px] font-semibold uppercase tracking-[0.2em]",
              isActionDisabled && "cursor-not-allowed opacity-60"
            )}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isActionDisabled}
            aria-busy={isLoading}
            className={cn(
              "h-7 rounded-lg px-4 text-[11px] font-semibold uppercase tracking-[0.2em]",
              isActionDisabled && "cursor-not-allowed opacity-70"
            )}
          >
            {resolvedConfirmLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
}
