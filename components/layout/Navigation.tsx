'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from '@/components/providers/SessionProvider';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Home, Search, LayoutDashboard, MessageSquare, Shield, LogOut, User, Plus } from 'lucide-react';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Browse', href: '/browse', icon: Search },
];

const getDashboardLink = (role?: string) => {
  if (role === 'ADMIN') return '/admin';
  if (role === 'PROVIDER') return '/provider-dashboard';
  return '/dashboard';
};

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, status, update } = useSession();
  const isLoading = status === 'loading';
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll for unread message count
  useEffect(() => {
    if (status !== 'authenticated') {
      setUnreadCount(0);
      return;
    }

    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/conversations/unread');
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {
        // Silently fail
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [status]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        await update();
        router.push('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const filteredNavigation = navigation;

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" className="w-8 h-8">
                <defs>
                  <linearGradient id="navPinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#c084fc"/>
                    <stop offset="40%" stopColor="#a855f7"/>
                    <stop offset="100%" stopColor="#f59e0b"/>
                  </linearGradient>
                </defs>
                <path d="M16 2C10.5 2 6 6.2 6 11.2C6 18.5 16 30 16 30S26 18.5 26 11.2C26 6.2 21.5 2 16 2Z"
                      fill="url(#navPinGrad)"/>
                <path d="M16 6 L17.5 11 L22 12.5 L17.5 14 L16 19 L14.5 14 L10 12.5 L14.5 11 Z"
                      fill="white"/>
                <circle cx="18.5" cy="10" r="0.5" fill="white" opacity="0.7"/>
                <circle cx="13.5" cy="15" r="0.5" fill="white" opacity="0.7"/>
                <circle cx="18.5" cy="15" r="0.5" fill="white" opacity="0.7"/>
                <circle cx="13.5" cy="10" r="0.5" fill="white" opacity="0.7"/>
              </svg>
              <span className="text-2xl font-bold gradient-text">
                Eventiphy
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={cn(
                      'flex items-center space-x-2',
                      isActive && 'gradient-brand text-white'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-2">
            {isLoading ? (
              <div className="w-20 h-9 bg-gray-200 animate-pulse rounded-xl"></div>
            ) : user ? (
              <>
                {/* + Nieuw Event knop - alleen voor customers */}
                {user.role === 'CUSTOMER' && (
                  <Link href="/events/new">
                    <Button variant="outline" className="rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50">
                      <Plus className="w-4 h-4 mr-2" />
                      Nieuw Event
                    </Button>
                  </Link>
                )}
                <Link href={getDashboardLink(user.role)}>
                  <Button variant="outline" className="rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                {/* Chat knop (icon-only) met ongelezen badge */}
                <Link href="/messages">
                  <Button
                    variant={pathname.startsWith('/messages') ? 'default' : 'ghost'}
                    size="icon"
                    className={cn(
                      'rounded-xl relative',
                      pathname.startsWith('/messages')
                        ? 'gradient-brand text-white'
                        : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'
                    )}
                  >
                    <MessageSquare className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold min-w-[18px] min-h-[18px]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </Link>
                <div className="hidden md:flex items-center space-x-2 text-sm">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{user.name}</span>
                  {user.role === 'ADMIN' && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      Admin
                    </span>
                  )}
                  {user.role === 'PROVIDER' && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                      Provider
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Uitloggen
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="outline" className="rounded-xl">
                  Inloggen
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="md:hidden border-t border-gray-100">
        <div className="flex justify-around py-2">
          {filteredNavigation.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'flex flex-col items-center space-y-1',
                    isActive && 'text-purple-600'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{item.name}</span>
                </Button>
              </Link>
            );
          })}
          {/* Mobile Dashboard link - role-aware */}
          {user && (
            <Link href={getDashboardLink(user.role)}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'flex flex-col items-center space-y-1',
                  (pathname === '/dashboard' || pathname === '/provider-dashboard' || pathname === '/admin') && 'text-purple-600'
                )}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-xs">Dashboard</span>
              </Button>
            </Link>
          )}
          {/* Mobile chat link */}
          {user && (
            <Link href="/messages">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'flex flex-col items-center space-y-1 relative',
                  pathname.startsWith('/messages') && 'text-purple-600'
                )}
              >
                <MessageSquare className="w-5 h-5" />
                <span className="text-xs">Chat</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 right-0 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
