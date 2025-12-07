import { DurableObject } from "cloudflare:workers";
import type { DemoItem, Board, Task, BoardSummary, Presence, Label, UpdatedColumn, Comment, Column } from '@shared/types';
import { MOCK_ITEMS, MOCK_BOARD } from '@shared/mock-data';
import { v4 as uuidv4 } from 'uuid';
import { createBoardSchema, createTaskSchema, updateTaskSchema, moveTaskSchema, createCommentSchema } from '@shared/schemas';
// **DO NOT MODIFY THE CLASS NAME**
export class GlobalDurableObject extends DurableObject {
    // --- Board Methods ---
    async getBoards(): Promise<BoardSummary[]> {
        let boards: Board[] = await this.ctx.storage.get("boards") || [];
        if (boards.length === 0) {
            boards = [MOCK_BOARD];
            await this.ctx.storage.put("boards", boards);
        }
        return boards.map(b => ({
            id: b.id,
            title: b.title,
            taskCount: b.tasks.length,
            lastActivity: b.tasks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]?.updatedAt || new Date().toISOString(),
        }));
    }
    async getBoard(id: string): Promise<Board | undefined> {
        let boards: Board[] = await this.ctx.storage.get("boards") || [];
        if (boards.length === 0) {
            boards = [MOCK_BOARD];
            await this.ctx.storage.put("boards", boards);
        }
        return boards.find(b => b.id === id);
    }
    async createBoard(input: { title: string }): Promise<Board> {
        const validated = createBoardSchema.parse(input);
        const newBoard: Board = {
            id: `board-${uuidv4()}`,
            title: validated.title,
            columns: [
                { id: 'col-1', title: 'Backlog', taskIds: [] },
                { id: 'col-2', title: 'In Progress', taskIds: [] },
                { id: 'col-3', title: 'In Review', taskIds: [] },
                { id: 'col-4', title: 'Done', taskIds: [] },
            ],
            tasks: [],
            users: MOCK_BOARD.users, // Seed with mock users/labels for demo
            labels: MOCK_BOARD.labels,
        };
        let boards: Board[] = await this.ctx.storage.get("boards") || [];
        boards.push(newBoard);
        await this.ctx.storage.put("boards", boards);
        return newBoard;
    }
    async addTask(boardId: string, columnId: string, taskData: { title: string }): Promise<Board | undefined> {
        const validated = createTaskSchema.parse({ title: taskData.title, columnId });
        let boards: Board[] = await this.ctx.storage.get("boards") || [];
        const boardIndex = boards.findIndex(b => b.id === boardId);
        if (boardIndex === -1) return undefined;
        const board = boards[boardIndex];
        const column = board.columns.find(c => c.id === validated.columnId);
        if (!column) return undefined;
        const newTask: Task = {
            id: `task-${uuidv4()}`,
            title: validated.title,
            status: validated.columnId,
            order: column.taskIds.length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        board.tasks.push(newTask);
        column.taskIds.push(newTask.id);
        await this.ctx.storage.put("boards", boards);
        return board;
    }
    async updateTask(boardId: string, taskId: string, updates: Partial<Task>): Promise<Board | undefined> {
        const validatedUpdates = updateTaskSchema.parse(updates);
        let boards: Board[] = await this.ctx.storage.get("boards") || [];
        const boardIndex = boards.findIndex(b => b.id === boardId);
        if (boardIndex === -1) return undefined;
        const board = boards[boardIndex];
        const taskIndex = board.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return undefined;
        board.tasks[taskIndex] = { ...board.tasks[taskIndex], ...validatedUpdates, updatedAt: new Date().toISOString() };
        await this.ctx.storage.put("boards", boards);
        return board;
    }
    async moveTask(boardId: string, taskId: string, fromColumnId: string, toColumnId: string, newIndex: number): Promise<Board | undefined> {
        const validated = moveTaskSchema.parse({ taskId, fromColumnId, toColumnId, newIndex });
        let boards: Board[] = await this.ctx.storage.get("boards") || [];
        const boardIndex = boards.findIndex(b => b.id === boardId);
        if (boardIndex === -1) return undefined;
        const board = boards[boardIndex];
        const task = board.tasks.find(t => t.id === validated.taskId);
        if (!task) return undefined;
        const fromCol = board.columns.find(c => c.id === validated.fromColumnId);
        const toCol = board.columns.find(c => c.id === validated.toColumnId);
        if (!fromCol || !toCol) return undefined;
        const oldIndex = fromCol.taskIds.indexOf(validated.taskId);
        if (oldIndex > -1) {
            fromCol.taskIds.splice(oldIndex, 1);
        }
        toCol.taskIds.splice(validated.newIndex, 0, validated.taskId);
        task.status = validated.toColumnId;
        task.updatedAt = new Date().toISOString();
        board.columns.forEach(col => {
            col.taskIds.forEach((tid, index) => {
                const t = board.tasks.find(t => t.id === tid);
                if (t) t.order = index;
            });
        });
        await this.ctx.storage.put("boards", boards);
        return board;
    }
    async deleteTask(boardId: string, taskId: string): Promise<Board | undefined> {
        let boards: Board[] = await this.ctx.storage.get("boards") || [];
        const boardIndex = boards.findIndex(b => b.id === boardId);
        if (boardIndex === -1) return undefined;
        const board = boards[boardIndex];
        const task = board.tasks.find(t => t.id === taskId);
        if (!task) return undefined;
        board.tasks = board.tasks.filter(t => t.id !== taskId);
        const column = board.columns.find(c => c.id === task.status);
        if (column) {
            column.taskIds = column.taskIds.filter(id => id !== taskId);
        }
        await this.ctx.storage.put("boards", boards);
        return board;
    }
    async addComment(boardId: string, taskId: string, input: { content: string; authorId: string }): Promise<Board | undefined> {
        createCommentSchema.parse(input);
        let boards: Board[] = await this.ctx.storage.get("boards") || [];
        const boardIndex = boards.findIndex(b => b.id === boardId);
        if (boardIndex === -1) return undefined;
        const board = boards[boardIndex];
        const task = board.tasks.find(t => t.id === taskId);
        if (!task) return undefined;
        const newComment: Comment = {
            id: `comment-${uuidv4()}`,
            authorId: input.authorId,
            content: input.content,
            createdAt: new Date().toISOString(),
        };
        if (!task.comments) task.comments = [];
        task.comments.push(newComment);
        task.updatedAt = new Date().toISOString();
        await this.ctx.storage.put("boards", boards);
        return board;
    }
    async getPresence(boardId: string): Promise<Presence[]> {
        const board = await this.getBoard(boardId);
        if (!board) return [];
        // Mock presence: some users are online
        return board.users.map((user, index) => ({
            userId: user.id,
            isOnline: index % 2 === 0, // Mock every other user as online
            lastSeen: new Date().toISOString(),
        }));
    }
    async updateColumns(boardId: string, newColumns: Column[]): Promise<Board | undefined> {
        let boards: Board[] = await this.ctx.storage.get("boards") || [];
        const boardIndex = boards.findIndex(b => b.id === boardId);
        if (boardIndex === -1) return undefined;
        const board = boards[boardIndex];
        const oldColumns = board.columns;
        const newColumnIds = new Set(newColumns.map(c => c.id));
        const removedColumns = oldColumns.filter(c => !newColumnIds.has(c.id));
        if (removedColumns.length > 0 && board.columns.length > removedColumns.length) {
            const backlogColumn = board.columns.find(c => !newColumnIds.has(c.id)) || board.columns[0];
            if (backlogColumn) {
                for (const removedCol of removedColumns) {
                    for (const taskId of removedCol.taskIds) {
                        const task = board.tasks.find(t => t.id === taskId);
                        if (task) {
                            task.status = backlogColumn.id;
                            backlogColumn.taskIds.push(taskId);
                        }
                    }
                }
            }
        }
        board.columns = newColumns;
        board.columns.forEach(col => {
            col.taskIds.forEach((tid, index) => {
                const t = board.tasks.find(t => t.id === tid);
                if (t) t.order = index;
            });
        });
        await this.ctx.storage.put("boards", boards);
        return board;
    }
    async updateLabels(boardId: string, labels: Label[]): Promise<Board | undefined> {
        let boards: Board[] = await this.ctx.storage.get("boards") || [];
        const boardIndex = boards.findIndex(b => b.id === boardId);
        if (boardIndex === -1) return undefined;
        const board = boards[boardIndex];
        board.labels = labels;
        await this.ctx.storage.put("boards", boards);
        return board;
    }
    // --- Existing Demo/Counter Methods ---
    async getCounterValue(): Promise<number> {
      const value = (await this.ctx.storage.get("counter_value")) || 0;
      return value as number;
    }
    async increment(amount = 1): Promise<number> {
      let value: number = (await this.ctx.storage.get("counter_value")) || 0;
      value += amount;
      await this.ctx.storage.put("counter_value", value);
      return value;
    }
    async getDemoItems(): Promise<DemoItem[]> {
      const items = await this.ctx.storage.get("demo_items");
      if (items) {
        return items as DemoItem[];
      }
      await this.ctx.storage.put("demo_items", MOCK_ITEMS);
      return MOCK_ITEMS;
    }
}