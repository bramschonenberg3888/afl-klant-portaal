import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className }: LogoProps) {
  const sizes = {
    sm: { width: 95, height: 32, className: 'h-8' },
    md: { width: 142, height: 48, className: 'h-12' },
    lg: { width: 189, height: 64, className: 'h-16' },
  };

  const { width, height, className: sizeClass } = sizes[size];

  return (
    <Image
      src="/logo-lc.svg"
      alt="Logistiekconcurrent"
      width={width}
      height={height}
      className={cn(sizeClass, 'w-auto', className)}
    />
  );
}
