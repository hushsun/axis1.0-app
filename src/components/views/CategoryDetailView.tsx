import React from 'react';
import { ArrowLeft, Plus, Trash2, Pencil, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const CategoryDetailView: React.FC = () => {
  const { 
    activeCategoryId, setActiveCategoryId, categories, setCategories, 
    setEditModal, updateDocSupabase 
  } = useAppStore();

  const category = categories.find(c => c.id === activeCategoryId);

  if (!category) return null;

  const catBudget = category.items.reduce((s: number, i: any) => s + i.budget, 0);
  const catActual = category.items.reduce((s: number, i: any) => s + (i.actual || 0), 0);
  const diff = catBudget - catActual;

  const deleteItem = async (itemId: string) => {
    const newItems = category.items.filter((i: any) => i.id !== itemId);
    const newCats = categories.map(c => c.id === activeCategoryId ? { ...c, items: newItems } : c);
    setCategories(newCats);
    await updateDocSupabase('categories', activeCategoryId!, { items: newItems });
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-500 flex flex-col h-full bg-white">
      <header className="px-6 py-4 border-b border-slate-100 flex items-center gap-4 sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <button onClick={() => setActiveCategoryId(null)} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-lg font-black italic text-slate-900 leading-none">{category.name}</h2>
          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Category Breakdown</p>
        </div>
      </header>

      <div className="p-6 space-y-6 overflow-y-auto pb-32">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-100">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Planned 预设</div>
            <div className="text-xl font-black text-slate-900 font-mono italic">¥{catBudget.toLocaleString()}</div>
          </div>
          <div className="bg-sky-50 p-5 rounded-[24px] border border-sky-100">
            <div className="text-[9px] font-black text-sky-400 uppercase tracking-widest mb-1 italic">Actual 实付</div>
            <div className="text-xl font-black text-sky-600 font-mono italic">¥{catActual.toLocaleString()}</div>
          </div>
        </div>

        <div className="flex justify-between items-center px-1">
          <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Itemized Ledger</h3>
          <button 
            onClick={() => setEditModal({ type: 'add_item', title: '新增子项', catId: category.id, val1: 0, name: '' })}
            className="flex items-center gap-1.5 text-[9px] font-bold text-white bg-slate-900 px-3 py-1.5 rounded-full uppercase tracking-tighter shadow-lg active:scale-95"
          >
            <Plus size={12}/> 新增项
          </button>
        </div>

        <div className="space-y-3">
          {category.items.length === 0 && (
            <div className="py-20 text-center text-slate-300 font-black italic text-sm">暂无明细项...</div>
          )}
          {category.items.map((item: any) => {
            const [mainName, description] = item.name.split('（');
            const cleanDescription = description ? description.replace('）', '') : '';
            
            return (
              <div key={item.id} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:border-slate-200 transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-black text-slate-900 text-sm leading-tight">{mainName}</h4>
                    {cleanDescription && <p className="text-[10px] text-slate-400 font-bold mt-1 leading-relaxed">{cleanDescription}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      {item.actual > 0 ? (
                        <span className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-tighter bg-emerald-50 px-1.5 py-0.5 rounded">
                          <CheckCircle2 size={10} /> 已支付
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-tighter bg-slate-50 px-1.5 py-0.5 rounded">
                          <AlertCircle size={10} /> 待支付
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditModal({ type: 'edit_item_full', title: '编辑子项', catId: category.id, itemId: item.id, name: item.name, val1: item.budget, val2: item.actual })} className="p-1.5 text-slate-300 hover:text-slate-900 transition-colors"><Pencil size={14}/></button>
                    <button onClick={() => deleteItem(item.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-50">
                  <div>
                    <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Budget</div>
                    <div className="text-xs font-black text-slate-400 font-mono">¥{item.budget.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Actual</div>
                    <div className="text-xs font-black text-sky-600 font-mono">¥{(item.actual || 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
