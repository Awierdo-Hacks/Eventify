'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSession } from '@/components/providers/SessionProvider';
import { Container } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  MessageSquare,
  Search,
} from 'lucide-react';

interface Conversation {
  id: string;
  updatedAt: string;
  otherUser: {
    id: string;
    name: string;
    role: string;
    businessName: string | null;
    category: string | null;
  } | null;
  lastMessage: {
    id: string;
    content: string;
    messageType: string;
    senderId: string;
    senderName: string;
    hasAttachment: boolean;
    createdAt: string;
  } | null;
  unreadCount: number;
}

export default function MessagesPage() {
  const router = useRouter();
  const { user, status } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/messages');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchConversations = async () => {
      try {
        const res = await fetch('/api/conversations');
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations || []);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    // Poll for new conversations every 10 seconds
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [status]);

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const name = conv.otherUser?.businessName || conv.otherUser?.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Nu';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}u`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  };

  const getMessagePreview = (msg: Conversation['lastMessage'], userId?: string) => {
    if (!msg) return 'Geen berichten';
    const isOwn = msg.senderId === userId;
    const prefix = isOwn ? 'Jij: ' : '';

    switch (msg.messageType) {
      case 'IMAGE':
        return `${prefix}📷 Foto`;
      case 'QUOTE':
        return `${prefix}💰 Offerte verstuurd`;
      case 'SYSTEM':
        return msg.content;
      default:
        if (msg.hasAttachment) return `${prefix}📎 ${msg.content || 'Bijlage'}`;
        return `${prefix}${msg.content}`;
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = (role: string) => {
    if (role === 'PROVIDER') return <Badge className="bg-amber-100 text-amber-700 text-xs">Provider</Badge>;
    if (role === 'ADMIN') return <Badge className="bg-purple-100 text-purple-700 text-xs">Admin</Badge>;
    return null;
  };

  if (loading || status === 'loading') {
    return (
      <main className="min-h-screen bg-gray-50">
        <Container className="py-8">
          <Skeleton className="h-12 w-64 mb-2" />
          <Skeleton className="h-6 w-96 mb-8" />
          <Skeleton className="h-12 w-full mb-6 rounded-xl" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-4 border-2 border-gray-100 rounded-3xl">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-40 mb-2" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <Container className="py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            <span className="gradient-text">Berichten</span>
          </h1>
          <p className="text-xl text-gray-600">
            Jouw gesprekken met {user.role === 'PROVIDER' ? 'klanten' : 'providers'}
          </p>
        </div>

        {/* Search */}
        {conversations.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Zoek in gesprekken..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl border-2 border-gray-100"
            />
          </div>
        )}

        {/* Conversations List */}
        {filteredConversations.length === 0 ? (
          <Card className="p-12 text-center border-2 border-gray-100 rounded-3xl">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'Geen gesprekken gevonden' : 'Nog geen berichten'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Probeer een andere zoekterm'
                : user.role === 'PROVIDER'
                ? 'Zodra klanten je berichten sturen, verschijnen ze hier'
                : 'Stuur een bericht naar een provider om te beginnen'}
            </p>
            {!searchQuery && user.role !== 'PROVIDER' && (
              <Button
                onClick={() => router.push('/browse')}
                className="rounded-xl border-2 border-purple-400 text-purple-700 bg-white hover:bg-purple-50 transition-colors h-10 px-6 text-sm shadow-sm"
              >
                Browse Providers
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((conv, index) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`p-4 border-2 rounded-3xl cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                    conv.unreadCount > 0
                      ? 'border-purple-200 bg-purple-50/30'
                      : 'border-gray-100 bg-white'
                  }`}
                  onClick={() => router.push(`/messages/${conv.id}`)}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full gradient-brand flex items-center justify-center text-white font-semibold text-sm">
                        {getUserInitials(conv.otherUser?.businessName || conv.otherUser?.name || '?')}
                      </div>
                      {conv.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-semibold truncate ${conv.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                            {conv.otherUser?.businessName || conv.otherUser?.name || 'Onbekend'}
                          </h3>
                          {conv.otherUser && getRoleBadge(conv.otherUser.role)}
                        </div>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : ''}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                        {getMessagePreview(conv.lastMessage, String(user.id))}
                      </p>
                      {conv.otherUser?.category && (
                        <p className="text-xs text-gray-400 mt-1">{conv.otherUser.category}</p>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
