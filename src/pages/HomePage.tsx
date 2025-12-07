import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LayoutGrid, Plus, CheckSquare, Clock } from 'lucide-react';
import type { ApiResponse, BoardSummary } from '@shared/types';
import { formatDistanceToNow } from 'date-fns';
async function fetchBoards(): Promise<BoardSummary[]> {
  const res = await fetch('/api/boards');
  if (!res.ok) throw new Error('Network response was not ok');
  const data: ApiResponse<BoardSummary[]> = await res.json();
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch boards');
  return data.data;
}
export function HomePage() {
  const { data: boards, isLoading, error } = useQuery({
    queryKey: ['boards'],
    queryFn: fetchBoards,
  });
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ThemeToggle className="fixed top-4 right-4" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16 md:py-24 lg:py-32 text-center">
          <div className="inline-block p-4 bg-gradient-to-r from-[#F38020] to-[#667EEA] rounded-2xl mb-8 animate-float">
            <LayoutGrid className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold text-balance leading-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            ForgeBoard
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            A developer-focused Kanban board designed for clarity and velocity. Built on Cloudflare.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Button size="lg" className="bg-[#F38020] hover:bg-[#F38020]/90 text-white font-semibold px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <Plus className="mr-2 h-5 w-5" />
              Create New Board
            </Button>
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
                <Link to={`/board/${board.id}`} key={board.id}>
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