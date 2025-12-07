export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
}
export interface Label {
  id: string;
  name: string;
  color: string;
}
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string; // This will be the columnId
  assigneeId?: string;
  labelIds?: string[];
  estimate?: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}
export interface Column {
  id: string;
  title: string;
  taskIds: string[];
}
export interface Board {
  id:string;
  title: string;
  columns: Column[];
  tasks: Task[];
  users: User[];
  labels: Label[];
}
export interface BoardSummary {
  id: string;
  title: string;
  taskCount: number;
  lastActivity: string;
}
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
// Keep demo types for now to avoid breaking existing demo page
export interface DemoItem {
  id: string;
  name: string;
  value: number;
}