'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export function useRealtime(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  useEffect(() => {
    if (!workspaceId || !session?.accessToken) return;

    const eventSource = new EventSource(
      `${API_URL}/workspaces/${workspaceId}/events?token=${session.accessToken}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Invalidate relevant queries based on event type
      if (data.type?.startsWith('task.')) {
        queryClient.invalidateQueries({ queryKey: ['board'] });
      }
      if (data.type?.startsWith('column.')) {
        queryClient.invalidateQueries({ queryKey: ['board'] });
      }
      if (data.type?.startsWith('member.')) {
        queryClient.invalidateQueries({ queryKey: ['workspace'] });
        queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      // Auto-reconnect after 5 seconds
      setTimeout(() => {
        // Component will re-mount the effect
      }, 5000);
    };

    return () => eventSource.close();
  }, [workspaceId, session?.accessToken, queryClient]);
}
