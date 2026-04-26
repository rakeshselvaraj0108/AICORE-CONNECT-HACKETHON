import { useEffect, useMemo, useState } from 'react';
import { Search, Download, X, Sparkles, Loader2, Users, Flame } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import ReactDOM from 'react-dom';
import { useAppStore } from '../../store/useAppStore';
import { useAmbassadors } from '../../hooks/useAmbassadors';
import { useSubmissions } from '../../hooks/useSubmissions';
import { useBadges } from '../../hooks/useBadges';
import { getAmbassadorSummary } from '../../lib/openrouter';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { clsx } from 'clsx';
import { getTier, getTierColor } from '../../types';
import type { Profile } from '../../types';

type SortKey = 'points' | 'streak' | 'full_name';

/* ─── Profile Drawer (portal) ─── */
function ProfileDrawer({ profile, rank, subs, badges, aiSummary, aiLoading, onAI, onClose }: {
  profile: Profile; rank: number; subs: any[]; badges: any[]; aiSummary: string; aiLoading: boolean; onAI: () => void; onClose: () => void;
}) {
  const initials = profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const tier = getTier(profile.points);
  const approved = subs.filter((s: any) => s.status === 'approved').length;
  const avgScore = subs.filter((s: any) => s.ai_score != null).length > 0
    ? Math.round(subs.reduce((a: number, s: any) => a + (s.ai_score ?? 0), 0) / subs.filter((s: any) => s.ai_score != null).length) : 0;

  return ReactDOM.createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-w-md h-full bg-gray-950 border-l border-white/10 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10"><X className="w-4 h-4 text-white/60" /></button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-xl font-bold shadow-lg">{initials}</div>
            <div>
              <p className="text-xl font-black text-white">{profile.full_name}</p>
              <p className="text-indigo-200 text-sm">{profile.college ?? '—'}</p>
              <p className="text-indigo-300 text-xs mt-0.5">Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Rank', val: `#${rank}`, color: 'text-amber-400' },
              { label: 'Points', val: profile.points, color: 'text-indigo-400' },
              { label: 'Streak', val: profile.streak, color: 'text-orange-400' },
              { label: 'Avg AI', val: avgScore, color: 'text-cyan-400' },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-white/[0.04] rounded-xl p-3 text-center border border-white/[0.06]">
                <p className={clsx('text-lg font-black', color)}>{val}</p>
                <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">{label}</p>
              </div>
            ))}
          </div>

          {/* Tier */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-2xl">{getTier(profile.points) === 'Platinum' ? '💎' : getTier(profile.points) === 'Gold' ? '🥇' : getTier(profile.points) === 'Silver' ? '🥈' : '🥉'}</span>
            <div>
              <p className={clsx('text-sm font-bold', getTierColor(tier))}>{tier} Tier</p>
              <p className="text-[10px] text-gray-500">{approved} tasks completed</p>
            </div>
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-2">Badges ({badges.length})</p>
              <div className="flex flex-wrap gap-2">
                {badges.map((b: any) => <span key={b.id} className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">🏅 {b.badge_name}</span>)}
              </div>
            </div>
          )}

          {/* Submissions */}
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-2">Submissions ({subs.length})</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {subs.length === 0 ? <p className="text-xs text-gray-500 text-center py-4">No submissions</p> : subs.map((s: any) => (
                <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0',
                    s.status === 'approved' ? 'bg-green-400' : s.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400')} />
                  <span className="text-xs text-gray-300 flex-1 truncate">{s.tasks?.title ?? 'Task'}</span>
                  <span className={clsx('text-[10px] font-bold uppercase',
                    s.status === 'approved' ? 'text-green-400' : s.status === 'rejected' ? 'text-red-400' : 'text-amber-400')}>{s.status}</span>
                  {s.ai_score != null && <span className="text-[10px] font-bold text-gray-500 ml-1">AI {s.ai_score}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* AI Summary */}
          <div>
            <button onClick={onAI} disabled={aiLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-60 shadow-lg shadow-indigo-500/25">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {aiLoading ? 'Generating…' : 'AI Performance Summary'}
            </button>
            {aiSummary && (
              <div className="mt-3 p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <p className="text-sm text-indigo-200 leading-relaxed">{aiSummary}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

/* ═══════════════════ MAIN ═══════════════════ */
export default function AmbassadorDirectory() {
  const { org, openrouterKey } = useAppStore();
  const { ambassadors, loading, fetchAmbassadors } = useAmbassadors();
  const { submissions, fetchSubmissions } = useSubmissions();
  const { badges, fetchBadges } = useBadges();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('points');
  const [sortAsc, setSortAsc] = useState(false);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => { if (org) { fetchAmbassadors(org.id); fetchSubmissions(org.id); } }, [org?.id]);
  useEffect(() => { if (selected) fetchBadges(selected.id); }, [selected?.id]);

  const sorted = useMemo(() => {
    const filtered = ambassadors.filter((a) => a.full_name.toLowerCase().includes(search.toLowerCase()) || (a.college ?? '').toLowerCase().includes(search.toLowerCase()));
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? 0; const bv = b[sortKey] ?? 0;
      if (typeof av === 'string') return sortAsc ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [ambassadors, search, sortKey, sortAsc]);

  const ranked = useMemo(() => [...ambassadors].sort((a, b) => b.points - a.points), [ambassadors]);
  const totalPoints = ambassadors.reduce((a, b) => a + b.points, 0);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  };

  const getSubs = (id: string) => submissions.filter((s) => s.ambassador_id === id);

  const exportCSV = () => {
    const rows = [['Name', 'College', 'Points', 'Rank', 'Streak', 'Completions']];
    ranked.forEach((a, i) => {
      const subs = getSubs(a.id).filter((s) => s.status === 'approved');
      rows.push([a.full_name, a.college ?? '', String(a.points), String(i + 1), String(a.streak), String(subs.length)]);
    });
    const csv = rows.map((r) => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'ambassadors.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleAISummary = async (amb: Profile) => {
    setAiLoading(true); setAiSummary('');
    const subs = getSubs(amb.id).filter((s) => s.status === 'approved');
    const taskTypes = subs.map((s) => (s.tasks as { task_type?: string })?.task_type ?? '').filter(Boolean);
    const freq: Record<string, number> = {};
    taskTypes.forEach((t) => { freq[t] = (freq[t] ?? 0) + 1; });
    const best = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'various';
    const summary = await getAmbassadorSummary(amb, { tasksCompleted: subs.length, bestTaskType: best }, openrouterKey);
    setAiSummary(summary); setAiLoading(false);
  };

  if (loading) return <LoadingSpinner fullPage />;

  const selectedSubs = selected ? getSubs(selected.id) : [];
  const selectedRank = selected ? ranked.findIndex((a) => a.id === selected.id) + 1 : 0;
  const selectedBadges = badges.filter((b) => b.ambassador_id === selected?.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2"><Users className="w-6 h-6 text-indigo-400" /> Ambassadors</h1>
          <p className="text-sm text-gray-400 mt-0.5">{ambassadors.length} members · {totalPoints.toLocaleString()} total pts</p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 border border-white/10 rounded-xl text-sm font-bold text-gray-300 hover:bg-white/[0.04] transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or college…"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <EmptyState icon="👥" title="No ambassadors yet" description="Ambassadors will appear here once they register." />
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/[0.06]">
              <tr>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('full_name')}>
                  Ambassador {sortKey === 'full_name' ? (sortAsc ? '↑' : '↓') : ''}
                </th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none hidden md:table-cell" onClick={() => toggleSort('points')}>
                  Points {sortKey === 'points' ? (sortAsc ? '↑' : '↓') : ''}
                </th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Tier</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none hidden lg:table-cell" onClick={() => toggleSort('streak')}>
                  Streak {sortKey === 'streak' ? (sortAsc ? '↑' : '↓') : ''}
                </th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Tasks</th>
                <th className="px-4 py-3.5 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {sorted.map((a) => {
                const rank = ranked.findIndex((r) => r.id === a.id) + 1;
                const initials = a.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                const ambSubs = getSubs(a.id);
                const tier = getTier(a.points);
                return (
                  <tr key={a.id} className="hover:bg-white/[0.03] transition-colors cursor-pointer" onClick={() => { setSelected(a); setAiSummary(''); }}>
                    <td className="px-4 py-3">
                      <span className={clsx('font-black', rank <= 3 ? 'text-amber-400' : 'text-gray-600')}>
                        {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-lg shadow-indigo-500/10">{initials}</div>
                        <div>
                          <p className="font-bold text-white">{a.full_name}</p>
                          <p className="text-xs text-gray-500">{a.college ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell"><span className="font-black text-indigo-400">{a.points}</span></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><span className={clsx('text-xs font-bold', getTierColor(tier))}>{tier}</span></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><span className="text-amber-400 flex items-center gap-1"><Flame className="w-3 h-3" />{a.streak}</span></td>
                    <td className="px-4 py-3 hidden xl:table-cell text-gray-400">{ambSubs.filter((s) => s.status === 'approved').length}/{ambSubs.length}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">View →</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Profile drawer */}
      <AnimatePresence>
        {selected && (
          <ProfileDrawer profile={selected} rank={selectedRank} subs={selectedSubs} badges={selectedBadges}
            aiSummary={aiSummary} aiLoading={aiLoading} onAI={() => handleAISummary(selected)} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
