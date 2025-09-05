import axios from 'axios';
import { Task, SyncQueueItem, SyncResult, BatchSyncResponse } from '../types';
import { Database } from '../db/database';
import { TaskService } from './taskService';

export class SyncService {
  private apiUrl: string;
  
  constructor(
    private db: Database,
    private taskService: TaskService,
    apiUrl: string = process.env.API_BASE_URL || 'http://localhost:3000/api'
  ) {
    this.apiUrl = apiUrl;
  }

  async sync(): Promise<SyncResult> {
    const batchSize = parseInt(process.env.SYNC_BATCH_SIZE || '50', 10);
    const queueRows = await this.db.all(`SELECT * FROM sync_queue ORDER BY created_at ASC`);
    const items: SyncQueueItem[] = queueRows.map((row: any) => ({
      id: row.id,
      task_id: row.task_id,
      operation: row.operation,
      data: JSON.parse(row.data),
      created_at: new Date(row.created_at),
      retry_count: row.retry_count,
      error_message: row.error_message ?? undefined,
    }));

    let synced = 0;
    let failed = 0;
    const errors: SyncResult['errors'] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      try {
        const resp = await this.processBatch(batch);
        for (const processed of resp.processed_items) {
          const original = batch.find((b) => b.task_id === processed.client_id);
          if (!original) continue;
          if (processed.status === 'success') {
            await this.updateSyncStatus(original.task_id, 'synced', { server_id: processed.server_id });
            synced += 1;
          } else if (processed.status === 'conflict') {
            // Apply resolved data using LWW if server provided
            if (processed.resolved_data) {
              const resolved = await this.resolveConflict(
                (await this.taskService.getTask(original.task_id)) as Task,
                processed.resolved_data
              );
              // Persist resolved
              await this.db.run(
                `UPDATE tasks SET title = ?, description = ?, completed = ?, updated_at = ?, sync_status = 'synced', server_id = ?, last_synced_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [
                  resolved.title,
                  resolved.description ?? null,
                  resolved.completed ? 1 : 0,
                  resolved.updated_at.toISOString(),
                  processed.server_id ?? null,
                  resolved.id,
                ]
              );
              await this.db.run(`DELETE FROM sync_queue WHERE task_id = ?`, [resolved.id]);
              synced += 1;
            } else {
              await this.handleSyncError(original, new Error('Conflict without resolution data'));
              failed += 1;
              errors.push({
                task_id: original.task_id,
                operation: original.operation,
                error: 'Conflict without resolution data',
                timestamp: new Date(),
              });
            }
          } else {
            await this.handleSyncError(original, new Error(processed.error || 'Unknown error'));
            failed += 1;
            errors.push({
              task_id: original.task_id,
              operation: original.operation,
              error: processed.error || 'Unknown error',
              timestamp: new Date(),
            });
          }
        }
      } catch (err: any) {
        // Entire batch failed
        for (const item of batch) {
          await this.handleSyncError(item, err);
          failed += 1;
          errors.push({
            task_id: item.task_id,
            operation: item.operation,
            error: err?.message || 'Batch failed',
            timestamp: new Date(),
          });
        }
      }
    }

    return {
      success: failed === 0,
      synced_items: synced,
      failed_items: failed,
      errors,
    };
  }

  async addToSyncQueue(taskId: string, operation: 'create' | 'update' | 'delete', data: Partial<Task>): Promise<void> {
    const id = cryptoRandomId();
    await this.db.run(
      `INSERT INTO sync_queue (id, task_id, operation, data) VALUES (?, ?, ?, ?)`,
      [id, taskId, operation, JSON.stringify(data)]
    );
  }

  private async processBatch(items: SyncQueueItem[]): Promise<BatchSyncResponse> {
    const payload = {
      items: items.map((i) => ({
        ...i,
        data: i.data,
      })),
      client_timestamp: new Date(),
    };
    const { data } = await axios.post(`${this.apiUrl}/batch`, payload);
    return data as BatchSyncResponse;
  }

  private async resolveConflict(localTask: Task, serverTask: Task): Promise<Task> {
    const localUpdated = new Date(localTask.updated_at).getTime();
    const serverUpdated = new Date(serverTask.updated_at).getTime();
    const winner = localUpdated >= serverUpdated ? localTask : serverTask;
    return winner;
  }

  private async updateSyncStatus(taskId: string, status: 'synced' | 'error', serverData?: Partial<Task>): Promise<void> {
    if (status === 'synced') {
      await this.db.run(
        `UPDATE tasks SET sync_status = 'synced', server_id = COALESCE(?, server_id), last_synced_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [serverData?.server_id ?? null, taskId]
      );
      await this.db.run(`DELETE FROM sync_queue WHERE task_id = ?`, [taskId]);
    } else {
      await this.db.run(
        `UPDATE tasks SET sync_status = 'error' WHERE id = ?`,
        [taskId]
      );
    }
  }

  private async handleSyncError(item: SyncQueueItem, error: Error): Promise<void> {
    const newCount = (item.retry_count || 0) + 1;
    await this.db.run(
      `UPDATE sync_queue SET retry_count = ?, error_message = ? WHERE id = ?`,
      [newCount, error.message, item.id]
    );
    if (newCount >= 3) {
      await this.updateSyncStatus(item.task_id, 'error');
    }
  }

  async checkConnectivity(): Promise<boolean> {
    // TODO: Check if server is reachable
    // 1. Make a simple health check request
    // 2. Return true if successful, false otherwise
    try {
      await axios.get(`${this.apiUrl}/health`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

function cryptoRandomId(): string {
  // Lightweight unique id for queue items
  return 'qid_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}