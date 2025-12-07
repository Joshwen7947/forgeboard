import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';
import { X, User, Tag, CheckSquare, Loader2, Trash2, MessageSquare, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import type { Board, Task, ApiResponse, Label as LabelType } from '@shared/types';
import { updateTaskSchema, createCommentSchema } from '@shared/schemas';
interface TaskSheetProps {
  board: Board;
  task: Task;
  onClose: () => void;
  onDelete: (taskId: string) => void;
}
type UpdateTaskFormValues = z.infer<typeof updateTaskSchema>;
type CreateCommentFormValues = z.infer<typeof createCommentSchema>;
async function updateTaskApi({ boardId, taskId, updates }: { boardId: string; taskId: string; updates: UpdateTaskFormValues }) {
  const res = await fetch(`/api/board/${boardId}/task/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update task');
  const data: ApiResponse<Board> = await res.json();
  if (!data.success) throw new Error(data.error || 'API error updating task');
  return data.data;
}
async function addCommentApi({ boardId, taskId, content }: { boardId: string; taskId: string; content: string }) {
  const res = await fetch(`/api/board/${boardId}/task/${taskId}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error('Failed to add comment');
  const data: ApiResponse<Board> = await res.json();
  if (!data.success) throw new Error(data.error || 'API error adding comment');
  return data.data;
}
export function TaskSheet({ board, task, onClose, onDelete }: TaskSheetProps) {
  const queryClient = useQueryClient();
  useHotkeys('esc', onClose);
  const taskForm = useForm<UpdateTaskFormValues>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      title: task.title || '',
      description: task.description || '',
      assigneeId: task.assigneeId || undefined,
      labelIds: task.labelIds || [],
      estimate: task.estimate || undefined,
    },
  });
  const commentForm = useForm<CreateCommentFormValues>({
    resolver: zodResolver(createCommentSchema),
    defaultValues: { content: '' },
  });
  const updateMutation = useMutation({
    mutationFn: updateTaskApi,
    onSuccess: (data) => {
      toast.success('Task updated!');
      if (data) queryClient.setQueryData(['board', board.id], data);
    },
    onError: () => toast.error('Failed to update task.'),
  });
  const addCommentMutation = useMutation({
    mutationFn: addCommentApi,
    onSuccess: (data) => {
      if (data) queryClient.setQueryData(['board', board.id], data);
      commentForm.reset();
    },
    onError: (err, newComment, context) => {
      toast.error('Failed to add comment.');
      if (context) queryClient.setQueryData(['board', board.id], context);
    },
  });
  const onTaskSubmit = (data: UpdateTaskFormValues) => {
    updateMutation.mutate({ boardId: board.id, taskId: task.id, updates: data });
  };
  const onCommentSubmit = (data: CreateCommentFormValues) => {
    addCommentMutation.mutate({ boardId: board.id, taskId: task.id, content: data.content });
  };
  const getUserById = (userId: string) => board.users.find(u => u.id === userId);
  return (
    <Sheet open={!!task} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl flex flex-col sm:w-[500px]">
        <SheetHeader className="pr-12">
          <SheetTitle>Task Details</SheetTitle>
          <SheetDescription>Edit details and collaborate with your team.</SheetDescription>
        </SheetHeader>
        <Separator />
        <div className="flex-1 overflow-y-auto py-4 pr-2">
          <Form {...taskForm}>
            <form id="task-form" onSubmit={taskForm.handleSubmit(onTaskSubmit)} className="space-y-6 px-1">
              <FormField control={taskForm.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={taskForm.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Markdown supported)</FormLabel>
                  <FormControl><Textarea {...field} rows={5} /></FormControl>
                  <div className="prose prose-sm dark:prose-invert max-w-none p-2 border rounded-md bg-muted/50 min-h-[50px] mt-2">
                    <ReactMarkdown>{taskForm.watch('description') || 'Description preview...'}</ReactMarkdown>
                  </div>
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={taskForm.control} name="assigneeId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><User className="w-4 h-4" /> Assignee</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="unassigned">Unassigned</SelectItem>{board.users.map(user => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={taskForm.control} name="labelIds" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Tag className="w-4 h-4" /> Labels</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal">
                        {field.value?.length > 0 ? field.value.map(id => <Badge key={id} className="mr-1" style={{ backgroundColor: board.labels.find(l=>l.id===id)?.color }}>{board.labels.find(l=>l.id===id)?.name}</Badge>) : "Select labels"}
                      </Button></PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <div className="space-y-2 p-2">
                          {board.labels.map(label => (
                            <div key={label.id} className="flex items-center space-x-2">
                              <Checkbox id={label.id} checked={field.value?.includes(label.id)} onCheckedChange={(checked) => {
                                return checked ? field.onChange([...(field.value || []), label.id]) : field.onChange(field.value?.filter(id => id !== label.id));
                              }} />
                              <Label htmlFor={label.id} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: label.color }} /> {label.name}</Label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )} />
              </div>
            </form>
          </Form>
          <Separator className="my-6" />
          <Accordion type="single" collapsible defaultValue="comments" className="w-full">
            <AccordionItem value="comments">
              <AccordionTrigger><h3 className="font-semibold flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Activity</h3></AccordionTrigger>
              <AccordionContent className="px-1 space-y-4">
                <Form {...commentForm}>
                  <form onSubmit={commentForm.handleSubmit(onCommentSubmit)} className="flex items-start gap-2">
                    <Avatar className="h-8 w-8 mt-1"><AvatarImage src={getUserById('user-1')?.avatarUrl} /><AvatarFallback>ME</AvatarFallback></Avatar>
                    <div className="flex-1">
                      <FormField control={commentForm.control} name="content" render={({ field }) => (
                        <FormItem><FormControl><Textarea placeholder="Add a comment..." {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <Button type="submit" size="sm" className="mt-2" disabled={addCommentMutation.isPending}>
                        {addCommentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Comment
                      </Button>
                    </div>
                  </form>
                </Form>
                <div className="space-y-4">
                  {task.comments?.slice().reverse().map((comment, i) => {
                    const author = getUserById(comment.authorId);
                    return (
                      <motion.div key={comment.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8"><AvatarImage src={author?.avatarUrl} /><AvatarFallback>{author?.name?.charAt(0)}</AvatarFallback></Avatar>
                          <div>
                            <div className="flex items-center gap-2"><p className="font-semibold text-sm">{author?.name}</p><p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</p></div>
                            <div className="prose prose-sm dark:prose-invert max-w-none p-2 border rounded-md bg-muted/50 mt-1"><ReactMarkdown>{comment.content}</ReactMarkdown></div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="history">
              <AccordionTrigger><h3 className="font-semibold flex items-center gap-2"><History className="w-5 h-5" /> History</h3></AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground text-center p-4">History and activity log coming soon.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <SheetFooter className="mt-auto">
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="destructive" className="mr-auto"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the task.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(task.id)}>Continue</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="task-form" disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}