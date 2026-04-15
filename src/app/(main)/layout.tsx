import LayoutWrapper from '@/components/layout/LayoutWrapper'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <LayoutWrapper>{children}</LayoutWrapper>
}
