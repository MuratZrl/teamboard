'use client';

import { useSession } from 'next-auth/react';
import { useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export function useApi() {
  const { data: session } = useSession();

  const fetcher = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const res = await fetch(`${API_URL}/${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(session?.accessToken && {
            Authorization: `Bearer ${session.accessToken}`,
          }),
          ...options.headers,
        },
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || `API error: ${res.status}`);
      }

      return res.json();
    },
    [session?.accessToken],
  );

  return { fetcher, token: session?.accessToken };
}
