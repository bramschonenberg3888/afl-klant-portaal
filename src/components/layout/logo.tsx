import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const sizes = {
    sm: { width: 24, height: 24 },
    md: { width: 40, height: 40 },
    lg: { width: 56, height: 56 },
  };

  const { width, height } = sizes[size];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Image
        src="/logo.png"
        alt="Logistiekconcurrent"
        width={width}
        height={height}
        className="shrink-0"
      />
      {showText && (
        <div className="flex flex-col">
          <span
            className={cn(
              'font-semibold leading-tight',
              size === 'sm' && 'text-sm',
              size === 'md' && 'text-base',
              size === 'lg' && 'text-lg'
            )}
          >
            Logistiekconcurrent
          </span>
          <span
            className={cn(
              'leading-tight opacity-70',
              size === 'sm' && 'text-xs',
              size === 'md' && 'text-sm',
              size === 'lg' && 'text-sm'
            )}
          >
            Veiligheidsportaal
          </span>
        </div>
      )}
    </div>
  );
}
