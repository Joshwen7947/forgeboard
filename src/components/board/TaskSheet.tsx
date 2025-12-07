import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { X, User, Tag, CheckSquare, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { Board, Task } from '@shared/types';
import { updateTaskSchema } from '@shared/schemas';
interface TaskSheetProps {
  board: Board;
  task: Task;
  onClose: () => void;
  onDelete: (taskId: string) => void;
}
type UpdateTaskFormValues = z.infer<typeof updateTaskSchema>;
async function updateTaskApi({ boardId, taskId, updates }: { boardId: string; taskId: string; updates: UpdateTaskFormValues }) {
  const res = await fetch(`/api/board/${boardId}/task/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}
export function TaskSheet({ board, task, onClose, onDelete }: TaskSheetProps) {
  const queryClient = useQueryClient();
  const form = useForm<UpdateTaskFormValues>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      title: task.title || '',
      description: task.description || '',
      assigneeId: task.assigneeId || undefined,
      labelIds: task.labelIds || [],
      estimate: task.estimate || undefined,
    },
  });
  const updateMutation = useMutation({
    mutationFn: updateTaskApi,
    onSuccess: () => {
      toast.success('Task updated!');
      queryClient.invalidateQueries({ queryKey: ['board', board.id] });
      onClose();
    },
    onError: () => toast.error('Failed to update task.'),
  });
  const onSubmit = (data: UpdateTaskFormValues) => {
    updateMutation.mutate({ boardId: board.id, taskId: task.id, updates: data });
  };
  return (
    <Sheet open={!!task} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader className="pr-12">
          <SheetTitle>Task Details</SheetTitle>
          <SheetDescription>Edit task details below. Click save when you're done.</SheetDescription>
        </SheetHeader>
        <Separator />
        <div className="flex-1 overflow-y-auto py-4">
          <Form {...form}>
            <form id="task-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-1">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Markdown supported)</FormLabel>
                  <FormControl><Textarea {...field} rows={5} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="prose prose-sm dark:prose-invert max-w-none p-2 border rounded-md bg-muted/50 min-h-[50px]">
                <ReactMarkdown>{form.watch('description') || 'Description preview...'}</ReactMarkdown>
              </div>
              <FormField control={form.control} name="assigneeId" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><User className="w-4 h-4" /> Assignee</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {board.users.map(user => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </form>
          </Form>
        </div>
        <SheetFooter className="mt-auto">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="mr-auto"><Trash2 className="w-4 h-4" /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone. This will permanently delete the task.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(task.id)}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="task-form" disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}