import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, size = 'md', variant = 'default', ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div
        ref={ref}
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-gray-200',
          {
            'h-1': size === 'sm',
            'h-2': size === 'md',
            'h-3': size === 'lg',
          },
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full w-full flex-1 transition-all duration-500 ease-out',
            {
              'bg-primary-600': variant === 'default',
              'bg-green-600': variant === 'success',
              'bg-yellow-600': variant === 'warning',
              'bg-red-600': variant === 'error',
            }
          )}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };