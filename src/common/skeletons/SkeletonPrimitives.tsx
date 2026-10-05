import type { CSSProperties, ReactNode } from 'react';

export interface SkeletonBaseProps {
  className?: string;
  style?: CSSProperties;
  pulse?: boolean;
}

export interface SkeletonLineProps extends SkeletonBaseProps {
  width?: string | number;
  height?: string | number;
}

export function SkeletonLine({
  width = '100%',
  height,
  pulse = false,
  className = '',
  style = {},
}: SkeletonLineProps) {
  return (
    <div
      className={`ax-skeleton ax-skeleton--line ${pulse ? 'ax-skeleton--pulse' : ''} ${className}`}
      style={{
        width,
        ...(height ? { height } : {}),
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

export interface SkeletonCircleProps extends SkeletonBaseProps {
  size?: number | string;
}

export function SkeletonCircle({
  size = 40,
  pulse = false,
  className = '',
  style = {},
}: SkeletonCircleProps) {
  const dim = typeof size === 'number' ? `${size}px` : size;
  return (
    <div
      className={`ax-skeleton ax-skeleton--circle ${pulse ? 'ax-skeleton--pulse' : ''} ${className}`}
      style={{
        width: dim,
        height: dim,
        flex: '0 0 auto',
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

export interface SkeletonRectProps extends SkeletonBaseProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export function SkeletonRect({
  width = '100%',
  height = 80,
  borderRadius,
  pulse = false,
  className = '',
  style = {},
}: SkeletonRectProps) {
  return (
    <div
      className={`ax-skeleton ax-skeleton--rect ${pulse ? 'ax-skeleton--pulse' : ''} ${className}`}
      style={{
        width,
        height,
        ...(borderRadius !== undefined ? { borderRadius } : {}),
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

export interface SkeletonRowProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function SkeletonRow({ children, className = '', style = {} }: SkeletonRowProps) {
  return (
    <div className={`ax-skeleton-row ${className}`} style={style} aria-hidden="true">
      {children}
    </div>
  );
}
