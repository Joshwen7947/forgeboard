import { useSortable, SortableContext } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskCard } from './TaskCard';
import type { Column as ColumnType, Task } from '@shared/types';
import { cn } from '@/lib/utils';
interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  boardId: string;
}
export function Column({ column, tasks }: ColumnProps) {
  const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'Column', column },
  });
  return (
    <div ref={setNodeRef} className={cn("w-80 flex-shrink-0 h-full flex flex-col", isOver && "ring-2 ring-offset-2 ring-primary rounded-lg")}>
      <Card className="flex-1 flex flex-col bg-muted/50">
        <CardHeader className="p-4 border-b flex-row justify-between items-center">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {column.title}
            <span className="text-sm font-normal bg-muted text-muted-foreground rounded-full px-2 py-0.5">
              {tasks.length}
            </span>
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-2 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <SortableContext items={taskIds}>
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </SortableContext>
            {tasks.length === 0 && (
              <div className="text-center text-muted-foreground p-4">
                <p>No tasks yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}