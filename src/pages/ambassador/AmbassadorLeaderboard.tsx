import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import ReactDOM from 'react-dom';
import { Trophy, Flame, Crown, Star, X, Zap, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAppStore } from '../../store/useAppStore';
import { useAmbassadors } from '../../hooks/useAmbassadors';
import { useRealtimeAmbassador } from '../../hooks/useRealtime';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getTier, getTierColor } from '../../types';
import { clsx } from 'clsx';
import type { Profile } from '../../types';

/* ─── Profile Detail Modal ─── */
function ProfileModal({ profile, rank, onClose }: { profile: Profile; rank: number; onClose: () => void }) {
  const initials = profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const tier = getTier(profile.points);
  return ReactDOM.createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-gray-900 border border-white/10 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-center relative">
          <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/10"><X className="w-4 h-4 text-white/60" /></button>
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-xl font-bold mx-auto mb-3 shadow-lg">{initials}</div>
          <p className="text-xl font-black text-white">{profile.full_name}</p>
          <p className="text-indigo-200 text-sm">{profile.college ?? '—'}</p>
          <p className="text-indigo-300 text-xs mt-1">Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}</p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: 'Rank', val: `#${rank}`, color: 'text-amber-400' },
              { label: 'Points', val: profile.points, color: 'text-indigo-400' },
              { label: 'Streak', val: profile.streak, color: 'text-orange-400' },
              { label: 'Tier', val: tier, color: getTierColor(tier) },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-white/[0.04] rounded-xl p-2.5 text-center border border-white/[0.06]">
                <p className={clsx('text-lg font-black', color)}>{val}</p>
                <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">{label}</p>
              </div>
            ))}
          </div>
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-sm font-semibold text-gray-400 transition-colors">Close</button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

/* ─── Podium ─── */
function Podium({ top3, currentUserId, onSelect }: { top3: Profile[]; currentUserId?: string; onSelect: (p: Profile) => void }) {
  if (top3.length < 3) return null;
  const order = [top3[1], top3[0], top3[2]];
  const heights = ['h-24', 'h-32', 'h-20'];
  const medals = ['🥈', '🥇', '🥉'];
  const glows = ['from-gray-400/20 to-gray-500/5', 'from-amber-400/20 to-yellow-500/5', 'from-amber-700/20 to-amber-800/5'];

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-6">
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-8"><Crown className="w-4 h-4 inline mr-1 text-amber-400" />Hall of Champions</h2>
      <div className="flex items-end justify-center gap-3">
        {order.map((amb, i) => {
          const initials = amb.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
          const isMe = amb.id === currentUserId;
          return (
            <motion.div key={amb.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
              onClick={() => onSelect(amb)}
              className="flex flex-col items-center cursor-pointer group flex-1 max-w-[140px]">
              <div className={clsx('rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg mb-2 transition-all group-hover:scale-110',
                i === 1 ? 'w-16 h-16 text-lg' : 'w-12 h-12 text-sm',
                isMe && 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-gray-950')}>
                {initials}
              </div>
              <p className="text-sm font-bold text-white text-center truncate w-full group-hover:text-indigo-300 transition-colors">{amb.full_name.split(' ')[0]}</p>
              <p className="text-xs text-gray-500">{amb.points.toLocaleString()} pts</p>
              <div className={clsx('w-full rounded-t-xl bg-gradient-to-t mt-2 flex items-end justify-center pb-3', glows[i], heights[i])}>
                <span className="text-2xl">{medals[i]}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Leaderboard Row ─── */
function RankRow({ profile, rank, isMe, delay, onSelect }: { profile: Profile; rank: number; isMe: boolean; delay: number; onSelect: () => void }) {
  const initials = profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const tier = getTier(profile.points);
  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}
      onClick={onSelect}
      className={clsx('flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer group',
        isMe ? 'bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/40' : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10 hover:bg-white/[0.04]')}>
      <span className={clsx('w-8 text-center font-black text-lg', rank <= 3 ? 'text-amber-400' : 'text-gray-600')}>
        {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
      </span>
      <div className={clsx('w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-lg transition-all',
        isMe ? 'shadow-indigo-500/30 ring-2 ring-indigo-400/50' : 'shadow-indigo-500/10 group-hover:shadow-indigo-500/20')}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={clsx('text-sm font-bold truncate', isMe ? 'text-indigo-300' : 'text-white group-hover:text-indigo-300 transition-colors')}>{profile.full_name}</p>
          {isMe && <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded uppercase">You</span>}
        </div>
        <p className="text-xs text-gray-500 truncate">{profile.college ?? '—'}</p>
      </div>
      <div className="flex items-center gap-3">
        {profile.streak > 0 && (
          <span className="flex items-center gap-1 text-xs text-orange-400 font-bold">
            <Flame className="w-3 h-3" />{profile.streak}
          </span>
        )}
        <span className={clsx('text-[9px] font-bold uppercase tracking-wider', getTierColor(tier))}>{tier}</span>
        <span className="text-sm font-black text-white min-w-[48px] text-right">{profile.points.toLocaleString()}</span>
      </div>
    </motion.div>
  );
}

/* ═══════════════════ MAIN ═══════════════════ */
export default function AmbassadorLeaderboard() {
  const { profile, org, setProfile } = useAppStore();
  const { ambassadors, fetchAmbassadors } = useAmbassadors();
  const [loading, setLoading] = useState(true);
  const [college, setCollege] = useState('All');
  const [confettiDone, setConfettiDone] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  useEffect(() => { if (org) fetchAmbassadors(org.id).then(() => setLoading(false)); }, [org?.id]);

  useRealtimeAmbassador(profile?.id, org?.id, {
    onNewTask: () => {},
    onSubmissionReviewed: () => {},
    onPointsUpdate: async () => {
      if (!profile) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', profile.id).single();
      if (data) setProfile(data as Profile);
    },
    onLeaderboardChange: () => { if (org) fetchAmbassadors(org.id); },
  });

  const sorted = useMemo(() => [...ambassadors].sort((a, b) => b.points - a.points), [ambassadors]);
  const colleges = useMemo(() => ['All', ...Array.from(new Set(ambassadors.map((a) => a.college).filter(Boolean) as string[])).sort()], [ambassadors]);
  const filtered = useMemo(() => college === 'All' ? sorted : sorted.filter((a) => a.college === college), [sorted, college]);
  const myRank = useMemo(() => sorted.findIndex((a) => a.id === profile?.id) + 1, [sorted, profile?.id]);
  const top3 = filtered.slice(0, 3);
  const totalPoints = ambassadors.reduce((a, b) => a + b.points, 0);

  useEffect(() => {
    if (!confettiDone && myRank >= 1 && myRank <= 3 && !loading) {
      setConfettiDone(true);
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }
  }, [myRank, loading, confettiDone]);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2"><Trophy className="w-6 h-6 text-amber-400" /> Leaderboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">{ambassadors.length} ambassadors competing</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-green-400 font-bold">LIVE</span>
        </div>
      </div>

      {/* My rank banner */}
      {myRank > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-indigo-600/20 via-violet-600/15 to-purple-600/10 border border-indigo-500/20 p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Your Rank</p>
              <p className="text-3xl font-black text-white">#{myRank}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Points</p>
              <p className={clsx('text-2xl font-black', getTierColor(getTier(profile?.points ?? 0)))}>{(profile?.points ?? 0).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Streak</p>
              <p className="text-2xl font-black text-orange-400 flex items-center gap-1"><Flame className="w-5 h-5" />{profile?.streak ?? 0}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Points', val: totalPoints.toLocaleString(), icon: Zap, color: 'text-amber-400' },
          { label: 'Avg Points', val: ambassadors.length > 0 ? Math.round(totalPoints / ambassadors.length) : 0, icon: TrendingUp, color: 'text-cyan-400' },
          { label: 'Active Streak', val: ambassadors.filter((a) => a.streak > 0).length, icon: Flame, color: 'text-orange-400' },
        ].map(({ label, val, icon: Ic, color }) => (
          <div key={label} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex items-center gap-3">
            <Ic className={clsx('w-5 h-5', color)} />
            <div>
              <p className="text-lg font-black text-white">{val}</p>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Podium */}
      <Podium top3={top3} currentUserId={profile?.id} onSelect={(p) => setSelectedProfile(p)} />

      {/* College filter */}
      {colleges.length > 2 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {colleges.map((c) => (
            <button key={c} onClick={() => setCollege(c)}
              className={clsx('flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all',
                college === c ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]')}>
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Ranked list */}
      <div className="space-y-2">
        {filtered.map((amb, i) => {
          const globalRank = college === 'All' ? i + 1 : sorted.findIndex((s) => s.id === amb.id) + 1;
          return <RankRow key={amb.id} profile={amb} rank={globalRank} isMe={amb.id === profile?.id} delay={i * 0.03} onSelect={() => setSelectedProfile(amb)} />;
        })}
        {filtered.length === 0 && <p className="text-sm text-gray-500 text-center py-12">No ambassadors from {college} yet.</p>}
      </div>

      {/* Profile modal */}
      <AnimatePresence>
        {selectedProfile && <ProfileModal profile={selectedProfile} rank={sorted.findIndex((a) => a.id === selectedProfile.id) + 1} onClose={() => setSelectedProfile(null)} />}
      </AnimatePresence>
    </div>
  );
}
