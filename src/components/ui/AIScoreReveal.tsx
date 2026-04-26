import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { ApprovalLikelihood } from '../../types';

interface Props {
  isLoading: boolean;
  score: number | null;
  feedback: string | null;
  approvalLikelihood: ApprovalLikelihood | null;
}

export default function AIScoreReveal({ isLoading, score, feedback, approvalLikelihood }: Props) {
  const [displayCount, setDisplayCount] = useState(0);
  const [typedFeedback, setTypedFeedback] = useState('');

  useEffect(() => {
    if (score === null || isLoading) { setDisplayCount(0); setTypedFeedback(''); return; }
    let frame: number;
    const start = Date.now();
    const duration = 1200;
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      setDisplayCount(Math.round(progress * score));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score, isLoading]);

  useEffect(() => {
    if (!feedback || isLoading) { setTypedFeedback(''); return; }
    const delay = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        setTypedFeedback(feedback.slice(0, i + 1));
        i++;
        if (i >= feedback.length) clearInterval(interval);
      }, 20);
      return () => clearInterval(interval);
    }, 800);
    return () => clearTimeout(delay);
  }, [feedback, isLoading]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
          <Loader2 className="w-10 h-10 text-indigo-600" />
        </motion.div>
        <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">AI is analysing your submission…</p>
      </div>
    );
  }

  if (score === null) return null;

  const color = score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#EF4444';
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (displayCount / 100) * circumference;

  const likelihood = approvalLikelihood ?? 'Medium';
  const likelihoodStyle: Record<ApprovalLikelihood, string> = {
    High: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Low: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <motion.circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black" style={{ color }}>{displayCount}</span>
          <span className="text-xs text-gray-400">/ 100</span>
        </div>
      </div>

      <span className={clsx('px-3 py-1 rounded-full text-sm font-semibold', likelihoodStyle[likelihood])}>
        {likelihood} Approval Likelihood
      </span>

      {feedback && (
        <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">AI Feedback</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed min-h-[2.5rem]">
            {typedFeedback}<span className="animate-pulse">|</span>
          </p>
        </div>
      )}
    </div>
  );
}
