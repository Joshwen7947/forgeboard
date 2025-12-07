import { DurableObject } from "cloudflare:workers";
import type { DemoItem, Board, Task, BoardSummary } from '@shared/types';
import { MOCK_ITEMS, MOCK_BOARD } from '@shared/mock-data';
import { v4 as uuidv4 } from 'uuid';
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
            lastActivity: b.tasks[0]?.updatedAt || new Date().toISOString(),
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
    async addTask(boardId: string, columnId: string, taskData: { title: string }): Promise<Board | undefined> {
        let boards: Board[] = await this.ctx.storage.get("boards") || [];
        const boardIndex = boards.findIndex(b => b.id === boardId);
        if (boardIndex === -1) return undefined;
        const board = boards[boardIndex];
        const column = board.columns.find(c => c.id === columnId);
        if (!column) return undefined;
        const newTask: Task = {
            id: `task-${uuidv4()}`,
            title: taskData.title,
            status: columnId,
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
        let boards: Board[] = await this.ctx.storage.get("boards") || [];
        const boardIndex = boards.findIndex(b => b.id === boardId);
        if (boardIndex === -1) return undefined;
        const board = boards[boardIndex];
        const taskIndex = board.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return undefined;
        board.tasks[taskIndex] = { ...board.tasks[taskIndex], ...updates, updatedAt: new Date().toISOString() };
        await this.ctx.storage.put("boards", boards);
        return board;
    }
    async moveTask(boardId: string, taskId: string, fromColumnId: string, toColumnId: string, newIndex: number): Promise<Board | undefined> {
        let boards: Board[] = await this.ctx.storage.get("boards") || [];
        const boardIndex = boards.findIndex(b => b.id === boardId);
        if (boardIndex === -1) return undefined;
        const board = boards[boardIndex];
        const task = board.tasks.find(t => t.id === taskId);
        if (!task) return undefined;
        const fromCol = board.columns.find(c => c.id === fromColumnId);
        const toCol = board.columns.find(c => c.id === toColumnId);
        if (!fromCol || !toCol) return undefined;
        // Remove from old column
        const oldIndex = fromCol.taskIds.indexOf(taskId);
        if (oldIndex > -1) {
            fromCol.taskIds.splice(oldIndex, 1);
        }
        // Add to new column
        toCol.taskIds.splice(newIndex, 0, taskId);
        // Update task status
        task.status = toColumnId;
        task.updatedAt = new Date().toISOString();
        // Re-order tasks in the target column
        toCol.taskIds.forEach((tid, index) => {
            const t = board.tasks.find(t => t.id === tid);
            if (t) t.order = index;
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
        // Remove task from tasks array
        board.tasks = board.tasks.filter(t => t.id !== taskId);
        // Remove taskId from its column
        const column = board.columns.find(c => c.id === task.status);
        if (column) {
            column.taskIds = column.taskIds.filter(id => id !== taskId);
        }
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