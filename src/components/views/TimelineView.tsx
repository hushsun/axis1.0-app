import React from 'react';
import { Layers, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getDaysDiff, getDaysFromToday } from '../../lib/utils';

export const TimelineView: React.FC = () => {
  const { timeline, setTimeline, setIsManagingTimeline, setEditModal, updateDocSupabase } = useAppStore();

  const sortedTimeline = [...timeline].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const toggleTimelineNodeDone = async (id: string) => {
    const node = timeline.find((n: any) => n.id === id);
    setTimeline(timeline.map((t: any) => t.id === id ? { ...t, done: !node.done } : t));
    await updateDocSupabase('timeline', id, { done: !node.done });
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6 pt-2 pb-24 px-5">
      <div className="flex justify-between items-center mb-8 px-2">
        <div>
          <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">Project Schedule</h2>
          <p className="text-xl font-black tracking-tight text-slate-900 italic mt-1">进度节点推演</p>
        </div>
        <button onClick={() => setIsManagingTimeline(true)} className="flex items-center gap-1.5 text-[9px] font-bold text-slate-900 bg-slate-50 px-3 py-1.5 rounded-full uppercase tracking-tighter transition-all hover:bg-slate-100 shadow-sm border border-slate-100">
          <Layers size={12}/> 节点规划
        </button>
      </div>
      
      <div className="relative text-slate-900 ml-2">
        {sortedTimeline.map((node: any, index: number) => { 
          const nextNode = sortedTimeline[index + 1]; 
          const diffDays = nextNode ? getDaysDiff(node.date, nextNode.date) : 0; 
          const dynamicPadding = nextNode ? Math.max(32, Math.min(150, diffDays * 3.5)) : 0; 
          let pastRatio = 0; 
          
          if (nextNode) { 
            const passedDays = getDaysFromToday(node.date); 
            pastRatio = diffDays <= 0 ? (getDaysFromToday(node.date) >= 0 ? 100 : 0) : Math.max(0, Math.min(100, (passedDays / diffDays) * 100)); 
          } 
          
          const isLate = getDaysFromToday(node.date) > 0 && !node.done; 
          
          return (
            <div key={node.id} className="relative flex gap-4 items-start group" style={{ paddingBottom: `${dynamicPadding}px` }}>
              <div className="flex flex-col items-center absolute left-0 top-4 bottom-0 w-4">
                <div className={`w-3.5 h-3.5 rounded-full z-10 shadow-sm ring-4 ring-slate-50 relative shrink-0 transition-colors ${node.done ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                {nextNode && <div className="w-1 absolute transition-all" style={{ top: '14px', bottom: '-16px', background: `linear-gradient(to bottom, #ef4444 ${pastRatio}%, #e2e8f0 ${pastRatio}%)` }}></div>}
              </div>
              <div className="flex-1 ml-6 -mt-1">
                {index === 0 || sortedTimeline[index - 1].phase !== node.phase ? (
                  <div className="text-[10px] font-black uppercase tracking-widest mb-3 px-2.5 py-1 rounded inline-block bg-slate-900 text-white shadow-md">{node.phaseName}</div>
                ) : null}
                <div className="flex justify-between items-center bg-white border border-slate-100 hover:border-slate-200 p-4 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all">
                  <div className="flex-1 cursor-pointer pr-4" onClick={() => setEditModal({ type: 'edit_timeline', itemId: node.id, title: '修改节点计划', name: node.title || node.text, val1: node.date })}>
                    <div className={`text-[11px] font-bold font-mono tracking-widest mb-1.5 flex items-center gap-2 ${isLate ? 'text-red-500' : 'text-slate-400'}`}>
                      {node.date.replace(/-/g, '.')}
                      {isLate && <span className="bg-red-50 text-red-500 px-1.5 py-0.5 rounded text-[9px] uppercase font-black">延期预警</span>}
                    </div>
                    <div className={`text-sm font-black leading-snug transition-all ${node.done ? 'text-slate-400 line-through opacity-70' : 'text-slate-800'}`}>{node.title || node.text}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); toggleTimelineNodeDone(node.id); }} className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${node.done ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'border-slate-200 text-slate-300 hover:border-emerald-400 bg-slate-50'}`}>
                    <Check size={20} strokeWidth={4} />
                  </button>
                </div>
              </div>
            </div>
          ); 
        })}
      </div>
    </div>
  );
};
