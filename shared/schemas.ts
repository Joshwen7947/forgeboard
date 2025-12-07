import { z } from 'zod';
export const createBoardSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
});
export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  columnId: z.string(),
});
export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  labelIds: z.array(z.string()).optional(),
  estimate: z.number().optional().nullable(),
}).strict(); // Disallow extra fields
export const moveTaskSchema = z.object({
  taskId: z.string(),
  fromColumnId: z.string(),
  toColumnId: z.string(),
  newIndex: z.number().min(0),
});