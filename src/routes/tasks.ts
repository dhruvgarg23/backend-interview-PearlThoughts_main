import { Router, Request, Response } from 'express';
import { TaskService } from '../services/taskService';
import { Database } from '../db/database';

export function createTaskRouter(db: Database): Router {
  const router = Router();
  const taskService = new TaskService(db);

  function toTaskResponse(task: any) {
    return {
      id: task.id,
      title: task.title,
      description: task.description ?? null,
      completed: !!task.completed,
      created_at: new Date(task.created_at).toISOString(),
      updated_at: new Date(task.updated_at).toISOString(),
      is_deleted: !!task.is_deleted,
      sync_status: task.sync_status ?? null,
      server_id: task.server_id ?? null,
      last_synced_at: task.last_synced_at ? new Date(task.last_synced_at).toISOString() : null,
    };
  }

  // Get all tasks
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const tasks = await taskService.getAllTasks();
      return res.json(tasks.map(toTaskResponse));
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  // Get single task
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const task = await taskService.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ 
          error: 'Task not found',
          timestamp: new Date().toISOString(),
          path: req.path
        });
      }
      return res.json(toTaskResponse(task));
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch task' });
    }
  });

  // Create task
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { title, description, completed } = req.body || {};
      if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'title is required' });
      }
      const task = await taskService.createTask({ title, description, completed });
      return res.status(201).json(toTaskResponse(task));
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create task' });
    }
  });

  // Update task
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const updates = req.body || {};
      if (updates.completed !== undefined && typeof updates.completed !== 'boolean') {
        return res.status(400).json({ error: 'completed must be a boolean' });
      }
      if (updates.title !== undefined && typeof updates.title !== 'string') {
        return res.status(400).json({ error: 'title must be a string' });
      }
      const updated = await taskService.updateTask(req.params.id, updates);
      if (!updated) return res.status(404).json({ error: 'Task not found' });
      return res.json(toTaskResponse(updated));
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update task' });
    }
  });

  // Delete task
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const ok = await taskService.deleteTask(req.params.id);
      if (!ok) return res.status(404).json({ error: 'Task not found' });
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  return router;
}