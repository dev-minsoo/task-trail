"use client";

import { useEffect, useMemo, useState } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { TaskTrailProvider } from "@/components/TaskTrailContext";
import type { Status, Task } from "@/lib/types";
import { ensureDefaultStatuses, createStatus, deleteStatus, updateStatus } from "@/lib/supabase/statuses";
import { createTask, deleteTask, listTasksByDate, updateTask } from "@/lib/supabase/tasks";
import { getActiveContainerId, reorder } from "@/lib/dnd";

const today = () => new Date().toISOString().slice(0, 10);

export default function TaskTrailShell({ children }: { children: React.ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<string>(today());
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newStatusName, setNewStatusName] = useState("");
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiInputText, setAiInputText] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiSelected, setAiSelected] = useState<Set<string>>(new Set());
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const loadedStatuses = await ensureDefaultStatuses();
      setStatuses(loadedStatuses);
    };
    void init();
  }, []);

  useEffect(() => {
    const loadTasks = async () => {
      const loadedTasks = await listTasksByDate(selectedDate);
      setTasks(loadedTasks);
    };
    void loadTasks();
  }, [selectedDate]);

  const orderedStatuses = useMemo(() => [...statuses].sort((a, b) => a.order - b.order), [statuses]);

  const primaryStatusId = orderedStatuses[0]?.id;

  const handleAddTask = async () => {
    const title = newTaskTitle.trim();
    if (!title || !primaryStatusId) {
      return;
    }
    const nextOrder = Math.max(0, ...tasks.filter((task) => task.statusId === primaryStatusId).map((task) => task.order)) + 1;
    const created = await createTask({ title, statusId: primaryStatusId, date: selectedDate, order: nextOrder });
    setTasks((prev) => [...prev, created]);
    setNewTaskTitle("");
  };

  const handleTaskStatusChange = async (taskId: string, statusId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }
    const nextOrder = Math.max(0, ...tasks.filter((item) => item.statusId === statusId).map((item) => item.order)) + 1;
    const updated = await updateTask(taskId, { statusId, order: nextOrder });
    setTasks((prev) => prev.map((item) => (item.id === taskId ? updated : item)));
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const handleTaskDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const activeTask = tasks.find((task) => task.id === active.id);
    if (!activeTask) {
      return;
    }

    const targetContainerId = getActiveContainerId(event);
    if (!targetContainerId) {
      return;
    }

    const targetTasks = tasks.filter((task) => task.statusId === targetContainerId).sort((a, b) => a.order - b.order);
    const sourceTasks = tasks.filter((task) => task.statusId === activeTask.statusId).sort((a, b) => a.order - b.order);

    const isSameContainer = activeTask.statusId === targetContainerId;

    if (isSameContainer) {
      const activeIndex = sourceTasks.findIndex((task) => task.id === active.id);
      const rawOverIndex = sourceTasks.findIndex((task) => task.id === over.id);
      const overIndex = rawOverIndex === -1 ? sourceTasks.length - 1 : rawOverIndex;
      const reordered = reorder(sourceTasks, activeIndex, overIndex).map((task, index) => ({ ...task, order: index + 1 }));

      setTasks((prev) =>
        prev.map((task) => {
          const updated = reordered.find((item) => item.id === task.id);
          return updated ? updated : task;
        })
      );

      await Promise.all(reordered.map((task) => updateTask(task.id, { order: task.order })));
      return;
    }

    const overIndex = targetTasks.findIndex((task) => task.id === over.id);
    const insertIndex = overIndex === -1 ? targetTasks.length : overIndex;
    const updatedTarget = [...targetTasks];
    updatedTarget.splice(insertIndex, 0, { ...activeTask, statusId: targetContainerId });

    const normalizedTarget = updatedTarget.map((task, index) => ({ ...task, order: index + 1 }));
    const normalizedSource = sourceTasks.filter((task) => task.id !== activeTask.id).map((task, index) => ({ ...task, order: index + 1 }));

    setTasks((prev) =>
      prev.map((task) => {
        const updated = [...normalizedTarget, ...normalizedSource].find((item) => item.id === task.id);
        return updated ? updated : task;
      })
    );

    await Promise.all([
      ...normalizedTarget.map((task) => updateTask(task.id, { statusId: task.statusId, order: task.order })),
      ...normalizedSource.map((task) => updateTask(task.id, { order: task.order })),
    ]);
  };

  const handleAddStatus = async () => {
    const name = newStatusName.trim();
    if (!name) {
      return;
    }
    const nextOrder = Math.max(0, ...statuses.map((status) => status.order)) + 1;
    const created = await createStatus({ name, order: nextOrder });
    setStatuses((prev) => [...prev, created]);
    setNewStatusName("");
  };

  const handleRenameStatus = async (statusId: string, name: string) => {
    const updated = await updateStatus(statusId, { name });
    setStatuses((prev) => prev.map((status) => (status.id === statusId ? updated : status)));
  };

  const handleDeleteStatus = async (statusId: string) => {
    const remainingStatuses = statuses.filter((status) => status.id !== statusId);
    await deleteStatus(statusId);
    await Promise.all(tasks.filter((task) => task.statusId === statusId).map((task) => deleteTask(task.id)));
    setStatuses(remainingStatuses);
    setTasks((prev) => prev.filter((task) => task.statusId !== statusId));
  };

  const handleStatusDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const activeIndex = orderedStatuses.findIndex((status) => status.id === active.id);
    const overIndex = orderedStatuses.findIndex((status) => status.id === over.id);
    const reordered = reorder(orderedStatuses, activeIndex, overIndex).map((status, index) => ({
      ...status,
      order: index + 1,
    }));

    setStatuses(reordered);
    await Promise.all(reordered.map((status) => updateStatus(status.id, { order: status.order })));
  };

  const handleOpenAiModal = () => {
    setIsAiModalOpen(true);
    setAiSelected(new Set());
  };

  const handleCloseAiModal = () => {
    setIsAiModalOpen(false);
    setAiSuggestions([]);
    setAiSelected(new Set());
    setAiInputText("");
  };

  const handleToggleSuggestion = (task: string) => {
    setAiSelected((prev) => {
      const updated = new Set(prev);
      if (updated.has(task)) {
        updated.delete(task);
      } else {
        updated.add(task);
      }
      return updated;
    });
  };

  const handleFetchSuggestions = async () => {
    if (!aiInputText.trim()) {
      return;
    }
    setIsAiLoading(true);
    try {
      const response = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiInputText }),
      });
      const data = (await response.json()) as { tasks?: string[] };
      const suggestions = data.tasks ?? [];
      setAiSuggestions(suggestions);
      setAiSelected(new Set(suggestions));
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCreateSuggestedTasks = async () => {
    if (!primaryStatusId) {
      return;
    }
    const selectedTasks = Array.from(aiSelected);
    if (selectedTasks.length === 0) {
      return;
    }
    const baseOrder = Math.max(0, ...tasks.filter((task) => task.statusId === primaryStatusId).map((task) => task.order));
    const createdTasks = await Promise.all(
      selectedTasks.map((title, index) => createTask({ title, statusId: primaryStatusId, date: selectedDate, order: baseOrder + index + 1 }))
    );
    setTasks((prev) => [...prev, ...createdTasks]);
    handleCloseAiModal();
  };

  const contextValue = {
    selectedDate,
    setSelectedDate,
    statuses: orderedStatuses,
    tasks,
    newTaskTitle,
    setNewTaskTitle,
    newStatusName,
    setNewStatusName,
    addTask: handleAddTask,
    changeTaskStatus: handleTaskStatusChange,
    deleteTaskById: handleDeleteTask,
    handleTaskDragEnd,
    addStatus: handleAddStatus,
    renameStatus: handleRenameStatus,
    deleteStatusById: handleDeleteStatus,
    handleStatusDragEnd,
    isAiModalOpen,
    openAiModal: handleOpenAiModal,
    closeAiModal: handleCloseAiModal,
    aiInputText,
    setAiInputText,
    aiSuggestions,
    aiSelected,
    isAiLoading,
    toggleSuggestion: handleToggleSuggestion,
    fetchSuggestions: handleFetchSuggestions,
    createSuggestedTasks: handleCreateSuggestedTasks,
  };

  return <TaskTrailProvider value={contextValue}>{children}</TaskTrailProvider>;
}
