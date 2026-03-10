import React, { useMemo } from 'react';
import { Pencil, XCircle, CheckCircle2, Droplets, Layers, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { BudgetPieChart } from '../ui/BudgetPieChart';

export const BudgetView: React.FC = () => {
  const { 
    totalBudgetState, setEditModal, currentUser, categories, 
    setIsManagingCategories, setActiveCategoryId, confirmBudget
  } = useAppStore();

  const spentTotal = useMemo(() => categories.reduce((sum: number, cat: any) => sum + cat.items.reduce((s: number, i: any) => s + (i.actual || 0), 0), 0), [categories]);
  const planTotalSum = useMemo(() => categories.reduce((sum: number, cat: any) => sum + cat.items.reduce((s: number, i: any) => s + i.budget, 0), 0), [categories]);
  const committedTotal = useMemo(() => categories.reduce((sum: number, cat: any) => sum + cat.items.reduce((s: number, i: any) => s + (i.actual === 0 ? i.budget : 0), 0), 0), [categories]);
  const displayTotalBudget = useMemo(() => totalBudgetState.status === 'pending' && totalBudgetState.proposal ? totalBudgetState.proposal.value : totalBudgetState.value, [totalBudgetState]);
  const remainingTotal = Math.max(0, displayTotalBudget - spentTotal - committedTotal);
  const isPlanOverBudget = planTotalSum > displayTotalBudget;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 p-5">
      <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-center mb-4 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">
          <span>Total Project Capital 总预算</span>
        </div>
        {totalBudgetState.status === 'pending' ? (
          <div className="bg-amber-50 rounded-[24px] p-4 border border-amber-100 flex justify-between items-center animate-in zoom-in shadow-sm">
            <div>
              <div className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-1">提案总容量</div>
              <div className="text-2xl font-black text-amber-600 font-mono tracking-tighter italic">¥{totalBudgetState.proposal.value.toLocaleString()}</div>
            </div>
            {totalBudgetState.proposal.by !== currentUser.id && (
              <div className="flex gap-2">
                <button onClick={() => confirmBudget(false)} className="bg-white p-2 rounded-xl text-slate-400 shadow-sm transition-all active:scale-90"><XCircle size={18}/></button>
                <button onClick={() => confirmBudget(true)} className="bg-slate-900 p-2 rounded-xl text-white shadow-md transition-all active:scale-90"><CheckCircle2 size={18}/></button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-4xl font-black tracking-tighter text-slate-900 font-mono italic">¥{totalBudgetState.value.toLocaleString()}</div>
            <button onClick={() => setEditModal({ type: 'total_budget', title: '修改总预算', val1: totalBudgetState.value })} className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-full">
              <Pencil size={18} />
            </button>
          </div>
        )}
        {isPlanOverBudget && (
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-2xl border border-red-100 animate-in fade-in">
            <AlertTriangle size={16} />
            <span>大类规划总额 (¥{planTotalSum.toLocaleString()}) 已超出总预算！</span>
          </div>
        )}
      </div>
      
      <div className="relative h-[440px] w-full bg-slate-50 border border-slate-200 rounded-[56px] overflow-hidden shadow-inner flex flex-col-reverse transition-all">
        <div className="bg-gradient-to-t from-sky-800 to-sky-600 transition-all duration-700 shadow-[0_-8px_40px_rgba(7,89,133,0.4)] relative flex items-center px-8" style={{ height: `${Math.min(100, (spentTotal / (displayTotalBudget || 1)) * 100)}%`, minHeight: spentTotal > 0 ? '60px' : '0px' }}>
          <div className="text-white">
            <div className="flex items-center gap-1 opacity-60 mb-1">
              <Droplets size={10}/>
              <span className="text-[9px] font-black uppercase tracking-widest italic">Invoiced 已付</span>
            </div>
            <span className="text-2xl font-black tracking-tighter font-mono italic">¥{spentTotal.toLocaleString()}</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-1 bg-white/20 backdrop-blur-sm"></div>
        </div>
        <div className="bg-sky-200/40 transition-all duration-1000 border-t border-white/50 relative flex items-center px-8" style={{ height: `${Math.min(100, (committedTotal / (displayTotalBudget || 1)) * 100)}%`, minHeight: committedTotal > 0 ? '50px' : '0px' }}>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-sky-600 uppercase tracking-widest mb-1 opacity-80 italic font-bold">Committed 待支</span>
            <span className="text-lg font-black text-sky-600 font-mono tracking-tight italic">¥{committedTotal.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex-1 flex items-center px-8 relative" style={{ minHeight: '60px' }}>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1 font-bold italic">Remaining 剩余容量</span>
            <span className="text-xl font-black text-slate-400 font-mono italic tracking-tighter">¥{remainingTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white border border-slate-100 rounded-[40px] p-6 shadow-sm overflow-hidden mb-12">
        <div className="flex justify-between items-center mb-2 px-2">
          <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Allocation Matrix</h3>
          <button onClick={() => setIsManagingCategories(true)} className="flex items-center gap-1.5 text-[9px] font-bold text-slate-900 bg-slate-50 px-3 py-1.5 rounded-full uppercase tracking-tighter transition-all hover:bg-slate-100 shadow-sm border border-slate-100">
            <Layers size={12}/> 类别规划
          </button>
        </div>
        <div className="px-2 mb-2 flex items-baseline gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic font-mono tracking-tighter">Planned Total:</span>
          <span className={`text-xl font-black tracking-tight font-mono ${isPlanOverBudget ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>¥{planTotalSum.toLocaleString()}</span>
          {isPlanOverBudget && <AlertTriangle size={14} className="text-red-600" />}
        </div>
        <BudgetPieChart categories={categories} onSelect={(id) => setActiveCategoryId(id)} />
      </div>
    </div>
  );
};
