import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ActivityItem } from '../types';

export function useActivity() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActivity = useCallback(async (orgId: string, limit = 20) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('activity')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) console.error('fetchActivity error:', error);
    if (!error && data) setActivity(data as ActivityItem[]);
    setLoading(false);
    return (data as ActivityItem[]) ?? [];
  }, []);

  const addActivity = useCallback(async (
    orgId: string,
    actorId: string,
    text: string,
    type: ActivityItem['type'],
  ) => {
    const { data } = await supabase
      .from('activity')
      .insert({ org_id: orgId, actor_id: actorId, text, type })
      .select()
      .single();
    if (data) setActivity((prev) => [data as ActivityItem, ...prev.slice(0, 19)]);
  }, []);

  return { activity, loading, fetchActivity, addActivity };
}
