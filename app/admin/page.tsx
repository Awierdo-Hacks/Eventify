import { redirect } from 'next/navigation';
import AdminClient from './AdminClient';
import { getAdminStats } from '@/lib/page-data';
import { getSession } from '@/lib/auth';

export default async function AdminPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login?redirect=/admin');
  }

  if (session.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const initialStats = await getAdminStats();

  return <AdminClient initialStats={initialStats} />;
}
