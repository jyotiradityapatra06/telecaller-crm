import React from 'react';
import { GraduationCap, Building2, Layers } from 'lucide-react';
import { BusinessBrand, BrandAccess } from '../../types';

interface BrandBadgeProps {
  brand?: BusinessBrand | BrandAccess | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const BrandBadge: React.FC<BrandBadgeProps> = ({
  brand,
  size = 'sm',
  showIcon = true,
  className = '',
}) => {
  const isVidya = brand === 'APNI_VIDYA';
  const isEstate = brand === 'APNI_ESTATE';
  const isBoth = brand === 'BOTH' || brand === 'ALL';

  const sizeStyles = {
    xs: 'text-xs px-2 py-0.5 gap-1 font-medium',
    sm: 'text-xs px-2.5 py-0.5 gap-1.5 font-semibold',
    md: 'text-xs sm:text-sm px-3 py-1 gap-1.5 font-bold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-4.5 h-4.5',
  };

  if (isVidya) {
    return (
      <span
        className={`inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 tracking-tight whitespace-nowrap shadow-2xs ${sizeStyles[size]} ${className}`}
      >
        {showIcon && <GraduationCap className={`${iconSizes[size]} text-indigo-600 shrink-0`} />}
        <span>Apni Vidya</span>
      </span>
    );
  }

  if (isEstate) {
    return (
      <span
        className={`inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 tracking-tight whitespace-nowrap shadow-2xs ${sizeStyles[size]} ${className}`}
      >
        {showIcon && <Building2 className={`${iconSizes[size]} text-emerald-600 shrink-0`} />}
        <span>Apni Estate</span>
      </span>
    );
  }

  if (isBoth) {
    return (
      <span
        className={`inline-flex items-center rounded-lg border border-purple-200 bg-purple-50 text-purple-700 tracking-tight whitespace-nowrap shadow-2xs ${sizeStyles[size]} ${className}`}
      >
        {showIcon && <Layers className={`${iconSizes[size]} text-purple-600 shrink-0`} />}
        <span>Dual Brand</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 text-slate-700 tracking-tight whitespace-nowrap ${sizeStyles[size]} ${className}`}
    >
      {brand || 'General'}
    </span>
  );
};
