import { clsx } from 'clsx';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

export default function LoadingSpinner({ size = 'md', fullPage = false }: Props) {
  const sizeClass = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-4' }[size];

  const spinner = (
    <div className={clsx('rounded-full border-indigo-600 border-t-transparent animate-spin', sizeClass)} />
  );

  if (fullPage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-950">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Loading CampusConnect...</p>
      </div>
    );
  }

  return spinner;
}
