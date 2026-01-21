import { getSupabaseClient } from "./client";
import type { Task, TaskUpdate } from "../types";

const TABLE_NAME = "tasks" as const;

function mapTask(row: {
  id: string;
  title: string;
  status_id: string;
  date: string;
  order: number;
  created_at: string;
  updated_at: string;
}): Task {
  return {
    id: row.id,
    title: row.title,
    statusId: row.status_id,
    date: row.date,
    order: row.order,
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
      created_at: string;
      updated_at: string;
    })
  );
}

export async function listTasks(): Promise<Task[]> {
  const client = getSupabaseClient();
  const { data, error } = await client.from(TABLE_NAME).select("*").order("created_at", { ascending: true });

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
      created_at: string;
      updated_at: string;
    })
  );
}

export async function createTask(input: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<Task> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from(TABLE_NAME)
    .insert({
      title: input.title,
      status_id: input.statusId,
      date: input.date,
      order: input.order,
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
      created_at: string;
      updated_at: string;
    }
  );
}

export async function updateTask(id: string, updates: TaskUpdate): Promise<Task> {
  const client = getSupabaseClient();
  const payload: {
    title?: string;
    status_id?: string;
    date?: string;
    order?: number;
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
