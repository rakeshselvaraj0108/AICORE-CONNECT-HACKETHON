import { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { Plus, Search, ExternalLink, Loader2, Clock, CheckCircle, XCircle, ChevronRight, Users, Calendar, Zap, X } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAppStore } from '../../store/useAppStore';
import { useTasks } from '../../hooks/useTasks';
import { useSubmissions } from '../../hooks/useSubmissions';
import { useRealtimeAdmin } from '../../hooks/useRealtime';
import CreateTaskModal from '../../components/admin/CreateTaskModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { clsx } from 'clsx';
import type { Task, TaskType, Submission, Profile } from '../../types';

const TYPE_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  Referral:          { bg: 'from-blue-500/20 to-blue-600/10', text: 'text-blue-400',   glow: 'shadow-blue-500/10' },
  'Content Creation':{ bg: 'from-purple-500/20 to-purple-600/10', text: 'text-purple-400', glow: 'shadow-purple-500/10' },
  'Social Media':    { bg: 'from-pink-500/20 to-pink-600/10', text: 'text-pink-400',   glow: 'shadow-pink-500/10' },
  'Event Promotion': { bg: 'from-amber-500/20 to-amber-600/10', text: 'text-amber-400', glow: 'shadow-amber-500/10' },
  Survey:            { bg: 'from-green-500/20 to-green-600/10', text: 'text-green-400', glow: 'shadow-green-500/10' },
};

function scoreColor(score: number | null) {
  if (score === null) return 'text-gray-400';
  if (score >= 80) return 'text-green-400 bg-green-500/10 border-green-500/20';
  if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-red-400 bg-red-500/10 border-red-500/20';
}

function ProofModal({ isOpen, onClose, url }: { isOpen: boolean; onClose: () => void; url: string }) {
  if (!isOpen) return null;

  const isText = url.startsWith('[text-response]');
  const isFileMeta = url.startsWith('[file-upload]');
  const isDataUrl = url.startsWith('data:');
  const isPdf = isDataUrl && url.startsWith('data:application/pdf');
  const isImage = isDataUrl && url.startsWith('data:image/');
  const isVideo = isDataUrl && url.startsWith('data:video/');

  let title = '📎 Submitted Proof';
  if (isText) title = '📝 Text Response';
  else if (isPdf) title = '📄 PDF Document';
  else if (isImage) title = '🖼️ Image';
  else if (isVideo) title = '🎬 Video';
  else if (isFileMeta) title = '📎 File Info';

  return ReactDOM.createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className={clsx('bg-gray-900 border border-white/10 rounded-2xl shadow-2xl', isPdf || isVideo ? 'max-w-3xl w-full h-[85vh]' : 'max-w-xl w-full max-h-[80vh]')}
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">{title}</h3>
          <div className="flex items-center gap-2">
            {isDataUrl && (
              <a href={url} download="proof" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-colors">
                ↓ Download
              </a>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"><X className="w-4 h-4 text-gray-400" /></button>
          </div>
        </div>

        {/* Content */}
        <div className={clsx('overflow-auto', isPdf || isVideo ? 'flex-1 h-[calc(85vh-56px)]' : 'p-5')}>
          {isPdf && (
            <iframe src={url} className="w-full h-full rounded-b-2xl" title="PDF Preview" />
          )}
          {isImage && (
            <div className="flex items-center justify-center p-4">
              <img src={url} alt="Proof" className="max-w-full max-h-[65vh] rounded-xl object-contain" />
            </div>
          )}
          {isVideo && (
            <video src={url} controls className="w-full h-full rounded-b-2xl" />
          )}
          {isText && (
            <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-words bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
              {url.replace('[text-response] ', '')}
            </div>
          )}
          {isFileMeta && (
            <div className="text-sm text-gray-300 bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
              {url.replace('[file-upload] ', '')}
            </div>
          )}
          {!isText && !isFileMeta && !isDataUrl && (
            <div className="text-center py-6">
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all">
                <ExternalLink className="w-4 h-4" /> Open Link
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

function ProofDisplay({ url }: { url: string }) {
  const [expanded, setExpanded] = useState(false);
  const isText = url.startsWith('[text-response]');
  const isFile = url.startsWith('[file-upload]');
  const isDataUrl = url.startsWith('data:');

  // Determine label and icon
  let label = '🔗 View Proof';
  if (isText) label = '📝 ' + url.replace('[text-response] ', '').substring(0, 50) + '…';
  else if (isFile) label = '📎 ' + url.replace('[file-upload] ', '').substring(0, 50) + '…';
  else if (isDataUrl && url.startsWith('data:application/pdf')) label = '📄 View PDF';
  else if (isDataUrl && url.startsWith('data:image/')) label = '🖼️ View Image';
  else if (isDataUrl && url.startsWith('data:video/')) label = '🎬 View Video';
  else if (url.includes('/storage/')) label = '📎 View File';

  // Everything is clickable and opens ProofModal
  return (
    <>
      <button onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
        className={clsx('text-xs rounded-lg px-3 py-1.5 border max-w-[220px] truncate text-left cursor-pointer hover:brightness-125 transition-all',
          isText ? 'text-gray-300 bg-white/5 border-white/10'
          : isFile ? 'text-gray-300 bg-violet-500/10 border-violet-500/20'
          : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20')}>
        {label}
      </button>
      <ProofModal isOpen={expanded} onClose={() => setExpanded(false)} url={url} />
    </>
  );
}

function ProfilePopover({ profile, submissions }: { profile: Profile; submissions: Submission[] }) {
  const [open, setOpen] = useState(false);
  const initials = profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const subs = submissions.filter((s) => s.ambassador_id === profile.id);
  const approved = subs.filter((s) => s.status === 'approved').length;
  const avgScore = subs.length > 0 ? Math.round(subs.reduce((a, s) => a + (s.ai_score ?? 0), 0) / subs.length) : 0;

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-3 text-left group">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">{initials}</div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">{profile.full_name}</p>
          <p className="text-xs text-gray-400 truncate">{profile.college ?? '—'}</p>
        </div>
      </button>
      {open && ReactDOM.createPortal(
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4" onClick={() => setOpen(false)}>
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
            className="bg-gray-900 border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-white">Ambassador Profile</h3>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-indigo-500/30">{initials}</div>
              <div>
                <p className="text-lg font-black text-white">{profile.full_name}</p>
                <p className="text-xs text-gray-400">{profile.college ?? '—'} · Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { label: 'Points', val: profile.points, color: 'text-indigo-400' },
                { label: 'Streak', val: `🔥 ${profile.streak}`, color: 'text-amber-400' },
                { label: 'Avg AI', val: avgScore, color: 'text-cyan-400' },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-white/[0.04] rounded-xl p-3 text-center border border-white/[0.06]">
                  <p className={clsx('text-lg font-black', color)}>{val}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-2">Submissions ({subs.length})</p>
              {subs.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0',
                    s.status === 'approved' ? 'bg-green-400' : s.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400')} />
                  <span className="text-xs text-gray-300 flex-1 truncate">{(s.tasks as any)?.title ?? 'Task'}</span>
                  {s.ai_score !== null && <span className="text-[10px] font-bold text-gray-500">AI {s.ai_score}</span>}
                </div>
              ))}
              {subs.length > 5 && <p className="text-[10px] text-gray-500 text-center pt-1">+{subs.length - 5} more</p>}
              {subs.length === 0 && <p className="text-xs text-gray-500 text-center py-3">No submissions yet</p>}
            </div>
            <div className="mt-4 pt-4 border-t border-white/[0.06] text-center">
              <p className="text-xs text-gray-500"><CheckCircle className="w-3 h-3 inline mr-1 text-green-400" />{approved} approved of {subs.length} total</p>
            </div>
          </motion.div>
        </motion.div>,
        document.body
      )}
    </>
  );
}

function SubmissionRow({ sub, task, reviewing, onApprove, onReject, allSubmissions }: {
  sub: Submission; task: Task | undefined; reviewing: string | null;
  onApprove: (id: string, pts: number) => void; onReject: (id: string) => void; allSubmissions: Submission[];
}) {
  const ambassador = sub.profiles;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-white/[0.03] backdrop-blur border border-white/[0.06] hover:border-white/10 transition-all group">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          {ambassador ? <ProfilePopover profile={ambassador} submissions={allSubmissions} /> : (
            <p className="text-sm text-gray-400">Unknown ambassador</p>
          )}
          <p className="text-[10px] text-gray-500 mt-1 pl-[52px]">{task?.title ?? '—'} · {formatDistanceToNow(new Date(sub.submitted_at), { addSuffix: true })}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {sub.ai_score !== null && (
            <span className={clsx('px-2.5 py-1 rounded-lg text-xs font-bold border', scoreColor(sub.ai_score))}>
              AI {sub.ai_score}/100
            </span>
          )}
          {sub.proof_url && <ProofDisplay url={sub.proof_url} />}
        </div>
      </div>
      {sub.ai_feedback && <p className="text-xs text-gray-500 italic mt-3 pl-[52px]">"{sub.ai_feedback}"</p>}
      <div className="flex items-center gap-2 mt-3 pl-[52px]">
        <button onClick={() => onApprove(sub.id, task?.points ?? 0)} disabled={reviewing === sub.id}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 text-xs font-bold transition-all active:scale-95 disabled:opacity-40">
          {reviewing === sub.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Approve
        </button>
        <button onClick={() => onReject(sub.id)} disabled={reviewing === sub.id}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 text-xs font-bold transition-all active:scale-95 disabled:opacity-40">
          <XCircle className="w-3.5 h-3.5" /> Reject
        </button>
      </div>
    </motion.div>
  );
}

export default function TaskManagement() {
  const { org, profile } = useAppStore();
  const { tasks, loading, fetchTasks, createTask, deleteTask } = useTasks();
  const { submissions, fetchSubmissions, approveSubmission, rejectSubmission } = useSubmissions();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!org) return;
    fetchTasks(org.id);
    fetchSubmissions(org.id);
  }, [org?.id]);

  useRealtimeAdmin(org?.id, {
    onNewSubmission: () => { if (org) fetchSubmissions(org.id); },
    onTaskUpdate: () => { if (org) fetchTasks(org.id); },
    onProfileUpdate: () => {},
  });

  const pendingSubs = useMemo(() => submissions.filter((s) => s.status === 'pending'), [submissions]);
  const filtered = useMemo(() => tasks.filter((t) => t.title.toLowerCase().includes(search.toLowerCase())), [tasks, search]);

  const handleCreateTask = async (
    taskData: { title: string; description: string; task_type: TaskType; points: number; deadline: string; assignment_type: 'global' | 'specific' },
    assignedAmbassadors: string[]
  ) => {
    if (!org || !profile) return { error: 'Not authenticated' };
    const { error } = await createTask(org.id, profile.id, taskData, assignedAmbassadors);
    if (error) { toast.error(error); return { error }; }
    toast.success('Task created!');
    return { error: null };
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await deleteTask(deleteId);
    setDeleteId(null);
    if (error) { toast.error(error); return; }
    toast.success('Task deleted');
  };

  const handleApprove = async (subId: string, taskPoints: number) => {
    if (!profile) return;
    setReviewing(subId);
    const { error } = await approveSubmission(subId, taskPoints, profile.id);
    setReviewing(null);
    if (error) { toast.error(error); return; }
    toast.success('Submission approved ✓');
    if (org) fetchSubmissions(org.id);
  };

  const handleReject = async (subId: string) => {
    if (!profile) return;
    setReviewing(subId);
    const { error } = await rejectSubmission(subId, profile.id);
    setReviewing(null);
    if (error) { toast.error(error); return; }
    toast.error('Submission rejected');
    if (org) fetchSubmissions(org.id);
  };

  if (loading) return <LoadingSpinner fullPage />;

  const taskSubs = (taskId: string) => submissions.filter((s) => s.task_id === taskId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Task Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">{tasks.length} active · {pendingSubs.length} pending review</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-500/25">
          <Plus className="w-4 h-4" /> Create Task
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks…"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all" />
      </div>

      {/* Task Cards Grid */}
      {filtered.length === 0 ? (
        <EmptyState icon="📋" title="No tasks yet" description="Create your first task to get ambassadors working." action={{ label: 'Create Task', onClick: () => setShowCreate(true) }} />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((task) => {
            const subs = taskSubs(task.id);
            const approved = subs.filter((s) => s.status === 'approved').length;
            const pending = subs.filter((s) => s.status === 'pending').length;
            const rejected = subs.filter((s) => s.status === 'rejected').length;
            const colors = TYPE_COLORS[task.task_type] ?? TYPE_COLORS.Survey;
            const daysLeft = Math.ceil((new Date(task.deadline).getTime() - Date.now()) / 86400000);
            const isOverdue = daysLeft < 0;
            const rate = subs.length > 0 ? Math.round((approved / subs.length) * 100) : 0;

            return (
              <motion.div key={task.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedTask(task)}
                className={clsx(
                  'relative cursor-pointer rounded-2xl border border-white/[0.08] bg-gradient-to-br',
                  colors.bg,
                  'backdrop-blur-md p-5 hover:border-white/15 transition-all hover:-translate-y-0.5 hover:shadow-xl',
                  colors.glow
                )}>
                {/* Badge row */}
                <div className="flex items-center justify-between mb-3">
                  <span className={clsx('text-[10px] font-bold uppercase tracking-widest', colors.text)}>{task.task_type}</span>
                  <span className={clsx('text-[10px] font-bold flex items-center gap-1',
                    isOverdue ? 'text-red-400' : daysLeft <= 3 ? 'text-amber-400' : 'text-gray-400')}>
                    <Clock className="w-3 h-3" /> {isOverdue ? 'Overdue' : `${daysLeft}d left`}
                  </span>
                </div>

                {/* Title & desc */}
                <h3 className="text-base font-bold text-white leading-snug mb-1">{task.title}</h3>
                <p className="text-xs text-gray-400 line-clamp-2 mb-4">{task.description}</p>

                {/* Points */}
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-lg font-black text-white">{task.points}</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">points</span>
                </div>

                {/* Stats bar */}
                <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-2">
                  <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-400" />{approved}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-400" />{pending}</span>
                  <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-400" />{rejected}</span>
                  <span className="ml-auto text-gray-500">{rate}% approved</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-700" style={{ width: `${rate}%` }} />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06]">
                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {format(new Date(task.created_at), 'MMM d, yyyy')}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(task.id); }}
                      className="text-[10px] text-gray-500 hover:text-red-400 transition-colors font-medium">Delete</button>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pending Reviews Section */}
      {pendingSubs.length > 0 && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-6">
          <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            Pending Reviews
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/20">{pendingSubs.length}</span>
          </h2>
          <p className="text-xs text-gray-500 mb-5">Ambassador submissions waiting for your approval</p>
          <div className="space-y-3">
            {pendingSubs.map((sub) => (
              <SubmissionRow key={sub.id} sub={sub} task={tasks.find((t) => t.id === sub.task_id)}
                reviewing={reviewing} onApprove={handleApprove} onReject={handleReject} allSubmissions={submissions} />
            ))}
          </div>
        </div>
      )}

      {/* Task Detail Slide-Over */}
      <AnimatePresence>
        {selectedTask && (() => {
          const subs = taskSubs(selectedTask.id);
          const colors = TYPE_COLORS[selectedTask.task_type] ?? TYPE_COLORS.Survey;
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={() => setSelectedTask(null)}>
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="w-full max-w-lg h-full bg-gray-950 border-l border-white/10 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={clsx('p-6 bg-gradient-to-br', colors.bg, 'border-b border-white/[0.06]')}>
                  <div className="flex items-start justify-between mb-4">
                    <span className={clsx('text-[10px] font-bold uppercase tracking-widest', colors.text)}>{selectedTask.task_type}</span>
                    <button onClick={() => setSelectedTask(null)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"><X className="w-4 h-4 text-gray-400" /></button>
                  </div>
                  <h2 className="text-xl font-black text-white mb-2">{selectedTask.title}</h2>
                  <p className="text-sm text-gray-300 leading-relaxed">{selectedTask.description}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-400" /><span className="text-sm font-bold text-white">{selectedTask.points} pts</span></div>
                    <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" /><span className="text-xs text-gray-400">Due {format(new Date(selectedTask.deadline), 'MMM d, yyyy')}</span></div>
                    <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-gray-400" /><span className="text-xs text-gray-400">{selectedTask.assignment_type}</span></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-px bg-white/[0.04] border-b border-white/[0.06]">
                  {[
                    { label: 'Approved', count: subs.filter(s => s.status === 'approved').length, color: 'text-green-400' },
                    { label: 'Pending',  count: subs.filter(s => s.status === 'pending').length,  color: 'text-amber-400' },
                    { label: 'Rejected', count: subs.filter(s => s.status === 'rejected').length, color: 'text-red-400' },
                  ].map(s => (
                    <div key={s.label} className="p-4 text-center bg-gray-950">
                      <p className={clsx('text-2xl font-black', s.color)}>{s.count}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Submissions list */}
                <div className="p-6">
                  <h3 className="text-sm font-bold text-white mb-4">All Submissions ({subs.length})</h3>
                  {subs.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No submissions yet</p>
                  ) : (
                    <div className="space-y-3">
                      {subs.map((sub) => {
                        const ambassador = sub.profiles;
                        const initials = ambassador?.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?';
                        const statusColors = { pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20', approved: 'bg-green-500/10 text-green-400 border-green-500/20', rejected: 'bg-red-500/10 text-red-400 border-red-500/20' };
                        return (
                          <div key={sub.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold">{initials}</div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{ambassador?.full_name ?? '—'}</p>
                                <p className="text-[10px] text-gray-500">{formatDistanceToNow(new Date(sub.submitted_at), { addSuffix: true })}</p>
                              </div>
                              <span className={clsx('px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border', statusColors[sub.status])}>{sub.status}</span>
                            </div>
                            {sub.ai_score !== null && (
                              <div className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border mb-2', scoreColor(sub.ai_score))}>AI Score: {sub.ai_score}/100</div>
                            )}
                            {sub.proof_url && <div className="mb-2"><ProofDisplay url={sub.proof_url} /></div>}
                            {sub.ai_feedback && <p className="text-xs text-gray-500 italic mb-3">"{sub.ai_feedback}"</p>}
                            {sub.status === 'pending' && (
                              <div className="flex gap-2">
                                <button onClick={() => handleApprove(sub.id, selectedTask.points)} disabled={reviewing === sub.id}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600/20 border border-green-500/30 text-green-400 text-xs font-bold transition-all active:scale-95 disabled:opacity-40">
                                  {reviewing === sub.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Approve
                                </button>
                                <button onClick={() => handleReject(sub.id)} disabled={reviewing === sub.id}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-bold transition-all active:scale-95 disabled:opacity-40">
                                  <XCircle className="w-3 h-3" /> Reject
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Create modal */}
      {org && <CreateTaskModal isOpen={showCreate} onClose={() => setShowCreate(false)} orgId={org.id} onCreate={handleCreateTask} />}
      <ConfirmDialog isOpen={!!deleteId} title="Delete Task" description="This will permanently remove the task." confirmLabel="Delete" danger onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
