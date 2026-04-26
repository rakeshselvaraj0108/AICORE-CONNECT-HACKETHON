import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ALL_BADGES } from '../types';
import type { Badge } from '../types';

interface BadgeStats {
  completedCount: number;
  refCount: number;
  streak: number;
  points: number;
  socialCount: number;
  contentCount: number;
  rank: number;
  maxAiScore: number;
}

export function useBadges() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBadges = useCallback(async (ambassadorId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .eq('ambassador_id', ambassadorId)
      .order('earned_at', { ascending: false });
    if (!error && data) setBadges(data as Badge[]);
    setLoading(false);
    return (data as Badge[]) ?? [];
  }, []);

  const checkAndAwardBadges = useCallback(async (ambassadorId: string, stats: BadgeStats) => {
    const conditions: Record<string, boolean> = {
      first: stats.completedCount >= 1,
      referral_pro: stats.refCount >= 5,
      on_fire: stats.streak >= 3,
      overachiever: stats.completedCount >= 10,
      club_500: stats.points >= 500,
      elite: stats.points >= 1500,
      social_star: stats.socialCount >= 3,
      content_king: stats.contentCount >= 5,
      top_3: stats.rank >= 1 && stats.rank <= 3,
      perfect_score: stats.maxAiScore >= 95,
    };

    const earned: Badge[] = [];
    for (const badge of ALL_BADGES) {
      if (!conditions[badge.id]) continue;
      const { data } = await supabase
        .from('badges')
        .upsert(
          { ambassador_id: ambassadorId, badge_id: badge.id, badge_name: badge.name },
          { onConflict: 'ambassador_id,badge_id', ignoreDuplicates: true },
        )
        .select()
        .single();
      if (data) earned.push(data as Badge);
    }

    if (earned.length > 0) {
      setBadges((prev) => {
        const ids = new Set(prev.map((b) => b.badge_id));
        const newOnes = earned.filter((b) => !ids.has(b.badge_id));
        return [...newOnes, ...prev];
      });
    }

    return earned;
  }, []);

  return { badges, loading, fetchBadges, checkAndAwardBadges, setBadges };
}
