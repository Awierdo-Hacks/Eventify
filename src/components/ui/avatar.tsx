import Image from 'next/image';
import { cn, initials } from '@/lib/utils';

const sizes = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg',
  xl: 'size-20 text-2xl',
} as const;

const pixels = { sm: 32, md: 40, lg: 56, xl: 80 } as const;

interface AvatarProps {
  name: string | null | undefined;
  src?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}

/** Photo when available, otherwise initials on a soft brand tile. */
function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-100 to-sun-100 font-bold text-brand-800',
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {src ? (
        <Image src={src} alt="" width={pixels[size]} height={pixels[size]} className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}

export { Avatar };
