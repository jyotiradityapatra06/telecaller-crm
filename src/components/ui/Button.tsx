import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'indigo' | 'emerald';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.98]';

  const variants = {
    primary:
      'bg-blue-600 hover:bg-blue-700 text-white shadow-xs focus-visible:ring-blue-500',
    secondary:
      'bg-slate-800 hover:bg-slate-900 text-slate-100 shadow-xs border border-slate-700 focus-visible:ring-slate-500',
    outline:
      'border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 focus-visible:ring-slate-400 shadow-2xs',
    ghost:
      'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:ring-slate-400',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus-visible:ring-rose-500',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus-visible:ring-emerald-500',
    indigo:
      'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs focus-visible:ring-indigo-500',
    emerald:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus-visible:ring-emerald-500',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 min-h-[36px] sm:min-h-[34px] gap-1.5',
    md: 'text-xs sm:text-sm px-4 py-2 min-h-[44px] sm:min-h-[38px] gap-2',
    lg: 'text-sm sm:text-base px-5 py-2.5 min-h-[48px] sm:min-h-[44px] gap-2.5',
    icon: 'p-2 sm:p-2 min-h-[44px] min-w-[44px] sm:min-h-[38px] sm:min-w-[38px]',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
