import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { KanbanBoard } from '@/components/board/KanbanBoard';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { ApiResponse, Board } from '@shared/types';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
async function fetchBoard(boardId: string): Promise<Board> {
  const res = await fetch(`/api/board/${boardId}`);
  if (!res.ok) throw new Error('Network response was not ok');
  const data: ApiResponse<Board> = await res.json();
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch board');
  return data.data;
}
export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { data: board, isLoading, error } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => fetchBoard(boardId!),
    enabled: !!boardId,
  });
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
      <header className="p-4 border-b shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <h1 className="text-2xl font-semibold">{board.title}</h1>
          </div>
          {/* Add filters and other controls here later */}
        </div>
      </header>
      <main className="flex-1 overflow-x-auto overflow-y-hidden">
        <KanbanBoard board={board} />
      </main>
    </div>
  );
}