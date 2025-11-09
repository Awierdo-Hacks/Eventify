'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/components/providers/SessionProvider';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Home, Search, FileText, LayoutDashboard, MessageSquare, Shield, LogOut, User } from 'lucide-react';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Browse', href: '/browse', icon: Search },
  { name: 'Documentatie', href: '/docs', icon: FileText },
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
              <span className="text-2xl font-bold gradient-text">
                Eventify
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
                <Link href={getDashboardLink(user.role)}>
                  <Button variant="default" className="gradient-brand rounded-xl">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
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
        </div>
      </div>
    </nav>
  );
}
