import { Hono } from "hono";
import { Env } from './core-utils';
import type { DemoItem, ApiResponse, BoardSummary, Board, Task, Presence, Label } from '@shared/types';
import { z } from 'zod';
import { createBoardSchema, createTaskSchema, updateTaskSchema, moveTaskSchema, createCommentSchema, updateColumnSchema, updateLabelsSchema } from '@shared/schemas';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    // --- Board Routes ---
    app.get('/api/boards', async (c) => {
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.getBoards();
        return c.json({ success: true, data } satisfies ApiResponse<BoardSummary[]>);
    });
    app.post('/api/board', async (c) => {
        try {
            const body = createBoardSchema.parse(await c.req.json());
            const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
            const data = await stub.createBoard(body);
            return c.json({ success: true, data } satisfies ApiResponse<Board>);
        } catch (e) {
            if (e instanceof z.ZodError) return c.json({ success: false, error: e.format() }, 400);
            console.error(e);
            return c.json({ success: false, error: 'Failed to create board' }, 500);
        }
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
    app.put('/api/board/:boardId/columns', async (c) => {
        try {
            const { boardId } = c.req.param();
            const body = z.array(updateColumnSchema).parse(await c.req.json());
            const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
            const data = await stub.updateColumns(boardId, body);
            return c.json({ success: true, data } satisfies ApiResponse<Board>);
        } catch (e) {
            if (e instanceof z.ZodError) return c.json({ success: false, error: e.format() }, 400);
            console.error(e);
            return c.json({ success: false, error: 'Failed to update columns' }, 500);
        }
    });
    app.put('/api/board/:boardId/labels', async (c) => {
        try {
            const { boardId } = c.req.param();
            const body = updateLabelsSchema.parse(await c.req.json());
            const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
            const data = await stub.updateLabels(boardId, body.labels);
            return c.json({ success: true, data } satisfies ApiResponse<Board>);
        } catch (e) {
            if (e instanceof z.ZodError) return c.json({ success: false, error: e.format() }, 400);
            console.error(e);
            return c.json({ success: false, error: 'Failed to update labels' }, 500);
        }
    });
    // --- Task Routes ---
    app.post('/api/board/:boardId/task', async (c) => {
        try {
            const { boardId } = c.req.param();
            const body = createTaskSchema.parse(await c.req.json());
            const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
            const data = await stub.addTask(boardId, body.columnId, { title: body.title });
            return c.json({ success: true, data } satisfies ApiResponse<Board>);
        } catch (e) {
            if (e instanceof z.ZodError) return c.json({ success: false, error: e.format() }, 400);
            console.error(e);
            return c.json({ success: false, error: 'Failed to create task' }, 500);
        }
    });
    app.put('/api/board/:boardId/task/:taskId', async (c) => {
        try {
            const { boardId, taskId } = c.req.param();
            const updates = updateTaskSchema.parse(await c.req.json());
            const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
            const data = await stub.updateTask(boardId, taskId, updates);
            return c.json({ success: true, data } satisfies ApiResponse<Board>);
        } catch (e) {
            if (e instanceof z.ZodError) return c.json({ success: false, error: e.format() }, 400);
            console.error(e);
            return c.json({ success: false, error: 'Failed to update task' }, 500);
        }
    });
    app.post('/api/board/:boardId/task/move', async (c) => {
        try {
            const { boardId } = c.req.param();
            const payload = moveTaskSchema.parse(await c.req.json());
            const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
            const data = await stub.moveTask(boardId, payload.taskId, payload.fromColumnId, payload.toColumnId, payload.newIndex);
            return c.json({ success: true, data } satisfies ApiResponse<Board>);
        } catch (e) {
            if (e instanceof z.ZodError) return c.json({ success: false, error: e.format() }, 400);
            console.error(e);
            return c.json({ success: false, error: 'Failed to move task' }, 500);
        }
    });
    app.delete('/api/board/:boardId/task/:taskId', async (c) => {
        const { boardId, taskId } = c.req.param();
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.deleteTask(boardId, taskId);
        return c.json({ success: true, data } satisfies ApiResponse<Board>);
    });
    app.post('/api/board/:boardId/task/:taskId/comment', async (c) => {
        try {
            const { boardId, taskId } = c.req.param();
            const body = createCommentSchema.parse(await c.req.json());
            const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
            // In a real app, authorId would come from auth context
            const data = await stub.addComment(boardId, taskId, { content: body.content, authorId: 'user-1' });
            return c.json({ success: true, data } satisfies ApiResponse<Board>);
        } catch (e) {
            if (e instanceof z.ZodError) return c.json({ success: false, error: e.format() }, 400);
            console.error(e);
            return c.json({ success: false, error: 'Failed to add comment' }, 500);
        }
    });
    // --- Collaboration Routes ---
    app.get('/api/board/:boardId/presence', async (c) => {
        const { boardId } = c.req.param();
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.getPresence(boardId);
        return c.json({ success: true, data } satisfies ApiResponse<Presence[]>);
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