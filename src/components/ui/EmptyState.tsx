import { clsx } from 'clsx';

interface Props {
  icon?: string;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export default function EmptyState({ icon = '📭', title, description, action, className }: Props) {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-16 text-center px-4', className)}>
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors active:scale-95"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
