import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'dark' | 'outline';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variants = {
    default: 'bg-white border border-slate-200/80 shadow-2xs text-slate-900',
    elevated: 'bg-white border border-slate-200 shadow-sm text-slate-900',
    glass: 'bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-2xs text-slate-900',
    dark: 'bg-slate-900 border border-slate-850 shadow-md text-white',
    outline: 'bg-transparent border border-slate-200 text-slate-900',
  };

  return (
    <div className={`rounded-xl transition-all duration-150 ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`p-4 sm:p-5 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`px-4 sm:px-5 py-3 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex items-center justify-between gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
};
