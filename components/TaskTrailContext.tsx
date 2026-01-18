"use client";

import { createContext, useContext } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import type { Status, Task } from "@/lib/types";

export type TaskTrailContextValue = {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  statuses: Status[];
  tasks: Task[];
  newTaskTitle: string;
  setNewTaskTitle: (value: string) => void;
  newStatusName: string;
  setNewStatusName: (value: string) => void;
  addTask: () => Promise<void>;
  changeTaskStatus: (taskId: string, statusId: string) => Promise<void>;
  deleteTaskById: (taskId: string) => Promise<void>;
  handleTaskDragEnd: (event: DragEndEvent) => Promise<void>;
  addStatus: () => Promise<void>;
  renameStatus: (statusId: string, name: string) => Promise<void>;
  deleteStatusById: (statusId: string) => Promise<void>;
  handleStatusDragEnd: (event: DragEndEvent) => Promise<void>;
  isAiModalOpen: boolean;
  openAiModal: () => void;
  closeAiModal: () => void;
  aiInputText: string;
  setAiInputText: (value: string) => void;
  aiSuggestions: string[];
  aiSelected: Set<string>;
  isAiLoading: boolean;
  toggleSuggestion: (task: string) => void;
  fetchSuggestions: () => Promise<void>;
  createSuggestedTasks: () => Promise<void>;
};

const TaskTrailContext = createContext<TaskTrailContextValue | null>(null);

export function TaskTrailProvider({ value, children }: { value: TaskTrailContextValue; children: React.ReactNode }) {
  return <TaskTrailContext.Provider value={value}>{children}</TaskTrailContext.Provider>;
}

export function useTaskTrail() {
  const context = useContext(TaskTrailContext);
  if (!context) {
    throw new Error("TaskTrailProvider is missing");
  }
  return context;
}
