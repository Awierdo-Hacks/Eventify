'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/providers/SessionProvider';
import { Container, PageHeader } from '@/components/layout';
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
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  Shield,
  AlertTriangle,
  Clock,
  Euro,
} from 'lucide-react';
import { motion } from 'framer-motion';

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
  location: string;
  verified: boolean;
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

interface PlatformStats {
  totalUsers: number;
  totalProviders: number;
  verifiedProviders: number;
  pendingProviders: number;
  totalBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, status } = useSession();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalProviders: 0,
    verifiedProviders: 0,
    pendingProviders: 0,
    totalBookings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);

  // Verification dialog state
  const [verifyingProvider, setVerifyingProvider] = useState<Provider | null>(null);
  const [verifyingProviderId, setVerifyingProviderId] = useState<string | null>(null);

  // User moderation state
  const [moderatingUser, setModeratingUser] = useState<User | null>(null);
  const [moderationAction, setModerationAction] = useState<'suspend' | 'ban' | 'activate' | 'delete' | null>(null);
  const [moderatingUserId, setModeratingUserId] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/admin');
    } else if (status === 'authenticated' && user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, user, router]);

  // Fetch admin data
  useEffect(() => {
    if (status !== 'authenticated' || user?.role !== 'ADMIN') return;

    const fetchAdminData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [statsRes, usersRes, providersRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/users'),
          fetch('/api/admin/providers'),
        ]);

        if (!statsRes.ok || !usersRes.ok || !providersRes.ok) {
          throw new Error('Failed to fetch admin data');
        }

        const [statsData, usersData, providersData] = await Promise.all([
          statsRes.json(),
          usersRes.json(),
          providersRes.json(),
        ]);

        setStats(statsData);
        setUsers(usersData.users || []);
        setProviders(providersData.providers || []);
      } catch (err) {
        console.error('Admin data fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [status, user]);

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

      // Refresh providers
      const providersRes = await fetch('/api/admin/providers');
      const providersData = await providersRes.json();
      setProviders(providersData.providers || []);

      // Update stats
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

      // Refresh users
      const usersRes = await fetch('/api/admin/users');
      const usersData = await usersRes.json();
      setUsers(usersData.users || []);

      // Update stats if user was deleted
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
      month: 'long',
      day: 'numeric',
    });
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      ADMIN: 'bg-purple-100 text-purple-800',
      PROVIDER: 'bg-amber-100 text-amber-800',
      CUSTOMER: 'bg-blue-100 text-blue-800',
    };
    return (
      <Badge className={styles[role as keyof typeof styles]}>
        {role}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800',
      SUSPENDED: 'bg-amber-100 text-amber-800',
      BANNED: 'bg-red-100 text-red-800',
    };
    const labels = {
      ACTIVE: 'Actief',
      SUSPENDED: 'Geschorst',
      BANNED: 'Verbannen',
    };
    return (
      <Badge className={styles[status as keyof typeof styles]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  if (status === 'loading' || (status === 'authenticated' && user?.role !== 'ADMIN')) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Container className="py-6 sm:py-12">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Container className="py-6 sm:py-12">
        <PageHeader title="Admin Dashboard" />
        <p className="text-gray-600 mb-6 sm:mb-8">Platform beheer en moderatie</p>

        {/* Success/Error Messages */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-semibold">{successMessage}</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3"
          >
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-semibold">{error}</span>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {[
            {
              icon: Users,
              label: 'Totaal Users',
              value: stats.totalUsers,
              color: 'from-blue-500 to-cyan-500',
            },
            {
              icon: Building2,
              label: 'Providers',
              value: `${stats.verifiedProviders}/${stats.totalProviders}`,
              subtext: 'geverifieerd',
              color: 'from-amber-500 to-orange-500',
            },
            {
              icon: CheckCircle,
              label: 'Totaal Bookings',
              value: stats.totalBookings,
              color: 'from-green-500 to-emerald-500',
            },
            {
              icon: Euro,
              label: 'Platform Omzet',
              value: `€${stats.totalRevenue.toLocaleString()}`,
              subtext: `€${stats.monthlyRevenue.toLocaleString()}/maand`,
              color: 'from-purple-500 to-pink-500',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4 sm:p-6 border-2 border-gray-100 rounded-3xl hover:shadow-eventiphy-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center flex-shrink-0`}>
                    <stat.icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
                {stat.subtext && (
                  <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
                )}
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border-2 border-gray-200 p-1 rounded-2xl w-full flex gap-1">
            <TabsTrigger value="overview" className="rounded-xl flex-1 text-xs sm:text-sm">Overzicht</TabsTrigger>
            <TabsTrigger value="providers" className="rounded-xl flex-1 text-xs sm:text-sm">
              Providers
              {stats.pendingProviders > 0 && (
                <Badge className="ml-1.5 bg-amber-500 text-white text-[10px] px-1.5 py-0 min-w-0 h-4">{stats.pendingProviders}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl flex-1 text-xs sm:text-sm">Users</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="p-4 sm:p-6 border-2 border-gray-100 rounded-3xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-purple-600" />
                Platform Status
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-100">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    <p className="font-semibold text-amber-900">Verificatie Wachtrij</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-amber-900">{stats.pendingProviders}</p>
                  <p className="text-sm text-amber-700 mt-1">providers wachten op verificatie</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-100">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <p className="font-semibold text-green-900">Actieve Providers</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-green-900">{stats.verifiedProviders}</p>
                  <p className="text-sm text-green-700 mt-1">geverifieerde providers actief</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Providers Tab */}
          <TabsContent value="providers" className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : providers.length === 0 ? (
              <Card className="p-6 md:p-12 border-2 border-gray-100 rounded-3xl text-center">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Geen providers</h3>
                <p className="text-gray-600">Er zijn nog geen providers geregistreerd</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                {providers.map((provider) => (
                  <Card key={provider.id} className="p-4 sm:p-6 border-2 border-gray-100 rounded-3xl hover:shadow-eventiphy-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-2">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{provider.businessName}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-2">
                          <Badge className="bg-purple-100 text-purple-800">{provider.category}</Badge>
                          <span>{provider.location}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Contact: {provider.user.name} ({provider.user.email})
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {provider.verified ? (
                          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Geverifieerd
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Wacht op verificatie
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 mb-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xl sm:text-2xl font-bold text-gray-900">{provider.stats.requests}</p>
                          <p className="text-xs text-gray-600">Aanvragen</p>
                        </div>
                        <div>
                          <p className="text-xl sm:text-2xl font-bold text-gray-900">{provider.stats.quotes}</p>
                          <p className="text-xs text-gray-600">Offertes</p>
                        </div>
                        <div>
                          <p className="text-xl sm:text-2xl font-bold text-gray-900">{provider.stats.bookings}</p>
                          <p className="text-xs text-gray-600">Boekingen</p>
                        </div>
                      </div>
                    </div>

                    {!provider.verified && (
                      <Button
                        onClick={() => setVerifyingProvider(provider)}
                        className="w-full rounded-xl border-2 border-purple-400 text-purple-700 bg-white hover:bg-purple-50 transition-colors shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Provider Verifiëren
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : users.length === 0 ? (
              <Card className="p-6 md:p-12 border-2 border-gray-100 rounded-3xl text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Geen users</h3>
                <p className="text-gray-600">Er zijn nog geen users geregistreerd</p>
              </Card>
            ) : (
              <>
                {/* Mobile: card list */}
                <div className="md:hidden space-y-3">
                  {users.map((user) => (
                    <Card key={user.id} className="p-4 border-2 border-gray-100 rounded-2xl">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[180px]">{user.email}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {getRoleBadge(user.role)}
                          {getStatusBadge(user.status)}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">{formatDate(user.createdAt)}</p>
                      <div className="flex flex-wrap gap-2">
                        {user.status === 'ACTIVE' && (
                          <>
                            <Button
                              onClick={() => { setModeratingUser(user); setModerationAction('suspend'); }}
                              variant="outline"
                              className="text-xs px-3 h-8 border-amber-300 text-amber-700 hover:bg-amber-50 rounded-lg"
                            >
                              Schorsen
                            </Button>
                            <Button
                              onClick={() => { setModeratingUser(user); setModerationAction('ban'); }}
                              variant="outline"
                              className="text-xs px-3 h-8 border-red-300 text-red-700 hover:bg-red-50 rounded-lg"
                            >
                              Verbannen
                            </Button>
                          </>
                        )}
                        {(user.status === 'SUSPENDED' || user.status === 'BANNED') && (
                          <Button
                            onClick={() => { setModeratingUser(user); setModerationAction('activate'); }}
                            variant="outline"
                            className="text-xs px-3 h-8 border-green-300 text-green-700 hover:bg-green-50 rounded-lg"
                          >
                            Activeren
                          </Button>
                        )}
                        {user.role !== 'ADMIN' && (
                          <Button
                            onClick={() => { setModeratingUser(user); setModerationAction('delete'); }}
                            variant="outline"
                            className="text-xs px-3 h-8 border-red-300 text-red-700 hover:bg-red-50 rounded-lg"
                          >
                            Verwijderen
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop: table */}
                <Card className="hidden md:block border-2 border-gray-100 rounded-3xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b-2 border-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Naam</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Role</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Aangemaakt</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Acties</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                            <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                            <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{formatDate(user.createdAt)}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {user.status === 'ACTIVE' && (
                                  <>
                                    <Button
                                      onClick={() => { setModeratingUser(user); setModerationAction('suspend'); }}
                                      variant="outline"
                                      className="text-xs px-3 py-1 border-amber-300 text-amber-700 hover:bg-amber-50 rounded-lg"
                                    >
                                      Schorsen
                                    </Button>
                                    <Button
                                      onClick={() => { setModeratingUser(user); setModerationAction('ban'); }}
                                      variant="outline"
                                      className="text-xs px-3 py-1 border-red-300 text-red-700 hover:bg-red-50 rounded-lg"
                                    >
                                      Verbannen
                                    </Button>
                                  </>
                                )}
                                {(user.status === 'SUSPENDED' || user.status === 'BANNED') && (
                                  <Button
                                    onClick={() => { setModeratingUser(user); setModerationAction('activate'); }}
                                    variant="outline"
                                    className="text-xs px-3 py-1 border-green-300 text-green-700 hover:bg-green-50 rounded-lg"
                                  >
                                    Activeren
                                  </Button>
                                )}
                                {user.role !== 'ADMIN' && (
                                  <Button
                                    onClick={() => { setModeratingUser(user); setModerationAction('delete'); }}
                                    variant="outline"
                                    className="text-xs px-3 py-1 border-red-300 text-red-700 hover:bg-red-50 rounded-lg"
                                  >
                                    Verwijderen
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </Container>

      {/* Verify Provider Confirmation Dialog */}
      <ConfirmationDialog
        open={!!verifyingProvider}
        onOpenChange={(open) => {
          if (!open) {
            setVerifyingProvider(null);
          }
        }}
        title="Provider Verifiëren?"
        description="Bevestig dat deze provider mag worden geverifieerd en actief op het platform."
      >
        {verifyingProvider && (
          <>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-100">
              <h4 className="text-2xl font-bold text-gray-900 mb-2">
                {verifyingProvider.businessName}
              </h4>
              <div className="space-y-2 text-sm text-gray-700">
                <p>• Categorie: {verifyingProvider.category}</p>
                <p>• Locatie: {verifyingProvider.location}</p>
                <p>• Contact: {verifyingProvider.user.name}</p>
                <p>• Email: {verifyingProvider.user.email}</p>
              </div>
            </div>

            <DialogWarning
              type="info"
              title="Verificatie Effect"
              message="Na verificatie kan deze provider actief aanvragen ontvangen en offertes versturen op het platform."
            />

            <DialogActions>
              <DialogButton
                onClick={handleVerifyProvider}
                variant="success"
                disabled={!!verifyingProviderId}
                loading={verifyingProviderId === verifyingProvider.id}
              >
                Ja, Verifiëren
              </DialogButton>
              <DialogButton
                onClick={() => setVerifyingProvider(null)}
                variant="outline"
                disabled={!!verifyingProviderId}
              >
                Annuleren
              </DialogButton>
            </DialogActions>
          </>
        )}
      </ConfirmationDialog>

      {/* User Moderation Dialog */}
      <ConfirmationDialog
        open={!!moderatingUser && !!moderationAction}
        onOpenChange={(open) => {
          if (!open) {
            setModeratingUser(null);
            setModerationAction(null);
          }
        }}
        title={
          moderationAction === 'suspend' ? 'User Schorsen?' :
          moderationAction === 'ban' ? 'User Verbannen?' :
          moderationAction === 'activate' ? 'User Activeren?' :
          'User Verwijderen?'
        }
        description={
          moderationAction === 'suspend' ? 'Deze user wordt tijdelijk geschorst en kan niet inloggen tot activatie.' :
          moderationAction === 'ban' ? 'Deze user wordt permanent verbannen van het platform.' :
          moderationAction === 'activate' ? 'Deze user wordt weer geactiveerd en kan het platform gebruiken.' :
          'Deze user en alle data worden permanent verwijderd. Deze actie kan niet ongedaan worden gemaakt!'
        }
      >
        {moderatingUser && moderationAction && (
          <>
            <div className={`bg-gradient-to-br rounded-2xl p-6 border-2 ${
              moderationAction === 'delete' || moderationAction === 'ban' 
                ? 'from-red-50 to-pink-50 border-red-200' 
                : moderationAction === 'suspend'
                ? 'from-amber-50 to-orange-50 border-amber-200'
                : 'from-green-50 to-emerald-50 border-green-200'
            }`}>
              <h4 className="text-2xl font-bold text-gray-900 mb-2">
                {moderatingUser.name}
              </h4>
              <div className="space-y-2 text-sm text-gray-700">
                <p>• Email: {moderatingUser.email}</p>
                <p>• Role: {moderatingUser.role}</p>
                <p>• Huidige Status: {
                  moderatingUser.status === 'ACTIVE' ? 'Actief' :
                  moderatingUser.status === 'SUSPENDED' ? 'Geschorst' :
                  'Verbannen'
                }</p>
                <p>• Geregistreerd: {formatDate(moderatingUser.createdAt)}</p>
              </div>
            </div>

            <DialogWarning
              type={
                moderationAction === 'delete' || moderationAction === 'ban' ? 'error' :
                moderationAction === 'suspend' ? 'warning' :
                'info'
              }
              title={
                moderationAction === 'suspend' ? 'Tijdelijke Schorsing' :
                moderationAction === 'ban' ? 'Permanente Ban' :
                moderationAction === 'activate' ? 'Account Activatie' :
                'Permanent Verwijderen'
              }
              message={
                moderationAction === 'suspend' 
                  ? 'De user kan niet inloggen tijdens de schorsing. Gebruik dit voor onderzoeken of bij twijfel. Je kunt de user later weer activeren.'
                  : moderationAction === 'ban'
                  ? 'De user wordt permanent verbannen en kan niet meer inloggen. Dit is onomkeerbaar zonder database wijziging.'
                  : moderationAction === 'activate'
                  ? 'De user krijgt weer volledige toegang tot het platform en kan normaal inloggen en het platform gebruiken.'
                  : 'Alle data van deze user (bookings, reviews, requests) wordt permanent verwijderd. Deze actie kan NIET ongedaan worden gemaakt!'
              }
            />

            <DialogActions>
              <DialogButton
                onClick={handleModerateUser}
                variant={
                  moderationAction === 'delete' || moderationAction === 'ban' ? 'danger' :
                  moderationAction === 'activate' ? 'success' :
                  'primary'
                }
                disabled={!!moderatingUserId}
                loading={moderatingUserId === moderatingUser.id}
              >
                {moderationAction === 'suspend' && 'Ja, Schorsen'}
                {moderationAction === 'ban' && 'Ja, Verbannen'}
                {moderationAction === 'activate' && 'Ja, Activeren'}
                {moderationAction === 'delete' && 'Ja, Permanent Verwijderen'}
              </DialogButton>
              <DialogButton
                onClick={() => {
                  setModeratingUser(null);
                  setModerationAction(null);
                }}
                variant="outline"
                disabled={!!moderatingUserId}
              >
                Annuleren
              </DialogButton>
            </DialogActions>
          </>
        )}
      </ConfirmationDialog>
    </main>
  );
}
