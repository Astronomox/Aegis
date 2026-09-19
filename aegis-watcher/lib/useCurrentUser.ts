'use client';

import { useEffect, useState } from 'react';
import { supabase, MOCK_MODE } from '@/lib/supabase';

interface CurrentUser {
  id: string;
  email: string;
}

const MOCK_USER: CurrentUser = { id: 'mock-watcher-001', email: 'watcher@aegis.demo' };

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (MOCK_MODE) {
      setUser(MOCK_USER);
      setLoading(false);
      return;
    }

    supabase!.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email ?? '' });
      }
      setLoading(false);
    });
  }, []);

  return { user, loading };
}
