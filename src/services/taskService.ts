import { v4 as uuidv4 } from 'uuid';
import { Task } from '../types';
import { Database } from '../db/database';

export class TaskService {
  constructor(private db: Database) {}

  async createTask(taskData: Partial<Task>): Promise<Task> {
    if (!taskData.title || typeof taskData.title !== 'string') {
      throw new Error('Title is required');
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const completed = taskData.completed ?? false;
    const isDeleted = false;
    const syncStatus: Task['sync_status'] = 'pending';

    await this.db.run(
      `INSERT INTO tasks (id, title, description, completed, created_at, updated_at, is_deleted, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        taskData.title,
        taskData.description ?? null,
        completed ? 1 : 0,
        now,
        now,
        isDeleted ? 1 : 0,
        syncStatus,
      ]
    );

    // Add to sync queue
    const queueId = uuidv4();
    const dataForQueue: Partial<Task> = {
      id,
      title: taskData.title,
      description: taskData.description,
      completed,
      updated_at: new Date(now) as any,
    };
    await this.db.run(
      `INSERT INTO sync_queue (id, task_id, operation, data) VALUES (?, ?, ?, ?)`,
      [queueId, id, 'create', JSON.stringify(dataForQueue)]
    );

    const created = await this.getTask(id);
    // created should not be null here
    return created as Task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const existing = await this.db.get(`SELECT * FROM tasks WHERE id = ?`, [id]);
    if (!existing) return null;

    const title = updates.title ?? existing.title;
    const description = updates.description ?? existing.description;
    const completed =
      typeof updates.completed === 'boolean' ? (updates.completed ? 1 : 0) : existing.completed;
    const now = new Date().toISOString();

    await this.db.run(
      `UPDATE tasks SET title = ?, description = ?, completed = ?, updated_at = ?, sync_status = 'pending' WHERE id = ?`,
      [title, description, completed, now, id]
    );

    // Add to sync queue
    const queueId = uuidv4();
    const dataForQueue: Partial<Task> = {
      id,
      title,
      description: description ?? undefined,
      completed: !!(completed === 1),
      updated_at: new Date(now) as any,
    };
    await this.db.run(
      `INSERT INTO sync_queue (id, task_id, operation, data) VALUES (?, ?, ?, ?)`,
      [queueId, id, 'update', JSON.stringify(dataForQueue)]
    );

    return (await this.getTask(id)) as Task;
  }

  async deleteTask(id: string): Promise<boolean> {
    const existing = await this.db.get(`SELECT * FROM tasks WHERE id = ?`, [id]);
    if (!existing) return false;

    const now = new Date().toISOString();
    await this.db.run(
      `UPDATE tasks SET is_deleted = 1, updated_at = ?, sync_status = 'pending' WHERE id = ?`,
      [now, id]
    );

    const queueId = uuidv4();
    const dataForQueue: Partial<Task> = { id, updated_at: new Date(now) as any };
    await this.db.run(
      `INSERT INTO sync_queue (id, task_id, operation, data) VALUES (?, ?, ?, ?)`,
      [queueId, id, 'delete', JSON.stringify(dataForQueue)]
    );

    return true;
  }

  async getTask(id: string): Promise<Task | null> {
    const row = await this.db.get(`SELECT * FROM tasks WHERE id = ?`, [id]);
    if (!row || row.is_deleted === 1) return null;
    return this.mapRowToTask(row);
  }

  async getAllTasks(): Promise<Task[]> {
    const rows = await this.db.all(`SELECT * FROM tasks WHERE is_deleted = 0`);
    return rows.map((r) => this.mapRowToTask(r));
  }

  async getTasksNeedingSync(): Promise<Task[]> {
    const rows = await this.db.all(
      `SELECT * FROM tasks WHERE sync_status IN ('pending','error') AND is_deleted = 0`
    );
    return rows.map((r) => this.mapRowToTask(r));
  }

  private mapRowToTask(row: any): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      completed: row.completed === 1,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      is_deleted: row.is_deleted === 1,
      sync_status: row.sync_status,
      server_id: row.server_id ?? undefined,
      last_synced_at: row.last_synced_at ? new Date(row.last_synced_at) : undefined,
    };
  }
}