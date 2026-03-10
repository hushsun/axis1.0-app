import React, { useEffect, useState, useRef } from 'react';
import { LogOut, LayoutDashboard, ClipboardCheck, Image as ImageIcon, Wallet, CalendarClock, Activity, Plus, XCircle, Trash2, Send, Pencil } from 'lucide-react';
import { useAppStore } from './store/useAppStore';
import { AxisLogo } from './components/ui/AxisLogo';
import { LoginView } from './components/views/LoginView';
import { SpacesView } from './components/views/SpacesView';
import { BudgetView } from './components/views/BudgetView';
import { SummaryView } from './components/views/SummaryView';
import { VisualsView } from './components/views/VisualsView';
import { TimelineView } from './components/views/TimelineView';
import { FeedView } from './components/views/FeedView';
import { CategoryDetailView } from './components/views/CategoryDetailView';
import { compressImage } from './lib/utils';

export default function App() {
  const { 
    isAppLoaded, currentUser, setCurrentUser, fetchInitial, globalMsg, setGlobalMsg,
    activeTab, setActiveTab, setIsManagingSpaces, setIsManagingCategories, setIsManagingTimeline,
    activeSpace, inputText, setInputText, addRequirement,
    previewImage, setPreviewImage, feedPosts, setFeedPosts, setDocSupabase, updateDocSupabase,
    editModal, setEditModal, isManagingSpaces, isManagingCategories, isManagingTimeline, showAddSpaceModal, setShowAddSpaceModal,
    activeCategoryId, setActiveCategoryId, categories, setCategories, timeline, setTimeline
  } = useAppStore();

  const [showPostModal, setShowPostModal] = useState(false);
  const [newPost, setNewPost] = useState({ header: '', description: '', images: [] as any[], tag: '现场' });
  const postFileInputRef = useRef<HTMLInputElement>(null);

  const [swipeY, setSwipeY] = useState(0); 
  const touchStartY = useRef(0); 

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = ` .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; } `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('axis_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }
    
    fetchInitial();
    const cleanup = useAppStore.getState().setupRealtime();
    return cleanup;
  }, []);

  useEffect(() => {
    if (globalMsg) { 
      const t = setTimeout(() => setGlobalMsg(''), 5000); 
      return () => clearTimeout(t); 
    }
  }, [globalMsg, setGlobalMsg]);

  useEffect(() => {
    if (isAppLoaded && currentUser && !useAppStore.getState().projectUsers) {
      setCurrentUser(null);
      if (!useAppStore.getState().dbError) {
        localStorage.removeItem('axis_user');
      }
    }
  }, [isAppLoaded, currentUser, setCurrentUser]);

  if (!isAppLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans text-slate-900">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <AxisLogo size="lg" />
          <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Loading Axis...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView />;
  }

  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; setSwipeY(0); };
  const handleTouchMove = (e: React.TouchEvent) => setSwipeY(e.touches[0].clientY - touchStartY.current);
  const handleTouchEnd = () => { if (Math.abs(swipeY) > 100) { setPreviewImage(null); setTimeout(() => setSwipeY(0), 300); } else setSwipeY(0); };

  const handlePostImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const uploadLimit = 9 - newPost.images.length;
    if (uploadLimit <= 0) { setGlobalMsg("最多9张图片！"); return; }
    
    setGlobalMsg(`正在上传 ${Math.min(files.length, uploadLimit)} 张图片...`);
    const validFiles = files.slice(0, uploadLimit);
    const newImages = [];
    for (const file of (validFiles as File[])) {
        const blob = await compressImage(file);
        if (blob) {
           const path = `feed/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
           const url = await useAppStore.getState().uploadImageSupabase(blob, path);
           if (url) newImages.push({ id: (Date.now() + Math.random()).toString(), url });
        }
    }
    setNewPost(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
    e.target.value = ''; setGlobalMsg('');
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newPost.header.trim()) return;
    const post = { id: `p_${Date.now()}`, creatorId: currentUser.id, ...newPost, timestamp: Date.now(), comments: [] };
    setFeedPosts([post, ...feedPosts]);
    await setDocSupabase('feedPosts', post.id, post);
    setShowPostModal(false); setNewPost({ header: '', description: '', images: [], tag: '现场' });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex justify-center sm:py-10 font-sans selection:bg-sky-100">
      <div className="w-full max-w-[400px] bg-white h-[100dvh] sm:h-[800px] sm:rounded-[40px] shadow-2xl relative flex flex-col overflow-hidden border-x border-slate-200">
        {globalMsg && <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-2.5 rounded-full text-xs font-black shadow-xl z-[999] animate-in slide-in-from-top-4">{globalMsg}</div>}
        
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-5 py-4 pt-5 sm:pt-4 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <AxisLogo size="sm" />
            <h1 className="text-xs font-black tracking-widest uppercase italic leading-none">Axis</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white rounded-full p-1 pl-3 shadow-sm border border-slate-100">
               <span className="text-[10px] font-bold text-slate-900">{currentUser.role}: {currentUser.name}</span>
               {currentUser.avatar ? (
                 <img src={currentUser.avatar} className="w-6 h-6 rounded-full object-cover shadow-sm" alt="avatar" />
               ) : (
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${currentUser.color} ${currentUser.textColor} shadow-sm`}>{currentUser.name.substring(0,1)}</div>
               )}
            </div>
            <button onClick={() => { setCurrentUser(null); localStorage.removeItem('axis_user'); }} className="text-slate-300 hover:text-red-500 transition-colors p-1"><LogOut size={16} /></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-40 relative scroll-smooth scrollbar-hide">
          {activeTab === 'spaces' && <SpacesView />}
          {activeTab === 'budget' && (activeCategoryId ? <CategoryDetailView /> : <BudgetView />)}
          {activeTab === 'summary' && <SummaryView />}
          {activeTab === 'visuals' && <VisualsView />}
          {activeTab === 'timeline' && <TimelineView />}
          {activeTab === 'feed' && <FeedView />}
        </main>

        {/* FAB for Feed */}
        {activeTab === 'feed' && (
          <button onClick={() => setShowPostModal(true)} className="absolute bottom-[100px] right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform z-40">
            <Plus size={28} />
          </button>
        )}

        <nav className="absolute bottom-0 w-full bg-white/95 border-t border-slate-100 flex h-[80px] px-2 pb-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          {[
            { id: 'spaces', icon: LayoutDashboard, label: '基准' }, 
            { id: 'summary', icon: ClipboardCheck, label: '清单' }, 
            { id: 'visuals', icon: ImageIcon, label: '视觉' }, 
            { id: 'budget', icon: Wallet, label: '预算' }, 
            { id: 'timeline', icon: CalendarClock, label: '排期' }, 
            { id: 'feed', icon: Activity, label: '动态' }
          ].map(t => (
            <button key={t.id} onClick={() => { setActiveTab(t.id); setIsManagingSpaces(false); setIsManagingCategories(false); setIsManagingTimeline(false); }} className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${activeTab === t.id ? 'text-slate-900 scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
              <t.icon size={20} className={activeTab === t.id ? 'stroke-[3px]' : 'stroke-2'} />
              <span className={`text-[9px] font-black uppercase tracking-widest ${activeTab === t.id ? 'opacity-100' : 'opacity-40'}`}>{t.label}</span>
            </button>
          ))}
        </nav>

        {/* Modals */}
        {editModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-6" onClick={() => setEditModal(null)}>
            <div className="bg-white w-full max-w-xs rounded-[40px] p-10 shadow-2xl animate-in zoom-in border border-slate-100 text-slate-900" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-black italic mb-2 tracking-tighter">{editModal.title}</h3><p className="text-[10px] text-slate-400 font-bold mb-8 uppercase tracking-widest italic">Audit Decision</p>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const { type, catId, itemId, val1, val2, name } = editModal;
                if (type === 'total_budget') {
                  const updateData = { status: 'pending', proposal: { value: Number(val1), by: currentUser.id } };
                  useAppStore.getState().setTotalBudgetState({ ...useAppStore.getState().totalBudgetState, ...updateData });
                  await setDocSupabase('config', 'main', { totalBudgetState: updateData });
                } else if (type === 'add_item') {
                  const cat = categories.find(c => c.id === catId);
                  if (cat) {
                    const newItem = { id: `i_${Date.now()}`, name, budget: Number(val1), actual: 0 };
                    const newItems = [...cat.items, newItem];
                    const newCats = categories.map(c => c.id === catId ? { ...c, items: newItems } : c);
                    setCategories(newCats);
                    await setDocSupabase('categories', catId, { ...cat, items: newItems });
                  }
                } else if (type === 'edit_item_full') {
                  const cat = categories.find(c => c.id === catId);
                  if (cat) {
                    const newItems = cat.items.map((i: any) => i.id === itemId ? { ...i, name, budget: Number(val1), actual: Number(val2) } : i);
                    const newCats = categories.map(c => c.id === catId ? { ...c, items: newItems } : c);
                    setCategories(newCats);
                    await setDocSupabase('categories', catId, { ...cat, items: newItems });
                  }
                } else if (type === 'add_category') {
                  const newCat = { id: `c_${Date.now()}`, name, items: [] };
                  const newCats = [...categories, newCat];
                  setCategories(newCats);
                  await setDocSupabase('categories', newCat.id, newCat);
                } else if (type === 'rename_category') {
                  const cat = categories.find(c => c.id === catId);
                  if (cat) {
                    const newCats = categories.map(c => c.id === catId ? { ...c, name } : c);
                    setCategories(newCats);
                    await setDocSupabase('categories', catId, { ...cat, name });
                  }
                } else if (type === 'add_timeline_node') {
                  const newNode = { id: `t_${Date.now()}`, date: val1, title: name, done: false, phase: 'custom', phaseName: '自定义' };
                  const newTimeline = [...timeline, newNode];
                  setTimeline(newTimeline);
                  await setDocSupabase('timeline', newNode.id, newNode);
                } else if (type === 'edit_timeline') {
                  const newTimeline = timeline.map((t: any) => t.id === itemId ? { ...t, date: val1, title: name } : t);
                  setTimeline(newTimeline);
                  await updateDocSupabase('timeline', itemId, { date: val1, title: name });
                }
                setEditModal(null);
              }} className="space-y-6">
                {(['add_item', 'add_category', 'edit_item_full', 'rename_category', 'add_timeline_node', 'edit_timeline'].includes(editModal.type)) && (<div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">描述名称 / Name</label><input autoFocus type="text" value={editModal.name || ''} onChange={e => setEditModal({...editModal, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-5 text-[16px] font-bold focus:ring-slate-900 outline-none shadow-inner" placeholder="输入名称" required /></div>)}
                {(['total_budget', 'add_item', 'edit_item_full'].includes(editModal.type)) && (<div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">数额 / Plan (¥)</label><div className="relative font-mono font-black"><span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">¥</span><input type="number" value={(editModal.type === 'edit_item_full' ? editModal.val1 : (editModal.val1 === 0 ? '' : editModal.val1))} onChange={e => setEditModal({...editModal, val1: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-5 pl-10 text-[16px] font-black focus:ring-slate-900 outline-none shadow-inner" placeholder="0" required /></div></div>)}
                {editModal.type === 'edit_item_full' && (<div className="space-y-2 animate-in slide-in-from-top-2"><label className="text-[9px] font-black text-sky-400 uppercase tracking-widest pl-1 italic">实际支付 / Actual (¥)</label><div className="relative font-mono font-black"><span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">¥</span><input type="number" value={editModal.val2 === 0 ? '' : editModal.val2} onChange={e => setEditModal({...editModal, val2: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-5 pl-10 text-[16px] font-black focus:ring-sky-500 outline-none shadow-inner" placeholder="0" /></div></div>)}
                {(['edit_timeline', 'add_timeline_node'].includes(editModal.type)) && (<div className="space-y-2 animate-in slide-in-from-top-2"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 italic">节点日期 / Date</label><input type="date" value={editModal.val1 || ''} onChange={e => setEditModal({...editModal, val1: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-5 text-[16px] font-black outline-none focus:ring-slate-900 shadow-inner" required /></div>)}
                <div className="flex gap-3 pt-2"><button type="button" onClick={() => setEditModal(null)} className="flex-1 bg-slate-100 text-slate-400 text-xs font-black py-5 rounded-3xl uppercase active:scale-95">Cancel</button><button type="submit" className="flex-1 bg-slate-900 text-white text-xs font-black py-5 rounded-3xl shadow-xl uppercase active:scale-95">Confirm</button></div>
              </form>
            </div>
          </div>
        )}

        {showAddSpaceModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6" onClick={() => setShowAddSpaceModal(false)}><div className="bg-white w-full max-w-xs rounded-[32px] p-10 shadow-2xl animate-in zoom-in border border-slate-100 text-slate-900" onClick={e => e.stopPropagation()}><h3 className="text-xl font-black italic mb-2 tracking-tighter">新增维度</h3><p className="text-[10px] text-slate-400 font-bold mb-8 uppercase tracking-widest italic">Shared Dimension</p><form onSubmit={async (e) => {
            e.preventDefault();
            const name = (e.target as any).spaceName.value;
            if (!name.trim()) return;
            const newSpace = { id: `s_${Date.now()}`, name: name.trim(), icon: '🏠' };
            useAppStore.getState().setSpaces([...useAppStore.getState().spaces, newSpace]);
            await setDocSupabase('spaces', newSpace.id, newSpace);
            setShowAddSpaceModal(false);
          }} className="space-y-6"><input name="spaceName" autoFocus type="text" className="w-full bg-slate-50 border-none rounded-2xl p-5 text-[16px] font-bold outline-none focus:ring-slate-900 shadow-inner" placeholder="空间名称 (如：书房)" /><div className="flex gap-3"><button type="button" onClick={() => setShowAddSpaceModal(false)} className="flex-1 bg-slate-100 text-slate-400 text-xs font-black py-5 rounded-3xl uppercase active:scale-95">Cancel</button><button type="submit" className="flex-1 bg-slate-900 text-white text-xs font-black py-5 rounded-3xl shadow-xl active:scale-95">Confirm</button></div></form></div></div>
        )}

        {isManagingCategories && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6" onClick={() => setIsManagingCategories(false)}>
            <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in border border-slate-100 text-slate-900 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black italic leading-none">类别规划</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">Allocation Matrix Management</p>
                </div>
                <button onClick={() => setIsManagingCategories(false)} className="p-2 bg-slate-100 rounded-full text-slate-400"><XCircle size={20}/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                {categories.map(cat => (
                  <div key={cat.id} className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center border border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900">{cat.name}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{cat.items.length} 个子项</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditModal({ type: 'rename_category', title: '重命名类别', catId: cat.id, name: cat.name })} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><Pencil size={14}/></button>
                      <button onClick={async () => {
                        if (confirm(`确定删除类别【${cat.name}】吗？`)) {
                          const newCats = categories.filter(c => c.id !== cat.id);
                          setCategories(newCats);
                          await useAppStore.getState().deleteDocSupabase('categories', cat.id);
                        }
                      }} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => setEditModal({ type: 'add_category', title: '新增预算类别', name: '' })}
                className="mt-6 w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-2"
              >
                <Plus size={16}/> 新增类别
              </button>
            </div>
          </div>
        )}

        {isManagingTimeline && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6" onClick={() => setIsManagingTimeline(false)}>
            <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in border border-slate-100 text-slate-900 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black italic leading-none">节点规划</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">Timeline Management</p>
                </div>
                <button onClick={() => setIsManagingTimeline(false)} className="p-2 bg-slate-100 rounded-full text-slate-400"><XCircle size={20}/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                {[...timeline].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(node => (
                  <div key={node.id} className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center border border-slate-100">
                    <div className="flex flex-col flex-1 pr-4">
                      <span className="text-sm font-black text-slate-900 leading-tight mb-1">{node.title || node.text}</span>
                      <span className="text-[10px] font-bold text-slate-400 font-mono tracking-widest">{node.date.replace(/-/g, '.')}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditModal({ type: 'edit_timeline', title: '修改节点计划', itemId: node.id, name: node.title || node.text, val1: node.date })} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><Pencil size={14}/></button>
                      <button onClick={async () => {
                        if (confirm(`确定删除节点【${node.title || node.text}】吗？`)) {
                          const newTimeline = timeline.filter(t => t.id !== node.id);
                          setTimeline(newTimeline);
                          await useAppStore.getState().deleteDocSupabase('timeline', node.id);
                        }
                      }} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => setEditModal({ type: 'add_timeline_node', title: '新增进度节点', name: '', val1: new Date().toISOString().split('T')[0] })}
                className="mt-6 w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-2"
              >
                <Plus size={16}/> 新增节点
              </button>
            </div>
          </div>
        )}

        {showPostModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4" onClick={() => setShowPostModal(false)}>
             <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in" onClick={e => e.stopPropagation()}>
                <div className="p-5 flex justify-between items-center border-b border-slate-100"><h3 className="font-black italic text-lg">发布新动态</h3><button onClick={() => setShowPostModal(false)}><XCircle className="text-slate-400" size={24}/></button></div>
                <div className="p-5 overflow-y-auto flex-1 space-y-5">
                   <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">动态标签 TAG</label><div className="flex flex-wrap gap-2">{['设计', '现场', '灵感', '感触'].map(t => (<button key={t} type="button" onClick={() => setNewPost({...newPost, tag: t})} className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${newPost.tag === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>{t}</button>))}</div></div>
                   <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">标题 HEADER</label><input type="text" value={newPost.header} onChange={e => setNewPost({...newPost, header: e.target.value})} placeholder="一句话概括..." className="w-full bg-slate-50 rounded-xl p-3 text-[16px] font-bold outline-none focus:ring-2 focus:ring-slate-900" /></div>
                   <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">详情 DESC</label><textarea value={newPost.description} onChange={e => setNewPost({...newPost, description: e.target.value})} placeholder="记录现场情况..." className="w-full bg-slate-50 rounded-xl p-3 text-[16px] font-bold h-24 resize-none focus:ring-2 focus:ring-slate-900 outline-none" /></div>
                   <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">影像 MEDIA</label>
                      <span className="text-[10px] font-bold text-slate-400">{newPost.images.length}/9</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {newPost.images.map(img => (
                        <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden">
                          <img src={img.url} className="w-full h-full object-cover" alt="preview" />
                          <button type="button" onClick={() => setNewPost({...newPost, images: newPost.images.filter(i=>i.id !== img.id)})} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-100 transition-opacity"><Trash2 size={16}/></button>
                        </div>
                      ))}
                      {newPost.images.length < 9 && (
                        <label htmlFor="post-upload" className="aspect-square rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 cursor-pointer">
                          <Plus size={20} />
                        </label>
                      )}
                      <input id="post-upload" type="file" multiple accept="image/*" onChange={handlePostImageUpload} className="hidden" />
                    </div>
                  </div>
                </div>
                <div className="p-5 border-t border-slate-100"><button type="button" onClick={handleAddPost} disabled={!newPost.header.trim()} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl uppercase tracking-widest disabled:opacity-40 transition-all">Publish 发布</button></div>
             </div>
          </div>
        )}

        {previewImage && (
          <div className="fixed inset-0 bg-black z-[300] flex items-center justify-center animate-in fade-in duration-300" onClick={() => setPreviewImage(null)} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            <img src={previewImage} alt="Fullscreen Preview" className="w-full h-full object-contain transition-transform duration-200 ease-out" style={{ transform: `translateY(${swipeY}px)`, opacity: 1 - Math.abs(swipeY) / 600 }} onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }} />
          </div>
        )}
      </div>
    </div>
  );
}
