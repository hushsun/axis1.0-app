import React from 'react';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface AppState {
  globalMsg: string;
  setGlobalMsg: (msg: string) => void;

  projectUsers: any;
  currentUser: any;
  setCurrentUser: (user: any) => void;
  setProjectUsers: (users: any) => void;

  spaces: any[];
  setSpaces: (spaces: any[]) => void;
  activeSpace: any;
  setActiveSpace: (space: any) => void;

  activeTab: string;
  setActiveTab: (tab: string) => void;

  requirements: any[];
  setRequirements: (reqs: any[]) => void;

  totalBudgetState: any;
  setTotalBudgetState: (state: any) => void;

  categories: any[];
  setCategories: (cats: any[]) => void;
  activeCategoryId: string | null;
  setActiveCategoryId: (id: string | null) => void;

  timeline: any[];
  setTimeline: (timeline: any[]) => void;

  visualsTab: string;
  setVisualsTab: (tab: string) => void;
  visualActiveSpaceId: string;
  setVisualActiveSpaceId: (id: string) => void;
  intentImages: Record<string, any[]>;
  setIntentImages: (images: Record<string, any[]>) => void;
  materials: any[];
  setMaterials: (materials: any[]) => void;

  feedPosts: any[];
  setFeedPosts: (posts: any[]) => void;

  previewImage: string | null;
  setPreviewImage: (url: string | null) => void;

  // Modals and UI states
  editModal: any;
  setEditModal: (modal: any) => void;

  isManagingSpaces: boolean;
  setIsManagingSpaces: (val: boolean) => void;
  isManagingCategories: boolean;
  setIsManagingCategories: (val: boolean) => void;
  isManagingTimeline: boolean;
  setIsManagingTimeline: (val: boolean) => void;

  inputText: string;
  setInputText: (text: string) => void;
  showAddSpaceModal: boolean;
  setShowAddSpaceModal: (val: boolean) => void;

  addRequirement: (e: React.FormEvent) => Promise<void>;
  handleVote: (reqId: string, vote: string) => Promise<void>;
  submitCounterProposal: (reqId: string, text: string) => Promise<void>;
  deleteSpace: (id: string) => Promise<void>;
  confirmBudget: (agree: boolean) => Promise<void>;

  // Supabase actions
  fetchInitial: () => Promise<void>;
  setupRealtime: () => () => void;
  uploadImageSupabase: (file: Blob, path: string) => Promise<string | null>;
  setDocSupabase: (col: string, docId: string, data: any) => Promise<void>;
  updateDocSupabase: (col: string, docId: string, partialData: any) => Promise<void>;
  deleteDocSupabase: (col: string, docId: string) => Promise<void>;
  resetProjectSupabase: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  globalMsg: '',
  setGlobalMsg: (msg) => set({ globalMsg: msg }),

  projectUsers: null,
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  setProjectUsers: (users) => set({ projectUsers: users }),

  spaces: [],
  setSpaces: (spaces) => set({ spaces }),
  activeSpace: null,
  setActiveSpace: (space) => set({ activeSpace: space }),

  activeTab: 'spaces',
  setActiveTab: (tab) => set({ activeTab: tab }),

  requirements: [],
  setRequirements: (reqs) => set({ requirements: reqs }),

  totalBudgetState: { value: 800000, status: 'locked', proposal: null },
  setTotalBudgetState: (state) => set({ totalBudgetState: state }),

  categories: [],
  setCategories: (cats) => set({ categories: cats }),
  activeCategoryId: null,
  setActiveCategoryId: (id) => set({ activeCategoryId: id }),

  timeline: [],
  setTimeline: (timeline) => set({ timeline }),

  visualsTab: 'intent',
  setVisualsTab: (tab) => set({ visualsTab: tab }),
  visualActiveSpaceId: '',
  setVisualActiveSpaceId: (id) => set({ visualActiveSpaceId: id }),
  intentImages: {},
  setIntentImages: (images) => set({ intentImages: images }),
  materials: [],
  setMaterials: (materials) => set({ materials }),

  feedPosts: [],
  setFeedPosts: (posts) => set({ feedPosts: posts }),

  previewImage: null,
  setPreviewImage: (url) => set({ previewImage: url }),

  editModal: null,
  setEditModal: (modal) => set({ editModal: modal }),

  isManagingSpaces: false,
  setIsManagingSpaces: (val) => set({ isManagingSpaces: val }),
  isManagingCategories: false,
  setIsManagingCategories: (val) => set({ isManagingCategories: val }),
  isManagingTimeline: false,
  setIsManagingTimeline: (val) => set({ isManagingTimeline: val }),

  inputText: '',
  setInputText: (text) => set({ inputText: text }),
  showAddSpaceModal: false,
  setShowAddSpaceModal: (val) => set({ showAddSpaceModal: val }),

  addRequirement: async (e) => {
    e.preventDefault();
    const state = get();
    const targetSpace = state.activeSpace || (state.spaces.length > 0 ? state.spaces[0] : null);
    if (!state.inputText.trim() || !state.currentUser || !targetSpace) return;
    const newReq = {
      id: Date.now().toString(), spaceId: targetSpace.id, text: state.inputText.trim(),
      creatorId: state.currentUser.id, status: 'pending', votes: { [state.currentUser.id]: 'agree' },
      history: [], currentRound: 1
    };
    set({ requirements: [newReq, ...state.requirements], inputText: '' });
    await state.setDocSupabase('requirements', newReq.id, newReq);
  },

  handleVote: async (reqId, vote) => {
    const state = get();
    const req = state.requirements.find(r => r.id === reqId);
    if(!req) return;
    
    // Prevent voting on own proposal or own counter-proposal
    if (req.creatorId === state.currentUser.id) return;
    
    const newVotes = { ...req.votes, [state.currentUser.id]: vote };
    let newStatus = req.status;
    if (newVotes.user_a === 'agree' && newVotes.user_b === 'agree') newStatus = 'locked';
    else if (vote === 'disagree') newStatus = req.currentRound >= 3 ? 'unresolved' : 'disputed';
    
    set({ requirements: state.requirements.map(r => r.id === reqId ? { ...r, votes: newVotes, status: newStatus } : r) });
    await state.updateDocSupabase('requirements', reqId, { votes: newVotes, status: newStatus });
  },

  submitCounterProposal: async (reqId, text) => {
    if (!text.trim()) return;
    const state = get();
    const req = state.requirements.find(r => r.id === reqId);
    if (!req) return;
    
    // Prevent user from submitting a counter-proposal to their own idea
    if (req.creatorId === state.currentUser.id) {
      state.setGlobalMsg("不能对自己的提案提出修正建议。");
      return;
    }
    
    const updatedReq = {
      history: [...req.history, { round: req.currentRound, text: req.text, votes: req.votes, creatorId: req.creatorId }],
      text: text.trim(), currentRound: req.currentRound + 1,
      status: 'pending', votes: { [state.currentUser.id]: 'agree' },
      creatorId: state.currentUser.id
    };
    
    set({ requirements: state.requirements.map(r => r.id === reqId ? { ...r, ...updatedReq } : r) });
    await state.updateDocSupabase('requirements', reqId, updatedReq);
  },

  deleteSpace: async (id) => {
    const state = get();
    if (state.spaces.length <= 1) { state.setGlobalMsg("至少保留一个空间维度！"); return; }
    set({ spaces: state.spaces.filter(s => s.id !== id) });
    await state.deleteDocSupabase('spaces', id);
  },

  confirmBudget: async (agree) => {
    const state = get();
    const val = agree && state.totalBudgetState.proposal ? state.totalBudgetState.proposal.value : state.totalBudgetState.value;
    const updateData = { value: val, status: 'locked', proposal: null };
    set({ totalBudgetState: { ...state.totalBudgetState, ...updateData } });
    await state.updateDocSupabase('config', 'main', { totalBudgetState: updateData });
  },

  fetchInitial: async () => {
    const { data, error } = await supabase.from('axis_db').select('*');
    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        get().setGlobalMsg("数据库未初始化！请在 Supabase 执行建表 SQL。");
      } else {
        console.error("Supabase error:", error);
      }
      return;
    }

    if (!data) return;

    const grouped = data.reduce((acc: any, row: any) => {
      if(!acc[row.collection]) acc[row.collection] = [];
      acc[row.collection].push(row.data);
      return acc;
    }, {});

    if (grouped['config']?.length > 0) {
      const mainConfig = grouped['config'].find((c: any) => c.id === 'main' || c.projectUsers);
      if (mainConfig) {
        set({ projectUsers: mainConfig.projectUsers, totalBudgetState: mainConfig.totalBudgetState });
      }
    }
    if (grouped['spaces']) set({ spaces: grouped['spaces'].sort((a: any, b: any) => a.id.localeCompare(b.id)) });
    if (grouped['categories']) set({ categories: grouped['categories'].sort((a: any, b: any) => a.id.localeCompare(b.id)) });
    if (grouped['requirements']) set({ requirements: grouped['requirements'].sort((a: any, b: any) => b.id.localeCompare(a.id)) });
    if (grouped['timeline']) set({ timeline: grouped['timeline'] });
    if (grouped['materials']) set({ materials: grouped['materials'].sort((a: any, b: any) => b.timestamp - a.timestamp) });
    if (grouped['feedPosts']) set({ feedPosts: grouped['feedPosts'].sort((a: any, b: any) => b.timestamp - a.timestamp) });

    if (grouped['intentImages']) {
      const map: Record<string, any[]> = {};
      grouped['intentImages'].forEach((img: any) => {
        if(!map[img.spaceId]) map[img.spaceId] = [];
        map[img.spaceId].push(img);
      });
      Object.keys(map).forEach(k => map[k].sort((a, b) => b.timestamp - a.timestamp));
      set({ intentImages: map });
    }
  },

  setupRealtime: () => {
    const channel = supabase.channel('realtime_axis')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'axis_db' }, (payload) => {
         // Instead of fetching everything, we can selectively update based on payload
         // For now, we'll just fetch everything but debounce it to avoid spam
         // In a real app, you'd parse payload.new and update the specific state
         get().fetchInitial();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  },

  uploadImageSupabase: async (file, path) => {
    const { data, error } = await supabase.storage.from('axis_assets').upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });
    if (error) {
      console.error("Upload error:", error);
      get().setGlobalMsg("图片上传失败，请检查 Storage 权限配置");
      return null;
    }
    const { data: publicUrlData } = supabase.storage.from('axis_assets').getPublicUrl(path);
    return publicUrlData.publicUrl;
  },

  setDocSupabase: async (col, docId, data) => {
    const payload = { id: `${col}_${docId}`, collection: col, data };
    const { error } = await supabase.from('axis_db').upsert(payload, { onConflict: 'id' });
    if(error) {
      console.error("Set error:", error);
      if (error.code === 'PGRST205') get().setGlobalMsg("错误：未找到表 'axis_db'。请创建表。");
    }
  },

  updateDocSupabase: async (col, docId, partialData) => {
    const id = `${col}_${docId}`;
    const { data: existing, error: fetchErr } = await supabase.from('axis_db').select('data').eq('id', id).single();
    if (fetchErr || !existing) { 
      console.error("Update fetch error:", fetchErr); 
      if (fetchErr?.code === 'PGRST205') get().setGlobalMsg("错误：未找到表 'axis_db'。请创建表。");
      return; 
    }
    
    let newData = { ...existing.data };
    for (const [k, v] of Object.entries(partialData)) {
      if (k.includes('.')) {
        const parts = k.split('.');
        let curr = newData;
        for (let i=0; i < parts.length - 1; i++) {
          if(!curr[parts[i]]) curr[parts[i]] = {};
          curr = curr[parts[i]];
        }
        curr[parts[parts.length-1]] = v;
      } else {
        newData[k] = v;
      }
    }
    const { error: updErr } = await supabase.from('axis_db').update({ data: newData }).eq('id', id);
    if(updErr) {
      console.error("Update error:", updErr);
      if (updErr.code === 'PGRST205') get().setGlobalMsg("错误：未找到表 'axis_db'。请创建表。");
    }
  },

  deleteDocSupabase: async (col, docId) => {
    const { error } = await supabase.from('axis_db').delete().eq('id', `${col}_${docId}`);
    if(error) {
      console.error("Delete error:", error);
      if (error.code === 'PGRST205') get().setGlobalMsg("错误：未找到表 'axis_db'。请创建表。");
    }
  },

  resetProjectSupabase: async () => {
    const { error } = await supabase.from('axis_db').delete().neq('id', 'dummy_id_to_delete_all');
    if(error) {
      console.error("Reset error:", error);
      if (error.code === 'PGRST205') get().setGlobalMsg("错误：未找到表 'axis_db'。请创建表。");
    } else {
      set({
        projectUsers: null, currentUser: null, spaces: [], activeSpace: null,
        requirements: [], timeline: [], categories: [], materials: [],
        feedPosts: [], intentImages: {}, totalBudgetState: { value: 800000, status: 'locked', proposal: null }
      });
    }
  }
}));
