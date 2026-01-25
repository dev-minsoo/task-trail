import { getSupabaseClient } from "./client";
import type { Status, StatusUpdate } from "../types";

const TABLE_NAME = "statuses" as const;

const defaultStatuses = [
  { name: "Inbox", order: 1 },
  { name: "In Progress", order: 2 },
  { name: "Done", order: 3 },
];

const legacyStatusMap = new Map([
  ["to do", "Inbox"],
  ["today", "In Progress"],
  ["in progress", "In Progress"],
  ["done", "Done"],
]);

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

let ensureStatusesPromise: Promise<Status[]> | null = null;

export async function ensureDefaultStatuses(): Promise<Status[]> {
  if (ensureStatusesPromise) {
    return ensureStatusesPromise;
  }

  ensureStatusesPromise = (async () => {
    const statuses = await listStatuses();
    if (statuses.length > 0) {
      const normalized = new Map(statuses.map((status) => [status.name.toLowerCase(), status]));
      const hasRequired = defaultStatuses.every((status) => normalized.has(status.name.toLowerCase()));
      let didMutate = false;

      if (!hasRequired) {
        const updates = statuses
          .map((status) => {
            const legacyName = status.name.toLowerCase();
            const mappedName = legacyStatusMap.get(legacyName);
            if (!mappedName) {
              return null;
            }
            const desired = defaultStatuses.find((item) => item.name === mappedName);
            if (!desired) {
              return null;
            }
            return updateStatus(status.id, { name: desired.name, order: desired.order });
          })
          .filter((update): update is Promise<Status> => Boolean(update));

        if (updates.length > 0) {
          await Promise.all(updates);
          didMutate = true;
        }
      }

      const statusMap = new Map(
        (didMutate ? await listStatuses() : statuses).map((status) => [status.name.toLowerCase(), status])
      );
      const missing = defaultStatuses.filter((status) => !statusMap.has(status.name.toLowerCase()));

      if (missing.length > 0) {
        const client = getSupabaseClient();
        const { error } = await client.from(TABLE_NAME).insert(missing);
        if (error) {
          throw error;
        }
        didMutate = true;
      }

      const finalStatuses = didMutate ? await listStatuses() : statuses;
      const orderMap = new Map(defaultStatuses.map((status) => [status.name.toLowerCase(), status.order]));
      return finalStatuses
        .filter((status) => orderMap.has(status.name.toLowerCase()))
        .sort((a, b) => (orderMap.get(a.name.toLowerCase()) ?? a.order) - (orderMap.get(b.name.toLowerCase()) ?? b.order));
    }

  const client = getSupabaseClient();
  const { data, error } = await client.from(TABLE_NAME).insert(defaultStatuses).select();

  if (error) {
    throw error;
  }

    return (data ?? []).map((row) => mapStatus(row as { id: string; name: string; order: number; created_at: string }));
  })();

  try {
    return await ensureStatusesPromise;
  } finally {
    ensureStatusesPromise = null;
  }
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
