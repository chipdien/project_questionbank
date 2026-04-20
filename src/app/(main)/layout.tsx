import LayoutWrapper from '@/components/layout/LayoutWrapper';
import { getCurrentUser } from '@/lib/utils/auth-utils';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return <LayoutWrapper user={user}>{children}</LayoutWrapper>;
}
