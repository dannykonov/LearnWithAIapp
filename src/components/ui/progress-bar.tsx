import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number; // Progress percentage (0-100)
  className?: string;
}

export function ProgressBar({ progress, className }: ProgressBarProps) {
  // Ensure progress is between 0 and 100
  const safeProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={cn("h-2 w-full bg-gray-200 rounded-full overflow-hidden", className)}>
      <div
        className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
        style={{ width: `${safeProgress}%` }}
      />
    </div>
  );
} 