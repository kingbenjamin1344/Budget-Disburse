import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AddBudgetLayout({ children }: { children: React.ReactNode }) {
  // Some Next.js typings may expose headers() as a promise; await to be safe
  // and avoid runtime/type mismatches across environments.
  // @ts-ignore
  const hdr = await headers();
  const cookieHeader = (hdr && typeof hdr.get === 'function') ? hdr.get('cookie') || '' : '';
  if (!cookieHeader.includes('auth-token=')) {
    // Redirect server-side to login if no auth cookie
    redirect('/login');
  }

  return <>{children}</>;
}
