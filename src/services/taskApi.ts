import type { User } from 'firebase/auth';
import type { Task, TaskFormValues, TaskStatus } from '../types/task.ts';

async function getAuthHeaders(user: User): Promise<HeadersInit> {
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data.error === 'string' && data.error
        ? data.error
        : `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

export async function fetchTasks(user: User): Promise<Task[]> {
  const headers = await getAuthHeaders(user);
  const res = await fetch('/api/tasks', { headers });
  const data = await handleResponse<{ tasks: Task[] }>(res);
  return data.tasks;
}

export async function createTaskRequest(
  user: User,
  values: TaskFormValues
): Promise<Task> {
  const headers = await getAuthHeaders(user);
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: values.title.trim(),
      description: values.description.trim(),
      due_date: values.due_date ? values.due_date : null,
      priority: values.priority,
      status: values.status,
    }),
  });
  const data = await handleResponse<{ task: Task }>(res);
  return data.task;
}

export async function updateTaskRequest(
  user: User,
  taskId: number,
  updates: Partial<TaskFormValues> | { status: TaskStatus }
): Promise<Task> {
  const headers = await getAuthHeaders(user);
  const payload: Record<string, unknown> = {};

  if ('title' in updates && updates.title !== undefined) {
    payload.title = updates.title.trim();
  }
  if ('description' in updates && updates.description !== undefined) {
    payload.description = updates.description.trim();
  }
  if ('due_date' in updates && updates.due_date !== undefined) {
    payload.due_date = updates.due_date ? updates.due_date : null;
  }
  if ('priority' in updates && updates.priority !== undefined) {
    payload.priority = updates.priority;
  }
  if ('status' in updates && updates.status !== undefined) {
    payload.status = updates.status;
  }

  const res = await fetch(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ task: Task }>(res);
  return data.task;
}

export async function deleteTaskRequest(
  user: User,
  taskId: number
): Promise<number> {
  const headers = await getAuthHeaders(user);
  const res = await fetch(`/api/tasks/${taskId}`, {
    method: 'DELETE',
    headers,
  });
  const data = await handleResponse<{ deletedId: number }>(res);
  return data.deletedId;
}
