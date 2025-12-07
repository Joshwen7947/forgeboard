import React, { useMemo, useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Column } from './Column';
import { TaskCard } from './TaskCard';
import type { Board, Column as ColumnType, Task } from '@shared/types';
interface KanbanBoardProps {
  board: Board;
}
async function moveTaskApi(payload: { boardId: string; taskId: string; fromColumnId: string; toColumnId: string; newIndex: number }) {
  const res = await fetch(`/api/board/${payload.boardId}/task/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to move task');
  return res.json();
}
export function KanbanBoard({ board }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const columns = useMemo(() => board.columns, [board.columns]);
  const columnIds = useMemo(() => columns.map((col) => col.id), [columns]);
  const tasks = useMemo(() => board.tasks, [board.tasks]);
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  }));
  const moveTaskMutation = useMutation({
    mutationFn: moveTaskApi,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['board', board.id] });
      const previousBoard = queryClient.getQueryData<Board>(['board', board.id]);
      queryClient.setQueryData<Board>(['board', board.id], (old) => {
        if (!old) return old;
        const newBoard = JSON.parse(JSON.stringify(old));
        const { taskId, fromColumnId, toColumnId, newIndex } = variables;
        const fromCol = newBoard.columns.find(c => c.id === fromColumnId);
        const toCol = newBoard.columns.find(c => c.id === toColumnId);
        const task = newBoard.tasks.find(t => t.id === taskId);
        if (!fromCol || !toCol || !task) return old;
        fromCol.taskIds = fromCol.taskIds.filter(id => id !== taskId);
        toCol.taskIds.splice(newIndex, 0, taskId);
        task.status = toColumnId;
        return newBoard;
      });
      return { previousBoard };
    },
    onError: (err, variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(['board', board.id], context.previousBoard);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board', board.id] });
    },
  });
  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
    }
  }
  function onDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;
    const isActiveATask = active.data.current?.type === 'Task';
    if (!isActiveATask) return;
    const taskId = active.id as string;
    const fromColumnId = active.data.current?.task.status as string;
    const isOverAColumn = over.data.current?.type === 'Column';
    const toColumnId = isOverAColumn ? over.id as string : over.data.current?.task.status as string;
    const fromColumn = board.columns.find(c => c.id === fromColumnId);
    const toColumn = board.columns.find(c => c.id === toColumnId);
    if (!fromColumn || !toColumn) return;
    const activeTaskIndex = fromColumn.taskIds.indexOf(taskId);
    let overTaskIndex = -1;
    if (over.data.current?.type === 'Task') {
      overTaskIndex = toColumn.taskIds.indexOf(over.id as string);
    } else {
      overTaskIndex = toColumn.taskIds.length;
    }
    moveTaskMutation.mutate({ boardId: board.id, taskId, fromColumnId, toColumnId, newIndex: overTaskIndex });
  }
  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full">
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-6 h-full items-start">
          <SortableContext items={columnIds}>
            {columns.map((col) => (
              <Column
                key={col.id}
                column={col}
                tasks={col.taskIds.map((taskId) => tasks.find((task) => task.id === taskId)!).filter(Boolean)}
                boardId={board.id}
              />
            ))}
          </SortableContext>
        </div>
        {createPortal(
          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} isOverlay />}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  );
}