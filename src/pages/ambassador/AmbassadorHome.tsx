import { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Flame, ArrowRight, Zap, CheckCircle, Clock, Award, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAppStore } from '../../store/useAppStore';
import { useTasks } from '../../hooks/useTasks';
import { useSubmissions } from '../../hooks/useSubmissions';
import { useAmbassadors } from '../../hooks/useAmbassadors';
import { useBadges } from '../../hooks/useBadges';
import { useRealtimeAmbassador } from '../../hooks/useRealtime';
import { supabase } from '../../lib/supabase';
import TaskCard from '../../components/ui/TaskCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getTier, getNextTier, getTierProgress, getTierColor } from '../../types';
import { clsx } from 'clsx';
import type { Profile } from '../../types';

function useCountUp(target: number, duration = 1000) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const from = prev.current;
    prev.current = target;
    if (from === target) { setVal(target); return; }
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      setVal(Math.round(from + (target - from) * p));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);
  return val;
}

const TIER_EMOJI: Record<string, string> = { Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎' };

export default function AmbassadorHome() {
  const navigate = useNavigate();
  const { profile, org, setProfile } = useAppStore();
  const { tasks, fetchTasks } = useTasks();
  const { submissions, fetchMySubmissions } = useSubmissions();
  const { ambassadors, fetchAmbassadors } = useAmbassadors();
  const { badges, fetchBadges } = useBadges();
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!profile || !org) return;
    await Promise.all([fetchTasks(org.id, profile.id), fetchMySubmissions(profile.id), fetchAmbassadors(org.id), fetchBadges(profile.id)]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [profile?.id, org?.id]);

  useRealtimeAmbassador(profile?.id, org?.id, {
    onNewTask: () => { if (org && profile) fetchTasks(org.id, profile.id); },
    onSubmissionReviewed: () => { if (profile) fetchMySubmissions(profile.id); },
    onPointsUpdate: async () => {
      if (!profile) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', profile.id).single();
      if (data) setProfile(data as Profile);
    },
    onLeaderboardChange: () => { if (org) fetchAmbassadors(org.id); },
  });

  const points = useCountUp(profile?.points ?? 0);
  const rank = useMemo(() => {
    const sorted = [...ambassadors].sort((a, b) => b.points - a.points);
    return sorted.findIndex((a) => a.id === profile?.id) + 1;
  }, [ambassadors, profile?.id]);

  const submittedTaskIds = useMemo(() => new Set(submissions.map((s) => s.task_id)), [submissions]);
  const pendingTasks = useMemo(() => tasks.filter((t) => !submittedTaskIds.has(t.id)).slice(0, 3), [tasks, submittedTaskIds]);
  const approvedCount = submissions.filter((s) => s.status === 'approved').length;
  const pendingCount = submissions.filter((s) => s.status === 'pending').length;

  const tier = getTier(profile?.points ?? 0);
  const next = getNextTier(profile?.points ?? 0);
  const progress = getTierProgress(profile?.points ?? 0);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      {/* ── Hero Card ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-700 to-purple-800" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-indigo-300 blur-3xl" />
        </div>
        <div className="relative z-10 p-6 md:p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-indigo-200 text-sm font-medium">Welcome back</p>
              <h1 className="text-2xl md:text-3xl font-black text-white mt-1">{profile?.full_name} 👋</h1>
              <p className="text-indigo-200 text-sm mt-1">{profile?.college} · Joined {new Date(profile?.created_at ?? '').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <p className="text-[9px] text-indigo-200 uppercase tracking-widest font-bold">Rank</p>
                <p className="text-xl font-black text-white">#{rank}</p>
              </div>
              <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <p className="text-[9px] text-indigo-200 uppercase tracking-widest font-bold">Streak</p>
                <p className="text-xl font-black text-amber-300 flex items-center gap-1"><Flame className="w-4 h-4" />{profile?.streak}</p>
              </div>
            </div>
          </div>
          {/* Mobile badges */}
          <div className="flex items-center gap-3 mt-4 md:hidden">
            <span className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-sm font-bold">#{rank}</span>
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 text-amber-300 text-sm font-bold"><Flame className="w-3.5 h-3.5" />{profile?.streak}</span>
            <span className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-sm font-bold">{TIER_EMOJI[tier]} {tier}</span>
          </div>
        </div>
      </motion.div>

      {/* ── Points + Tier Progress ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-6">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Your Points</p>
            <p className={clsx('text-5xl font-black mt-1', getTierColor(tier))}>{points.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl">{TIER_EMOJI[tier]}</span>
              <span className={clsx('text-lg font-black', getTierColor(tier))}>{tier}</span>
            </div>
            {next && <p className="text-[10px] text-gray-500 mt-0.5">{next.pointsNeeded} pts to {next.tier}</p>}
          </div>
        </div>
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-full" />
        </div>
        {next && <p className="text-[10px] text-gray-500 mt-2">{next.tier} — {next.pointsNeeded} pts away</p>}
      </motion.div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Completed', val: approvedCount, icon: CheckCircle, color: 'text-green-400', glow: 'from-green-500/15 to-emerald-600/5' },
          { label: 'Pending', val: pendingCount, icon: Clock, color: 'text-amber-400', glow: 'from-amber-500/15 to-orange-600/5' },
          { label: 'Badges', val: badges.length, icon: Award, color: 'text-indigo-400', glow: 'from-indigo-500/15 to-blue-600/5' },
          { label: 'Available', val: pendingTasks.length, icon: Star, color: 'text-violet-400', glow: 'from-violet-500/15 to-purple-600/5' },
        ].map(({ label, val, icon: Ic, color, glow }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
            className={clsx('rounded-2xl border border-white/[0.08] bg-gradient-to-br backdrop-blur-md p-4', glow)}>
            <Ic className={clsx('w-5 h-5 mb-2', color)} />
            <p className="text-2xl font-black text-white">{val}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Badges Showcase ── */}
      {badges.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-5">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-indigo-400" /> Your Badges</h2>
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <span key={b.id} className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
                🏅 {b.badge_name}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Tasks To Do ── */}
      {pendingTasks.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Tasks To Do</h2>
            <Link to="/ambassador/tasks" className="text-xs text-indigo-400 font-bold flex items-center gap-1 hover:text-indigo-300 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingTasks.map((t) => (
              <TaskCard key={t.id} task={t} showSubmitButton onSubmit={() => navigate('/ambassador/tasks')} />
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Floating Rank Button ── */}
      <button
        onClick={() => toast(`You are ranked #${rank} with ${profile?.points ?? 0} points! 🎯`, { icon: '🏆', duration: 3000 })}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/30 flex items-center justify-center hover:scale-110 transition-transform"
        title="My rank"
      >
        <Trophy className="w-6 h-6" />
      </button>
    </div>
  );
}
