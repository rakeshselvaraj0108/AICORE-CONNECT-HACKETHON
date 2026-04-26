import { motion } from 'framer-motion';
import { Flame, Trophy } from 'lucide-react';
import type { Profile } from '../../types';
import { clsx } from 'clsx';

interface Props {
  profile: Profile;
  rank: number;
  isCurrentUser?: boolean;
  gapToPrev?: number;
  prevName?: string;
  delay?: number;
  onClick?: () => void;
}

const rankEmoji: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function LeaderboardRow({ profile, rank, isCurrentUser, gapToPrev, prevName, delay = 0, onClick }: Props) {
  const initials = profile.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const isTop3 = rank <= 3;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.25 }}
      whileHover={{ x: 4 }}
      onClick={onClick}
      className={clsx(
        'flex items-center gap-4 p-3.5 rounded-xl cursor-pointer transition-all duration-200',
        isCurrentUser
          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-300 dark:border-indigo-700'
          : isTop3
          ? 'bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border border-gray-100 dark:border-gray-800'
          : 'hover:bg-gray-50 dark:hover:bg-gray-900/50',
      )}
    >
      <div className="w-10 text-center flex-shrink-0">
        {isTop3 ? (
          <span className="text-xl">{rankEmoji[rank]}</span>
        ) : (
          <span className="text-sm font-bold text-gray-400">#{rank}</span>
        )}
      </div>

      <div className={clsx(
        'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
        rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
        rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
        rank === 3 ? 'bg-gradient-to-br from-amber-500 to-amber-700' :
        'bg-gradient-to-br from-indigo-500 to-violet-600',
      )}>
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{profile.full_name}</p>
          {isCurrentUser && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">YOU</span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{profile.college ?? '—'}</p>
        {gapToPrev !== undefined && prevName && rank > 1 && (
          <p className="text-xs text-gray-400 mt-0.5">{gapToPrev} pts behind {prevName}</p>
        )}
      </div>

      <div className="flex items-center gap-1 text-amber-500 flex-shrink-0">
        <Flame className="w-4 h-4" />
        <span className="text-sm font-semibold">{profile.streak}</span>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Trophy className="w-4 h-4 text-amber-500" />
        <span className="text-base font-bold text-gray-900 dark:text-white">{profile.points}</span>
        <span className="text-xs text-gray-400">pts</span>
      </div>
    </motion.div>
  );
}
