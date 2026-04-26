import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../../store/useAppStore';
import { useTasks } from '../../hooks/useTasks';
import { useSubmissions } from '../../hooks/useSubmissions';
import { useBadges } from '../../hooks/useBadges';
import { useAmbassadors } from '../../hooks/useAmbassadors';
import { useRealtimeAmbassador } from '../../hooks/useRealtime';
import SubmitProofModal from '../../components/ambassador/SubmitProofModal';
import TaskCard from '../../components/ui/TaskCard';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { clsx } from 'clsx';
import type { Task, ApprovalLikelihood, SubmissionStatus } from '../../types';

type Tab = SubmissionStatus | 'available';
const TABS: { id: Tab; label: string }[] = [
  { id: 'available', label: 'Available' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

export default function MyTasks() {
  const { profile, org, openrouterKey, setProfile } = useAppStore();
  const { tasks, fetchTasks } = useTasks();
  const { submissions, fetchMySubmissions, submitProof } = useSubmissions();
  const { fetchBadges, checkAndAwardBadges } = useBadges();
  const { fetchAmbassadors } = useAmbassadors();
  const [tab, setTab] = useState<Tab>('available');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    if (!profile || !org) return;
    await Promise.all([fetchTasks(org.id, profile.id), fetchMySubmissions(profile.id), fetchBadges(profile.id), fetchAmbassadors(org.id)]);
  };

  useEffect(() => {
    if (!profile || !org) return;
    loadAll().then(() => setLoading(false));
  }, [profile?.id, org?.id]);

  // ─── Real-time: live task/submission updates ───
  useRealtimeAmbassador(profile?.id, org?.id, {
    onNewTask: () => { if (org && profile) fetchTasks(org.id, profile.id); },
    onSubmissionReviewed: () => { if (profile) fetchMySubmissions(profile.id); },
    onPointsUpdate: (pts) => {
      if (profile) setProfile({ ...profile, points: pts });
    },
    onLeaderboardChange: () => {},
  });

  const submittedTaskIds = useMemo(() => new Set(submissions.map((s) => s.task_id)), [submissions]);

  const tabCounts = useMemo(() => ({
    available: tasks.filter((t) => !submittedTaskIds.has(t.id)).length,
    pending: submissions.filter((s) => s.status === 'pending').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
  }), [tasks, submissions, submittedTaskIds]);

  const openModal = (task: Task) => {
    setActiveTask(task);
  };

  const handleConfirm = async (
    proofUrl: string,
    notes: string,
    aiScore: number | null,
    aiFeedback: string | null,
    aiLikelihood: ApprovalLikelihood | null
  ) => {
    if (!profile || !activeTask) return { error: 'Not authenticated' };
    const { error } = await submitProof(activeTask.id, profile.id, proofUrl.trim(), notes.trim(), aiScore, aiFeedback, aiLikelihood);
    if (error) { toast.error(error); return { error }; }
    toast.success('Submitted for review! 🎯');
    setActiveTask(null);
    if (profile && org) {
      const updatedSubs = await fetchMySubmissions(profile.id);
      const approvedSubs = updatedSubs.filter((s) => s.status === 'approved');
      const allAmbs = await fetchAmbassadors(org.id);
      const rank = [...allAmbs].sort((a, b) => b.points - a.points).findIndex((a) => a.id === profile.id) + 1;
      const taskTypes = approvedSubs.map((s) => (s.tasks as { task_type?: string })?.task_type ?? '');
      await checkAndAwardBadges(profile.id, {
        completedCount: approvedSubs.length,
        refCount: taskTypes.filter((t) => t === 'Referral').length,
        streak: profile.streak,
        points: profile.points,
        socialCount: taskTypes.filter((t) => t === 'Social Media').length,
        contentCount: taskTypes.filter((t) => t === 'Content Creation').length,
        rank,
        maxAiScore: Math.max(0, ...updatedSubs.map((s) => s.ai_score ?? 0)),
      });
    }
    return { error: null };
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Tasks</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-all relative', tab === id ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200')}>
            {label}
            {tabCounts[id] > 0 && (
              <span className={clsx('ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold', tab === id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400')}>
                {tabCounts[id]}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {tab === 'available' && (
            tasks.filter((t) => !submittedTaskIds.has(t.id)).length === 0
              ? <EmptyState icon="✅" title="All caught up!" description="No available tasks right now. Check back soon." />
              : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.filter((t) => !submittedTaskIds.has(t.id)).map((t) => (
                  <TaskCard key={t.id} task={t} showSubmitButton onSubmit={() => openModal(t)} />
                ))}
              </div>
          )}

          {tab !== 'available' && (() => {
            const filtered = submissions.filter((s) => s.status === tab);
            if (filtered.length === 0) return <EmptyState icon="📋" title={`No ${tab} submissions`} description="Nothing here yet." />;
            return (
              <div className="space-y-3">
                {filtered.map((s) => {
                  const task = tasks.find((t) => t.id === s.task_id) ?? (s.tasks as Task | undefined);
                  return (
                    <div key={s.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{task?.title ?? 'Task'}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">{new Date(s.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={clsx('px-2.5 py-1 rounded-full text-xs font-bold',
                            s.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            s.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          )}>{s.status}</span>
                          {s.status === 'approved' && s.points_awarded > 0 && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">+{s.points_awarded} pts</span>
                          )}
                          {s.ai_score !== null && (
                            <span className={clsx('px-2 py-0.5 rounded text-xs font-bold',
                              (s.ai_score ?? 0) >= 80 ? 'bg-green-100 text-green-700' : (s.ai_score ?? 0) >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                            )}>AI: {s.ai_score}</span>
                          )}
                        </div>
                      </div>
                      {s.proof_url && (
                        s.proof_url.startsWith('[text-response]') ? (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700">
                            📝 {s.proof_url.replace('[text-response] ', '').substring(0, 200)}{s.proof_url.length > 220 ? '…' : ''}
                          </p>
                        ) : (
                          <a href={s.proof_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-2">
                            <ExternalLink className="w-3.5 h-3.5" /> {s.proof_url.includes('/storage/') ? '📎 View uploaded file' : '🔗 View proof link'}
                          </a>
                        )
                      )}
                      {s.ai_feedback && <p className="text-xs text-gray-500 italic mt-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">"{s.ai_feedback}"</p>}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </motion.div>
      </AnimatePresence>

      <SubmitProofModal
        isOpen={!!activeTask}
        onClose={() => setActiveTask(null)}
        task={activeTask}
        openrouterKey={openrouterKey}
        ambassadorId={profile?.id ?? ''}
        onSubmit={handleConfirm}
      />
    </div>
  );
}
