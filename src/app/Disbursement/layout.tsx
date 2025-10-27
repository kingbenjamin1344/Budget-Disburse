import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DisbursementLayout({ children }: { children: React.ReactNode }) {
  // Await headers() to handle environments where it's a promise
  // @ts-ignore
  const hdr = await headers();
  const cookieHeader = (hdr && typeof hdr.get === 'function') ? hdr.get('cookie') || '' : '';
  if (!cookieHeader.includes('auth-token=')) {
    redirect('/login');
  }

  return <>{children}</>;
}
