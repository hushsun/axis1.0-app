import React, { useMemo } from 'react';

interface BudgetPieChartProps {
  categories: any[];
  onSelect: (id: string) => void;
}

export const BudgetPieChart: React.FC<BudgetPieChartProps> = ({ categories, onSelect }) => {
  const totalCategoryBudget = useMemo(() => 
    categories.reduce((acc, cat) => acc + cat.items.reduce((s: any, i: any) => s + i.budget, 0), 0)
  , [categories]);

  let cumulativePercent = 0;
  const colors = ["#06b6d4", "#3b82f6", "#8b5cf6", "#f43f5e", "#f59e0b", "#10b981", "#ec4899", "#f97316"];

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div className="relative flex flex-col items-center py-6 font-sans">
      <svg viewBox="-1.2 -1.2 2.4 2.4" className="w-64 h-64 -rotate-90 transform drop-shadow-2xl transition-all duration-700">
        {totalCategoryBudget === 0 ? (
          <circle cx="0" cy="0" r="1" fill="#f1f5f9" className="opacity-50" />
        ) : (
          categories.map((cat, index) => {
            const catBudget = cat.items.reduce((s: any, i: any) => s + i.budget, 0);
            if (catBudget <= 0) return null;
            const percent = catBudget / totalCategoryBudget;
            if (percent >= 0.999) return <circle key={cat.id} cx="0" cy="0" r="1" fill={colors[index % colors.length]} className="cursor-pointer hover:opacity-90 transition-opacity outline-none" onClick={() => onSelect(cat.id)} />;

            const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
            cumulativePercent += percent;
            const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
            const largeArcFlag = percent > 0.5 ? 1 : 0;
            return <path key={cat.id} d={`M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0`} fill={colors[index % colors.length]} className="cursor-pointer hover:opacity-90 transition-opacity outline-none" onClick={() => onSelect(cat.id)} />;
          })
        )}
        <circle cx="0" cy="0" r="0.55" fill="white" />
      </svg>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center pointer-events-none">
        <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Ratio</div>
        <div className="text-xs font-black text-slate-900 tracking-tighter italic leading-none">资金<br/>结构</div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-10 px-2 w-full">
        {categories.map((cat, index) => {
           const catBudget = cat.items.reduce((s: any, i: any) => s + i.budget, 0);
           const percent = totalCategoryBudget > 0 ? ((catBudget / totalCategoryBudget) * 100).toFixed(1) : 0;
           return (
             <button key={cat.id} onClick={() => onSelect(cat.id)} className="flex items-center gap-2.5 text-left group transition-transform active:scale-95 leading-none">
                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: colors[index % colors.length] }}></div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-900 leading-tight uppercase truncate max-w-[120px]">{cat.name}</span>
                  <span className="text-[8px] font-bold text-slate-400 tabular-nums">{percent}%占比</span>
                </div>
             </button>
           );
        })}
      </div>
    </div>
  );
};
