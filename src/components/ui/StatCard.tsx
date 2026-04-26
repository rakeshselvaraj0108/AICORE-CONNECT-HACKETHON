import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  badge?: { label: string; color: string };
  subtitle?: string;
}

export default function StatCard({ title, value, icon: Icon, iconColor = 'text-indigo-600', iconBg = 'bg-indigo-50 dark:bg-indigo-900/30', badge, subtitle }: Props) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {badge && (
            <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold mt-2', badge.color)}>
              {badge.label}
            </span>
          )}
        </div>
        <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon className={clsx('w-6 h-6', iconColor)} />
        </div>
      </div>
    </div>
  );
}
