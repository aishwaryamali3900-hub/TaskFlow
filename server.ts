import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import {
  createTask,
  deleteTaskById,
  listTasksByUser,
  updateTaskById,
  type TaskPriority,
  type TaskStatus,
} from './src/db/tasks.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_PRIORITIES: readonly TaskPriority[] = ['Low', 'Medium', 'High'];
const VALID_STATUSES: readonly TaskStatus[] = ['Pending', 'Completed'];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidPriority(value: unknown): value is TaskPriority {
  return typeof value === 'string' && VALID_PRIORITIES.includes(value as TaskPriority);
}

function isValidStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && VALID_STATUSES.includes(value as TaskStatus);
}

function normalizeDueDate(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value === 'string' && DATE_PATTERN.test(value.trim())) {
    return value.trim();
  }
  return undefined;
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/tasks', requireAuth, async (req: AuthRequest, res) => {
    try {
      const dbUser = req.dbUser;
      if (!dbUser) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const userTasks = await listTasksByUser(dbUser.id);
      res.json({ tasks: userTasks });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to fetch tasks.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/tasks', requireAuth, async (req: AuthRequest, res) => {
    try {
      const dbUser = req.dbUser;
      if (!dbUser) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const body = req.body ?? {};
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      const description =
        typeof body.description === 'string' ? body.description.trim() : '';
      const priority: TaskPriority = isValidPriority(body.priority)
        ? body.priority
        : 'Medium';
      const status: TaskStatus = isValidStatus(body.status)
        ? body.status
        : 'Pending';

      if (!title) {
        res.status(400).json({ error: 'Task title is required.' });
        return;
      }
      if (title.length > 160) {
        res.status(400).json({ error: 'Task title must be 160 characters or fewer.' });
        return;
      }
      if (description.length > 2000) {
        res.status(400).json({ error: 'Description must be 2000 characters or fewer.' });
        return;
      }

      const normalizedDate = normalizeDueDate(body.due_date);
      if (body.due_date !== undefined && body.due_date !== null && body.due_date !== '' && normalizedDate === undefined) {
        res.status(400).json({ error: 'Due date must be in YYYY-MM-DD format.' });
        return;
      }

      const created = await createTask({
        userId: dbUser.id,
        title,
        description,
        due_date: normalizedDate ?? null,
        priority,
        status,
      });

      res.status(201).json({ task: created });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to create task.';
      res.status(500).json({ error: message });
    }
  });

  app.patch('/api/tasks/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const dbUser = req.dbUser;
      if (!dbUser) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const taskId = Number(req.params.id);
      if (!Number.isInteger(taskId) || taskId <= 0) {
        res.status(400).json({ error: 'Invalid task ID.' });
        return;
      }

      const body = req.body ?? {};
      const updates: {
        title?: string;
        description?: string;
        due_date?: string | null;
        priority?: TaskPriority;
        status?: TaskStatus;
      } = {};

      if (body.title !== undefined) {
        const title = typeof body.title === 'string' ? body.title.trim() : '';
        if (!title) {
          res.status(400).json({ error: 'Task title cannot be empty.' });
          return;
        }
        if (title.length > 160) {
          res.status(400).json({ error: 'Task title must be 160 characters or fewer.' });
          return;
        }
        updates.title = title;
      }

      if (body.description !== undefined) {
        if (typeof body.description !== 'string') {
          res.status(400).json({ error: 'Description must be text.' });
          return;
        }
        const description = body.description.trim();
        if (description.length > 2000) {
          res.status(400).json({ error: 'Description must be 2000 characters or fewer.' });
          return;
        }
        updates.description = description;
      }

      if (body.due_date !== undefined) {
        const normalizedDate = normalizeDueDate(body.due_date);
        if (body.due_date !== null && body.due_date !== '' && normalizedDate === undefined) {
          res.status(400).json({ error: 'Due date must be in YYYY-MM-DD format.' });
          return;
        }
        updates.due_date = normalizedDate ?? null;
      }

      if (body.priority !== undefined) {
        if (!isValidPriority(body.priority)) {
          res.status(400).json({ error: 'Priority must be Low, Medium, or High.' });
          return;
        }
        updates.priority = body.priority;
      }

      if (body.status !== undefined) {
        if (!isValidStatus(body.status)) {
          res.status(400).json({ error: 'Status must be Pending or Completed.' });
          return;
        }
        updates.status = body.status;
      }

      if (Object.keys(updates).length === 0) {
        res.status(400).json({ error: 'No valid fields provided to update.' });
        return;
      }

      const updated = await updateTaskById(taskId, dbUser.id, updates);
      if (!updated) {
        res.status(404).json({ error: 'Task not found.' });
        return;
      }

      res.json({ task: updated });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update task.';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/tasks/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const dbUser = req.dbUser;
      if (!dbUser) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const taskId = Number(req.params.id);
      if (!Number.isInteger(taskId) || taskId <= 0) {
        res.status(400).json({ error: 'Invalid task ID.' });
        return;
      }

      const deleted = await deleteTaskById(taskId, dbUser.id);
      if (!deleted) {
        res.status(404).json({ error: 'Task not found.' });
        return;
      }

      res.json({ deletedId: deleted.id });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to delete task.';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`TaskFlow server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
