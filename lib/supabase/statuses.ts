import { getSupabaseClient } from "./client";
import type { Status, StatusUpdate } from "../types";

const TABLE_NAME = "statuses" as const;

const defaultStatuses = [
  { name: "To Do", order: 1 },
  { name: "In Progress", order: 2 },
  { name: "Done", order: 3 },
];

function mapStatus(row: { id: string; name: string; order: number; created_at: string }): Status {
  return {
    id: row.id,
    name: row.name,
    order: row.order,
    createdAt: row.created_at,
  };
}

export async function listStatuses(): Promise<Status[]> {
  const client = getSupabaseClient();
  const { data, error } = await client.from(TABLE_NAME).select("*").order("order", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapStatus(row as { id: string; name: string; order: number; created_at: string }));
}

export async function ensureDefaultStatuses(): Promise<Status[]> {
  const statuses = await listStatuses();
  if (statuses.length > 0) {
    return statuses;
  }

  const client = getSupabaseClient();
  const { data, error } = await client.from(TABLE_NAME).insert(defaultStatuses).select();

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapStatus(row as { id: string; name: string; order: number; created_at: string }));
}

export async function createStatus(input: Omit<Status, "id" | "createdAt">): Promise<Status> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from(TABLE_NAME)
    .insert({ name: input.name, order: input.order })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapStatus(data as { id: string; name: string; order: number; created_at: string });
}

export async function updateStatus(id: string, updates: StatusUpdate): Promise<Status> {
  const client = getSupabaseClient();
  const payload: { name?: string; order?: number } = {};

  if (typeof updates.name === "string") {
    payload.name = updates.name;
  }
  if (typeof updates.order === "number") {
    payload.order = updates.order;
  }

  const { data, error } = await client.from(TABLE_NAME).update(payload).eq("id", id).select().single();

  if (error) {
    throw error;
  }

  return mapStatus(data as { id: string; name: string; order: number; created_at: string });
}

export async function deleteStatus(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from(TABLE_NAME).delete().eq("id", id);
  if (error) {
    throw error;
  }
}
