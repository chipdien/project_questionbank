export const dynamic = 'force-dynamic';

import { getCurrentUser } from '@/lib/utils/auth.utils';
import { redirect } from 'next/navigation';
import { getDifficultiesAction } from '@/lib/actions/difficulty.action';
import DifficultyManager from './components/DifficultyManager';

export default async function DifficultyPage() {
  const user = await getCurrentUser();
  if (!user || (user.level_rank || 0) < 5) {
    redirect('/');
  }

  const response = await getDifficultiesAction();
  const difficulties = response.success ? response.data || [] : [];

  return (
    <div className="p-8 min-h-full bg-slate-50">
      <DifficultyManager initialDifficulties={difficulties} />
    </div>
  );
}
