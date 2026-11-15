import { MessageSquare } from 'lucide-react';

/** Desktop placeholder next to the inbox; on phones the inbox itself fills the screen. */
export default function MessagesIndexPage() {
  return (
    <div className="hidden flex-1 flex-col items-center justify-center px-6 text-center lg:flex">
      <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <MessageSquare className="size-7" aria-hidden />
      </span>
      <p className="mt-4 text-lg font-bold text-ink-950">Kies een gesprek</p>
      <p className="mt-1 max-w-xs text-sm text-ink-600">Selecteer links een gesprek om de berichten te lezen.</p>
    </div>
  );
}
