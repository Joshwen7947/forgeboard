import { useState, useEffect } from 'react';
import { ArrowLeft, Database, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import type { ApiResponse, Board } from '@shared/types';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AppLayout } from '@/components/layout/AppLayout';
export function DemoPage() {
  const [boardData, setBoardData] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchBoardData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/board/board-1');
      const data: ApiResponse<Board> = await res.json();
      if (data.success && data.data) {
        setBoardData(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch board data", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchBoardData();
  }, []);
  return (
    <AppLayout>
      <main className="min-h-screen bg-background p-6">
        <ThemeToggle />
        <div className="max-w-4xl mx-auto space-y-6">
          <header className="space-y-2">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Admin / Debug Panel</h1>
            <p className="text-muted-foreground">View raw Durable Object state and trigger actions.</p>
          </header>
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-500" />
                  Board State (board-1)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={fetchBoardData} disabled={loading}>
                  {loading ? 'Loading...' : 'Refresh Board Data'}
                </Button>
                <pre className="mt-4 p-4 bg-muted rounded-md text-sm overflow-x-auto">
                  {JSON.stringify(boardData, null, 2)}
                </pre>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-green-500" />
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  More debug actions can be added here.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}