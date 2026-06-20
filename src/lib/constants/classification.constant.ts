export const GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export const TAG_CATEGORIES = ['SOURCE', 'METHOD', 'SKILL', 'TYPE', 'EXAM', 'YEAR'];

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  single_choice: 'Trắc nghiệm 1 đáp án',
  multiple_choice: 'Trắc nghiệm nhiều đáp án',
  true_false: 'Đúng / Sai',
  fill_in: 'Điền khuyết',
  essay: 'Tự luận',
};

export const getTagColorClass = (category: string, isSelected: boolean): string => {
  const cat = category.toUpperCase();
  if (isSelected) {
    switch (cat) {
      case 'SKILL': return 'bg-blue-500 border-blue-500 text-white';
      case 'SOURCE': return 'bg-purple-500 border-purple-500 text-white';
      case 'METHOD': return 'bg-emerald-500 border-emerald-500 text-white';
      case 'TYPE': return 'bg-amber-500 border-amber-500 text-white';
      case 'EXAM': return 'bg-rose-500 border-rose-500 text-white';
      case 'YEAR': return 'bg-cyan-500 border-cyan-500 text-white';
      default: return 'bg-slate-600 border-slate-600 text-white';
    }
  } else {
    switch (cat) {
      case 'SKILL': return 'bg-blue-500/8 border-blue-500/20 text-blue-600 hover:border-blue-500/40';
      case 'SOURCE': return 'bg-purple-500/8 border-purple-500/20 text-purple-600 hover:border-purple-500/40';
      case 'METHOD': return 'bg-emerald-500/8 border-emerald-500/20 text-emerald-600 hover:border-emerald-500/40';
      case 'TYPE': return 'bg-amber-500/8 border-amber-500/20 text-amber-600 hover:border-amber-500/40';
      case 'EXAM': return 'bg-rose-500/8 border-rose-500/20 text-rose-600 hover:border-rose-500/40';
      case 'YEAR': return 'bg-cyan-500/8 border-cyan-500/20 text-cyan-600 hover:border-cyan-500/40';
      default: return 'bg-slate-500/8 border-slate-500/20 text-slate-600 hover:border-slate-500/40';
    }
  }
};

export const getTagBadgeClass = (category?: string): string => {
  if (!category) return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
  switch (category.toUpperCase()) {
    case 'SKILL':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/25';
    case 'SOURCE':
      return 'bg-purple-500/10 text-purple-600 border-purple-500/25';
    case 'METHOD':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25';
    case 'TYPE':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/25';
    case 'EXAM':
      return 'bg-rose-500/10 text-rose-600 border-rose-500/25';
    case 'YEAR':
      return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/25';
    default:
      return 'bg-slate-500/10 text-slate-550 border-slate-500/25';
  }
};

export const getTagChipColorClass = (category: string): string => {
  const cat = category.toUpperCase();
  switch (cat) {
    case 'SKILL': return 'bg-blue-500/10 text-blue-600 border-blue-500/25';
    case 'SOURCE': return 'bg-purple-500/10 text-purple-600 border-purple-500/25';
    case 'METHOD': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25';
    case 'TYPE': return 'bg-amber-500/10 text-amber-600 border-amber-500/25';
    case 'EXAM': return 'bg-rose-500/10 text-rose-600 border-rose-500/25';
    case 'YEAR': return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/25';
    default: return 'bg-slate-500/10 text-slate-600 border-slate-500/25';
  }
};

export const getDifficultyStyles = (diffName: string, difficulties: any[]) => {
  const diff = difficulties?.find(
    (d) => d.name.toLowerCase() === diffName.toLowerCase()
  );
  const color = diff?.color_code || '#f97316';
  return {
    backgroundColor: `${color}15`, // ~8% opacity
    color: color,
    borderColor: `${color}30`, // ~18% opacity
  };
};
