import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { KanbanBoard } from '@/components/board/KanbanBoard';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BoardPresence } from '@/components/board/BoardPresence';
import type { ApiResponse, Board, Column } from '@shared/types';
import { ArrowLeft, Settings, Search, Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
async function fetchBoard(boardId: string): Promise<Board> {
  const res = await fetch(`/api/board/${boardId}`);
  if (!res.ok) throw new Error('Network response was not ok');
  const data: ApiResponse<Board> = await res.json();
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch board');
  return data.data;
}
async function updateColumnsApi({ boardId, columns }: { boardId: string; columns: Column[] }) {
    const res = await fetch(`/api/board/${boardId}/columns`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(columns),
    });
    if (!res.ok) throw new Error('Failed to update columns');
    return res.json();
}
const columnsFormSchema = z.object({
  columns: z.array(z.object({
    id: z.string(),
    title: z.string().min(1, "Title is required"),
    taskIds: z.array(z.string()),
  })),
});
type ColumnsFormValues = z.infer<typeof columnsFormSchema>;
export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [assignee, setAssignee] = useState<string | undefined>();
  const [label, setLabel] = useState<string | undefined>();
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const { data: board, isLoading, error } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => fetchBoard(boardId!),
    enabled: !!boardId,
  });
  const form = useForm<ColumnsFormValues>({
    resolver: zodResolver(columnsFormSchema),
    values: { columns: board?.columns || [] },
  });
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: "columns" });
  const updateColumnsMutation = useMutation({
    mutationFn: updateColumnsApi,
    onSuccess: () => {
      toast.success("Board columns updated!");
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setSettingsOpen(false);
    },
    onError: (err) => toast.error((err as Error).message),
  });
  const onSubmit = (data: ColumnsFormValues) => {
    updateColumnsMutation.mutate({ boardId: boardId!, columns: data.columns });
  };
  const filters = useMemo(() => ({ search, assignee, label }), [search, assignee, label]);
  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-4">
        <Skeleton className="h-10 w-1/4" />
        <div className="flex gap-6 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-80 flex-shrink-0 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (error) {
    return <div className="text-center text-destructive p-8">Error: {(error as Error).message}</div>;
  }
  if (!board) {
    return <div className="text-center p-8">Board not found.</div>;
  }
  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden">
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      <header className="p-4 border-b shrink-0 bg-card/80 backdrop-blur-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <h1 className="text-2xl font-semibold">{board.title}</h1>
            <BoardPresence boardId={board.id} users={board.users} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tasks..." className="pl-8 w-40" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={assignee} onValueChange={v => setAssignee(v === 'all' ? undefined : v)}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Assignees" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Assignees</SelectItem>{board.users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
            </Select>
            <Dialog open={isSettingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Settings className="h-4 w-4 mr-2" /> Board Settings</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader><DialogTitle>Board Settings</DialogTitle><DialogDescription>Manage your board's columns.</DialogDescription></DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2 mb-2">
                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                          <FormField control={form.control} name={`columns.${index}.title`} render={({ field }) => (
                            <FormItem className="flex-1"><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" type="button"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>Deleting this column will move its tasks to the first column. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => remove(index)}>Continue</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ id: `col-new-${uuidv4()}`, title: 'New Column', taskIds: [] })}>
                      <Plus className="h-4 w-4 mr-2" /> Add Column
                    </Button>
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setSettingsOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={updateColumnsMutation.isPending}>
                        {updateColumnsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-x-auto overflow-y-hidden">
        <KanbanBoard board={board} filters={filters} />
      </main>
    </div>
  );
}