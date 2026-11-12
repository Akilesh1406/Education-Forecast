import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { RiskLevel } from '@/types';

interface RiskBadgeProps {
  level: RiskLevel | string | null | undefined;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, className = '' }) => {
  if (!level) return null;

  const normalized = level.toLowerCase();

  if (normalized.includes('low')) {
    return (
      <Badge
        variant="outline"
        className={`bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 font-medium ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        Low Risk
      </Badge>
    );
  }

  if (normalized.includes('medium')) {
    return (
      <Badge
        variant="outline"
        className={`bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1.5 font-medium ${className}`}
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        Medium Risk
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={`bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 gap-1.5 font-medium ${className}`}
    >
      <AlertCircle className="w-3.5 h-3.5" />
      High Risk
    </Badge>
  );
};

