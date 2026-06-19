export const GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export const TAG_CATEGORIES = ['SOURCE', 'METHOD', 'SKILL', 'TYPE', 'EXAM', 'YEAR'];

export const getTagColorClass = (category: string, isSelected: boolean): string => {
  const cat = category.toUpperCase();
  if (isSelected) {
    switch (cat) {
      case 'SOURCE': return 'bg-orange-500 border-orange-500 text-white';
      case 'METHOD': return 'bg-blue-500 border-blue-500 text-white';
      case 'SKILL': return 'bg-purple-500 border-purple-500 text-white';
      case 'TYPE': return 'bg-emerald-500 border-emerald-500 text-white';
      case 'EXAM': return 'bg-rose-500 border-rose-500 text-white';
      default: return 'bg-slate-600 border-slate-600 text-white';
    }
  } else {
    switch (cat) {
      case 'SOURCE': return 'bg-orange-500/8 border-orange-500/20 text-orange-600 hover:border-orange-500/40';
      case 'METHOD': return 'bg-blue-500/8 border-blue-500/20 text-blue-600 hover:border-blue-500/40';
      case 'SKILL': return 'bg-purple-500/8 border-purple-500/20 text-purple-600 hover:border-purple-500/40';
      case 'TYPE': return 'bg-emerald-500/8 border-emerald-500/20 text-emerald-600 hover:border-emerald-500/40';
      case 'EXAM': return 'bg-rose-500/8 border-rose-500/20 text-rose-600 hover:border-rose-500/40';
      default: return 'bg-slate-500/8 border-slate-500/20 text-slate-600 hover:border-slate-500/40';
    }
  }
};
