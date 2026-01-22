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
    if (event.nativeEvent.isComposing) {
      return;
    }
    if (event.key === "Enter" && !event.shiftKey && !event.repeat) {
      event.preventDefault();
      onSubmit();
    }
  };

  const trimmedValue = value.trim();

  const hasAiAction = Boolean(onAiClick);

  return (
    <div className={cn("bg-transparent", className)}>
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="relative overflow-visible">
          <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 opacity-20 blur" />

          <Card className="relative rounded-3xl border-border bg-card/95 shadow-xl backdrop-blur transition focus-within:border-transparent focus-within:ring-2 focus-within:ring-sky-400">
            <Textarea
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                "min-h-[56px] resize-none rounded-3xl border-0 bg-transparent px-5 py-3 text-base text-foreground focus-visible:ring-0",
                hasAiAction ? "pr-32" : "pr-20"
              )}
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              {hasAiAction && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onAiClick}
                  className="h-9 gap-2 rounded-2xl px-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
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
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          {showAutocomplete && commands.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 z-30 mb-3 max-h-56 overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-xl">
              {commands.map((option) => (
                <button
                  key={option.command}
                  type="button"
                  onClick={() => onCommandSelect?.(option.command)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <span className="font-semibold text-foreground">{option.command}</span>
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{option.label}</span>
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
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Press <kbd className="rounded bg-muted px-1.5 py-0.5 text-foreground">Enter</kbd> to add •
            <kbd className="ml-1 rounded bg-muted px-1.5 py-0.5 text-foreground">Shift + Enter</kbd> for a new line
          </p>
        )}
      </div>
    </div>
  );
}
