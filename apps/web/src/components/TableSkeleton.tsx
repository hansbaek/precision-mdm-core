/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Skeleton } from '@/components/ui/skeleton';

const COLUMN_WIDTHS = ['w-10', 'w-16', 'w-40', 'w-28', 'w-28', 'w-16', 'w-64', 'w-8'];

export default function TableSkeleton({ rows = 9 }: { rows?: number }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
      {/* Header row */}
      <div className="bg-muted border-b border-border h-12 flex items-center px-4 gap-6">
        {COLUMN_WIDTHS.map((w, i) => (
          <Skeleton key={i} className={`h-3 ${w}`} />
        ))}
      </div>
      {/* Body rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center px-4 gap-6 h-11">
            {COLUMN_WIDTHS.map((w, i) => (
              <Skeleton key={i} className={`h-3.5 ${w}`} style={{ animationDelay: `${r * 60}ms` }} />
            ))}
          </div>
        ))}
      </div>
      {/* Footer */}
      <div className="bg-muted/50 border-t border-border h-14 flex items-center justify-between px-6">
        <Skeleton className="h-3 w-44" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}
