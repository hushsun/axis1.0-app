import React, { useState } from 'react';
import { Settings2, Plus, Trash2, Check, AlertTriangle, CornerDownRight, XCircle, CheckCircle2, Send } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const SpacesView: React.FC = () => {
  const { 
    spaces, activeSpace, setActiveSpace, isManagingSpaces, setIsManagingSpaces, 
    requirements, currentUser, handleVote, submitCounterProposal, deleteSpace, deleteRequirement,
    setShowAddSpaceModal, inputText, setInputText, addRequirement
  } = useAppStore();

  const [isEditingRequirements, setIsEditingRequirements] = useState(false);

  React.useEffect(() => {
    if (spaces.length > 0 && (!activeSpace || !spaces.find((s: any) => s.id === activeSpace.id))) {
      setActiveSpace(spaces[0]);
    }
  }, [spaces, activeSpace, setActiveSpace]);

  const [counterProposalText, setCounterProposalText] = useState('');

  const getUserInfo = (id: string) => {
    const projectUsers = useAppStore.getState().projectUsers;
    return projectUsers && projectUsers[id] ? projectUsers[id] : { id, name: '未知', color: 'bg-slate-300', textColor: 'text-white', avatar: null };
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6 p-5">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Dimension Registry</h2>
        <div className="flex gap-2">
          <button onClick={() => setIsManagingSpaces(!isManagingSpaces)} className={`p-2 rounded-full shadow-sm transition-all ${isManagingSpaces ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
            <Settings2 size={14}/>
          </button>
          <button onClick={() => setShowAddSpaceModal(true)} className="p-2 bg-slate-900 text-white rounded-full shadow-lg active:scale-90 transition-transform">
            <Plus size={14}/>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {spaces.map((s: any) => (
          <button key={s.id} onClick={() => !isManagingSpaces && setActiveSpace(s)} className={`p-4 rounded-2xl border transition-all relative ${activeSpace?.id === s.id && !isManagingSpaces ? 'bg-slate-900 text-white border-slate-900 shadow-xl scale-105 z-10' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}>
            {isManagingSpaces && <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-md" onClick={(e) => { e.stopPropagation(); deleteSpace(s.id); }}><Trash2 size={10}/></div>}
            <span className="text-xl mb-1 block leading-none">{s.icon}</span>
            <span className="text-[10px] font-bold uppercase truncate w-full block tracking-tighter">{s.name}</span>
          </button>
        ))}
      </div>
      
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-xl font-black italic text-slate-900">{activeSpace?.name || 'Loading'} 的想法</h3>
          <button onClick={() => setIsEditingRequirements(!isEditingRequirements)} className={`p-2 rounded-xl transition-all ${isEditingRequirements ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400 hover:text-slate-900'}`}>
            <Settings2 size={16} />
          </button>
        </div>
        {requirements.filter((r: any) => r.spaceId === activeSpace?.id).length === 0 && (
          <div className="py-20 text-center opacity-40 italic text-sm font-bold text-slate-400">暂无执念...</div>
        )}
        {requirements.filter((r: any) => r.spaceId === activeSpace?.id).map((req: any) => { 
          const isLocked = req.status === 'locked'; 
          const creatorInfo = getUserInfo(req.creatorId); 
          const isAuthor = req.creatorId === currentUser.id;
          // Only the person who did NOT create the current proposal can vote.
          const canVote = !isAuthor;
          
          return (
            <div key={req.id} className={`p-5 rounded-[28px] border transition-all relative overflow-hidden ${isLocked ? 'bg-slate-50 border-slate-200' : req.status === 'unresolved' ? 'bg-red-50 border-red-100' : req.status === 'disputed' ? 'bg-orange-50/50 border-orange-100 shadow-sm' : 'bg-white border-slate-100 shadow-sm'}`}>
              {isEditingRequirements && isAuthor && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center animate-in fade-in z-20" onClick={e => e.stopPropagation()}>
                  <button type="button" onClick={(e) => { e.stopPropagation(); deleteRequirement(req.id); }} className="p-4 bg-red-500 text-white rounded-full shadow-xl active:scale-90 transition-transform"><Trash2 size={24}/></button>
                </div>
              )}
              <div className="flex justify-between items-center mb-4 border-b border-slate-100/50 pb-3">
                <div className="flex items-center gap-2">
                  {creatorInfo.avatar ? <img src={creatorInfo.avatar} className="w-5 h-5 rounded-full object-cover shadow-sm" alt="avatar" /> : <span className={`w-2 h-2 rounded-full ${creatorInfo.color}`}></span>}
                  <span className="text-xs font-black text-slate-500">{creatorInfo.name} 提案</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">R.{req.currentRound}</span>
                  {isLocked && <div className="text-[9px] bg-emerald-500 text-white px-2 rounded-full flex items-center gap-1 shadow-sm font-bold italic tracking-tighter"><Check size={10}/> 锁定</div>}
                  {req.status === 'unresolved' && <div className="text-[9px] bg-red-600 text-white px-2 rounded-full flex items-center gap-1 shadow-sm font-bold italic tracking-tighter"><AlertTriangle size={10}/> 最终分歧</div>}
                </div>
              </div>
              
              {req.history.map((h: any, i: number) => {
                const hCreator = getUserInfo(h.creatorId || req.creatorId);
                return (
                  <div key={i} className="mb-2 pl-3 border-l-2 border-slate-200 opacity-40">
                    <p className="text-[10px] font-bold text-slate-500 mb-1">{hCreator.name} 提案 (R.{h.round})</p>
                    <p className="text-xs line-through text-slate-400 leading-snug font-mono italic">{h.text}</p>
                  </div>
                );
              })}
              
              <p className={`text-base font-semibold leading-relaxed ${isLocked ? 'text-slate-500 opacity-60' : req.status === 'unresolved' ? 'text-red-700' : 'text-slate-800'}`}>
                {req.status === 'disputed' && <CornerDownRight size={14} className="inline mr-2 text-orange-400" />}
                {req.text}
              </p>
              
              {!isLocked && req.status !== 'unresolved' && req.status !== 'disputed' && (
                <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-100">
                  <button onClick={() => canVote && handleVote(req.id, 'disagree')} disabled={!canVote} className={`transition-all ${!canVote ? 'opacity-20 cursor-not-allowed scale-90' : 'text-slate-300 hover:text-red-500 active:scale-90'}`}><XCircle size={24}/></button>
                  <button onClick={() => canVote && handleVote(req.id, 'agree')} disabled={!canVote} className={`p-2 rounded-xl active:scale-90 transition-all shadow-sm font-black italic ${!canVote ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-slate-100 text-slate-900'}`}><CheckCircle2 size={24}/></button>
                </div>
              )}
              
              {req.status === 'disputed' && (
                <div className="mt-4 pt-4 border-t border-orange-100 animate-in slide-in-from-top-2">
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2 italic font-bold">输入修正建议 / ROUND {req.currentRound}：</p>
                  <div className="flex gap-2">
                    <input type="text" value={counterProposalText} onChange={e => setCounterProposalText(e.target.value)} placeholder="输入修正后的 Plan B..." className="flex-1 bg-white border border-orange-200 rounded-xl px-4 py-2 text-[16px] focus:ring-1 focus:ring-orange-400 outline-none shadow-inner" />
                    <button onClick={() => { submitCounterProposal(req.id, counterProposalText); setCounterProposalText(''); }} className="bg-orange-500 text-white px-4 rounded-xl shadow-lg active:scale-90 transition-transform font-black"><Send size={16}/></button>
                  </div>
                </div>
              )}
            </div>
          ); 
        })}
      </div>
    </div>
  );
};
