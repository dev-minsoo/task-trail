export type Status = {
  id: string;
  name: string;
  order: number;
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  statusId: string;
  date: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  isArchived: boolean;
  archivedAt: string | null;
};

export type TaskUpdate = Partial<Omit<Task, "id" | "createdAt">>;
export type StatusUpdate = Partial<Omit<Status, "id" | "createdAt">>;
