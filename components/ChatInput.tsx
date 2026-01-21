"use client";

import { KeyboardEvent } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface CommandOption {
  command: string;
  label: string;
}

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  showAutocomplete?: boolean;
  commands?: CommandOption[];
  onCommandSelect?: (command: string) => void;
  showCommandError?: boolean;
  onAiClick?: () => void;
  className?: string;
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Add a task, or type /today",
  showAutocomplete = false,
  commands = [],
  onCommandSelect,
  showCommandError = false,
  onAiClick,
  className,
}: ChatInputProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  const trimmedValue = value.trim();

  const hasAiAction = Boolean(onAiClick);

  return (
    <div className={cn("bg-transparent", className)}>
      <div className="mx-auto w-full max-w-5xl px-6 pb-4">
        <div className="relative overflow-visible">
          <div className="pointer-events-none absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 opacity-20 blur" />

          <Card className="relative rounded-3xl border-slate-200 bg-white/95 shadow-xl backdrop-blur transition focus-within:border-transparent focus-within:ring-2 focus-within:ring-sky-400">
            <Textarea
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                "min-h-[56px] resize-none rounded-3xl border-0 bg-transparent px-5 py-3 text-base text-slate-700 focus-visible:ring-0",
                hasAiAction ? "pr-32" : "pr-20"
              )}
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              {hasAiAction && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onAiClick}
                  className="h-9 gap-2 rounded-2xl px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600"
                >
                  <Sparkles className="h-4 w-4 text-sky-500" />
                  AI Spark
                </Button>
              )}
              <Button
                type="button"
                size="icon"
                onClick={onSubmit}
                disabled={!trimmedValue}
                className={cn(
                  "h-9 w-9 rounded-2xl transition",
                  trimmedValue
                    ? "bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 text-white shadow-lg hover:from-sky-600 hover:via-cyan-600 hover:to-emerald-600"
                    : "bg-slate-200 text-slate-400"
                )}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          {showAutocomplete && commands.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 z-30 mb-3 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              {commands.map((option) => (
                <button
                  key={option.command}
                  type="button"
                  onClick={() => onCommandSelect?.(option.command)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <span className="font-semibold text-slate-900">{option.command}</span>
                  <span className="text-[11px] uppercase tracking-wide text-slate-400">{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {showCommandError ? (
          <p className="mt-2 text-center text-xs font-semibold text-rose-500">
            Unknown command. Try /today or /inbox.
          </p>
        ) : (
          <p className="mt-2 text-center text-xs text-slate-400">
            Press <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">Enter</kbd> to add •
            <kbd className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">Shift + Enter</kbd> for a new line
          </p>
        )}
      </div>
    </div>
  );
}
