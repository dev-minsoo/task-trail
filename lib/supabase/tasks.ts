import { getSupabaseClient } from "./client";
import type { Task, TaskUpdate } from "../types";

const TABLE_NAME = "tasks" as const;

function mapTask(row: {
  id: string;
  title: string;
  status_id: string;
  date: string;
  order: number;
  started_at: string | null;
  completed_at: string | null;
  is_archived: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}): Task {
  return {
    id: row.id,
    title: row.title,
    statusId: row.status_id,
    date: row.date,
    order: row.order,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    isArchived: row.is_archived,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listTasksByDate(date: string): Promise<Task[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from(TABLE_NAME)
    .select("*")
    .eq("date", date)
    .eq("is_archived", false)
    .order("order", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) =>
    mapTask(row as {
      id: string;
      title: string;
      status_id: string;
      date: string;
      order: number;
      started_at: string | null;
      completed_at: string | null;
      is_archived: boolean;
      archived_at: string | null;
      created_at: string;
      updated_at: string;
    })
  );
}

export async function listTasks(): Promise<Task[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from(TABLE_NAME)
    .select("*")
    .eq("is_archived", false)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) =>
    mapTask(row as {
      id: string;
      title: string;
      status_id: string;
      date: string;
      order: number;
      started_at: string | null;
      completed_at: string | null;
      is_archived: boolean;
      archived_at: string | null;
      created_at: string;
      updated_at: string;
    })
  );
}


export async function createTask(input: {
  title: string;
  statusId: string;
  date: string;
  order: number;
  startedAt?: string | null;
  completedAt?: string | null;
  isArchived?: boolean;
  archivedAt?: string | null;
}): Promise<Task> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from(TABLE_NAME)
    .insert({
      title: input.title,
      status_id: input.statusId,
      date: input.date,
      order: input.order,
      started_at: input.startedAt ?? null,
      completed_at: input.completedAt ?? null,
      is_archived: input.isArchived ?? false,
      archived_at: input.archivedAt ?? null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapTask(
    data as {
      id: string;
      title: string;
      status_id: string;
      date: string;
      order: number;
      started_at: string | null;
      completed_at: string | null;
      is_archived: boolean;
      archived_at: string | null;
      created_at: string;
      updated_at: string;
    }
  );
}

export async function createTasks(
  inputs: Array<{
    title: string;
    statusId: string;
    date: string;
    order: number;
    startedAt?: string | null;
    completedAt?: string | null;
    isArchived?: boolean;
    archivedAt?: string | null;
  }>
): Promise<Task[]> {
  if (inputs.length === 0) {
    return [];
  }
  const client = getSupabaseClient();
  const { data, error } = await client
    .from(TABLE_NAME)
    .insert(
      inputs.map((input) => ({
        title: input.title,
        status_id: input.statusId,
        date: input.date,
        order: input.order,
        started_at: input.startedAt ?? null,
        completed_at: input.completedAt ?? null,
        is_archived: input.isArchived ?? false,
        archived_at: input.archivedAt ?? null,
      }))
    )
    .select();

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) =>
    mapTask(row as {
      id: string;
      title: string;
      status_id: string;
      date: string;
      order: number;
      started_at: string | null;
      completed_at: string | null;
      is_archived: boolean;
      archived_at: string | null;
      created_at: string;
      updated_at: string;
    })
  );
}

export async function updateTask(id: string, updates: TaskUpdate): Promise<Task> {
  const client = getSupabaseClient();
  const payload: {
    title?: string;
    status_id?: string;
    date?: string;
    order?: number;
    started_at?: string | null;
    completed_at?: string | null;
    is_archived?: boolean;
    archived_at?: string | null;
    updated_at?: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (typeof updates.title === "string") {
    payload.title = updates.title;
  }
  if (typeof updates.statusId === "string") {
    payload.status_id = updates.statusId;
  }
  if (typeof updates.date === "string") {
    payload.date = updates.date;
  }
  if (typeof updates.order === "number") {
    payload.order = updates.order;
  }
  if (updates.startedAt !== undefined) {
    payload.started_at = updates.startedAt;
  }
  if (updates.completedAt !== undefined) {
    payload.completed_at = updates.completedAt;
  }
  if (typeof updates.isArchived === "boolean") {
    payload.is_archived = updates.isArchived;
  }
  if (updates.archivedAt !== undefined) {
    payload.archived_at = updates.archivedAt;
  }

  const { data, error } = await client.from(TABLE_NAME).update(payload).eq("id", id).select().single();

  if (error) {
    throw error;
  }

  return mapTask(
    data as {
      id: string;
      title: string;
      status_id: string;
      date: string;
      order: number;
      started_at: string | null;
      completed_at: string | null;
      is_archived: boolean;
      archived_at: string | null;
      created_at: string;
      updated_at: string;
    }
  );
}

export async function deleteTask(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from(TABLE_NAME).delete().eq("id", id);
  if (error) {
    throw error;
  }
}

export async function fetchArchivedTasks(): Promise<Task[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from(TABLE_NAME)
    .select("*")
    .eq("is_archived", true)
    .order("archived_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) =>
    mapTask(row as {
      id: string;
      title: string;
      status_id: string;
      date: string;
      order: number;
      started_at: string | null;
      completed_at: string | null;
      is_archived: boolean;
      archived_at: string | null;
      created_at: string;
      updated_at: string;
    })
  );
}

export const listArchivedTasks = fetchArchivedTasks;
