import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useAmbassadors } from '../../hooks/useAmbassadors';
import { useRealtimeAdmin } from '../../hooks/useRealtime';
import LeaderboardRow from '../../components/ui/LeaderboardRow';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function AdminLeaderboard() {
  const { org } = useAppStore();
  const { ambassadors, loading, fetchAmbassadors } = useAmbassadors();
  const [college, setCollege] = useState('All');

  useEffect(() => { if (org) fetchAmbassadors(org.id); }, [org?.id]);

  // ─── Real-time: leaderboard updates live ───
  useRealtimeAdmin(org?.id, {
    onProfileUpdate: () => { if (org) fetchAmbassadors(org.id); },
    onNewSubmission: () => {},
    onTaskUpdate: () => {},
  });

  const colleges = useMemo(() => ['All', ...Array.from(new Set(ambassadors.map((a) => a.college ?? '').filter(Boolean)))], [ambassadors]);

  const ranked = useMemo(() => {
    const filtered = college === 'All' ? ambassadors : ambassadors.filter((a) => a.college === college);
    return [...filtered].sort((a, b) => b.points - a.points);
  }, [ambassadors, college]);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> LIVE
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {colleges.map((c) => (
            <button key={c} onClick={() => setCollege(c)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${college === c ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-indigo-300'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {ranked.length === 0 ? (
        <EmptyState icon="🏆" title="No ambassadors yet" description="Rankings appear once ambassadors join." />
      ) : (
        <>
          {/* Top 3 podium */}
          {ranked.length >= 3 && college === 'All' && (
            <div className="flex items-end justify-center gap-3 py-6">
              {[ranked[1], ranked[0], ranked[2]].map((a, podiumIndex) => {
                const actualRank = podiumIndex === 0 ? 2 : podiumIndex === 1 ? 1 : 3;
                const heights = ['h-24', 'h-32', 'h-20'];
                const colors = ['bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700', 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800', 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'];
                const medals = ['🥈', '🥇', '🥉'];
                const initials = a.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={a.id} className={`flex flex-col items-center gap-2 flex-1 max-w-[140px] rounded-2xl border p-4 ${colors[podiumIndex]} ${heights[podiumIndex]} justify-end`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold">{initials}</div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white text-center leading-tight">{a.full_name.split(' ')[0]}</p>
                    <p className="text-xs text-gray-500 text-center">{a.points} pts</p>
                    <span className="text-xl">{medals[podiumIndex]}</span>
                    <span className="text-xs text-gray-400">#{actualRank}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 space-y-1">
            {ranked.map((a, i) => (
              <LeaderboardRow
                key={a.id}
                profile={a}
                rank={i + 1}
                delay={i * 0.03}
                gapToPrev={i > 0 ? ranked[i - 1].points - a.points : undefined}
                prevName={i > 0 ? ranked[i - 1].full_name.split(' ')[0] : undefined}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
