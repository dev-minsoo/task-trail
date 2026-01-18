import { useTaskTrail } from "@/components/TaskTrailContext";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded border border-neutral-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-neutral-500">AI Studio</p>
            <h2 className="text-xl font-semibold">Suggestion deck</h2>
            <p className="text-sm text-neutral-600">Paste your notes and pick what to create.</p>
          </div>
          <button type="button" onClick={closeAiModal} className="rounded border border-neutral-300 px-3 py-1 text-sm">
            Close
          </button>
        </div>
        <div className="mt-5 flex flex-col gap-4">
          <textarea
            value={aiInputText}
            onChange={(event) => setAiInputText(event.target.value)}
            placeholder="Paste your notes"
            rows={4}
            className="w-full rounded border border-neutral-300 px-4 py-3 text-sm"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => void fetchSuggestions()} className="rounded border border-neutral-300 px-4 py-2 text-sm" disabled={isAiLoading}>
              {isAiLoading ? "Thinking" : "Generate"}
            </button>
            <span className="text-sm text-neutral-500">{aiSuggestions.length} ideas</span>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {aiSuggestions.length === 0 ? (
              <div className="rounded border border-dashed border-neutral-300 px-4 py-6 text-sm text-neutral-500">
                No suggestions yet. Try a new prompt.
              </div>
            ) : (
              aiSuggestions.map((task) => {
                const isExisting = existingTitles.has(task.toLowerCase());
                const isSelected = aiSelected.has(task);
                return (
                  <button
                    key={task}
                    type="button"
                    onClick={() => toggleSuggestion(task)}
                    disabled={isExisting}
                    className={`flex items-start justify-between gap-3 rounded border px-4 py-3 text-left text-sm ${
                      isExisting
                        ? "border-neutral-200 text-neutral-400"
                        : isSelected
                        ? "border-neutral-400"
                        : "border-neutral-200"
                    }`}
                  >
                    <span>{task}</span>
                    <span className="text-sm text-neutral-500">{isExisting ? "Added" : isSelected ? "Selected" : "Pick"}</span>
                  </button>
                );
              })
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-neutral-500">{aiSelected.size} selected</span>
            <button type="button" onClick={() => void createSuggestedTasks()} className="rounded border border-neutral-300 px-5 py-2 text-sm" disabled={aiSelected.size === 0}>
              Create selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
