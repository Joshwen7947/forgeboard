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
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
  estimate: z.number().optional(),
}).strict(); // Disallow extra fields
export const moveTaskSchema = z.object({
  taskId: z.string(),
  fromColumnId: z.string(),
  toColumnId: z.string(),
  newIndex: z.number().min(0),
});
export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});
export const updateColumnSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
});
export const updateLabelsSchema = z.object({
  labels: z.array(z.object({
    id: z.string(),
    name: z.string(),
    color: z.string()
  }))
});