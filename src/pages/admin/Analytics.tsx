import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Loader2, Target, Users, CheckCircle, TrendingUp, BarChart3, PieChart as PieIcon, Zap, Brain } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useTasks } from '../../hooks/useTasks';
import { useSubmissions } from '../../hooks/useSubmissions';
import { useAmbassadors } from '../../hooks/useAmbassadors';
import { getProgramInsights, type Insight } from '../../lib/openrouter';
import ActivityChart from '../../components/charts/ActivityChart';
import PointsChart from '../../components/charts/PointsChart';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { clsx } from 'clsx';

const PIE_COLORS = ['#F59E0B', '#22C55E', '#EF4444'];
const INSIGHT_ICONS = ['💡', '🎯', '🚀'];

/* ─── Glow Stat ─── */
function GlowStat({ label, value, subtitle, icon: Icon, gradient, glow }: {
  label: string; value: string | number; subtitle?: string; icon: typeof Target; gradient: string; glow: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className={clsx('relative rounded-2xl p-5 border border-white/[0.08] bg-gradient-to-br backdrop-blur-md overflow-hidden group', gradient)}>
      <div className={clsx('absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity', glow)} />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{label}</p>
          <p className="text-2xl font-black text-white mt-1">{value}</p>
          {subtitle && <p className="text-[10px] text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
          <Icon className="w-5 h-5 text-white/70" />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Funnel Bar ─── */
function FunnelBar({ label, count, pct, color, delay }: { label: string; count: number; pct: number; color: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-gray-300 font-medium text-xs">{label}</span>
        <span className="text-gray-500 text-xs">{count} <span className="text-gray-600">({pct.toFixed(0)}%)</span></span>
      </div>
      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 1, delay }}
          className={clsx('h-full rounded-full', color)} />
      </div>
    </motion.div>
  );
}

/* ═══════════════════ MAIN ═══════════════════ */
export default function Analytics() {
  const { org, openrouterKey } = useAppStore();
  const { tasks, fetchTasks } = useTasks();
  const { submissions, fetchSubmissions } = useSubmissions();
  const { ambassadors, fetchAmbassadors } = useAmbassadors();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    if (!org) return;
    Promise.all([fetchTasks(org.id), fetchSubmissions(org.id), fetchAmbassadors(org.id)]).then(() => setLoading(false));
  }, [org?.id]);

  const approved = useMemo(() => submissions.filter((s) => s.status === 'approved'), [submissions]);
  const pending = useMemo(() => submissions.filter((s) => s.status === 'pending'), [submissions]);
  const rejected = useMemo(() => submissions.filter((s) => s.status === 'rejected'), [submissions]);

  const totalExpected = useMemo(() => {
    let count = 0;
    tasks.forEach((t) => {
      if (t.assignment_type === 'global') count += ambassadors.length;
      else count += (t as any).task_assignments?.length || 0;
    });
    return count;
  }, [tasks, ambassadors.length]);

  const completionRate = totalExpected > 0 ? (approved.length / totalExpected) * 100 : 0;
  const avgPoints = ambassadors.length > 0 ? ambassadors.reduce((s, a) => s + a.points, 0) / ambassadors.length : 0;
  const avgAiScore = submissions.length > 0 ? Math.round(submissions.reduce((a, s) => a + (s.ai_score ?? 0), 0) / submissions.filter((s) => s.ai_score != null).length) : 0;

  const topCollege = useMemo(() => {
    const map: Record<string, number> = {};
    ambassadors.forEach((a) => { if (a.college) map[a.college] = (map[a.college] ?? 0) + a.points; });
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  }, [ambassadors]);

  const bestTaskType = useMemo(() => {
    const map: Record<string, number> = {};
    approved.forEach((s) => {
      const t = tasks.find((t) => t.id === s.task_id);
      if (t) map[t.task_type] = (map[t.task_type] ?? 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  }, [approved, tasks]);

  const lineData = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const day = subDays(new Date(), 13 - i);
    const dayStr = format(day, 'yyyy-MM-dd');
    const daySubs = submissions.filter((s) => s.submitted_at.startsWith(dayStr));
    return { day: format(day, 'MM/dd'), submissions: daySubs.length, approvals: daySubs.filter((s) => s.status === 'approved').length };
  }), [submissions]);

  const taskTypeData = useMemo(() => {
    const map: Record<string, number> = {};
    submissions.forEach((s) => {
      const t = tasks.find((t) => t.id === s.task_id);
      if (t) map[t.task_type] = (map[t.task_type] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [submissions, tasks]);

  const pieData = [
    { name: 'Pending', value: pending.length },
    { name: 'Approved', value: approved.length },
    { name: 'Rejected', value: rejected.length },
  ].filter((d) => d.value > 0);

  const handleInsights = async () => {
    setInsightLoading(true);
    const result = await getProgramInsights({ ambassadorCount: ambassadors.length, taskCount: tasks.length, completionRate, topCollege, avgPoints }, openrouterKey);
    setInsights(result);
    setInsightLoading(false);
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2"><BarChart3 className="w-6 h-6 text-indigo-400" /> Analytics</h1>
        <p className="text-sm text-gray-400 mt-0.5">Program performance & insights</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlowStat label="Completion Rate" value={`${completionRate.toFixed(1)}%`} icon={Target} gradient="from-indigo-500/15 to-blue-600/5" glow="bg-indigo-500" subtitle={`${approved.length}/${totalExpected} tasks`} />
        <GlowStat label="Avg Points" value={avgPoints.toFixed(0)} icon={TrendingUp} gradient="from-green-500/15 to-emerald-600/5" glow="bg-green-500" subtitle="Per ambassador" />
        <GlowStat label="Top College" value={topCollege} icon={Users} gradient="from-amber-500/15 to-orange-600/5" glow="bg-amber-500" />
        <GlowStat label="Best Category" value={bestTaskType} icon={CheckCircle} gradient="from-violet-500/15 to-purple-600/5" glow="bg-violet-500" />
      </div>

      {/* Extra metric row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-4 flex items-center gap-3">
          <Zap className="w-5 h-5 text-amber-400" />
          <div><p className="text-lg font-black text-white">{submissions.length}</p><p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Total Submissions</p></div>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-4 flex items-center gap-3">
          <Brain className="w-5 h-5 text-cyan-400" />
          <div><p className="text-lg font-black text-white">{avgAiScore || '—'}</p><p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Avg AI Score</p></div>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-4 flex items-center gap-3">
          <Target className="w-5 h-5 text-rose-400" />
          <div><p className="text-lg font-black text-white">{tasks.length}</p><p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Active Tasks</p></div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-6">
          <h2 className="text-sm font-bold text-white mb-1">Activity — Last 14 Days</h2>
          <p className="text-[10px] text-gray-500 mb-4">Submissions & approvals trend</p>
          <ActivityChart data={lineData} />
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-6">
          <h2 className="text-sm font-bold text-white mb-1">Submissions by Category</h2>
          <p className="text-[10px] text-gray-500 mb-4">Distribution across task types</p>
          {taskTypeData.length > 0 ? <PointsChart data={taskTypeData} color="#6366F1" /> : <p className="text-sm text-gray-500 py-16 text-center">No data yet</p>}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Donut */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-6">
          <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><PieIcon className="w-4 h-4 text-indigo-400" /> Status Breakdown</h2>
          <p className="text-[10px] text-gray-500 mb-4">Submission outcomes</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12, color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-500 py-16 text-center">No submissions yet</p>}
        </div>

        {/* Funnel */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-6">
          <h2 className="text-sm font-bold text-white mb-1">Completion Funnel</h2>
          <p className="text-[10px] text-gray-500 mb-5">Expected → Submitted → Approved</p>
          <div className="space-y-5">
            <FunnelBar label="Expected" count={totalExpected} pct={100} color="bg-gradient-to-r from-indigo-500 to-blue-500" delay={0.1} />
            <FunnelBar label="Submitted" count={submissions.length} pct={totalExpected > 0 ? (submissions.length / totalExpected) * 100 : 0} color="bg-gradient-to-r from-violet-500 to-purple-500" delay={0.2} />
            <FunnelBar label="Approved" count={approved.length} pct={totalExpected > 0 ? (approved.length / totalExpected) * 100 : 0} color="bg-gradient-to-r from-green-500 to-emerald-500" delay={0.3} />
          </div>
        </div>

        {/* AI Insights */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-6">
          <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" /> AI Insights</h2>
          <p className="text-[10px] text-gray-500 mb-4">Powered by AI analysis</p>
          <button onClick={handleInsights} disabled={insightLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-60 shadow-lg shadow-indigo-500/25 mb-4">
            {insightLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {insightLoading ? 'Analysing…' : 'Generate Insights'}
          </button>
          {insightLoading && (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}</div>
          )}
          {!insightLoading && insights.length > 0 && (
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <p className="text-xs font-bold text-indigo-300 mb-0.5">{INSIGHT_ICONS[i]} {insight.title}</p>
                  <p className="text-[11px] text-indigo-200/80 leading-relaxed">{insight.detail}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
