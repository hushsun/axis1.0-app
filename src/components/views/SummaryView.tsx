import React from 'react';
import { ClipboardCheck, Check, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const SummaryView: React.FC = () => {
  const { spaces, requirements, projectUsers } = useAppStore();

  const getUserInfo = (id: string) => {
    return projectUsers && projectUsers[id] ? projectUsers[id] : { id, name: '未知', color: 'bg-slate-300', textColor: 'text-white', avatar: null };
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 pb-20 text-center py-6 px-5">
      <h2 className="text-2xl font-black tracking-tighter italic uppercase text-slate-900">Collaboration Ledger</h2>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1 italic">Final Decision Baseline</p>
      
      <div className="space-y-8 pt-4 border-t border-slate-100 text-left px-1">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="text-slate-900" size={18} />
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest italic">已达成共识 Baseline</h3>
        </div>
        
        {spaces.map((space: any) => { 
          const lockedReqs = requirements.filter((r: any) => r.spaceId === space.id && (r.status === 'locked' || r.status === 'unresolved')); 
          if (lockedReqs.length === 0) return null; 
          
          return (
            <div key={space.id} className="relative px-2 mb-8 animate-in fade-in">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{space.icon}</span>
                <span className="font-black text-xs uppercase tracking-widest text-slate-400 italic">{space.name}</span>
              </div>
              <div className="space-y-8 ml-4 border-l border-slate-100 pl-5 text-slate-700">
                {lockedReqs.map((req: any) => {
                  const creatorInfo = getUserInfo(req.creatorId);
                  return (
                    <div key={req.id} className="animate-in fade-in flex flex-col gap-3">
                      {req.history && req.history.length > 0 && (
                        <div className="space-y-3">
                          {req.history.map((h: any, i: number) => {
                            const hCreator = getUserInfo(h.creatorId || req.creatorId);
                            return (
                              <div key={i} className="flex gap-3 items-start opacity-50">
                                <div className="w-[14px] flex-shrink-0 flex justify-center mt-1.5">
                                  <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 mb-0.5">{hCreator.name} 提案 (R.{h.round})</p>
                                  <p className="text-xs text-slate-500 leading-snug italic line-through">{h.text}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      <div className="flex gap-3 items-start">
                        {req.status === 'locked' ? <Check className="text-emerald-500 flex-shrink-0 mt-1" size={14} /> : <AlertTriangle className="text-red-500 flex-shrink-0 mt-1" size={14} />}
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 mb-0.5">{creatorInfo.name} {req.status === 'locked' ? '最终共识' : '最终分歧'} (R.{req.currentRound || 1})</p>
                          <p className={`text-sm font-bold leading-relaxed ${req.status === 'unresolved' ? 'text-red-600' : 'text-slate-900'}`}>{req.text}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ); 
        })}
      </div>
    </div>
  );
};
