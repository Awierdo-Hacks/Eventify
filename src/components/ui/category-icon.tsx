import {
  BedDouble,
  CakeSlice,
  Camera,
  Car,
  ClipboardList,
  Flower2,
  Landmark,
  Mic,
  Music,
  Package,
  PartyPopper,
  ShieldCheck,
  ShowerHead,
  Sparkles,
  UtensilsCrossed,
  Video,
  type LucideIcon,
} from 'lucide-react';
import { findCategory } from '@/lib/catalog';
import { cn } from '@/lib/utils';

const ICONS: Record<string, LucideIcon> = {
  venues: Landmark,
  catering: UtensilsCrossed,
  dj: Music,
  photography: Camera,
  video: Video,
  decoration: Sparkles,
  flowers: Flower2,
  entertainment: PartyPopper,
  cake: CakeSlice,
  mc: Mic,
  transport: Car,
  accommodation: BedDouble,
  security: ShieldCheck,
  sanitary: ShowerHead,
  planning: ClipboardList,
  other: Package,
};

export function categoryIcon(value: string | null | undefined): LucideIcon {
  return ICONS[findCategory(value)?.slug ?? 'other'] ?? Package;
}

interface CategoryIconProps {
  category: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const tileSizes = {
  sm: 'size-8 rounded-lg [&_svg]:size-4',
  md: 'size-10 rounded-xl [&_svg]:size-5',
  lg: 'size-12 rounded-xl [&_svg]:size-6',
} as const;

/** Line icon on a tinted tile — replaces the emoji used in v1. */
function CategoryIcon({ category, size = 'md', className }: CategoryIconProps) {
  const Icon = categoryIcon(category);
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center bg-brand-50 text-brand-700', tileSizes[size], className)}>
      <Icon aria-hidden />
    </span>
  );
}

export { CategoryIcon };
