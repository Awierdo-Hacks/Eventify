'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, FileText, Flag, Loader2, Paperclip, SendHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAction } from '@/hooks/use-action';
import { formatDate, formatFileSize, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  loadEarlierAction,
  markReadAction,
  sendChatQuoteAction,
  sendMessageAction,
  type SendMessageInput,
} from '@/features/messaging/actions';
import type { MessageView, Thread as ThreadData } from '@/features/messaging/queries';
import { QuoteCard } from '@/features/quotes/components/quote-card';
import { emptyQuoteDraft, QuoteFormFields } from '@/features/quotes/components/quote-form-fields';
import type { LinkableEvent } from '@/features/quotes/queries';
import { uploadFileAction, type UploadedFile } from '@/features/uploads/actions';

const POLL_MS = 4_000;

interface ThreadProps {
  thread: ThreadData;
  viewer: { id: string; role: string };
  linkableEvents: LinkableEvent[];
}

/** Merge message lists by id, keeping chronological order. Newer copies win. */
function mergeMessages(current: MessageView[], incoming: MessageView[]): MessageView[] {
  if (incoming.length === 0) return current;
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function Thread({ thread, viewer, linkableEvents }: ThreadProps) {
  const [messages, setMessages] = React.useState(thread.messages);
  const [hasMore, setHasMore] = React.useState(thread.hasMore);
  const [text, setText] = React.useState('');
  const [files, setFiles] = React.useState<UploadedFile[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [quoteOpen, setQuoteOpen] = React.useState(false);

  const scroller = React.useRef<HTMLDivElement>(null);
  const fileInput = React.useRef<HTMLInputElement>(null);
  const textarea = React.useRef<HTMLTextAreaElement>(null);
  const stickToBottom = React.useRef(true);
  const lastSeen = React.useRef(thread.messages.at(-1)?.createdAt ?? new Date().toISOString());

  // Server data changes after an action elsewhere on the page (e.g. a quote
  // was accepted): fold the fresh copies into what is on screen.
  React.useEffect(() => setMessages((current) => mergeMessages(current, thread.messages)), [thread.messages]);

  React.useEffect(() => {
    const last = messages.at(-1);
    if (last && last.createdAt > lastSeen.current) lastSeen.current = last.createdAt;
    if (stickToBottom.current && scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [messages]);

  // Poll for new messages while the conversation is on screen.
  React.useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const response = await fetch(`/api/conversations/${thread.id}/messages?after=${encodeURIComponent(lastSeen.current)}`, { cache: 'no-store' });
        if (!response.ok) return;
        const data = (await response.json()) as { messages: MessageView[] };
        if (!cancelled && data.messages.length > 0) setMessages((current) => mergeMessages(current, data.messages));
      } catch {
        // Offline: the next tick tries again.
      }
    };
    const timer = window.setInterval(poll, POLL_MS);
    document.addEventListener('visibilitychange', poll);
    void markReadAction({ conversationId: thread.id });
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', poll);
    };
  }, [thread.id]);

  const onScroll = () => {
    const element = scroller.current;
    if (element) stickToBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 120;
  };

  const earlier = useAction(loadEarlierAction, {
    onSuccess: (data) => {
      const element = scroller.current;
      const previousHeight = element?.scrollHeight ?? 0;
      stickToBottom.current = false;
      setMessages((current) => mergeMessages(current, data.messages));
      setHasMore(data.hasMore);
      // Keep the message the reader was looking at in place.
      requestAnimationFrame(() => {
        if (element) element.scrollTop += element.scrollHeight - previousHeight;
      });
    },
  });

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const picked = [...list].slice(0, 5 - files.length);
    setUploading(true);
    for (const file of picked) {
      const formData = new FormData();
      formData.set('file', file);
      formData.set('folder', 'chat');
      const result = await uploadFileAction(formData).catch(() => null);
      if (result?.ok) setFiles((current) => [...current, result.data]);
      else toast.error(result?.error ?? `Uploaden van ${file.name} is mislukt.`);
    }
    setUploading(false);
    if (fileInput.current) fileInput.current.value = '';
  };

  const send = async () => {
    const content = text.trim();
    if ((!content && files.length === 0) || sending || uploading) return;
    setSending(true);
    const result = await sendMessageAction({ conversationId: thread.id, content, attachments: files as SendMessageInput['attachments'] }).catch(() => null);
    setSending(false);
    if (result?.ok) {
      stickToBottom.current = true;
      setMessages((current) => mergeMessages(current, [result.data]));
      setText('');
      setFiles([]);
      if (textarea.current) textarea.current.style.height = 'auto';
      textarea.current?.focus();
    } else {
      toast.error(result?.error ?? 'Je bericht kon niet verstuurd worden.');
    }
  };

  const other = thread.other;
  const canWrite = other?.available ?? false;
  const isProvider = viewer.role === 'PROVIDER';
  const canSendQuote = isProvider && canWrite && other?.role === 'CUSTOMER';

  let lastDay = '';

  return (
    <section className="flex min-h-0 flex-1 flex-col" aria-label={`Gesprek met ${other?.name ?? 'gebruiker'}`}>
      <header className="flex items-center gap-3 border-b border-ink-100 px-3 py-3 sm:px-5">
        <Link href="/messages" className="flex size-9 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100 lg:hidden" aria-label="Terug naar gesprekken">
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <Avatar name={other?.name} src={other?.image} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-bold text-ink-950">
            {other?.providerId ? (
              <Link href={`/providers/${other.providerId}`} className="hover:text-brand-700">
                {other.name}
              </Link>
            ) : (
              (other?.name ?? 'Gesprek')
            )}
          </h2>
          {other?.contactName && <p className="truncate text-xs text-ink-500">{other.contactName}</p>}
        </div>
        {other && (
          <Link
            href={`/melden?type=MESSAGE&id=${thread.id}`}
            className="flex size-9 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700"
            aria-label="Dit gesprek melden"
            title="Dit gesprek melden"
          >
            <Flag className="size-4" aria-hidden />
          </Link>
        )}
      </header>

      <div ref={scroller} onScroll={onScroll} className="flex-1 space-y-1 overflow-y-auto bg-ink-50/50 px-3 py-4 sm:px-5" role="log" aria-live="polite">
        {hasMore && (
          <div className="flex justify-center pb-3">
            <Button
              variant="outline"
              size="sm"
              loading={earlier.pending}
              onClick={() => messages[0] && earlier.run({ conversationId: thread.id, before: messages[0].createdAt })}
            >
              Eerdere berichten laden
            </Button>
          </div>
        )}
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-500">Nog geen berichten. Stuur het eerste bericht.</p>
        )}
        {messages.map((message) => {
          const own = message.senderId === viewer.id;
          const day = formatDate(message.createdAt);
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <React.Fragment key={message.id}>
              {showDay && (
                <div className="flex justify-center py-3">
                  <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-ink-500 shadow-xs ring-1 ring-ink-200">{day}</span>
                </div>
              )}
              {message.type === 'SYSTEM' ? (
                <p className="py-1 text-center text-xs text-ink-500">{message.content}</p>
              ) : message.quote ? (
                <div className={cn('flex py-1', own ? 'justify-end' : 'justify-start')}>
                  <div className="w-full max-w-md">
                    <QuoteCard
                      quote={message.quote}
                      viewer={viewer.role === 'CUSTOMER' ? 'customer' : 'provider'}
                      linkableEvents={linkableEvents}
                      hideChat
                    />
                    <p className={cn('mt-1 text-[0.6875rem] text-ink-500', own && 'text-right')}>{formatTime(message.createdAt)}</p>
                  </div>
                </div>
              ) : (
                <div className={cn('flex py-0.5', own ? 'justify-end' : 'justify-start')}>
                  <div className={cn('flex max-w-[85%] flex-col gap-1 sm:max-w-[70%]', own ? 'items-end' : 'items-start')}>
                    {message.attachments.map((attachment) =>
                      attachment.fileType.startsWith('image/') ? (
                        <a key={attachment.id} href={attachment.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-2xl ring-1 ring-ink-200">
                          <Image src={attachment.url} alt={attachment.fileName} width={320} height={240} className="h-auto max-h-72 w-auto max-w-full object-cover" />
                        </a>
                      ) : (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-sm ring-1 ring-ink-200 hover:bg-ink-50"
                        >
                          <FileText className="size-5 shrink-0 text-brand-600" aria-hidden />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-ink-950">{attachment.fileName}</span>
                            <span className="block text-xs text-ink-500">{formatFileSize(attachment.fileSize)}</span>
                          </span>
                        </a>
                      ),
                    )}
                    {message.content && (
                      <p
                        className={cn(
                          'whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[0.9375rem] leading-relaxed',
                          own ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md bg-surface text-ink-900 ring-1 ring-ink-200',
                        )}
                      >
                        {message.content}
                      </p>
                    )}
                    <span className="px-1 text-[0.6875rem] text-ink-500">{formatTime(message.createdAt)}</span>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {canWrite ? (
        <div className="border-t border-ink-100 bg-surface p-3 sm:p-4">
          {files.length > 0 && (
            <ul className="mb-2 flex flex-wrap gap-2">
              {files.map((file) => (
                <li key={file.url} className="flex items-center gap-2 rounded-lg bg-ink-100 py-1 pl-3 pr-1 text-sm">
                  <span className="max-w-40 truncate font-medium text-ink-800">{file.fileName}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((current) => current.filter((item) => item.url !== file.url))}
                    className="flex size-6 items-center justify-center rounded-md text-ink-500 hover:bg-ink-200"
                    aria-label={`${file.fileName} verwijderen`}
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
            className="flex items-end gap-2"
          >
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
              multiple
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => void onFiles(event.target.files)}
              aria-label="Bijlage kiezen"
            />
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => fileInput.current?.click()} disabled={uploading || files.length >= 5} aria-label="Bijlage toevoegen">
              {uploading ? <Loader2 className="animate-spin" aria-hidden /> : <Paperclip aria-hidden />}
            </Button>
            {canSendQuote && (
              <Button variant="outline" className="shrink-0" onClick={() => setQuoteOpen(true)}>
                <FileText aria-hidden /> <span className="hidden sm:inline">Offerte</span>
                <span className="sr-only sm:hidden">Offerte sturen</span>
              </Button>
            )}
            <label htmlFor="message-input" className="sr-only">
              Bericht
            </label>
            <textarea
              id="message-input"
              ref={textarea}
              value={text}
              rows={1}
              maxLength={4000}
              placeholder="Typ een bericht"
              onChange={(event) => {
                setText(event.target.value);
                event.target.style.height = 'auto';
                event.target.style.height = `${Math.min(event.target.scrollHeight, 160)}px`;
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  void send();
                }
              }}
              className="max-h-40 min-h-10 flex-1 resize-none rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-2 text-[0.9375rem] leading-relaxed placeholder:text-ink-400 focus:border-brand-500 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand-500/15"
            />
            <Button type="submit" size="icon" className="shrink-0" loading={sending} disabled={uploading || (!text.trim() && files.length === 0)} aria-label="Versturen">
              {!sending && <SendHorizontal aria-hidden />}
            </Button>
          </form>
        </div>
      ) : (
        <p className="border-t border-ink-100 bg-surface px-5 py-4 text-center text-sm text-ink-600">
          Je kunt in dit gesprek geen berichten meer sturen.
        </p>
      )}

      {canSendQuote && (
        <ChatQuoteDialog
          open={quoteOpen}
          onOpenChange={setQuoteOpen}
          conversationId={thread.id}
          customerName={other?.name ?? 'de klant'}
          onSent={(message) => {
            stickToBottom.current = true;
            setMessages((current) => mergeMessages(current, [message]));
          }}
        />
      )}
    </section>
  );
}

function ChatQuoteDialog({
  open,
  onOpenChange,
  conversationId,
  customerName,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  customerName: string;
  onSent: (message: MessageView) => void;
}) {
  const [draft, setDraft] = React.useState(emptyQuoteDraft);
  const [eventDate, setEventDate] = React.useState('');
  const [eventLocation, setEventLocation] = React.useState('');
  const { run, pending, fieldErrors } = useAction(sendChatQuoteAction, {
    onSuccess: (message) => {
      onSent(message);
      onOpenChange(false);
      setDraft(emptyQuoteDraft());
      setEventDate('');
      setEventLocation('');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Offerte voor {customerName}</DialogTitle>
          <DialogDescription>
            De offerte verschijnt in het gesprek. De klant kan ze daar accepteren of afwijzen; een geaccepteerde
            offerte is een bindende afspraak.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Datum van het event" htmlFor="chat-quote-date" optional>
              <Input id="chat-quote-date" type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} />
            </Field>
            <Field label="Plaats" htmlFor="chat-quote-location" optional>
              <Input id="chat-quote-location" value={eventLocation} onChange={(event) => setEventLocation(event.target.value)} maxLength={200} />
            </Field>
          </div>
          <QuoteFormFields draft={draft} onChange={setDraft} errors={fieldErrors} />
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Annuleren
          </Button>
          <Button loading={pending} onClick={() => run({ conversationId, eventDate, eventLocation, ...draft })}>
            Offerte versturen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { Thread };
