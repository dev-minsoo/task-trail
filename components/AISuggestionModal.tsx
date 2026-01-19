"use client";

import { useTaskTrail } from "@/components/TaskTrailContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export default function AISuggestionModal() {
  const {
    isAiModalOpen,
    closeAiModal,
    aiInputText,
    setAiInputText,
    aiSuggestions,
    aiSelected,
    isAiLoading,
    tasks,
    toggleSuggestion,
    fetchSuggestions,
    createSuggestedTasks,
  } = useTaskTrail();

  if (!isAiModalOpen) {
    return null;
  }

  const existingTitles = new Set(tasks.map((task) => task.title.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-2xl rounded-2xl border-slate-200 bg-white shadow-xl">
        <CardHeader className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                AI Studio
              </Badge>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">Suggestion deck</h2>
              <p className="mt-1 text-sm text-slate-600">Paste your notes and pick what to create.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={closeAiModal}
              className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300"
            >
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Textarea
            value={aiInputText}
            onChange={(event) => setAiInputText(event.target.value)}
            placeholder="Paste your notes"
            rows={4}
            className="min-h-[140px] rounded-xl px-4 py-3 text-sm text-slate-700"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => void fetchSuggestions()}
              className="rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wide"
              disabled={isAiLoading}
            >
              {isAiLoading ? "Thinking" : "Generate"}
            </Button>
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs text-slate-500">
              {aiSuggestions.length} ideas
            </Badge>
          </div>
          <Separator className="bg-slate-100" />
          <div className="grid gap-2 md:grid-cols-2">
            {aiSuggestions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No suggestions yet. Try a new prompt.
              </div>
            ) : (
              aiSuggestions.map((task) => {
                const isExisting = existingTitles.has(task.toLowerCase());
                const isSelected = aiSelected.has(task);
                return (
                  <Button
                    key={task}
                    type="button"
                    variant="ghost"
                    onClick={() => toggleSuggestion(task)}
                    disabled={isExisting}
                    className={`h-auto items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                      isExisting
                        ? "border-slate-200 bg-white text-slate-400"
                        : isSelected
                        ? "border-slate-400 bg-slate-50 text-slate-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-medium">{task}</span>
                    <span className="text-xs uppercase tracking-wide text-slate-500">
                      {isExisting ? "Added" : isSelected ? "Selected" : "Pick"}
                    </span>
                  </Button>
                );
              })
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs text-slate-500">
              {aiSelected.size} selected
            </Badge>
            <Button
              type="button"
              onClick={() => void createSuggestedTasks()}
              className="rounded-xl px-5 py-2 text-xs font-semibold uppercase tracking-wide"
              disabled={aiSelected.size === 0}
            >
              Create selected
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
