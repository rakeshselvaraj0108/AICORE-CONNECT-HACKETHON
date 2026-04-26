import { useEffect, useMemo, useState } from 'react';
import { Users, ListTodo, CheckCircle, Clock, Trophy, TrendingUp, Zap, Send, XCircle, Plus, Award } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import ReactDOM from 'react-dom';
import { useAppStore } from '../../store/useAppStore';
import { useTasks } from '../../hooks/useTasks';
import { useSubmissions } from '../../hooks/useSubmissions';
import { useAmbassadors } from '../../hooks/useAmbassadors';
import { useActivity } from '../../hooks/useActivity';
import { useRealtimeAdmin } from '../../hooks/useRealtime';
import ActivityChart from '../../components/charts/ActivityChart';
import PointsChart from '../../components/charts/PointsChart';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { clsx } from 'clsx';
import type { Profile, ActivityItem } from '../../types';
import { formatTimeAgo, getTier, getTierColor } from '../../types';

/* ─── Stat Card ─────────────────────────────────────── */
function GlowStat({ label, value, icon: Icon, gradient, glow, onClick }: {
  label: string; value: string | number; icon: typeof Users; gradient: string; glow: string; onClick?: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}
      onClick={onClick}
      className={clsx('relative rounded-2xl p-5 border border-white/[0.08] bg-gradient-to-br backdrop-blur-md overflow-hidden group', gradient, onClick && 'cursor-pointer')}>
      <div className={clsx('absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity', glow)} />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">{label}</p>
          <p className="text-3xl font-black text-white mt-1.5">{value}</p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
          <Icon className="w-5 h-5 text-white/70" />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Live Activity Feed ─────────────────────────────── */
const ACTIVITY_ICONS: Record<string, { Icon: typeof Send; color: string }> = {
  submission: { Icon: Send, color: 'from-indigo-500 to-blue-600' },
  approval: { Icon: CheckCircle, color: 'from-green-500 to-emerald-600' },
  rejection: { Icon: XCircle, color: 'from-red-500 to-rose-600' },
  task_created: { Icon: Plus, color: 'from-amber-500 to-orange-600' },
  badge_earned: { Icon: Award, color: 'from-purple-500 to-violet-600' },
  points: { Icon: Zap, color: 'from-amber-400 to-yellow-500' },
};

function LiveFeed({ items }: { items: ActivityItem[] }) {
  const displayed = items.slice(0, 10);
  if (displayed.length === 0) return <p className="text-sm text-gray-500 text-center py-10">No activity yet</p>;
  return (
    <div className="space-y-2">
      {displayed.map((item, i) => {
        const cfg = ACTIVITY_ICONS[item.type ?? 'submission'] ?? ACTIVITY_ICONS.submission;
        return (
          <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors group">
            <div className={clsx('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-lg', cfg.color)}>
              <cfg.Icon className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-300 leading-snug">{item.text}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{formatTimeAgo(item.created_at)}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─── Top Performer Card ────────────────────────────── */
function PerformerCard({ profile, rank, submissions, onClick }: { profile: Profile; rank: number; submissions: any[]; onClick: () => void }) {
  const medals = ['🥇', '🥈', '🥉'];
  const initials = profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const tier = getTier(profile.points);
  const approved = submissions.filter((s: any) => s.status === 'approved').length;
  return (
    <motion.div whileHover={{ scale: 1.02 }} onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-all cursor-pointer group">
      <span className="text-xl w-7 text-center">{medals[rank] ?? `#${rank + 1}`}</span>
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">{initials}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">{profile.full_name}</p>
        <p className="text-[10px] text-gray-500">{profile.college ?? '—'} · {approved} approved</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-black text-white">{profile.points}</p>
        <p className={clsx('text-[9px] font-bold uppercase tracking-wider', getTierColor(tier))}>{tier}</p>
      </div>
    </motion.div>
  );
}

/* ─── Profile Modal ────────────────────────────────── */
function ProfileModal({ profile, submissions, onClose }: { profile: Profile; submissions: any[]; onClose: () => void }) {
  const initials = profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const subs = submissions.filter((s: any) => s.ambassador_id === profile.id);
  const approved = subs.filter((s: any) => s.status === 'approved').length;
  const avgScore = subs.length > 0 ? Math.round(subs.reduce((a: number, s: any) => a + (s.ai_score ?? 0), 0) / subs.length) : 0;
  const tier = getTier(profile.points);

  return ReactDOM.createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-gray-900 border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/30">{initials}</div>
          <div>
            <p className="text-lg font-black text-white">{profile.full_name}</p>
            <p className="text-xs text-gray-400">{profile.college ?? '—'}</p>
            <p className={clsx('text-[10px] font-bold uppercase tracking-wider mt-0.5', getTierColor(tier))}>{tier} Tier</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { label: 'Points', val: profile.points, color: 'text-indigo-400' },
            { label: 'Streak', val: profile.streak, color: 'text-amber-400' },
            { label: 'Avg AI', val: avgScore, color: 'text-cyan-400' },
            { label: 'Done', val: approved, color: 'text-green-400' },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-white/[0.04] rounded-xl p-2.5 text-center border border-white/[0.06]">
              <p className={clsx('text-lg font-black', color)}>{val}</p>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">{label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-2">Recent ({subs.length})</p>
          {subs.slice(0, 6).map((s: any) => (
            <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <span className={clsx('w-1.5 h-1.5 rounded-full', s.status === 'approved' ? 'bg-green-400' : s.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400')} />
              <span className="text-xs text-gray-300 flex-1 truncate">{s.tasks?.title ?? 'Task'}</span>
              {s.ai_score != null && <span className="text-[10px] font-bold text-gray-500">AI {s.ai_score}</span>}
            </div>
          ))}
          {subs.length === 0 && <p className="text-xs text-gray-500 text-center py-3">No submissions</p>}
        </div>
        <button onClick={onClose} className="w-full mt-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-sm font-semibold text-gray-400 transition-colors">Close</button>
      </motion.div>
    </motion.div>,
    document.body
  );
}

/* ═══════════════════ MAIN DASHBOARD ═══════════════════ */
export default function AdminDashboard() {
  const { org } = useAppStore();
  const { tasks, fetchTasks } = useTasks();
  const { submissions, fetchSubmissions } = useSubmissions();
  const { ambassadors, fetchAmbassadors } = useAmbassadors();
  const { activity, fetchActivity } = useActivity();
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const load = async () => {
    if (!org) return;
    await Promise.all([fetchTasks(org.id), fetchSubmissions(org.id), fetchAmbassadors(org.id), fetchActivity(org.id)]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [org?.id]);

  useRealtimeAdmin(org?.id, {
    onNewSubmission: () => { if (org) { fetchSubmissions(org.id); fetchActivity(org.id); } },
    onProfileUpdate: () => { if (org) fetchAmbassadors(org.id); },
    onTaskUpdate: () => { if (org) fetchTasks(org.id); },
  });

  const approved = useMemo(() => submissions.filter((s) => s.status === 'approved'), [submissions]);
  const pending = useMemo(() => submissions.filter((s) => s.status === 'pending'), [submissions]);
  const totalPoints = useMemo(() => ambassadors.reduce((a, b) => a + b.points, 0), [ambassadors]);

  const chartData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const day = subDays(new Date(), 6 - i);
    const dayStr = format(day, 'yyyy-MM-dd');
    const daySubs = submissions.filter((s) => s.submitted_at.startsWith(dayStr));
    return { day: format(day, 'EEE'), submissions: daySubs.length, approvals: daySubs.filter((s) => s.status === 'approved').length };
  }), [submissions]);

  const collegeData = useMemo(() => {
    const map: Record<string, number> = {};
    ambassadors.forEach((a) => { if (a.college) map[a.college] = (map[a.college] ?? 0) + a.points; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [ambassadors]);

  const top5 = useMemo(() => [...ambassadors].sort((a, b) => b.points - a.points).slice(0, 5), [ambassadors]);
  const approvalRate = submissions.length > 0 ? Math.round((approved.length / submissions.length) * 100) : 0;

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">{org?.name} · Command Center</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlowStat label="Ambassadors" value={ambassadors.length} icon={Users}
          gradient="from-indigo-500/15 to-blue-600/5" glow="bg-indigo-500" />
        <GlowStat label="Active Tasks" value={tasks.length} icon={ListTodo}
          gradient="from-violet-500/15 to-purple-600/5" glow="bg-violet-500" />
        <GlowStat label="Approved" value={approved.length} icon={CheckCircle}
          gradient="from-green-500/15 to-emerald-600/5" glow="bg-green-500" />
        <GlowStat label="Pending" value={pending.length} icon={Clock}
          gradient="from-amber-500/15 to-orange-600/5" glow="bg-amber-500" />
      </div>

      {/* Secondary stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{approvalRate}%</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Approval Rate</p>
          </div>
          <div className="ml-auto w-16 h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full" style={{ width: `${approvalRate}%` }} />
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{totalPoints.toLocaleString()}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Total Points</p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/10 flex items-center justify-center">
            <Send className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{submissions.length}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Submissions</p>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-6">
          <h2 className="text-sm font-bold text-white mb-1">Weekly Activity</h2>
          <p className="text-[10px] text-gray-500 mb-4">Submissions & approvals over the last 7 days</p>
          <ActivityChart data={chartData} />
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-6">
          <h2 className="text-sm font-bold text-white mb-1">Points by College</h2>
          <p className="text-[10px] text-gray-500 mb-4">Top performing institutions</p>
          {collegeData.length > 0 ? <PointsChart data={collegeData} /> : <p className="text-sm text-gray-500 py-16 text-center">No data yet</p>}
        </div>
      </div>

      {/* Bottom section: Top performers + Activity */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Top performers */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-6">
          <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" /> Top Performers
          </h2>
          <p className="text-[10px] text-gray-500 mb-4">Click to view profile details</p>
          {top5.length === 0 ? <p className="text-sm text-gray-500 text-center py-8">No ambassadors yet</p> : (
            <div className="space-y-2">
              {top5.map((a, i) => (
                <PerformerCard key={a.id} profile={a} rank={i}
                  submissions={submissions.filter((s) => s.ambassador_id === a.id)}
                  onClick={() => setSelectedProfile(a)} />
              ))}
            </div>
          )}
        </div>

        {/* Live activity feed */}
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Live Activity</h2>
              <p className="text-[10px] text-gray-500">Real-time updates from your ambassador network</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-green-400 font-bold">LIVE</span>
            </div>
          </div>
          <LiveFeed items={activity} />
        </div>
      </div>

      {/* Profile modal */}
      <AnimatePresence>
        {selectedProfile && (
          <ProfileModal profile={selectedProfile} submissions={submissions}
            onClose={() => setSelectedProfile(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
