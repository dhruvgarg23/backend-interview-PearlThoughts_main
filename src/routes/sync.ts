import { Router, Request, Response } from 'express';
import { SyncService } from '../services/syncService';
import { TaskService } from '../services/taskService';
import { Database } from '../db/database';

export function createSyncRouter(db: Database): Router {
  const router = Router();
  const taskService = new TaskService(db);
  const syncService = new SyncService(db, taskService);

  // Trigger manual sync
  router.post('/sync', async (_req: Request, res: Response) => {
    try {
      const online = await syncService.checkConnectivity();
      if (!online) {
        res.status(503).json({ error: 'Server unreachable' });
        return;
      }
      const result = await syncService.sync();
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to sync' });
    }
  });

  // Check sync status
  router.get('/status', async (_req: Request, res: Response) => {
    try {
      const pending = await db.get(`SELECT COUNT(*) as cnt FROM tasks WHERE sync_status IN ('pending','error')`);
      const last = await db.get(`SELECT MAX(last_synced_at) as last FROM tasks`);
      const queueSize = await db.get(`SELECT COUNT(*) as cnt FROM sync_queue`);
      const online = await syncService.checkConnectivity();
      return res.json({
        pending_sync_count: pending?.cnt ?? 0,
        last_sync_timestamp: last?.last ? new Date(last.last).toISOString() : null,
        is_online: online,
        sync_queue_size: queueSize?.cnt ?? 0,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to get status' });
    }
  });

  // Batch sync endpoint (for server-side)
  router.post('/batch', async (_req: Request, res: Response) => {
    // Stub for local development; in real deployment, server handles this.
    return res.status(200).json({ processed_items: [] });
  });

  // Health check endpoint
  router.get('/health', async (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });

  return router;
}