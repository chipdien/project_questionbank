export const ADMIN_MIN_LEVEL = 5;

/**
 * Checks if a given level_rank corresponds to an Admin role.
 */
export const isAdminRank = (rank: number | undefined | null): boolean => {
  return (rank || 0) >= ADMIN_MIN_LEVEL;
};

/**
 * Gets the Vietnamese label for a given level_rank.
 */
export const getRoleLabelVi = (rank: number | undefined | null): string => {
  return isAdminRank(rank) ? 'Admin' : 'Giáo viên';
};

/**
 * Gets the English label for a given level_rank.
 */
export const getRoleLabelEn = (rank: number | undefined | null): string => {
  return isAdminRank(rank) ? 'Admin' : 'Teacher';
};

/**
 * Gets the CSS class string for a role badge based on level_rank.
 */
export const getRoleBadgeClass = (rank: number | undefined | null): string => {
  return isAdminRank(rank)
    ? 'bg-rose-50/80 text-rose-600 border border-rose-200/50'
    : 'bg-emerald-50/80 text-emerald-600 border border-emerald-200/50';
};
