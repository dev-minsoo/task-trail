"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { TaskTrailProvider } from "@/components/TaskTrailContext";
import type { Status, Task } from "@/lib/types";
import { ensureDefaultStatuses, createStatus, deleteStatus, updateStatus } from "@/lib/supabase/statuses";
import { createTask, createTasks, deleteTask, listTasks, updateTask } from "@/lib/supabase/tasks";
import { createTaskStatusHistory } from "@/lib/supabase/status-history";
import { getActiveContainerId, reorder } from "@/lib/dnd";

const today = () => new Date().toISOString().slice(0, 10);
const STATUS_INBOX = "Inbox";
const STATUS_IN_PROGRESS = "In Progress";
const STATUS_DONE = "Done";

export default function TaskTrailShell({ children }: { children: React.ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<string>(today());
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newStatusName, setNewStatusName] = useState("");
  const hasInitialized = useRef(false);

  const orderedStatuses = useMemo(() => [...statuses].sort((a, b) => a.order - b.order), [statuses]);
  const statusByName = useMemo(
    () => new Map(orderedStatuses.map((status) => [status.name.toLowerCase(), status.id])),
    [orderedStatuses]
  );
  const inboxStatusId = statusByName.get(STATUS_INBOX.toLowerCase());
  const inProgressStatusId = statusByName.get(STATUS_IN_PROGRESS.toLowerCase());
  const doneStatusId = statusByName.get(STATUS_DONE.toLowerCase());
  const primaryStatusId = inboxStatusId ?? orderedStatuses[0]?.id;

  const resolveDateForStatus = (statusId: string, currentDate: string) => {
    if (statusId === inboxStatusId) {
      return currentDate;
    }
    if (statusId === inProgressStatusId) {
      return currentDate || selectedDate;
    }
    return currentDate;
  };

  const normalizeTasks = async (loadedTasks: Task[], loadedStatuses: Status[]) => {
    const allowedNames = new Set([
      STATUS_INBOX.toLowerCase(),
      STATUS_IN_PROGRESS.toLowerCase(),
      STATUS_DONE.toLowerCase(),
    ]);
    const allowedStatuses = loadedStatuses.filter((status) => allowedNames.has(status.name.toLowerCase()));
    const allowedIds = new Set(allowedStatuses.map((status) => status.id));
    const fallbackStatusId = allowedStatuses.find((status) => status.name === STATUS_INBOX)?.id;

    if (!fallbackStatusId) {
      return loadedTasks;
    }

    const invalidTasks = loadedTasks.filter((task) => !allowedIds.has(task.statusId));
    if (invalidTasks.length === 0) {
      return loadedTasks;
    }

    await Promise.all(
      invalidTasks.map((task) =>
        updateTask(task.id, {
          statusId: fallbackStatusId,
          date: task.date,
        })
      )
    );

    return loadedTasks.map((task) =>
      allowedIds.has(task.statusId) ? task : { ...task, statusId: fallbackStatusId, date: task.date }
    );
  };

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;
    const init = async () => {
      try {
        const loadedStatuses = await ensureDefaultStatuses();
        setStatuses(loadedStatuses);
        const loadedTasks = await listTasks();
        const normalizedTasks = await normalizeTasks(loadedTasks, loadedStatuses);
        setTasks(normalizedTasks);
      } finally {
        setIsBootstrapping(false);
      }
    };
    void init();
  }, []);

  const handleAddTask = async (overrides?: { title?: string; statusId?: string; date?: string }) => {
    const title = (overrides?.title ?? newTaskTitle).trim();
    const statusId = overrides?.statusId ?? primaryStatusId;
    if (!title || !statusId) {
      return;
    }
    const baseDate = overrides?.date ?? (statusId === inboxStatusId ? "" : selectedDate);
    const date = resolveDateForStatus(statusId, baseDate);
    const nextOrder = Math.max(0, ...tasks.filter((task) => task.statusId === statusId).map((task) => task.order)) + 1;
    const created = await createTask({ title, statusId, date, order: nextOrder });
    setTasks((prev) => [...prev, created]);
    setNewTaskTitle("");
  };

  const handleAddTasks = async (items: Array<{ title: string; statusId?: string; date?: string }>) => {
    const normalized = items
      .map((item) => {
        const title = item.title.trim();
        const statusId = item.statusId ?? primaryStatusId;
        if (!title || !statusId) {
          return null;
        }
        const baseDate = item.date ?? (statusId === inboxStatusId ? "" : selectedDate);
        const date = resolveDateForStatus(statusId, baseDate);
        return { title, statusId, date };
      })
      .filter((item): item is { title: string; statusId: string; date: string } => Boolean(item));

    if (normalized.length === 0) {
      return;
    }

    const orderByStatus = new Map<string, number>();
    tasks.forEach((task) => {
      const current = orderByStatus.get(task.statusId) ?? 0;
      orderByStatus.set(task.statusId, Math.max(current, task.order));
    });

    const grouped = new Map<string, Array<{ title: string; statusId: string; date: string }>>();
    normalized.forEach((item) => {
      const group = grouped.get(item.statusId) ?? [];
      group.push(item);
      grouped.set(item.statusId, group);
    });

    const payload: Array<Parameters<typeof createTask>[0]> = [];
    grouped.forEach((group, statusId) => {
      const startOrder = (orderByStatus.get(statusId) ?? 0) + 1;
      group.forEach((item, index) => {
        payload.push({
          title: item.title,
          statusId,
          date: item.date,
          order: startOrder + index,
        });
      });
    });

    const created = await createTasks(payload);
    if (created.length > 0) {
      setTasks((prev) => [...prev, ...created]);
    }
  };

  const handleTaskStatusChange = async (taskId: string, statusId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }
    const resolvedDate = resolveDateForStatus(statusId, task.date);
    const nextOrder = Math.max(0, ...tasks.filter((item) => item.statusId === statusId).map((item) => item.order)) + 1;
    const now = new Date().toISOString();
    const updates: Parameters<typeof updateTask>[1] = {
      statusId,
      order: nextOrder,
      date: resolvedDate,
    };

    if (statusId === inboxStatusId) {
      updates.startedAt = null;
      updates.completedAt = null;
    }
    if (statusId === inProgressStatusId && !task.startedAt) {
      updates.startedAt = now;
    }
    if (statusId === doneStatusId) {
      updates.completedAt = now;
    } else {
      updates.completedAt = null;
    }

    const updated = await updateTask(taskId, updates);
    setTasks((prev) => prev.map((item) => (item.id === taskId ? updated : item)));
    await createTaskStatusHistory({
      taskId,
      fromStatusId: task.statusId,
      toStatusId: statusId,
      changedAt: now,
    });
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
    const nextDate = resolveDateForStatus(targetContainerId, activeTask.date);
    updatedTarget.splice(insertIndex, 0, { ...activeTask, statusId: targetContainerId, date: nextDate });

    const normalizedTarget = updatedTarget.map((task, index) => ({ ...task, order: index + 1 }));
    const normalizedSource = sourceTasks.filter((task) => task.id !== activeTask.id).map((task, index) => ({ ...task, order: index + 1 }));

    setTasks((prev) =>
      prev.map((task) => {
        const updated = [...normalizedTarget, ...normalizedSource].find((item) => item.id === task.id);
        return updated ? updated : task;
      })
    );

    const now = new Date().toISOString();
    const movedTask = normalizedTarget.find((task) => task.id === activeTask.id);
    const movedStatusId = movedTask?.statusId ?? activeTask.statusId;
    const statusUpdates: Parameters<typeof updateTask>[1] = {
      statusId: movedStatusId,
      order: movedTask?.order ?? activeTask.order,
      date: movedTask?.date ?? activeTask.date,
    };

    if (movedStatusId === inboxStatusId) {
      statusUpdates.startedAt = null;
      statusUpdates.completedAt = null;
    }
    if (movedStatusId === inProgressStatusId && !activeTask.startedAt) {
      statusUpdates.startedAt = now;
    }
    if (movedStatusId === doneStatusId) {
      statusUpdates.completedAt = now;
    } else {
      statusUpdates.completedAt = null;
    }

    await Promise.all([
      ...normalizedTarget.map((task) =>
        task.id === activeTask.id
          ? updateTask(task.id, statusUpdates)
          : updateTask(task.id, { order: task.order })
      ),
      ...normalizedSource.map((task) => updateTask(task.id, { order: task.order })),
    ]);

    if (activeTask.statusId !== movedStatusId) {
      await createTaskStatusHistory({
        taskId: activeTask.id,
        fromStatusId: activeTask.statusId,
        toStatusId: movedStatusId,
        changedAt: now,
      });
    }
  };

  const handleToggleTaskDone = async (taskId: string) => {
    if (!doneStatusId) {
      return;
    }
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }
    const fallbackStatusId = inProgressStatusId ?? inboxStatusId;
    if (!fallbackStatusId) {
      return;
    }

    const isDone = task.statusId === doneStatusId;
    const nextStatusId = isDone ? fallbackStatusId : doneStatusId;
    const resolvedDate = isDone ? resolveDateForStatus(nextStatusId, task.date) : task.date;
    const nextOrder = Math.max(0, ...tasks.filter((item) => item.statusId === nextStatusId).map((item) => item.order)) + 1;
    const now = new Date().toISOString();
    const updates: Parameters<typeof updateTask>[1] = {
      statusId: nextStatusId,
      order: nextOrder,
      date: resolvedDate,
    };

    if (nextStatusId === inboxStatusId) {
      updates.startedAt = null;
      updates.completedAt = null;
    }
    if (nextStatusId === inProgressStatusId && !task.startedAt) {
      updates.startedAt = now;
    }
    if (nextStatusId === doneStatusId) {
      updates.completedAt = now;
    } else {
      updates.completedAt = null;
    }

    const updated = await updateTask(taskId, updates);
    setTasks((prev) => prev.map((item) => (item.id === taskId ? updated : item)));
    await createTaskStatusHistory({
      taskId,
      fromStatusId: task.statusId,
      toStatusId: nextStatusId,
      changedAt: now,
    });
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


  const contextValue = {
    selectedDate,
    setSelectedDate,
    statuses: orderedStatuses,
    tasks,
    isBootstrapping,
    newTaskTitle,
    setNewTaskTitle,
    newStatusName,
    setNewStatusName,
    addTask: handleAddTask,
    addTasks: handleAddTasks,
    changeTaskStatus: handleTaskStatusChange,
    deleteTaskById: handleDeleteTask,
    toggleTaskDone: handleToggleTaskDone,
    handleTaskDragEnd,
    addStatus: handleAddStatus,
    renameStatus: handleRenameStatus,
    deleteStatusById: handleDeleteStatus,
    handleStatusDragEnd,
  };

  return <TaskTrailProvider value={contextValue}>{children}</TaskTrailProvider>;
}
