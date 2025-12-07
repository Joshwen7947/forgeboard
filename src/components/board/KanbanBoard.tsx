import React, { useMemo, useState, useCallback } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useHotkeys } from 'react-hotkeys-hook';
import { Column } from './Column';
import { TaskCard } from './TaskCard';
import { TaskSheet } from './TaskSheet';
import type { Board, Task, ApiResponse } from '@shared/types';
async function moveTaskApi(payload: { boardId: string; taskId: string; fromColumnId: string; toColumnId: string; newIndex: number }) {
  const res = await fetch(`/api/board/${payload.boardId}/task/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to move task');
  const data: ApiResponse<Board> = await res.json();
  if (!data.success) throw new Error(data.error || 'API error moving task');
  return data.data;
}
async function deleteTaskApi({ boardId, taskId }: { boardId: string; taskId: string }) {
    const res = await fetch(`/api/board/${boardId}/task/${taskId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete task');
    const data: ApiResponse<Board> = await res.json();
    if (!data.success) throw new Error(data.error || 'API error deleting task');
    return data.data;
}
async function addTaskApi({ boardId, columnId, title }: { boardId: string; columnId: string; title: string }) {
    const res = await fetch(`/api/board/${boardId}/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId, title }),
    });
    if (!res.ok) throw new Error('Failed to add task');
    const data: ApiResponse<Board> = await res.json();
    if (!data.success) throw new Error(data.error || 'API error adding task');
    return data.data;
}
export function KanbanBoard({ board }: { board: Board }) {
  const queryClient = useQueryClient();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const columns = useMemo(() => board.columns, [board.columns]);
  const columnIds = useMemo(() => columns.map((col) => col.id), [columns]);
  const tasks = useMemo(() => board.tasks, [board.tasks]);
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 10 },
  }));
  const handleOptimisticUpdate = useCallback((updatedBoard: Board) => {
      queryClient.setQueryData(['board', board.id], updatedBoard);
  }, [queryClient, board.id]);
  const mutationOptions = useMemo(() => ({
    onSuccess: (data: Board | undefined) => {
        if (data) {
            handleOptimisticUpdate(data);
        }
    },
    onError: (err: Error) => {
        toast.error(err.message);
        queryClient.invalidateQueries({ queryKey: ['board', board.id] });
    },
  }), [handleOptimisticUpdate, queryClient, board.id]);
  const moveTaskMutation = useMutation({ mutationFn: moveTaskApi, ...mutationOptions });
  const addTaskMutation = useMutation({ mutationFn: addTaskApi, ...mutationOptions });
  const deleteTaskMutation = useMutation({ mutationFn: deleteTaskApi, ...mutationOptions });
  const onDragStart = useCallback((event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
    }
  }, []);
  const onDragEnd = useCallback((event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const isActiveATask = active.data.current?.type === 'Task';
    if (!isActiveATask) return;
    const taskId = active.id as string;
    const fromColumnId = active.data.current?.task.status as string;
    const isOverAColumn = over.data.current?.type === 'Column';
    const toColumnId = isOverAColumn ? over.id as string : over.data.current?.task.status as string;
    const toColumn = board.columns.find(c => c.id === toColumnId);
    if (!toColumn) return;
    let newIndex;
    if (over.data.current?.type === 'Task') {
        newIndex = toColumn.taskIds.indexOf(over.id as string);
    } else {
        newIndex = toColumn.taskIds.length;
    }
    moveTaskMutation.mutate({ boardId: board.id, taskId, fromColumnId, toColumnId, newIndex });
  }, [board.id, board.columns, moveTaskMutation]);
  const handleAddTask = useCallback((columnId: string) => {
      addTaskMutation.mutate({ boardId: board.id, columnId, title: "New Task" }, {
          onSuccess: (data) => {
              if (data) {
                  const newTask = data.tasks.find(t => !board.tasks.some(bt => bt.id === t.id));
                  if (newTask) setSelectedTask(newTask);
                  handleOptimisticUpdate(data);
              }
          }
      });
  }, [addTaskMutation, board.id, board.tasks, handleOptimisticUpdate]);
  const handleDeleteTask = useCallback((taskId: string) => {
      setSelectedTask(null);
      deleteTaskMutation.mutate({ boardId: board.id, taskId }, {
          onSuccess: (data) => {
              if (data) handleOptimisticUpdate(data);
              toast.success("Task deleted");
          }
      });
  }, [deleteTaskMutation, board.id, handleOptimisticUpdate]);
  const onTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
  }, []);
  useHotkeys('n', () => handleAddTask(board.columns[0].id), [board.columns, handleAddTask]);
  useHotkeys('esc', () => setSelectedTask(null), []);
  useHotkeys('delete', () => {
    if (selectedTask) {
      handleDeleteTask(selectedTask.id);
    }
  }, [selectedTask, handleDeleteTask]);
  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full">
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-6 h-full items-start overflow-x-auto">
          <SortableContext items={columnIds}>
            {columns.map((col) => (
              <Column
                key={col.id}
                column={col}
                tasks={col.taskIds.map((taskId) => tasks.find((task) => task.id === taskId)!).filter(Boolean)}
                onTaskClick={onTaskClick}
                onAddTask={() => handleAddTask(col.id)}
              />
            ))}
          </SortableContext>
        </div>
        {createPortal(
          <DragOverlay>{activeTask && <TaskCard task={activeTask} isOverlay />}</DragOverlay>,
          document.body
        )}
      </DndContext>
      {selectedTask && (
        <TaskSheet
          board={board}
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}