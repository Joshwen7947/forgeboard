import { Hono } from "hono";
import { Env } from './core-utils';
import type { DemoItem, ApiResponse, BoardSummary, Board, Task } from '@shared/types';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    // --- Board Routes ---
    app.get('/api/boards', async (c) => {
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.getBoards();
        return c.json({ success: true, data } satisfies ApiResponse<BoardSummary[]>);
    });
    app.get('/api/board/:id', async (c) => {
        const { id } = c.req.param();
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.getBoard(id);
        if (!data) {
            return c.json({ success: false, error: 'Board not found' }, 404);
        }
        return c.json({ success: true, data } satisfies ApiResponse<Board>);
    });
    // --- Task Routes ---
    app.post('/api/board/:boardId/task', async (c) => {
        const { boardId } = c.req.param();
        const { title, columnId } = await c.req.json<{ title: string, columnId: string }>();
        if (!title || !columnId) {
            return c.json({ success: false, error: 'Title and columnId are required' }, 400);
        }
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.addTask(boardId, columnId, { title });
        return c.json({ success: true, data } satisfies ApiResponse<Board>);
    });
    app.put('/api/board/:boardId/task/:taskId', async (c) => {
        const { boardId, taskId } = c.req.param();
        const updates = await c.req.json<Partial<Task>>();
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.updateTask(boardId, taskId, updates);
        return c.json({ success: true, data } satisfies ApiResponse<Board>);
    });
    app.post('/api/board/:boardId/task/move', async (c) => {
        const { boardId } = c.req.param();
        const { taskId, fromColumnId, toColumnId, newIndex } = await c.req.json<{ taskId: string, fromColumnId: string, toColumnId: string, newIndex: number }>();
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.moveTask(boardId, taskId, fromColumnId, toColumnId, newIndex);
        return c.json({ success: true, data } satisfies ApiResponse<Board>);
    });
    app.delete('/api/board/:boardId/task/:taskId', async (c) => {
        const { boardId, taskId } = c.req.param();
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.deleteTask(boardId, taskId);
        return c.json({ success: true, data } satisfies ApiResponse<Board>);
    });
    // --- Existing Demo Routes ---
    app.get('/api/test', (c) => c.json({ success: true, data: { name: 'CF Workers Demo' }}));
    app.get('/api/demo', async (c) => {
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.getDemoItems();
        return c.json({ success: true, data } satisfies ApiResponse<DemoItem[]>);
    });
    app.get('/api/counter', async (c) => {
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.getCounterValue();
        return c.json({ success: true, data } satisfies ApiResponse<number>);
    });
    app.post('/api/counter/increment', async (c) => {
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.increment();
        return c.json({ success: true, data } satisfies ApiResponse<number>);
    });
}