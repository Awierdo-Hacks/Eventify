'use client';

import { MessageSquare } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { useAction } from '@/hooks/use-action';
import { openConversationAction } from '@/features/messaging/open-conversation';

/** Opens (or creates) the conversation with another user. */
function ChatButton({ recipientId, label = 'Bericht', ...props }: { recipientId: string; label?: string } & ButtonProps) {
  const { run, pending } = useAction(openConversationAction);
  return (
    <Button variant="outline" size="sm" {...props} loading={pending} onClick={() => run({ recipientId })}>
      <MessageSquare aria-hidden /> {label}
    </Button>
  );
}

export { ChatButton };
