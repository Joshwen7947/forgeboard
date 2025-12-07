import { SortableContext } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Plus, GripVertical, CheckSquare } from 'lucide-react';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskCard } from './TaskCard';
import type { Column as ColumnType, Task } from '@shared/types';
import { cn } from '@/lib/utils';
interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  onAddTask: () => void;
  onTaskClick: (task: Task) => void;
}
export function Column({ column, tasks, onAddTask, onTaskClick }: ColumnProps) {
  const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'Column', column },
  });
  return (
    <div ref={setNodeRef} className="w-80 flex-shrink-0 h-full flex flex-col">
      <Card className={cn("flex-1 flex flex-col bg-muted/50 transition-all duration-300", isOver && "bg-primary/10 ring-2 ring-primary/50")}>
        <CardHeader className="p-4 border-b flex-row justify-between items-center">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {column.title}
            <span className="text-sm font-normal bg-muted text-muted-foreground rounded-full px-2 py-0.5">
              {tasks.length}
            </span>
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onAddTask} className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-2 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <SortableContext items={taskIds}>
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
              ))}
            </SortableContext>
            {tasks.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-32 text-muted-foreground p-4 text-center"
              >
                <CheckSquare className="h-8 w-8 mb-2 text-muted-foreground/50" />
                <p className="text-sm font-medium">Empty column</p>
                <p className="text-xs">Drag tasks here or add a new one.</p>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}