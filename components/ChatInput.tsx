"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import ChatInputPreviewList, { ChatInputPreviewItem } from "@/components/ChatInputPreviewList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  previewItems?: ChatInputPreviewItem[];
  onPreviewTitleChange?: (id: string, value: string) => void;
  onPreviewToggleSelect?: (id: string) => void;
  onPreviewConfirm?: () => void;
  onPreviewCancel?: () => void;
  previewStatusText?: string;
  isPreviewLoading?: boolean;
  isSubmitDisabled?: boolean;
  showAiStatusBadge?: boolean;
  aiStatusLabel?: string;
  commandItems?: CommandItem[];
  isCommandAutocompleteEnabled?: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  className?: string;
}

export type CommandItem = {
  id: string;
  label: string;
  description: string;
  displayLabel?: string;
  placeholder?: string;
};

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Add a task",
  previewItems,
  onPreviewTitleChange,
  onPreviewToggleSelect,
  onPreviewConfirm,
  onPreviewCancel,
  previewStatusText,
  isPreviewLoading = false,
  isSubmitDisabled = false,
  showAiStatusBadge = false,
  aiStatusLabel = "No API key",
  commandItems = [],
  isCommandAutocompleteEnabled = false,
  inputRef,
  className,
}: ChatInputProps) {
  const trimmedValue = value.trim();
  const isSendDisabled = isSubmitDisabled || !trimmedValue;
  const internalTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const textareaRef = inputRef ?? internalTextareaRef;
  const [activeCommandIndex, setActiveCommandIndex] = useState(0);

  const trimmedStartValue = value.trimStart();
  const commandToken = trimmedStartValue.split(/\s+/)[0] ?? "";
  const hasCommandArguments = trimmedStartValue.length > commandToken.length;
  const commandMatch = commandItems.find(
    (command) => trimmedStartValue === command.label || trimmedStartValue.startsWith(`${command.label} `)
  );
  const commandPrefix = commandMatch?.label;
  const commandDisplayLabel = commandMatch?.displayLabel ?? commandPrefix;
  const commandPlaceholder = commandMatch?.placeholder;
  const commandInputValue = (() => {
    if (!commandPrefix) {
      return value;
    }
    const escaped = commandPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`^\\s*${escaped}\\s*`);
    return value.replace(pattern, "");
  })();
  const isCommandMode =
    isCommandAutocompleteEnabled && commandToken.startsWith("/") && !hasCommandArguments && !commandPrefix;
  const filteredCommands =
    isCommandMode ? commandItems.filter((command) => command.label.startsWith(commandToken)) : [];
  const isCommandMenuOpen = isCommandMode && filteredCommands.length > 0;
  const activeIndex = isCommandMenuOpen
    ? Math.min(activeCommandIndex, Math.max(filteredCommands.length - 1, 0))
    : 0;

  const applyCommand = (command: CommandItem) => {
    onChange(`${command.label} `);
    setActiveCommandIndex(0);
  };

  const handleValueChange = (nextValue: string) => {
    if (commandPrefix) {
      const trimmedNextValue = nextValue.replace(/^\s+/, "");
      onChange(trimmedNextValue ? `${commandPrefix} ${trimmedNextValue}` : commandPrefix);
      return;
    }
    onChange(nextValue);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) {
      return;
    }
    if (commandPrefix && event.key === "Backspace" && commandInputValue.length === 0) {
      event.preventDefault();
      onChange("");
      return;
    }
    if (isCommandMenuOpen) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (filteredCommands.length > 0) {
          setActiveCommandIndex((prev) => (prev + 1) % filteredCommands.length);
        }
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (filteredCommands.length > 0) {
          setActiveCommandIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        }
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const selected = filteredCommands[activeIndex];
        if (selected) {
          applyCommand(selected);
        }
        return;
      }
    }
    if (event.key === "Enter" && !event.shiftKey && !event.repeat) {
      event.preventDefault();
      onSubmit();
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const maxHeight = 200;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [value, textareaRef]);

  return (
    <div className={cn("bg-transparent", className)}>
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="relative overflow-visible">
          <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 opacity-20 blur" />

          {isCommandMenuOpen ? (
            <div
              role="listbox"
              className="absolute bottom-full left-0 right-0 z-50 mb-2 w-full max-w-[36rem] rounded-lg border border-border bg-card p-1 text-foreground shadow-lg"
            >
              <div className="max-h-64 overflow-auto">
                {filteredCommands.map((command, index) => {
                  const isActive = index === activeCommandIndex;
                  return (
                    <button
                      key={command.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => applyCommand(command)}
                      className={cn(
                        "w-full rounded-md px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{command.label}</span>
                        <span className="text-muted-foreground">{command.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="relative rounded-3xl border border-border/60 bg-card/95 shadow-lg backdrop-blur transition focus-within:border-ring/60 focus-within:ring-2 focus-within:ring-ring/40">
            <div
              className={cn("flex gap-2 px-3 py-2", value.includes("\n") ? "flex-col" : "flex-row items-center")}
            >
              {!value.includes("\n") && showAiStatusBadge && (
                <Badge className="shrink-0 rounded-full border-border bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {aiStatusLabel}
                </Badge>
              )}
              {commandDisplayLabel ? (
                <Badge className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-gradient-to-r from-sky-500/50 via-cyan-500/50 to-emerald-500/50 px-2.5 py-0.5 text-[11px] font-semibold text-foreground shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-[2px] transition-all">
                  {commandDisplayLabel}
                </Badge>
              ) : null}
              <Textarea
                ref={textareaRef}
                value={commandInputValue}
                onChange={(e) => handleValueChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={commandPlaceholder ?? placeholder}
                rows={1}
                disabled={isSubmitDisabled}
                className={cn(
                  "scrollbar-thin min-h-0 resize-none border-0 bg-transparent text-sm leading-7 text-foreground shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-0",
                  value.includes("\n") ? "w-full" : "min-w-0 flex-1"
                )}
              />
              {value.includes("\n") ? (
                <div className="flex items-center justify-between">
                  {showAiStatusBadge ? (
                    <Badge className="shrink-0 rounded-full border-border bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {aiStatusLabel}
                    </Badge>
                  ) : (
                    <div />
                  )}
                  <Button
                    type="button"
                    size="icon"
                    onClick={onSubmit}
                    disabled={isSendDisabled}
                    className={cn(
                      "h-7 w-7 shrink-0 rounded-lg transition",
                      !isSendDisabled
                        ? "bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 text-white shadow-md hover:from-sky-600 hover:via-cyan-600 hover:to-emerald-600"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  size="icon"
                  onClick={onSubmit}
                  disabled={isSendDisabled}
                  className={cn(
                    "h-7 w-7 shrink-0 rounded-lg transition",
                    !isSendDisabled
                      ? "bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 text-white shadow-md hover:from-sky-600 hover:via-cyan-600 hover:to-emerald-600"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <ChatInputPreviewList
            items={previewItems}
            onTitleChange={onPreviewTitleChange}
            onToggleSelect={onPreviewToggleSelect}
            onConfirm={onPreviewConfirm}
            onCancel={onPreviewCancel}
            statusText={previewStatusText}
            isLoading={isPreviewLoading}
            isDisabled={isSubmitDisabled}
          />
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          Press <kbd className="rounded bg-muted px-1.5 py-0.5 text-foreground">Enter</kbd> to preview •
          <kbd className="ml-1 rounded bg-muted px-1.5 py-0.5 text-foreground">Shift + Enter</kbd> for a new line
        </p>
      </div>
    </div>
  );
}
