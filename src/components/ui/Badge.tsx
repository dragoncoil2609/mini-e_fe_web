import type { HTMLAttributes, ReactNode } from 'react';

type BadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'muted';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  children: ReactNode;
};

export default function Badge({
  variant = 'primary',
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={`mochi-badge mochi-badge-${variant} ${className}`} {...props}>
      {children}
    </span>
  );
}