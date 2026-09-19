'use client';

import { useEffect, useState } from 'react';
import { supabase, MOCK_MODE } from '@/lib/supabase';
import { MOCK_USERS } from '@/lib/mock-data';
import { useCurrentUser } from '@/lib/useCurrentUser';

/**
 * Returns a map of passenger_id → display name for the current watcher's
 * watched passengers (from the watchers table). Falls back to MOCK_USERS
 * for any ID not found in the DB, and ultimately to the raw ID.
 */
export function usePassengerNames(): (id: string) => string {
  const { user } = useCurrentUser();
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (MOCK_MODE || !user || !supabase) {
      setNames(MOCK_USERS);
      return;
    }

    supabase
      .from('watchers')
      .select('passenger_id, label')
      .eq('auth_id', user.id)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, string> = { ...MOCK_USERS };
        for (const row of data) {
          if (row.label) map[row.passenger_id] = row.label;
        }
        setNames(map);
      });
  }, [user]);

  return (id: string) => names[id] ?? id;
}
