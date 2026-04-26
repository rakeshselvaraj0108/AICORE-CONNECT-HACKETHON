import { CheckCircle, XCircle, Send, Plus, Award, Zap } from 'lucide-react';
import type { ActivityItem } from '../../types';
import { formatTimeAgo } from '../../types';
import { clsx } from 'clsx';

interface Props {
  items: ActivityItem[];
  maxItems?: number;
}

const typeConfig: Record<string, { Icon: typeof Send; color: string }> = {
  submission: { Icon: Send, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' },
  approval: { Icon: CheckCircle, color: 'text-green-600 bg-green-50 dark:bg-green-900/30' },
  rejection: { Icon: XCircle, color: 'text-red-500 bg-red-50 dark:bg-red-900/30' },
  task_created: { Icon: Plus, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
  badge_earned: { Icon: Award, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30' },
  points: { Icon: Zap, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' },
};

export default function ActivityFeed({ items, maxItems = 10 }: Props) {
  const displayed = items.slice(0, maxItems);

  if (displayed.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">No activity yet</p>;
  }

  return (
    <div className="space-y-3">
      {displayed.map((item) => {
        const config = typeConfig[item.type ?? 'submission'] ?? typeConfig.submission;
        const { Icon, color } = config;
        return (
          <div key={item.id} className="flex items-start gap-3">
            <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{item.text}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatTimeAgo(item.created_at)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
