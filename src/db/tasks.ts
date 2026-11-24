import { and, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import { tasks, type TaskRecord } from './schema.ts';

export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Pending' | 'Completed';

export interface CreateTaskInput {
  userId: number;
  title: string;
  description: string;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  due_date?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export async function listTasksByUser(userId: number): Promise<TaskRecord[]> {
  try {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.created_at), desc(tasks.id));
  } catch (error) {
    console.error('Failed to list tasks:', error);
    throw new Error('Failed to load tasks from the database.', { cause: error });
  }
}

export async function createTask(input: CreateTaskInput): Promise<TaskRecord> {
  try {
    const result = await db
      .insert(tasks)
      .values({
        userId: input.userId,
        title: input.title,
        description: input.description,
        due_date: input.due_date,
        priority: input.priority,
        status: input.status,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to create task:', error);
    throw new Error('Failed to create task in the database.', { cause: error });
  }
}

export async function updateTaskById(
  taskId: number,
  userId: number,
  updates: UpdateTaskInput
): Promise<TaskRecord | null> {
  try {
    const result = await db
      .update(tasks)
      .set(updates)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();

    return result[0] ?? null;
  } catch (error) {
    console.error('Failed to update task:', error);
    throw new Error('Failed to update task in the database.', { cause: error });
  }
}

export async function deleteTaskById(
  taskId: number,
  userId: number
): Promise<TaskRecord | null> {
  try {
    const result = await db
      .delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();

    return result[0] ?? null;
  } catch (error) {
    console.error('Failed to delete task:', error);
    throw new Error('Failed to delete task from the database.', { cause: error });
  }
}
