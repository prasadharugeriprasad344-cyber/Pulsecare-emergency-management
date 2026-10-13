import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  iconColor = 'text-teal-medical',
  iconBg = 'bg-teal-soft',
  trend,
}) => {
  return (
    <div className="bg-surface rounded-2xl p-5 border border-border shadow-subtle hover:shadow-card transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-text-secondary tracking-wide uppercase">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-2xl sm:text-3xl font-heading font-extrabold text-navy tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-semibold text-text-secondary">
            {unit}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50 text-xs">
        {subtitle && (
          <span className="text-text-secondary text-[11px] truncate">
            {subtitle}
          </span>
        )}
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ml-auto
              ${trend.isPositive ? 'bg-green-50 text-priority-low' : 'bg-red-50 text-priority-critical'}
            `}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
};
