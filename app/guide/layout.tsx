import type { Metadata } from 'next';
import GuideShell from './GuideShell';

export const metadata: Metadata = {
  title: 'Guide – CppEditor',
  description: 'CppEditor user guide – online C++/Python compiler',
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return <GuideShell>{children}</GuideShell>;
}
