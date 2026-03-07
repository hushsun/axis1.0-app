import React, { useRef, useState } from 'react';
import { Settings2, UploadCloud, AlertTriangle, Plus, Maximize2, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { compressImage } from '../../lib/utils';

export const VisualsView: React.FC = () => {
  const { 
    visualsTab, setVisualsTab, spaces, visualActiveSpaceId, setVisualActiveSpaceId,
    intentImages, setIntentImages, materials, setMaterials, setPreviewImage,
    setGlobalMsg, setDocSupabase, deleteDocSupabase, uploadImageSupabase
  } = useAppStore();

  const [isEditingIntents, setIsEditingIntents] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ title: '', remark: '', url: '' });

  const intentFileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!visualActiveSpaceId && spaces.length > 0) {
      setVisualActiveSpaceId(spaces[0].id);
    }
  }, [spaces, visualActiveSpaceId, setVisualActiveSpaceId]);

  const handleIntentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const currentIntents = intentImages[visualActiveSpaceId] || [];
    if (currentIntents.length >= 5) { setGlobalMsg("每个空间最多上传5张意向图！"); return; }
    
    setGlobalMsg("图片上传中...");
    const blob = await compressImage(file);
    if (!blob) { setGlobalMsg("图片处理失败"); return; }
    const path = `intents/${visualActiveSpaceId}/${Date.now()}.jpg`;
    const url = await uploadImageSupabase(blob, path);
    if (!url) return;
    
    const newImg = { id: Date.now().toString(), spaceId: visualActiveSpaceId, url, timestamp: Date.now() };
    
    setIntentImages({
        ...intentImages,
        [visualActiveSpaceId]: [newImg, ...(intentImages[visualActiveSpaceId] || [])]
    });

    await setDocSupabase('intentImages', newImg.id, newImg);
    e.target.value = ''; setGlobalMsg('');
  };

  const handleDeleteIntent = async (imageId: string) => { 
      const newMap = { ...intentImages };
      if (newMap[visualActiveSpaceId]) {
          newMap[visualActiveSpaceId] = newMap[visualActiveSpaceId].filter((img: any) => img.id !== imageId);
      }
      setIntentImages(newMap);
      await deleteDocSupabase('intentImages', imageId); 
  };

  const handleMaterialImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGlobalMsg("图片上传中...");
    const blob = await compressImage(file);
    if (!blob) { setGlobalMsg("图片处理失败"); return; }
    const path = `materials/${Date.now()}.jpg`;
    const url = await uploadImageSupabase(blob, path);
    if (url) setNewMaterial(prev => ({ ...prev, url }));
    e.target.value = ''; setGlobalMsg('');
  };

  const submitNewMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.url || !newMaterial.title.trim()) return;
    const m = { id: Date.now().toString(), ...newMaterial, timestamp: Date.now() };
    setMaterials([m, ...materials]);
    await setDocSupabase('materials', m.id, m);
    setShowMaterialModal(false); setNewMaterial({ title: '', remark: '', url: '' });
  };

  const deleteMaterial = async (id: string) => { 
      setMaterials(materials.filter((m: any) => m.id !== id));
      await deleteDocSupabase('materials', id); 
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 pb-20 px-5 pt-5">
      <div className="flex bg-slate-200/60 p-1.5 rounded-full mb-6 relative shadow-inner">
        <button onClick={() => setVisualsTab('intent')} className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-full transition-all relative z-10 ${visualsTab === 'intent' ? 'text-slate-900 shadow-sm bg-white' : 'text-slate-500 hover:text-slate-700'}`}>空间意向</button>
        <button onClick={() => setVisualsTab('material')} className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-full transition-all relative z-10 ${visualsTab === 'material' ? 'text-slate-900 shadow-sm bg-white' : 'text-slate-500 hover:text-slate-700'}`}>全域材料</button>
      </div>
      
      {visualsTab === 'intent' && (
        <div className="space-y-6 animate-in slide-in-from-left-4">
          <div className="flex flex-wrap gap-2 pb-4">
            {spaces.map((s: any) => (
              <button key={s.id} onClick={() => setVisualActiveSpaceId(s.id)} className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border ${visualActiveSpaceId === s.id ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-200'}`}>{s.name}</button>
            ))}
          </div>
          
          <div className="flex justify-between items-end mb-4 px-1">
            <div>
              <h3 className="text-xl font-black italic text-slate-900 leading-none">{spaces.find((s: any) => s.id === visualActiveSpaceId)?.name} 意向定调</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">Max 5 Images Per Space</p>
            </div>
            <button onClick={() => setIsEditingIntents(!isEditingIntents)} className={`p-2 rounded-xl transition-all ${isEditingIntents ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400 hover:text-slate-900'}`}>
              <Settings2 size={16} />
            </button>
          </div>
          
          <div className="flex flex-col gap-4">
            {(intentImages[visualActiveSpaceId] || []).map((img: any) => (
              <div key={img.id} className="relative rounded-[24px] overflow-hidden shadow-md group bg-slate-100 w-full">
                <img src={img.url} alt="Intent" className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => !isEditingIntents && setPreviewImage(img.url)} />
                {isEditingIntents && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center animate-in fade-in" onClick={e => e.stopPropagation()}>
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteIntent(img.id); }} className="p-4 bg-red-500 text-white rounded-full shadow-xl active:scale-90 transition-transform relative z-20"><Trash2 size={24}/></button>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {(() => { 
            const currentCount = (intentImages[visualActiveSpaceId] || []).length; 
            const isFull = currentCount >= 5; 
            return (
              <div className="mt-6">
                <input id="intent-upload" type="file" accept="image/*" onChange={handleIntentUpload} className="hidden" disabled={isFull || isEditingIntents} />
                <label htmlFor={isFull || isEditingIntents ? undefined : "intent-upload"} className={`w-full py-6 rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all ${isFull ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed' : 'bg-white border-slate-300 text-slate-400 hover:border-slate-900 active:scale-95 cursor-pointer'}`}>
                  {isFull ? (
                    <><AlertTriangle size={24} className="text-amber-500" /><span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">精简意向以保证空间调性的一致性</span></>
                  ) : (
                    <><UploadCloud size={28} /><span className="text-xs font-black uppercase tracking-widest">Upload Key Vision ({currentCount}/5)</span></>
                  )}
                </label>
              </div>
            ); 
          })()}
        </div>
      )}
      
      {visualsTab === 'material' && (
        <div className="space-y-6 animate-in slide-in-from-right-4">
          <div className="flex justify-between items-center mb-6 px-1">
            <div>
              <h3 className="text-xl font-black italic text-slate-900 leading-none">全局材料库</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">Material & Texture Audit</p>
            </div>
            <button onClick={() => setShowMaterialModal(true)} className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"><Plus size={18}/></button>
          </div>
          
          {materials.length === 0 && <div className="py-20 text-center text-slate-300 font-black italic text-sm">暂无材料入库...</div>}
          
          <div className="columns-2 gap-3 space-y-3">
            {materials.map((m: any) => (
              <div key={m.id} className="break-inside-avoid bg-white p-2 rounded-[24px] shadow-sm border border-slate-100 group relative">
                <div className="relative rounded-[16px] overflow-hidden cursor-pointer" onClick={() => setPreviewImage(m.url)}>
                  <img src={m.url} alt={m.title} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-colors">
                    <Maximize2 className="text-white drop-shadow-md" size={24} />
                  </div>
                </div>
                <div className="pt-3 pb-1 px-2">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-black text-sm text-slate-900 leading-snug">{m.title}</h4>
                    <button type="button" onClick={(e) => { e.stopPropagation(); deleteMaterial(m.id); }} className="text-slate-300 hover:text-red-500 transition-colors p-1 relative z-10"><Trash2 size={14}/></button>
                  </div>
                  {m.remark && <p className="text-[10px] text-slate-500 mt-1.5 font-bold leading-relaxed">{m.remark}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showMaterialModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-6" onClick={() => setShowMaterialModal(false)}>
          <div className="bg-white w-full max-w-xs rounded-[40px] p-8 shadow-2xl animate-in zoom-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black italic mb-6">入库新材料</h3>
            <form onSubmit={submitNewMaterial} className="space-y-4">
              <div className="relative h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center justify-center overflow-hidden hover:border-slate-400 transition-colors">
                {newMaterial.url ? (
                  <img src={newMaterial.url} className="w-full h-full object-cover" alt="preview" />
                ) : (
                  <><UploadCloud className="text-slate-300 mb-2" size={32} /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">上传实拍图</span></>
                )}
                <input type="file" accept="image/*" onChange={handleMaterialImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <input type="text" value={newMaterial.title} onChange={e => setNewMaterial({...newMaterial, title: e.target.value})} placeholder="材料名称" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-[16px] font-bold outline-none" required />
              <textarea value={newMaterial.remark} onChange={e => setNewMaterial({...newMaterial, remark: e.target.value})} placeholder="备注说明..." className="w-full bg-slate-50 border-none rounded-2xl p-4 text-[16px] font-bold resize-none h-24 outline-none" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowMaterialModal(false)} className="flex-1 bg-slate-100 text-slate-400 font-black py-4 rounded-3xl text-xs uppercase active:scale-95">Cancel</button>
                <button type="submit" disabled={!newMaterial.url || !newMaterial.title.trim()} className="flex-1 bg-slate-900 text-white font-black py-4 rounded-3xl text-xs uppercase shadow-xl active:scale-95 disabled:opacity-40">Upload</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
