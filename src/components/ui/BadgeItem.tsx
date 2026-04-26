import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  emoji: string;
  name: string;
  description: string;
  progressHint: string;
  earned: boolean;
  earnedAt?: string;
  delay?: number;
}

export default function BadgeItem({ emoji, name, description, progressHint, earned, earnedAt, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3, type: 'spring', stiffness: 200 }}
      whileHover={earned ? { scale: 1.04 } : {}}
      className={clsx(
        'rounded-2xl border p-4 text-center relative overflow-hidden transition-all duration-200',
        earned
          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
          : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800',
      )}
    >
      <div className={clsx('relative inline-block', !earned && 'grayscale opacity-50')}>
        <span className="text-4xl">{emoji}</span>
        {!earned && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/40 rounded">
            <Lock className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
      <h4 className={clsx('text-sm font-bold mt-2', earned ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600')}>
        {name}
      </h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      {earned ? (
        <div className="mt-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
            ✓ Earned
          </span>
          {earnedAt && (
            <p className="text-xs text-gray-400 mt-0.5">{new Date(earnedAt).toLocaleDateString()}</p>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-400 mt-2 italic">{progressHint}</p>
      )}
    </motion.div>
  );
}
