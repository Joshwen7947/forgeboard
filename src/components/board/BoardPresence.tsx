import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ApiResponse, Presence, User } from '@shared/types';
async function fetchPresence(boardId: string): Promise<Presence[]> {
  const res = await fetch(`/api/board/${boardId}/presence`);
  if (!res.ok) throw new Error('Failed to fetch presence');
  const data: ApiResponse<Presence[]> = await res.json();
  if (!data.success || !data.data) throw new Error(data.error || 'API error fetching presence');
  return data.data;
}
interface BoardPresenceProps {
  boardId: string;
  users: User[];
}
export function BoardPresence({ boardId, users }: BoardPresenceProps) {
  const { data: presence } = useQuery({
    queryKey: ['presence', boardId],
    queryFn: () => fetchPresence(boardId),
    refetchInterval: 10000, // Poll every 10 seconds
  });
  const getUserById = (userId: string) => users.find(u => u.id === userId);
  return (
    <div className="flex items-center -space-x-2">
      <TooltipProvider>
        {presence?.map((p, index) => {
          const user = getUserById(p.userId);
          if (!user) return null;
          return (
            <motion.div
              key={p.userId}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Avatar className="h-8 w-8 border-2 border-background">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {p.isOnline && (
                      <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{user.name} - {p.isOnline ? 'Online' : 'Offline'}</p>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          );
        })}
      </TooltipProvider>
    </div>
  );
}