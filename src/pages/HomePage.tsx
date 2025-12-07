import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { LayoutGrid, Plus, CheckSquare, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { ApiResponse, BoardSummary, Board } from '@shared/types';
import { createBoardSchema } from '@shared/schemas';
import { z } from 'zod';
async function fetchBoards(): Promise<BoardSummary[]> {
  const res = await fetch('/api/boards');
  if (!res.ok) throw new Error('Network response was not ok');
  const data: ApiResponse<BoardSummary[]> = await res.json();
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch boards');
  return data.data;
}
async function createBoard(title: string): Promise<ApiResponse<Board>> {
    const res = await fetch('/api/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error('Failed to create board');
    return res.json();
}
type CreateBoardFormValues = z.infer<typeof createBoardSchema>;
export function HomePage() {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: boards, isLoading, error } = useQuery({
    queryKey: ['boards'],
    queryFn: fetchBoards,
  });
  const form = useForm<CreateBoardFormValues>({
    resolver: zodResolver(createBoardSchema),
    defaultValues: { title: '' },
  });
  const createMutation = useMutation({
    mutationFn: createBoard,
    onSuccess: (response) => {
      if (response.success && response.data) {
        queryClient.invalidateQueries({ queryKey: ['boards'] });
        toast.success('Board created successfully!');
        form.reset();
        setCreateDialogOpen(false);
        navigate(`/board/${response.data.id}`);
      } else {
        toast.error(response.error || 'Failed to create board.');
      }
    },
    onError: (err) => {
      toast.error((err as Error).message || 'An unexpected error occurred.');
    },
  });
  const onSubmit = (data: CreateBoardFormValues) => {
    createMutation.mutate(data.title);
  };
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16 md:py-24 lg:py-32 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="inline-block p-4 bg-gradient-to-r from-[#F38020] to-[#667EEA] rounded-2xl mb-8"
          >
            <LayoutGrid className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-display font-bold text-balance leading-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            ForgeBoard
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            A developer-focused Kanban board designed for clarity and velocity. Built on Cloudflare.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-[#F38020] hover:bg-[#F38020]/90 text-white font-semibold px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <Plus className="mr-2 h-5 w-5" />
                  Create New Board
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create a new board</DialogTitle>
                  <DialogDescription>Give your new board a title to get started.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Board Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Q3 Project Launch" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={createMutation.isPending}>
                        {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Board
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="pb-16 md:pb-24 lg:pb-32">
          <h2 className="text-3xl font-semibold tracking-tight text-center mb-10">Your Boards</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          ) : error ? (
            <div className="text-center text-destructive">Error: {(error as Error).message}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {boards?.map((board) => (
                <Link to={`/board/${board.id}`} key={board.id} className="outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl">
                  <Card className="hover:shadow-xl hover:-translate-y-2 transition-all duration-300 ease-in-out h-full flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-2xl font-semibold">{board.title}</CardTitle>
                      <CardDescription>Click to view board</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow" />
                    <CardFooter className="flex justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4" />
                        <span>{board.taskCount} tasks</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{formatDistanceToNow(new Date(board.lastActivity), { addSuffix: true })}</span>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <footer className="text-center py-8 text-muted-foreground/80">
        <p>Built with ❤️ at Cloudflare</p>
      </footer>
    </div>
  );
}