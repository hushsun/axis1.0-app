// src/components/views/VisualsView.tsx
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
              <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">Unlimited Images Per Space</p>
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
            return (
              <div className="mt-6">
                <input id="intent-upload" type="file" accept="image/*" onChange={handleIntentUpload} className="hidden" disabled={isEditingIntents} />
                <label htmlFor={isEditingIntents ? undefined : "intent-upload"} className={`w-full py-6 rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all bg-white border-slate-300 text-slate-400 hover:border-slate-900 active:scale-95 cursor-pointer`}>
                  <UploadCloud size={28} />
                  <span className="text-xs font-black uppercase tracking-widest">Upload Key Vision ({currentCount})</span>
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
          
          <div className="grid grid-cols-2 gap-4">
            {materials.map((m: any) => (
              <div key={m.id} className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-100 group">
                <div className="aspect-square relative bg-slate-100">
                  <img src={m.url} alt={m.title} className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setPreviewImage(m.url)} />
                  <button onClick={() => deleteMaterial(m.id)} className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                </div>
                <div className="p-4">
                  <h4 className="text-xs font-black text-slate-900 truncate">{m.title}</h4>
                  {m.remark && <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{m.remark}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showMaterialModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6" onClick={() => setShowMaterialModal(false)}>
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in border border-slate-100 text-slate-900" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black italic mb-2 tracking-tighter">新增材料</h3>
            <p className="text-[10px] text-slate-400 font-bold mb-8 uppercase tracking-widest italic">Add Material</p>
            <form onSubmit={submitNewMaterial} className="space-y-6">
              <div className="relative w-full aspect-square rounded-[24px] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden hover:border-slate-400 transition-colors group cursor-pointer shadow-inner">
                {newMaterial.url ? <img src={newMaterial.url} alt="Preview" className="w-full h-full object-cover" /> : <div className="flex flex-col items-center text-slate-400"><UploadCloud size={32} /><span className="text-[10px] font-black uppercase mt-2 tracking-widest">上传材料图</span></div>}
                <input type="file" accept="image/*" onChange={handleMaterialImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <input type="text" value={newMaterial.title} onChange={e => setNewMaterial({...newMaterial, title: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-5 text-[16px] font-bold outline-none focus:ring-slate-900 shadow-inner" placeholder="材料名称 (如：微水泥)" required />
              <input type="text" value={newMaterial.remark} onChange={e => setNewMaterial({...newMaterial, remark: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-5 text-[16px] font-bold outline-none focus:ring-slate-900 shadow-inner" placeholder="备注 (如：用于客餐厅地面)" />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowMaterialModal(false)} className="flex-1 bg-slate-100 text-slate-400 text-xs font-black py-5 rounded-3xl uppercase active:scale-95">Cancel</button>
                <button type="submit" disabled={!newMaterial.url || !newMaterial.title.trim()} className="flex-1 bg-slate-900 text-white text-xs font-black py-5 rounded-3xl shadow-xl uppercase active:scale-95 disabled:opacity-50">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};