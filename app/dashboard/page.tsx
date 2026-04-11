import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import { getCustomerDashboardData, toPageUser } from '@/lib/page-data';
import { getSession } from '@/lib/auth';

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await getSession();

  if (!session) {
    redirect('/login?redirect=/dashboard');
  }

  if (session.role === 'PROVIDER') {
    redirect('/provider-dashboard');
  }

  if (session.role === 'ADMIN') {
    redirect('/admin');
  }

  const params = (await searchParams) ?? {};
  const initialData = await getCustomerDashboardData(session);

  return (
    <DashboardClient
      initialData={initialData}
      initialUser={toPageUser(session)}
      initialTab={firstParam(params.tab) || 'events'}
      initialSuccess={firstParam(params.success)}
    />
  );
}
