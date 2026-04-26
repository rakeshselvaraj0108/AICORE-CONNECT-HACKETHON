import { useEffect, useMemo } from 'react';
import { Flame } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../../store/useAppStore';
import { useBadges } from '../../hooks/useBadges';
import { useAmbassadors } from '../../hooks/useAmbassadors';
import BadgeItem from '../../components/ui/BadgeItem';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { ALL_BADGES, getTier, getNextTier, getTierProgress, getTierColor } from '../../types';
import { format, subDays } from 'date-fns';

export default function BadgesPage() {
  const { profile, org } = useAppStore();
  const { badges, loading, fetchBadges } = useBadges();
  const { ambassadors, fetchAmbassadors } = useAmbassadors();

  useEffect(() => {
    if (!profile || !org) return;
    fetchBadges(profile.id);
    fetchAmbassadors(org.id);
  }, [profile?.id, org?.id]);

  const rank = useMemo(() => {
    const sorted = [...ambassadors].sort((a, b) => b.points - a.points);
    return sorted.findIndex((a) => a.id === profile?.id) + 1;
  }, [ambassadors, profile?.id]);

  const earnedIds = useMemo(() => new Set(badges.map((b) => b.badge_id)), [badges]);
  const tier = getTier(profile?.points ?? 0);
  const next = getNextTier(profile?.points ?? 0);
  const progress = getTierProgress(profile?.points ?? 0);
  const tierEmoji: Record<string, string> = { Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎' };

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return { label: format(d, 'd'), dayStr: format(d, 'yyyy-MM-dd') };
  });

  const handleShare = () => {
    const earnedBadges = badges.map((b) => b.badge_name).join(', ');
    const text = `🏆 Check out my CampusConnect profile!\nName: ${profile?.full_name} | College: ${profile?.college ?? '—'}\nPoints: ${profile?.points} | Rank: #${rank}\nBadges: ${earnedBadges || 'None yet'}`;
    navigator.clipboard.writeText(text).then(() => toast.success('Profile copied to clipboard!')).catch(() => toast.error('Could not copy'));
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Badges & Achievements</h1>
        <button onClick={handleShare} className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          Share Profile
        </button>
      </div>

      {/* Points & tier */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Total Points</p>
            <p className={`text-5xl font-black ${getTierColor(tier)}`}>{profile?.points?.toLocaleString() ?? 0}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl">{tierEmoji[tier]}</p>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mt-1">{tier} Tier</p>
            {next && <p className="text-xs text-gray-400">{next.pointsNeeded} pts to {next.tier}</p>}
          </div>
        </div>
        <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Streak calendar */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Streak — {profile?.streak} days</h2>
        </div>
        <div className="flex gap-2 justify-between">
          {last7Days.map(({ label, dayStr }) => {
            const isToday = dayStr === format(new Date(), 'yyyy-MM-dd');
            const isActive = profile?.last_active_date && dayStr <= profile.last_active_date && dayStr >= format(subDays(new Date(), (profile.streak ?? 0) - 1), 'yyyy-MM-dd');
            return (
              <div key={dayStr} className="flex flex-col items-center gap-1.5 flex-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  isActive ? 'bg-indigo-600 text-white' :
                  isToday ? 'border-2 border-indigo-400 text-indigo-600 dark:text-indigo-400' :
                  'bg-gray-100 dark:bg-gray-800 text-gray-400'
                }`}>
                  {isActive ? '🔥' : label}
                </div>
                <span className="text-xs text-gray-400">{label}</span>
              </div>
            );
          })}
        </div>
        {(profile?.streak ?? 0) > 0 && (
          <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mt-3 text-center">
            🔥 {profile?.streak}-day streak! Keep it going!
          </p>
        )}
      </div>

      {/* Badges grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">All Badges</h2>
          <span className="text-sm text-gray-500">{earnedIds.size} / {ALL_BADGES.length} earned</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {ALL_BADGES.map((badge, i) => {
            const earnedBadge = badges.find((b) => b.badge_id === badge.id);
            return (
              <BadgeItem
                key={badge.id}
                emoji={badge.emoji}
                name={badge.name}
                description={badge.description}
                progressHint={badge.progressHint}
                earned={earnedIds.has(badge.id)}
                earnedAt={earnedBadge?.earned_at}
                delay={i * 0.04}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
