'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Container } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ConfirmationDialog,
  DialogWarning,
  DialogActions,
  DialogButton,
} from '@/components/ui/confirmation-dialog';
import {
  Users,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  Euro,
  Eye,
  EyeOff,
  Search,
  Ban,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Hash,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  ShieldCheck,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  createdAt: string;
}

interface Provider {
  id: string;
  businessName: string;
  category: string;
  description: string | null;
  location: string;
  verified: boolean;
  isActive: boolean;
  images: string[];
  portfolioImages: string[];
  phone: string | null;
  btwNumber: string | null;
  ratingAvg: number;
  reviewCount: number;
  user: {
    name: string;
    email: string;
  };
  stats: {
    requests: number;
    quotes: number;
    bookings: number;
  };
}

interface RecentActivity {
  type: 'booking' | 'provider_new' | 'provider_verified' | 'user' | 'review';
  message: string;
  timestamp: string;
}

interface PlatformStats {
  totalUsers: number;
  totalProviders: number;
  verifiedProviders: number;
  pendingProviders: number;
  totalBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  recentActivity: RecentActivity[];
}

const CATEGORY_COLORS: Record<string, string> = {
  catering: 'bg-orange-100 text-orange-700 border-orange-200',
  dj: 'bg-purple-100 text-purple-700 border-purple-200',
  photography: 'bg-pink-100 text-pink-700 border-pink-200',
  decoration: 'bg-green-100 text-green-700 border-green-200',
  venues: 'bg-blue-100 text-blue-700 border-blue-200',
  entertainment: 'bg-violet-100 text-violet-700 border-violet-200',
  flowers: 'bg-rose-100 text-rose-700 border-rose-200',
  video: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  planning: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  transport: 'bg-slate-100 text-slate-700 border-slate-200',
};

const CATEGORY_LABELS: Record<string, string> = {
  catering: 'Catering',
  dj: 'DJ & Muziek',
  photography: 'Photography',
  decoration: 'Decoration',
  venues: 'Venue',
  entertainment: 'Entertainment',
  flowers: 'Flowers',
  video: 'Video',
  planning: 'Planning',
  transport: 'Transport',
};

const ACTIVITY_ICONS: Record<string, { icon: string; color: string }> = {
  booking: { icon: '✅', color: 'bg-green-100' },
  provider_new: { icon: '🏢', color: 'bg-orange-100' },
  provider_verified: { icon: '🟢', color: 'bg-green-100' },
  user: { icon: '👤', color: 'bg-blue-100' },
  review: { icon: '💬', color: 'bg-purple-100' },
};

const ADMIN_PAGE_SIZE = 25;

interface AdminClientProps {
  initialStats: PlatformStats;
}

export default function AdminClient({ initialStats }: AdminClientProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [stats, setStats] = useState<PlatformStats>(initialStats);
  const [users, setUsers] = useState<User[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [providersPage, setProvidersPage] = useState(1);
  const [usersHasMore, setUsersHasMore] = useState(false);
  const [providersHasMore, setProvidersHasMore] = useState(false);

  // Search states
  const [providerSearch, setProviderSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Provider detail dialog
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Verification dialog state
  const [verifyingProvider, setVerifyingProvider] = useState<Provider | null>(null);
  const [verifyingProviderId, setVerifyingProviderId] = useState<string | null>(null);

  // User moderation state
  const [moderatingUser, setModeratingUser] = useState<User | null>(null);
  const [moderationAction, setModerationAction] = useState<'suspend' | 'ban' | 'activate' | 'delete' | null>(null);
  const [moderatingUserId, setModeratingUserId] = useState<string | null>(null);

  // Toggle visibility loading state
  const [togglingProviderId, setTogglingProviderId] = useState<string | null>(null);

  const filteredProviders = providers;
  const filteredUsers = users;

  const loadProviders = useCallback(async (page = 1, append = false) => {
    setProvidersLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(ADMIN_PAGE_SIZE),
      });
      if (providerSearch.trim()) params.set('search', providerSearch.trim());

      const providersRes = await fetch(`/api/admin/providers?${params.toString()}`);
      if (!providersRes.ok) throw new Error('Failed to fetch providers');

      const providersData = await providersRes.json();
      const nextProviders = providersData.providers || [];
      setProviders((current) => (append ? [...current, ...nextProviders] : nextProviders));
      setProvidersPage(providersData.page || page);
      setProvidersHasMore(Boolean(providersData.hasMore));
    } catch (err) {
      console.error('Admin providers fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load providers');
    } finally {
      setProvidersLoading(false);
    }
  }, [providerSearch]);

  const loadUsers = useCallback(async (page = 1, append = false) => {
    setUsersLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(ADMIN_PAGE_SIZE),
      });
      if (userSearch.trim()) params.set('search', userSearch.trim());

      const usersRes = await fetch(`/api/admin/users?${params.toString()}`);
      if (!usersRes.ok) throw new Error('Failed to fetch users');

      const usersData = await usersRes.json();
      const nextUsers = usersData.users || [];
      setUsers((current) => (append ? [...current, ...nextUsers] : nextUsers));
      setUsersPage(usersData.page || page);
      setUsersHasMore(Boolean(usersData.hasMore));
    } catch (err) {
      console.error('Admin users fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, [userSearch]);

  useEffect(() => {
    if (activeTab === 'providers') {
      loadProviders(1, false);
    }
  }, [activeTab, loadProviders]);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers(1, false);
    }
  }, [activeTab, loadUsers]);

  const handleVerifyProvider = async () => {
    if (!verifyingProvider) return;
    setVerifyingProviderId(verifyingProvider.id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/providers/${verifyingProvider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to verify provider');
      }

      await loadProviders(1, false);

      setStats(prev => ({
        ...prev,
        verifiedProviders: prev.verifiedProviders + 1,
        pendingProviders: prev.pendingProviders - 1,
      }));

      setVerifyingProvider(null);
      setSuccessMessage(`${verifyingProvider.businessName} is geverifieerd!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Verify provider error:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify provider');
      setTimeout(() => setError(null), 5000);
    } finally {
      setVerifyingProviderId(null);
    }
  };

  const handleToggleProviderVisibility = async (provider: Provider) => {
    setTogglingProviderId(provider.id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/providers/${provider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !provider.isActive }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to toggle visibility');
      }

      await loadProviders(1, false);

      setSuccessMessage(
        provider.isActive
          ? `${provider.businessName} is verborgen`
          : `${provider.businessName} is weer zichtbaar`
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Toggle visibility error:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle visibility');
      setTimeout(() => setError(null), 5000);
    } finally {
      setTogglingProviderId(null);
    }
  };

  const handleDeleteProvider = async (provider: Provider) => {
    if (!confirm(`Weet je zeker dat je ${provider.businessName} wilt verwijderen?`)) return;
    setError(null);

    try {
      const response = await fetch(`/api/admin/providers/${provider.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete provider');
      }

      await loadProviders(1, false);

      setSuccessMessage(`${provider.businessName} is verwijderd`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Delete provider error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete provider');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleModerateUser = async () => {
    if (!moderatingUser || !moderationAction) return;
    setModeratingUserId(moderatingUser.id);
    setError(null);

    try {
      const isDelete = moderationAction === 'delete';
      const response = await fetch(`/api/admin/users/${moderatingUser.id}`, {
        method: isDelete ? 'DELETE' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: isDelete ? undefined : JSON.stringify({ action: moderationAction }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to moderate user');
      }

      await loadUsers(1, false);

      if (isDelete) {
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
      }

      const actionMessages = {
        suspend: 'geschorst',
        ban: 'verbannen',
        activate: 'geactiveerd',
        delete: 'verwijderd',
      };

      setModeratingUser(null);
      setModerationAction(null);
      setSuccessMessage(`User ${moderatingUser.name} is ${actionMessages[moderationAction]}!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Moderate user error:', err);
      setError(err instanceof Error ? err.message : 'Failed to moderate user');
      setTimeout(() => setError(null), 5000);
    } finally {
      setModeratingUserId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    }
    return `${date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}, ${date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      ADMIN: 'bg-purple-100 text-purple-800',
      PROVIDER: 'bg-amber-100 text-amber-800',
      CUSTOMER: 'bg-blue-100 text-blue-800',
    };
    return <Badge className={styles[role as keyof typeof styles]}>{role}</Badge>;
  };

  const getStatusBadge = (userStatus: string) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800',
      SUSPENDED: 'bg-amber-100 text-amber-800',
      BANNED: 'bg-red-100 text-red-800',
    };
    const labels = { ACTIVE: 'Actief', SUSPENDED: 'Geschorst', BANNED: 'Verbannen' };
    return <Badge className={styles[userStatus as keyof typeof styles]}>{labels[userStatus as keyof typeof labels]}</Badge>;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br bg-gray-50">
      <Container className="py-4 sm:py-6">
        {/* Compact title */}
        

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-green-800 font-medium">{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm">
            <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-gray-200 p-1 rounded-full w-full max-w-lg mx-auto flex gap-1 mb-6">
            <TabsTrigger value="overview" className="rounded-full flex-1 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              Overzicht
            </TabsTrigger>
            <TabsTrigger value="providers" className="rounded-full flex-1 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              Providers
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-full flex-1 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              Users
            </TabsTrigger>
          </TabsList>

          {/* ==================== OVERVIEW TAB ==================== */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  icon: Users,
                  label: 'Totaal Users',
                  value: stats.totalUsers,
                  borderColor: 'border-t-blue-400',
                  iconBg: 'bg-blue-100',
                  iconColor: 'text-blue-600',
                },
                {
                  icon: Building2,
                  label: 'Providers',
                  value: `${stats.verifiedProviders}/${stats.totalProviders}`,
                  subtext: 'geverifieerd',
                  borderColor: 'border-t-amber-400',
                  iconBg: 'bg-amber-100',
                  iconColor: 'text-amber-600',
                },
                {
                  icon: CheckCircle,
                  label: 'Totaal Bookings',
                  value: stats.totalBookings,
                  borderColor: 'border-t-green-400',
                  iconBg: 'bg-green-100',
                  iconColor: 'text-green-600',
                },
                {
                  icon: Euro,
                  label: 'Platform Omzet',
                  value: `€${stats.totalRevenue.toLocaleString('nl-NL')}`,
                  subtext: `€${stats.monthlyRevenue.toLocaleString('nl-NL')}/maand`,
                  borderColor: 'border-t-purple-400',
                  iconBg: 'bg-purple-100',
                  iconColor: 'text-purple-600',
                },
              ].map((stat) => (
                <Card key={stat.label} className={`p-4 border-t-4 ${stat.borderColor} rounded-2xl`}>
                  <div className={`w-10 h-10 ${stat.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                  <p className="text-xs text-gray-500 mb-0.5">{stat.label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                  {stat.subtext && <p className="text-xs text-gray-400">{stat.subtext}</p>}
                </Card>
              ))}
            </div>

            {/* Recent Activity */}
            <Card className="rounded-2xl border border-gray-200">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Recent Activity</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {stats.recentActivity.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">Nog geen recente activiteit</div>
                ) : (
                  stats.recentActivity.map((activity, i) => {
                    const activityStyle = ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS.user;
                    return (
                      <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 ${activityStyle.color} rounded-lg flex items-center justify-center text-sm`}>
                            {activityStyle.icon}
                          </div>
                          <span className="text-sm text-gray-700">{activity.message}</span>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{formatTimestamp(activity.timestamp)}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </TabsContent>

          {/* ==================== PROVIDERS TAB ==================== */}
          <TabsContent value="providers" className="mt-0">
            <Card className="rounded-2xl border border-gray-200 overflow-hidden">
              {/* Search bar */}
              <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={providerSearch}
                    onChange={(e) => setProviderSearch(e.target.value)}
                    className="w-full pl-9 pr-3 h-9 rounded-lg border border-gray-200 text-sm focus:border-purple-400 focus:ring-0 outline-none"
                  />
                </div>
              </div>

              {providersLoading && providers.length === 0 ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : filteredProviders.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  {providerSearch ? 'Geen providers gevonden' : 'Er zijn nog geen providers geregistreerd'}
                </div>
              ) : (
                <>
                  {/* Mobile: compact cards */}
                  <div className="md:hidden divide-y divide-gray-50">
                    {filteredProviders.map((provider) => (
                      <div
                        key={provider.id}
                        className="p-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
                        onClick={() => { setSelectedProvider(provider); setSelectedImageIndex(0); }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{provider.businessName}</p>
                            <p className="text-xs text-gray-500 truncate">{provider.user.email}</p>
                          </div>
                          <Badge className={`text-xs ${CATEGORY_COLORS[provider.category] || 'bg-gray-100 text-gray-700'}`}>
                            {CATEGORY_LABELS[provider.category] || provider.category}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {provider.verified ? (
                              <span className="flex items-center gap-1 text-xs text-green-700"><CheckCircle className="w-3.5 h-3.5" /> Verified</span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-amber-700"><Clock className="w-3.5 h-3.5" /> Pending</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleProviderVisibility(provider); }}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                              title={provider.isActive ? 'Verbergen' : 'Tonen'}
                            >
                              {provider.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteProvider(provider); }}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                              title="Verwijderen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop: table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Provider Name</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Verification</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredProviders.map((provider) => (
                          <tr
                            key={provider.id}
                            className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                            onClick={() => { setSelectedProvider(provider); setSelectedImageIndex(0); }}
                          >
                            <td className="px-4 py-3">
                              <span className="text-sm font-medium text-gray-900">{provider.businessName}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-gray-600">{provider.user.email}</span>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={`text-xs font-medium ${CATEGORY_COLORS[provider.category] || 'bg-gray-100 text-gray-700'}`}>
                                {CATEGORY_LABELS[provider.category] || provider.category}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              {provider.verified ? (
                                <span className="flex items-center gap-1.5 text-sm text-green-700">
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  Verified
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-sm text-amber-700">
                                  <Clock className="w-4 h-4 text-amber-500" />
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                {!provider.verified && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setVerifyingProvider(provider); }}
                                    className="p-2 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                                    title="Verifi&euml;ren"
                                  >
                                    <ShieldCheck className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleToggleProviderVisibility(provider); }}
                                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                                  title={provider.isActive ? 'Verbergen van browse' : 'Tonen op browse'}
                                >
                                  {provider.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteProvider(provider); }}
                                  className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Verwijderen"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {providersHasMore && (
                    <div className="p-4 border-t border-gray-100 text-center">
                      <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => loadProviders(providersPage + 1, true)}
                        disabled={providersLoading}
                      >
                        {providersLoading ? 'Laden...' : 'Meer providers laden'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card>
          </TabsContent>

          {/* ==================== USERS TAB ==================== */}
          <TabsContent value="users" className="mt-0">
            <Card className="rounded-2xl border border-gray-200 overflow-hidden">
              {/* Search bar */}
              <div className="p-4 border-b border-gray-100">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-3 h-9 rounded-lg border border-gray-200 text-sm focus:border-purple-400 focus:ring-0 outline-none"
                  />
                </div>
              </div>

              {usersLoading && users.length === 0 ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  {userSearch ? 'Geen users gevonden' : 'Er zijn nog geen users geregistreerd'}
                </div>
              ) : (
                <>
                  {/* Mobile: compact cards */}
                  <div className="md:hidden divide-y divide-gray-50">
                    {filteredUsers.map((u) => (
                      <div key={u.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{u.name}</p>
                            <p className="text-xs text-gray-500 truncate">{u.email}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                            {getRoleBadge(u.role)}
                            {getStatusBadge(u.status)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">{formatDate(u.createdAt)}</p>
                          <div className="flex items-center gap-1">
                            {u.status === 'ACTIVE' && u.role !== 'ADMIN' && (
                              <button
                                onClick={() => { setModeratingUser(u); setModerationAction('ban'); }}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-black-400 hover:text-red-600 transition-colors"
                                title="Schorsen"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                            {(u.status === 'SUSPENDED' || u.status === 'BANNED') && (
                              <button
                                onClick={() => { setModeratingUser(u); setModerationAction('activate'); }}
                                className="p-1.5 rounded-lg hover:bg-green-50 text-black-400 hover:text-green-600 transition-colors"
                                title="Activeren"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {u.role !== 'ADMIN' && (
                              <button
                                onClick={() => { setModeratingUser(u); setModerationAction('delete'); }}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-300 hover:text-red-600 transition-colors"
                                title="Verwijderen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop: table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Naam</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aangemaakt</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acties</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                            <td className="px-4 py-3">{getRoleBadge(u.role)}</td>
                            <td className="px-4 py-3">{getStatusBadge(u.status)}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{formatDate(u.createdAt)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                {u.status === 'ACTIVE' && u.role !== 'ADMIN' && (
                                  <button
                                    onClick={() => { setModeratingUser(u); setModerationAction('ban'); }}
                                    className="p-2 rounded-lg hover:bg-red-50 text-black-400 hover:text-red-600 transition-colors"
                                    title="Schorsen"
                                  >
                                    <Ban className="w-4 h-4" />
                                  </button>
                                )}
                                {(u.status === 'SUSPENDED' || u.status === 'BANNED') && (
                                  <button
                                    onClick={() => { setModeratingUser(u); setModerationAction('activate'); }}
                                    className="p-2 rounded-lg hover:bg-green-50 text-black-400 hover:text-green-600 transition-colors"
                                    title="Activeren"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                )}
                                {u.role !== 'ADMIN' && (
                                  <button
                                    onClick={() => { setModeratingUser(u); setModerationAction('delete'); }}
                                    className="p-2 rounded-lg hover:bg-red-50 text-red-300 hover:text-red-600 transition-colors"
                                    title="Verwijderen"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {usersHasMore && (
                    <div className="p-4 border-t border-gray-100 text-center">
                      <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => loadUsers(usersPage + 1, true)}
                        disabled={usersLoading}
                      >
                        {usersLoading ? 'Laden...' : 'Meer users laden'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </Container>

      {/* ==================== PROVIDER DETAIL MODAL ==================== */}
      {selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedProvider(null)}>
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-black-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <div>
                <h2 className="text-lg font-bold text-black-900">{selectedProvider.businessName}</h2>
                <p className="text-sm text-black-500">{selectedProvider.user.email}</p>
              </div>
              <button onClick={() => setSelectedProvider(null)} className="p-2 rounded-lg hover:bg-black-100 transition-colors">
                <X className="w-5 h-5 text-black-500" />
              </button>
            </div>

            {/* Images */}
            {selectedProvider.images.length > 0 && (
              <div className="relative">
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  <Image
                    src={selectedProvider.images[selectedImageIndex]}
                    alt={selectedProvider.businessName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 672px) 100vw, 672px"
                    priority
                  />
                </div>
                {selectedProvider.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImageIndex((i) => (i - 1 + selectedProvider.images.length) % selectedProvider.images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedImageIndex((i) => (i + 1) % selectedProvider.images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                      {selectedImageIndex + 1} / {selectedProvider.images.length}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Thumbnail strip */}
            {selectedProvider.images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {selectedProvider.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                      i === selectedImageIndex ? 'border-purple-500' : 'border-transparent'
                    }`}
                  >
                    <Image src={img} alt="" width={56} height={56} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Info */}
            <div className="p-4 space-y-4">
              {/* Status badges */}
              <div className="flex flex-wrap gap-2">
                <Badge className={`${CATEGORY_COLORS[selectedProvider.category] || 'bg-gray-100 text-gray-700'}`}>
                  {CATEGORY_LABELS[selectedProvider.category] || selectedProvider.category}
                </Badge>
                {selectedProvider.verified ? (
                  <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Geverifieerd</Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" />Wacht op verificatie</Badge>
                )}
                {selectedProvider.isActive ? (
                  <Badge className="bg-blue-100 text-blue-800"><Eye className="w-3 h-3 mr-1" />Zichtbaar</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-600"><EyeOff className="w-3 h-3 mr-1" />Verborgen</Badge>
                )}
              </div>

              {/* Description */}
              {selectedProvider.description && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    <FileText className="w-3.5 h-3.5" /> Beschrijving
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedProvider.description}</p>
                </div>
              )}

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {selectedProvider.location}
                </div>
                {selectedProvider.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {selectedProvider.phone}
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {selectedProvider.user.email}
                </div>
                {selectedProvider.btwNumber && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Hash className="w-4 h-4 text-gray-400" />
                    {selectedProvider.btwNumber}
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Star className="w-4 h-4 text-gray-400" />
                  {selectedProvider.ratingAvg > 0 ? `${selectedProvider.ratingAvg.toFixed(1)} (${selectedProvider.reviewCount} reviews)` : 'Nog geen reviews'}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{selectedProvider.stats.requests}</p>
                  <p className="text-xs text-gray-500">Aanvragen</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{selectedProvider.stats.quotes}</p>
                  <p className="text-xs text-gray-500">Offertes</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{selectedProvider.stats.bookings}</p>
                  <p className="text-xs text-gray-500">Boekingen</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {!selectedProvider.verified && (
                  <Button
                    onClick={() => { setVerifyingProvider(selectedProvider); setSelectedProvider(null); }}
                    className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm h-9"
                  >
                    <ShieldCheck className="w-4 h-4 mr-1.5" />
                    Verifi&euml;ren
                  </Button>
                )}
                <Button
                  onClick={() => handleToggleProviderVisibility(selectedProvider)}
                  variant="outline"
                  className="flex-1 rounded-xl text-sm h-9"
                  disabled={togglingProviderId === selectedProvider.id}
                >
                  {selectedProvider.isActive ? (
                    <><EyeOff className="w-4 h-4 mr-1.5" />Verbergen</>
                  ) : (
                    <><Eye className="w-4 h-4 mr-1.5" />Tonen</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== VERIFY DIALOG ==================== */}
      <ConfirmationDialog
        open={!!verifyingProvider}
        onOpenChange={(open) => { if (!open) setVerifyingProvider(null); }}
        title="Provider Verifi&euml;ren?"
        description="Bevestig dat deze provider mag worden geverifieerd en actief op het platform."
      >
        {verifyingProvider && (
          <>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
              <h4 className="text-xl font-bold text-gray-900 mb-2">{verifyingProvider.businessName}</h4>
              <div className="space-y-1.5 text-sm text-gray-700">
                <p>Categorie: {CATEGORY_LABELS[verifyingProvider.category] || verifyingProvider.category}</p>
                <p>Locatie: {verifyingProvider.location}</p>
                <p>Contact: {verifyingProvider.user.name}</p>
                <p>Email: {verifyingProvider.user.email}</p>
              </div>
            </div>
            <DialogWarning type="info" title="Verificatie Effect" message="Na verificatie kan deze provider actief aanvragen ontvangen en offertes versturen." />
            <DialogActions>
              <DialogButton onClick={handleVerifyProvider} variant="success" disabled={!!verifyingProviderId} loading={verifyingProviderId === verifyingProvider.id}>
                Ja, Verifi&euml;ren
              </DialogButton>
              <DialogButton onClick={() => setVerifyingProvider(null)} variant="outline" disabled={!!verifyingProviderId}>
                Annuleren
              </DialogButton>
            </DialogActions>
          </>
        )}
      </ConfirmationDialog>

      {/* ==================== USER MODERATION DIALOG ==================== */}
      <ConfirmationDialog
        open={!!moderatingUser && !!moderationAction}
        onOpenChange={(open) => { if (!open) { setModeratingUser(null); setModerationAction(null); } }}
        title={
          moderationAction === 'suspend' ? 'User Schorsen?' :
          moderationAction === 'ban' ? 'User Verbannen?' :
          moderationAction === 'activate' ? 'User Activeren?' :
          'User Verwijderen?'
        }
        description={
          moderationAction === 'suspend' ? 'Deze user wordt tijdelijk geschorst.' :
          moderationAction === 'ban' ? 'Deze user wordt permanent verbannen.' :
          moderationAction === 'activate' ? 'Deze user wordt weer geactiveerd.' :
          'Deze user en alle data worden permanent verwijderd!'
        }
      >
        {moderatingUser && moderationAction && (
          <>
            <div className={`rounded-2xl p-5 border ${
              moderationAction === 'delete' || moderationAction === 'ban'
                ? 'bg-red-50 border-red-200'
                : moderationAction === 'suspend'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <h4 className="text-xl font-bold text-gray-900 mb-2">{moderatingUser.name}</h4>
              <div className="space-y-1.5 text-sm text-gray-700">
                <p>Email: {moderatingUser.email}</p>
                <p>Role: {moderatingUser.role}</p>
                <p>Status: {moderatingUser.status === 'ACTIVE' ? 'Actief' : moderatingUser.status === 'SUSPENDED' ? 'Geschorst' : 'Verbannen'}</p>
              </div>
            </div>
            <DialogActions>
              <DialogButton
                onClick={handleModerateUser}
                variant={moderationAction === 'delete' || moderationAction === 'ban' ? 'danger' : moderationAction === 'activate' ? 'success' : 'primary'}
                disabled={!!moderatingUserId}
                loading={moderatingUserId === moderatingUser.id}
              >
                {moderationAction === 'suspend' && 'Ja, Schorsen'}
                {moderationAction === 'ban' && 'Ja, Verbannen'}
                {moderationAction === 'activate' && 'Ja, Activeren'}
                {moderationAction === 'delete' && 'Ja, Verwijderen'}
              </DialogButton>
              <DialogButton onClick={() => { setModeratingUser(null); setModerationAction(null); }} variant="outline" disabled={!!moderatingUserId}>
                Annuleren
              </DialogButton>
            </DialogActions>
          </>
        )}
      </ConfirmationDialog>
    </main>
  );
}
