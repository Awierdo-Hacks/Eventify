'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '@/components/providers/SessionProvider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Send,
  Image as ImageIcon,
  Euro,
  Check,
  CheckCheck,
  X,
  Plus,
  FileText,
  Clock,
  Loader2,
  Download,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Attachment {
  id: string;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

interface QuoteData {
  id: string;
  totalPrice: number;
  includedServices: string[];
  terms: string | null;
  packageName: string | null;
  validUntil: string;
  accepted: boolean;
  rejected: boolean;
  linkedToEvent: boolean;
  provider: {
    id: string;
    businessName: string;
    category: string;
  };
  serviceRequest?: {
    id: string;
    eventType: string;
    eventDate: string;
  } | null;
}

interface ChatMessage {
  id: string;
  content: string;
  messageType: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  isOwn: boolean;
  attachments: Attachment[];
  quote: QuoteData | null;
  createdAt: string;
}

interface ConversationInfo {
  id: string;
  otherUser: {
    id: string;
    name: string;
    role: string;
    businessName: string | null;
    category: string | null;
  } | null;
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user, status } = useSession();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Quote form state
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteDescription, setQuoteDescription] = useState('');
  const [quoteTerms, setQuoteTerms] = useState('');
  const [quoteServices, setQuoteServices] = useState<string[]>(['']);
  const [sendingQuote, setSendingQuote] = useState(false);

  // Resolve params
  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await Promise.resolve(params);
      setConversationId(resolved.id);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/messages');
    }
  }, [status, router]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!conversationId || status !== 'authenticated') return;

    try {
      const res = await fetch(`/api/conversations/${conversationId}`);
      if (!res.ok) {
        if (res.status === 403 || res.status === 404) {
          router.push('/messages');
          return;
        }
        throw new Error('Failed to fetch messages');
      }

      const data = await res.json();
      setConversation(data.conversation);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, status, router]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // SSE connection
  useEffect(() => {
    if (!conversationId || status !== 'authenticated') return;

    const eventSource = new EventSource(`/api/conversations/${conversationId}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const newMsg: ChatMessage = JSON.parse(event.data);
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      } catch {
        // Ignore parse errors (keepalive comments)
      }
    };

    eventSource.onerror = () => {
      // Reconnect after a delay
      eventSource.close();
      setTimeout(() => {
        if (conversationId && status === 'authenticated') {
          const newSource = new EventSource(`/api/conversations/${conversationId}/stream`);
          eventSourceRef.current = newSource;
        }
      }, 5000);
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [conversationId, status]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send text message
  const handleSend = async () => {
    if (!newMessage.trim() || !conversationId || sending) return;

    setSending(true);
    const messageContent = newMessage;
    setNewMessage('');

    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageContent }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent); // Restore on failure
    } finally {
      setSending(false);
    }
  };

  // Upload file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId) return;

    setUploading(true);

    try {
      // Upload file
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/conversations/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || 'Upload mislukt');
      }

      const uploadData = await uploadRes.json();

      // Send message with attachment
      const isImage = file.type.startsWith('image/');
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: isImage ? '' : file.name,
          messageType: isImage ? 'IMAGE' : 'TEXT',
          attachments: [
            {
              url: uploadData.url,
              fileName: uploadData.fileName,
              fileType: uploadData.fileType,
              fileSize: uploadData.fileSize,
            },
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Send quote via chat
  const handleSendQuote = async () => {
    if (!quotePrice || !quoteDescription || !conversationId) return;

    setSendingQuote(true);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalPrice: quotePrice,
          message: quoteDescription,
          terms: quoteTerms || undefined,
          includedServices: quoteServices.filter((s) => s.trim() !== ''),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        setShowQuoteDialog(false);
        setQuotePrice('');
        setQuoteDescription('');
        setQuoteTerms('');
        setQuoteServices(['']);
      } else {
        const err = await res.json();
        console.error('Quote error:', err.error);
      }
    } catch (error) {
      console.error('Error sending quote:', error);
    } finally {
      setSendingQuote(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Group messages by date
  const groupedMessages = messages.reduce<{ date: string; messages: ChatMessage[] }[]>((groups, msg) => {
    const dateStr = new Date(msg.createdAt).toDateString();
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && new Date(lastGroup.messages[0].createdAt).toDateString() === dateStr) {
      lastGroup.messages.push(msg);
    } else {
      groups.push({ date: dateStr, messages: [msg] });
    }
    return groups;
  }, []);

  // Quote card component in chat
  const QuoteCard = ({ quote, isOwn }: { quote: QuoteData; isOwn: boolean }) => (
    <div className={`rounded-2xl border-2 overflow-hidden ${
      quote.accepted
        ? 'border-green-200 bg-green-50'
        : quote.rejected
        ? 'border-red-200 bg-red-50'
        : 'border-purple-200 bg-gradient-to-br from-purple-50 to-amber-50'
    }`}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Euro className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-gray-900">Offerte</span>
          {quote.accepted && <Badge className="bg-green-100 text-green-800">Geaccepteerd</Badge>}
          {quote.rejected && <Badge className="bg-red-100 text-red-800">Afgewezen</Badge>}
          {quote.linkedToEvent && <Badge className="bg-blue-100 text-blue-800">Gekoppeld</Badge>}
        </div>

        <div className="text-3xl font-bold gradient-text mb-3">
          €{quote.totalPrice.toLocaleString('nl-NL')}
        </div>

        {quote.packageName && (
          <p className="text-sm text-gray-700 mb-2 font-medium">{quote.packageName}</p>
        )}

        {quote.includedServices.length > 0 && (
          <div className="space-y-1 mb-3">
            {quote.includedServices.map((service, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span>{service}</span>
              </div>
            ))}
          </div>
        )}

        {quote.terms && (
          <p className="text-xs text-gray-500 mb-2">{quote.terms}</p>
        )}

        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          <span>Geldig tot {formatDate(quote.validUntil)}</span>
        </div>
      </div>

      {/* Quote actions for customer */}
      {!isOwn && !quote.accepted && !quote.rejected && (
        <div className="border-t-2 border-purple-100 p-3 flex gap-2">
          <Button
            size="sm"
            className="flex-1 gradient-brand text-white rounded-xl text-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleAcceptQuote(quote.id);
            }}
          >
            <Check className="w-4 h-4 mr-1" />
            Accepteer
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 rounded-xl text-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleRejectQuote(quote.id);
            }}
          >
            <X className="w-4 h-4 mr-1" />
            Afwijzen
          </Button>
        </div>
      )}
    </div>
  );

  const handleAcceptQuote = async (quoteId: string) => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      });

      if (res.ok) {
        // Refresh messages to show updated quote status
        fetchMessages();
      }
    } catch (error) {
      console.error('Error accepting quote:', error);
    }
  };

  const handleRejectQuote = async (quoteId: string) => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      });

      if (res.ok) {
        fetchMessages();
      }
    } catch (error) {
      console.error('Error rejecting quote:', error);
    }
  };

  if (loading || status === 'loading') {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border-b border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded" />
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-5 w-40" />
            </div>
          </div>
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
                <Skeleton className="h-12 w-64 rounded-2xl" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!user || !conversation) return null;

  const otherUser = conversation.otherUser;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/messages')}
            className="rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-white font-semibold text-sm">
            {getUserInitials(otherUser?.businessName || otherUser?.name || '?')}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">
              {otherUser?.businessName || otherUser?.name || 'Onbekend'}
            </h2>
            {otherUser?.category && (
              <p className="text-xs text-gray-500">{otherUser.category}</p>
            )}
          </div>

          {otherUser?.role === 'PROVIDER' && (
            <Badge className="bg-amber-100 text-amber-700">Provider</Badge>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
          {groupedMessages.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Begin het gesprek
              </h3>
              <p className="text-gray-500 text-sm">
                Stuur een bericht om de conversatie te starten
              </p>
            </div>
          ) : (
            groupedMessages.map((group) => (
              <div key={group.date}>
                {/* Date separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium">
                    {formatDate(group.messages[0].createdAt)}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Messages */}
                <div className="space-y-3">
                  {group.messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] sm:max-w-[70%] ${msg.isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                        {/* Quote message */}
                        {msg.messageType === 'QUOTE' && msg.quote && (
                          <div className="w-full max-w-sm mb-1">
                            <QuoteCard quote={msg.quote} isOwn={msg.isOwn} />
                          </div>
                        )}

                        {/* Image message */}
                        {msg.messageType === 'IMAGE' && msg.attachments.length > 0 && (
                          <div className="mb-1">
                            {msg.attachments
                              .filter((a) => a.fileType.startsWith('image/'))
                              .map((att) => (
                                <div
                                  key={att.id}
                                  className="rounded-2xl overflow-hidden cursor-pointer border-2 border-gray-100"
                                  onClick={() => setImagePreview(att.url)}
                                >
                                  <img
                                    src={att.url}
                                    alt={att.fileName}
                                    className="max-w-sm max-h-72 object-cover"
                                    loading="lazy"
                                  />
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Text bubble (skip for image-only or quote-only messages) */}
                        {msg.content && msg.messageType !== 'QUOTE' && (
                          <div
                            className={`px-4 py-2.5 rounded-2xl ${
                              msg.isOwn
                                ? 'gradient-brand text-white rounded-br-md'
                                : 'bg-white border-2 border-gray-100 text-gray-900 rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                        )}

                        {/* Non-image attachments */}
                        {msg.attachments
                          .filter((a) => !a.fileType.startsWith('image/'))
                          .map((att) => (
                            <a
                              key={att.id}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                                msg.isOwn
                                  ? 'bg-white/20 text-white'
                                  : 'bg-gray-50 text-gray-700 border border-gray-200'
                              }`}
                            >
                              <FileText className="w-4 h-4" />
                              <span className="truncate">{att.fileName}</span>
                              <Download className="w-3.5 h-3.5 flex-shrink-0" />
                            </a>
                          ))}

                        {/* System message */}
                        {msg.messageType === 'SYSTEM' && (
                          <div className="text-center">
                            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                              {msg.content}
                            </span>
                          </div>
                        )}

                        {/* Timestamp */}
                        <span className={`text-[10px] text-gray-400 mt-0.5 px-1 ${msg.isOwn ? 'text-right' : ''}`}>
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-100 sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2">
            {/* Upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl flex-shrink-0 h-10 w-10 p-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              ) : (
                <ImageIcon className="w-5 h-5 text-gray-500" />
              )}
            </Button>

            {/* Quote button (providers only) */}
            {user.role === 'PROVIDER' && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl flex-shrink-0 h-10 w-10 p-0"
                onClick={() => setShowQuoteDialog(true)}
              >
                <Euro className="w-5 h-5 text-purple-600" />
              </Button>
            )}

            {/* Message input */}
            <div className="flex-1">
              <Input
                placeholder="Typ een bericht..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="rounded-xl border-2 border-gray-100 h-10"
                disabled={sending}
              />
            </div>

            {/* Send button */}
            <Button
              className="gradient-brand rounded-xl h-10 w-10 p-0 flex-shrink-0"
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
            >
              <Send className="w-4 h-4 text-white" />
            </Button>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {imagePreview && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setImagePreview(null)}
        >
          <Button
            variant="ghost"
            className="absolute top-4 right-4 text-white hover:bg-white/10 rounded-xl"
            onClick={() => setImagePreview(null)}
          >
            <X className="w-6 h-6" />
          </Button>
          <img
            src={imagePreview}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}

      {/* Send Quote Dialog (Provider only) */}
      <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
        <DialogContent className="sm:max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="gradient-text text-xl">Offerte Versturen</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Price */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Totaalprijs (€) *
              </label>
              <Input
                type="number"
                placeholder="750"
                value={quotePrice}
                onChange={(e) => setQuotePrice(e.target.value)}
                className="rounded-xl border-2 border-gray-100 h-12"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Pakket beschrijving *
              </label>
              <Input
                placeholder="DJ Set 6 uur met professionele geluidsinstallatie"
                value={quoteDescription}
                onChange={(e) => setQuoteDescription(e.target.value)}
                className="rounded-xl border-2 border-gray-100 h-12"
              />
            </div>

            {/* Included services */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Inbegrepen diensten *
              </label>
              <div className="space-y-2">
                {quoteServices.map((service, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Dienst ${index + 1}`}
                      value={service}
                      onChange={(e) => {
                        const updated = [...quoteServices];
                        updated[index] = e.target.value;
                        setQuoteServices(updated);
                      }}
                      className="rounded-xl border-2 border-gray-100"
                    />
                    {quoteServices.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl flex-shrink-0"
                        onClick={() => setQuoteServices(quoteServices.filter((_, i) => i !== index))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setQuoteServices([...quoteServices, ''])}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Dienst toevoegen
                </Button>
              </div>
            </div>

            {/* Terms */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Voorwaarden (optioneel)
              </label>
              <Input
                placeholder="Inclusief opbouw en afbouw, excl. BTW"
                value={quoteTerms}
                onChange={(e) => setQuoteTerms(e.target.value)}
                className="rounded-xl border-2 border-gray-100"
              />
            </div>

            {/* Send */}
            <Button
              className="w-full gradient-brand rounded-xl h-12 text-base"
              onClick={handleSendQuote}
              disabled={!quotePrice || !quoteDescription || quoteServices.filter((s) => s.trim()).length === 0 || sendingQuote}
            >
              {sendingQuote ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Euro className="w-5 h-5 mr-2" />
              )}
              Offerte Versturen
            </Button>

            <p className="text-xs text-gray-400 text-center">
              De offerte wordt ook zichtbaar in het dashboard van de klant
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
