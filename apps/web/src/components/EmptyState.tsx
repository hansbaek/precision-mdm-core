/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ComponentType } from 'react';
import { SearchX } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: ComponentType<{ className?: string }>;
  message: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon = SearchX,
  message,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 px-5 text-center">
      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
        <Icon className="h-6 w-6 text-muted-foreground/60" />
      </div>
      <p className="text-sm font-bold text-foreground">{message}</p>
      {description && <p className="text-xs text-muted-foreground -mt-1">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction} className="mt-1 text-xs font-bold">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
