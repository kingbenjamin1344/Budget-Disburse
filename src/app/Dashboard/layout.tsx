import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // @ts-ignore
  const hdr = await headers();
  const cookieHeader = (hdr && typeof hdr.get === 'function') ? hdr.get('cookie') || '' : '';
  if (!cookieHeader.includes('auth-token=')) {
    redirect('/login');
  }

  return <>{children}</>;
}
