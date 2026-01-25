import { getSupabaseClient } from "./client";

const TABLE_NAME = "task_status_history" as const;

export async function createTaskStatusHistory(input: {
  taskId: string;
  fromStatusId: string | null;
  toStatusId: string;
  changedAt?: string;
}): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from(TABLE_NAME).insert({
    task_id: input.taskId,
    from_status_id: input.fromStatusId,
    to_status_id: input.toStatusId,
    changed_at: input.changedAt,
  });

  if (error) {
    throw error;
  }
}
