import { getSupabaseClient } from "./client";
import type { Task, TaskUpdate } from "../types";

const TABLE_NAME = "tasks" as const;

type TaskRow = {
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
};

export type ArchivedTaskQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  statusId?: string;
  archivedFrom?: string;
  archivedTo?: string;
  includeCount?: boolean;
};

export type ArchivedTaskPage = {
  items: Task[];
  total: number;
  hasMore: boolean;
};

export type TaskMetricRow = {
  id: string;
  createdAt: string;
  completedAt: string | null;
  statusId: string;
  isArchived: boolean;
};

function mapTask(row: TaskRow): Task {
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

function mapTaskMetricRow(row: {
  id: string;
  created_at: string;
  completed_at: string | null;
  status_id: string;
  is_archived: boolean;
}): TaskMetricRow {
  return {
    id: row.id,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    statusId: row.status_id,
    isArchived: row.is_archived,
  };
}

function toStartOfDayIso(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
}

function toNextDayStartIso(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day + 1, 0, 0, 0, 0).toISOString();
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
  const allItems: Task[] = [];
  let page = 0;
  while (true) {
    const result = await fetchArchivedTaskPage({ page, pageSize: 100 });
    allItems.push(...result.items);
    if (!result.hasMore) {
      break;
    }
    page += 1;
  }
  return allItems;
}

export const listArchivedTasks = fetchArchivedTasks;

export async function restoreArchivedTaskToInbox(taskId: string, inboxStatusId: string): Promise<Task> {
  const client = getSupabaseClient();
  const { data: orderRows, error: orderError } = await client
    .from(TABLE_NAME)
    .select("order")
    .eq("is_archived", false)
    .eq("status_id", inboxStatusId)
    .order("order", { ascending: false })
    .limit(1);

  if (orderError) {
    throw orderError;
  }

  const nextOrder = (orderRows?.[0]?.order ?? 0) + 1;
  return updateTask(taskId, {
    isArchived: false,
    archivedAt: null,
    statusId: inboxStatusId,
    order: nextOrder,
    startedAt: null,
    completedAt: null,
    date: "",
  });
}

export async function fetchArchivedTaskPage(query: ArchivedTaskQuery = {}): Promise<ArchivedTaskPage> {
  const page = Math.max(0, query.page ?? 0);
  const pageSize = Math.min(Math.max(1, query.pageSize ?? 30), 100);
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const includeCount = query.includeCount ?? true;

  const client = getSupabaseClient();
  let request = client
    .from(TABLE_NAME)
    .select("*", includeCount ? { count: "exact" } : undefined)
    .eq("is_archived", true)
    .order("archived_at", { ascending: false, nullsFirst: false })
    .range(from, to);

  const search = query.search?.trim();
  if (search) {
    request = request.ilike("title", `%${search}%`);
  }

  if (query.statusId) {
    request = request.eq("status_id", query.statusId);
  }

  const archivedFromIso = query.archivedFrom ? toStartOfDayIso(query.archivedFrom) : null;
  if (archivedFromIso) {
    request = request.gte("archived_at", archivedFromIso);
  }

  const archivedToExclusiveIso = query.archivedTo ? toNextDayStartIso(query.archivedTo) : null;
  if (archivedToExclusiveIso) {
    request = request.lt("archived_at", archivedToExclusiveIso);
  }

  const { data, error, count } = await request;
  if (error) {
    throw error;
  }

  const total = includeCount ? count ?? 0 : 0;
  const items = (data ?? []).map((row) => mapTask(row as TaskRow));
  const hasMore = includeCount ? from + items.length < total : items.length === pageSize;
  return {
    items,
    total,
    hasMore,
  };
}

export async function fetchArchivedTaskMetricsInRange(input: {
  startInclusiveIso: string;
  endExclusiveIso: string;
}): Promise<TaskMetricRow[]> {
  const client = getSupabaseClient();
  const { startInclusiveIso, endExclusiveIso } = input;

  const [createdResult, completedResult] = await Promise.all([
    client
      .from(TABLE_NAME)
      .select("id, created_at, completed_at, status_id, is_archived")
      .eq("is_archived", true)
      .gte("created_at", startInclusiveIso)
      .lt("created_at", endExclusiveIso),
    client
      .from(TABLE_NAME)
      .select("id, created_at, completed_at, status_id, is_archived")
      .eq("is_archived", true)
      .not("completed_at", "is", null)
      .gte("completed_at", startInclusiveIso)
      .lt("completed_at", endExclusiveIso),
  ]);

  if (createdResult.error) {
    throw createdResult.error;
  }
  if (completedResult.error) {
    throw completedResult.error;
  }

  const rows = [...(createdResult.data ?? []), ...(completedResult.data ?? [])];
  const deduped = new Map<string, TaskMetricRow>();
  rows.forEach((row) => {
    const mapped = mapTaskMetricRow(row);
    deduped.set(mapped.id, mapped);
  });
  return Array.from(deduped.values());
}
