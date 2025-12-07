import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Task } from '@shared/types';
import { cn } from '@/lib/utils';
interface TaskCardProps {
  task: Task;
  isOverlay?: boolean;
  onClick?: (task: Task) => void;
}
export function TaskCard({ task, isOverlay, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
  });
  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent click from firing when dragging
    if (isDragging) {
      e.preventDefault();
      return;
    }
    onClick?.(task);
  };
  return (
    <div ref={setNodeRef} style={style} className={cn("relative", isDragging && "opacity-50 z-50", isOverlay && "shadow-2xl")}>
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCardClick}
        className="cursor-pointer"
      >
        <Card className="group bg-card hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-3 relative">
            <p className="font-medium leading-snug pr-8 text-pretty">{task.title}</p>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                {task.estimate != null && (
                  <Badge variant="outline" className="font-mono text-xs">{task.estimate}h</Badge>
                )}
              </div>
              {task.assigneeId && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${task.assigneeId}`} />
                        <AvatarFallback>{task.assigneeId.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent><p>Assigned to user</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <button
              {...attributes}
              {...listeners}
              className="absolute top-1 right-1 p-2 text-muted-foreground/20 group-hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              onClick={(e) => e.stopPropagation()} // Prevent card click when grabbing handle
            >
              <GripVertical className="h-5 w-5" />
            </button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}