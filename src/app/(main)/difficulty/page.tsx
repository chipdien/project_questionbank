export const dynamic = 'force-dynamic';

import { getCurrentUser } from '@/lib/utils/auth-utils';
import { redirect } from 'next/navigation';
import { getDifficulties } from '@/actions/difficulty';
import DifficultyManager from './components/DifficultyManager';

export default async function DifficultyPage() {
  const user = await getCurrentUser();
  if (!user || (user.level_rank || 0) < 5) {
    redirect('/');
  }

  const difficulties = await getDifficulties();

  return (
    <div className="p-8 min-h-full">
      <DifficultyManager initialDifficulties={difficulties} />
    </div>
  );
}
