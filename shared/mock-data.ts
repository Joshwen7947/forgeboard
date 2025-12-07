import type { Board, DemoItem } from './types';
import { v4 as uuidv4 } from 'uuid';
export const MOCK_USERS = [
  { id: 'user-1', name: 'Alex Johnson', avatarUrl: 'https://i.pravatar.cc/150?u=user-1' },
  { id: 'user-2', name: 'Maria Garcia', avatarUrl: 'https://i.pravatar.cc/150?u=user-2' },
  { id: 'user-3', name: 'James Smith', avatarUrl: 'https://i.pravatar.cc/150?u=user-3' },
];
export const MOCK_LABELS = [
  { id: 'label-1', name: 'Bug', color: '#ef4444' },
  { id: 'label-2', name: 'Feature', color: '#3b82f6' },
  { id: 'label-3', name: 'Docs', color: '#16a34a' },
  { id: 'label-4', name: 'UI', color: '#8b5cf6' },
];
const now = new Date();
export const MOCK_BOARD: Board = {
  id: 'board-1',
  title: 'Cloudflare Project X',
  users: MOCK_USERS,
  labels: MOCK_LABELS,
  columns: [
    { id: 'col-1', title: 'Backlog', taskIds: ['task-1', 'task-2'] },
    { id: 'col-2', title: 'In Progress', taskIds: ['task-3', 'task-4'] },
    { id: 'col-3', title: 'In Review', taskIds: ['task-5'] },
    { id: 'col-4', title: 'Done', taskIds: ['task-6'] },
  ],
  tasks: [
    { id: 'task-1', title: 'Setup CI/CD pipeline', status: 'col-1', order: 0, assigneeId: 'user-1', labelIds: ['label-2'], estimate: 8, createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 'task-2', title: 'Design database schema', status: 'col-1', order: 1, assigneeId: 'user-2', labelIds: ['label-2'], estimate: 5, createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 'task-3', title: 'Implement authentication service', description: 'Use JWT-based authentication with passwordless login.', status: 'col-2', order: 0, assigneeId: 'user-1', labelIds: ['label-2'], estimate: 13, createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 'task-4', title: 'Fix login button styling on mobile', status: 'col-2', order: 1, assigneeId: 'user-3', labelIds: ['label-1', 'label-4'], estimate: 2, createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 'task-5', title: 'Write API documentation for v1', status: 'col-3', order: 0, assigneeId: 'user-2', labelIds: ['label-3'], estimate: 8, createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 'task-6', title: 'Deploy staging environment', status: 'col-4', order: 0, assigneeId: 'user-1', labelIds: [], estimate: 3, createdAt: now.toISOString(), updatedAt: now.toISOString() },
  ],
};
// Keep demo items for now
export const MOCK_ITEMS: DemoItem[] = [
  { id: '1', name: 'Demo Item A', value: 42 },
  { id: '2', name: 'Demo Item B', value: 73 }
];