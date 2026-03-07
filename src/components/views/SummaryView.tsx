import React from 'react';
import { ClipboardCheck, Check, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const SummaryView: React.FC = () => {
  const { spaces, requirements } = useAppStore();

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
              <div className="space-y-5 ml-4 border-l border-slate-100 pl-5 text-slate-700">
                {lockedReqs.map((req: any) => (
                  <div key={req.id} className="flex gap-3 items-start animate-in fade-in">
                    {req.status === 'locked' ? <Check className="text-emerald-500 flex-shrink-0 mt-0.5" size={14} /> : <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={14} />}
                    <p className={`text-sm font-bold leading-relaxed ${req.status === 'unresolved' ? 'text-red-600' : ''}`}>{req.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ); 
        })}
      </div>
    </div>
  );
};
