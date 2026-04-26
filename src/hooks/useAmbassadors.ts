import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

export function useAmbassadors() {
  const [ambassadors, setAmbassadors] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAmbassadors = useCallback(async (orgId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('org_id', orgId)
      .eq('role', 'ambassador')
      .order('points', { ascending: false });
    if (!error && data) setAmbassadors(data as Profile[]);
    setLoading(false);
    return (data as Profile[]) ?? [];
  }, []);

  const refreshAmbassador = useCallback(async (ambassadorId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', ambassadorId).single();
    if (data) {
      setAmbassadors((prev) =>
        prev.map((a) => (a.id === ambassadorId ? (data as Profile) : a)),
      );
    }
  }, []);

  return { ambassadors, loading, fetchAmbassadors, refreshAmbassador, setAmbassadors };
}
