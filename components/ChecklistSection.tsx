import { useTaskTrail } from "@/components/TaskTrailContext";

export default function ChecklistSection() {
  const {
    selectedDate,
    setSelectedDate,
    newTaskTitle,
    setNewTaskTitle,
    addTask,
    tasks,
    statuses,
    changeTaskStatus,
    deleteTaskById,
    openAiModal,
  } = useTaskTrail();

  const statusOrder = new Map(statuses.map((status) => [status.id, status.order]));
  const statusMap = new Map(statuses.map((status) => [status.id, status.name]));
  const orderedTasks = [...tasks].sort((a, b) => {
    const statusDiff = (statusOrder.get(a.statusId) ?? 0) - (statusOrder.get(b.statusId) ?? 0);
    if (statusDiff !== 0) {
      return statusDiff;
    }
    return a.order - b.order;
  });

  return (
    <section className="rounded border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-500">Checklist</p>
          <h2 className="text-lg font-semibold">Daily focus</h2>
          <p className="text-sm text-neutral-600">Track tasks by date and keep momentum.</p>
        </div>
        <button type="button" onClick={openAiModal} className="rounded border border-neutral-300 px-3 py-1 text-sm">
          AI Spark
        </button>
      </div>
      <div className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm text-neutral-600">
          Date
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(event) => setNewTaskTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void addTask();
              }
            }}
            placeholder="Add a task"
            className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <button type="button" onClick={() => void addTask()} className="rounded border border-neutral-300 px-4 py-2 text-sm">
            Add
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {orderedTasks.length === 0 ? (
            <div className="rounded border border-dashed border-neutral-300 px-3 py-4 text-sm text-neutral-500">
              No tasks yet. Add a title to start the list.
            </div>
          ) : (
            orderedTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between gap-3 rounded border border-neutral-200 px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-sm">{task.title}</span>
                  <span className="text-sm text-neutral-500">{statusMap.get(task.statusId) ?? "Status"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={task.statusId}
                    onChange={(event) => void changeTaskStatus(task.id, event.target.value)}
                    className="rounded border border-neutral-300 px-2 py-1 text-sm"
                  >
                    {statuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => void deleteTaskById(task.id)} className="text-sm text-neutral-500">
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
