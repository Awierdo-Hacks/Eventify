import { redirect } from 'next/navigation';
import ProviderDashboardClient from './ProviderDashboardClient';
import { getProviderDashboardData, toPageUser } from '@/lib/page-data';
import { getSession } from '@/lib/auth';

export default async function ProviderDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login?redirect=/provider-dashboard');
  }

  if (session.role !== 'PROVIDER') {
    redirect('/dashboard');
  }

  const initialData = await getProviderDashboardData(session);

  return (
    <ProviderDashboardClient
      initialData={initialData}
      initialUser={toPageUser(session)}
    />
  );
}
