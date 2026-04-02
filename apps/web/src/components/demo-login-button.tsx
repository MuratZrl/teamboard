'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Play } from 'lucide-react';

export function DemoLoginButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: 'demo@teamboard.dev',
        password: 'demo123456',
        isRegister: 'false',
        redirect: false,
      });

      if (result?.ok) {
        router.push('/workspaces');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDemoLogin}
      disabled={loading}
      className={className}
    >
      <Play className="w-4 h-4" />
      {loading ? 'Loading demo...' : 'Try Demo'}
    </button>
  );
}
