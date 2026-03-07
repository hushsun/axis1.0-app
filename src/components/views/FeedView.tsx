import React, { useState } from 'react';
import { Trash2, Reply, X, Send } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { formatTime } from '../../lib/utils';

export const FeedView: React.FC = () => {
  const { 
    feedPosts, setFeedPosts, currentUser, setPreviewImage, 
    deleteDocSupabase, updateDocSupabase 
  } = useAppStore();

  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<{postId: string, commentId: string, name: string} | null>(null);

  const tagColors: Record<string, string> = { 
    '设计': 'bg-purple-100 text-purple-700', 
    '现场': 'bg-emerald-100 text-emerald-700', 
    '灵感': 'bg-amber-100 text-amber-700', 
    '感触': 'bg-blue-100 text-blue-700' 
  };

  const getPostImageGridClass = (total: number, index: number) => 
    total === 1 ? 'col-span-12 aspect-[4/3]' : 
    total === 2 ? 'col-span-6 aspect-square' : 
    total === 3 ? (index === 0 ? 'col-span-12 aspect-[21/9]' : 'col-span-6 aspect-square') : 
    total === 4 ? 'col-span-6 aspect-square' : 'col-span-4 aspect-square';

  const getUserInfo = (id: string) => {
    const projectUsers = useAppStore.getState().projectUsers;
    return projectUsers && projectUsers[id] ? projectUsers[id] : { id, name: '未知', color: 'bg-slate-300', textColor: 'text-white', avatar: null };
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId];
    if(!text || !text.trim()) return;
    
    const post = feedPosts.find((p: any) => p.id === postId);
    let updatedComments = [...post.comments];
    if(replyingTo && replyingTo.postId === postId) {
      updatedComments = updatedComments.map(c => c.id === replyingTo.commentId ? { ...c, replies: [...(c.replies||[]), { id: `r_${Date.now()}`, creatorId: currentUser.id, text: text.trim(), timestamp: Date.now() }] } : c);
    } else {
      updatedComments.push({ id: `c_${Date.now()}`, creatorId: currentUser.id, text: text.trim(), timestamp: Date.now(), replies: [] });
    }

    setFeedPosts(feedPosts.map((p: any) => p.id === postId ? { ...p, comments: updatedComments } : p));
    await updateDocSupabase('feedPosts', postId, { comments: updatedComments });
    
    setCommentInputs({...commentInputs, [postId]: ''}); 
    setReplyingTo(null);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6 pb-24 px-5 pt-5">
      <div className="space-y-8">
        {feedPosts.length === 0 && <div className="py-20 text-center text-slate-300 font-black italic text-sm">暂无项目动态，点击右下角新增...</div>}
        
        {feedPosts.map((post: any) => { 
          const author = getUserInfo(post.creatorId); 
          const isExpanded = expandedComments[post.id]; 
          const visibleComments = isExpanded ? post.comments : post.comments.slice(-2); 
          
          return (
            <div key={post.id} className="bg-white rounded-[32px] p-5 shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {author.avatar ? (
                    <img src={author.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover shadow-md border border-slate-100" />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-xs ${author.color} shadow-md`}>{author.name.substring(0,1)}</div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-900 leading-none mb-1">{author.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 font-mono tracking-widest leading-none">{formatTime(post.timestamp)}</span>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest ${tagColors[post.tag] || 'bg-slate-100 text-slate-600'}`}>{post.tag}</span>
                  {post.creatorId === currentUser.id && (
                    postToDelete === post.id ? (
                      <div className="flex items-center gap-2 bg-red-50 px-2 py-1 rounded text-[10px]">
                        <span className="text-red-500 font-bold">删?</span>
                        <button onClick={async () => { await deleteDocSupabase('feedPosts', post.id); setPostToDelete(null); setFeedPosts(feedPosts.filter((p: any) => p.id !== post.id)); }} className="text-red-600 font-black">是</button>
                        <button onClick={() => setPostToDelete(null)} className="text-slate-400 font-black">否</button>
                      </div>
                    ) : (
                      <button onClick={() => setPostToDelete(post.id)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                    )
                  )}
                </div>
              </div>
              
              <h3 className="text-base font-black text-slate-900 mb-2 leading-tight">{post.header}</h3>
              {post.description && <p className="text-sm font-medium text-slate-600 leading-relaxed mb-4">{post.description}</p>}
              
              {post.images.length > 0 && (
                <div className="grid grid-cols-12 gap-1.5 rounded-xl overflow-hidden mb-4">
                  {post.images.map((img: any, i: number) => (
                    <div key={img.id} className={`relative overflow-hidden cursor-pointer group ${getPostImageGridClass(post.images.length, i)}`} onClick={() => setPreviewImage(img.url)}>
                      <img src={img.url} className="w-full h-full object-cover" alt="media" />
                    </div>
                  ))}
                </div>
              )}
              
              <div className="bg-slate-50 rounded-2xl p-4 mt-2">
                <div className="space-y-3">
                  {visibleComments.map((c: any) => { 
                    const cAuthor = getUserInfo(c.creatorId); 
                    return (
                      <div key={c.id} className="text-xs">
                        <div>
                          <span className="font-black text-slate-900 mr-2 inline-flex items-center gap-1 translate-y-[2px]">
                            {cAuthor.avatar ? (
                              <img src={cAuthor.avatar} className="w-4 h-4 rounded-full object-cover" alt="avatar" />
                            ) : (
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white ${cAuthor.color}`}>{cAuthor.name.substring(0,1)}</div>
                            )}
                            {cAuthor.name}:
                          </span>
                          <span className="text-slate-700 font-medium leading-relaxed">{c.text}</span>
                          <button onClick={() => setReplyingTo({ postId: post.id, commentId: c.id, name: cAuthor.name })} className="ml-2 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase">回复</button>
                        </div>
                        {c.replies?.map((r: any) => { 
                          const rAuthor = getUserInfo(r.creatorId); 
                          return (
                            <div key={r.id} className="ml-4 mt-1.5 pl-2 border-l-2 border-slate-200 text-xs">
                              <span className="font-black text-slate-900 mr-1">{rAuthor.name}</span>
                              <span className="text-slate-400 mr-1 text-[10px] font-bold">回复</span>
                              <span className="font-black text-slate-900 mr-2">{cAuthor.name}:</span>
                              <span className="text-slate-700 font-medium">{r.text}</span>
                            </div>
                          ); 
                        })}
                      </div>
                    ); 
                  })}
                  
                  {post.comments.length > 2 && (
                    <button onClick={() => setExpandedComments({...expandedComments, [post.id]: !isExpanded})} className="text-[10px] font-black text-slate-400 hover:text-slate-900 pt-2 uppercase tracking-widest">
                      {isExpanded ? '收起评论' : `展开全部 ${post.comments.length} 条评论`}
                    </button>
                  )}
                </div>
                
                <div className="mt-4 flex gap-1.5 items-center bg-white p-1 rounded-full border border-slate-200 focus-within:ring-2 ring-slate-900 w-full overflow-hidden">
                  {replyingTo?.postId === post.id && (
                    <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-1.5 rounded-full font-black flex items-center gap-1 max-w-[80px] shrink-0">
                      <Reply size={10} className="shrink-0"/>
                      <span className="truncate">{replyingTo.name}</span>
                      <X size={10} className="cursor-pointer shrink-0" onClick={() => setReplyingTo(null)}/>
                    </span>
                  )}
                  <input className="flex-1 min-w-0 bg-transparent px-2 py-1.5 text-[16px] sm:text-xs font-bold outline-none placeholder-slate-300" placeholder={replyingTo?.postId === post.id ? "回复讨论..." : "添加评论..."} value={commentInputs[post.id] || ''} onChange={e => setCommentInputs({...commentInputs, [post.id]: e.target.value})} onKeyDown={e => { if(e.key === 'Enter') handleAddComment(post.id); }} />
                  <button onClick={() => handleAddComment(post.id)} disabled={!commentInputs[post.id]?.trim()} className="w-8 h-8 flex items-center justify-center bg-slate-900 text-white rounded-full disabled:bg-slate-100 disabled:text-slate-300 shrink-0 mr-0.5">
                    <Send size={12}/>
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
