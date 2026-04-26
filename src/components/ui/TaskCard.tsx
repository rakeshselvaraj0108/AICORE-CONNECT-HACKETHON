import { motion } from 'framer-motion';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import type { Task } from '../../types';
import { clsx } from 'clsx';

interface Props {
  task: Task;
  submittedCount?: number;
  approvedCount?: number;
  pendingCount?: number;
  onSubmit?: () => void;
  onReview?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showSubmitButton?: boolean;
  alreadySubmitted?: boolean;
}

const typeColors: Record<string, string> = {
  Referral: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'Content Creation': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'Social Media': 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  'Event Promotion': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Survey: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

export default function TaskCard({ task, submittedCount = 0, approvedCount = 0, pendingCount = 0, onSubmit, onReview, onEdit, onDelete, showSubmitButton, alreadySubmitted }: Props) {
  const daysLeft = Math.ceil((new Date(task.deadline).getTime() - Date.now()) / 86400000);
  const isOverdue = daysLeft < 0;
  const deadlineColor = isOverdue ? 'text-red-500' : daysLeft <= 3 ? 'text-amber-500' : 'text-green-600 dark:text-green-400';
  const approvalRate = submittedCount > 0 ? Math.round((approvedCount / submittedCount) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', typeColors[task.task_type] ?? typeColors.Survey)}>
          {task.task_type}
        </span>
        <div className={clsx('flex items-center gap-1 text-xs font-medium', deadlineColor)}>
          {isOverdue ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
          {isOverdue ? 'Overdue' : `${daysLeft}d left`}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-snug">{task.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{task.description}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-indigo-600">{task.points}</span>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">points</span>
      </div>

      {submittedCount > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{submittedCount} submitted · {approvedCount} approved · {pendingCount} pending</span>
            <span>{approvalRate}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${approvalRate}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mt-auto pt-1">
        {showSubmitButton && (
          <button
            onClick={onSubmit}
            disabled={alreadySubmitted}
            className={clsx(
              'flex-1 py-2 text-sm font-medium rounded-xl transition-all active:scale-95',
              alreadySubmitted
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700',
            )}
          >
            {alreadySubmitted ? 'Submitted ✓' : 'Submit Proof'}
          </button>
        )}
        {pendingCount > 0 && onReview && (
          <button
            onClick={onReview}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Review {pendingCount}
          </button>
        )}
        {onEdit && (
          <button onClick={onEdit} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs font-medium">
            Edit
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-xs font-medium">
            Delete
          </button>
        )}
      </div>
    </motion.div>
  );
}
