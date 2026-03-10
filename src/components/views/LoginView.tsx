import React, { useState, useCallback } from 'react';
import { Camera, Check, X } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { AxisLogo } from '../ui/AxisLogo';
import { useAppStore } from '../../store/useAppStore';
import { compressImage } from '../../lib/utils';
import getCroppedImg from '../../lib/cropImage';

export const LoginView: React.FC = () => {
  const { dbError, projectUsers, setProjectUsers, setCurrentUser, setGlobalMsg, updateDocSupabase, setDocSupabase, fetchInitial } = useAppStore();
  const [view, setView] = useState('login');
  const [loginInput, setLoginInput] = useState('');
  const [loginAvatar, setLoginAvatar] = useState<string | null>(null);
  const [setupInput, setSetupInput] = useState({ manager: '', partner: '' });
  
  // Cropper state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dbError) {
      setGlobalMsg("数据库连接失败，无法初始化项目。");
      return;
    }
    if (!setupInput.manager || !setupInput.partner) return;
    
    setGlobalMsg("正在初始化项目，请稍候...");
    await useAppStore.getState().resetProjectSupabase();
    
    const users = {
      user_a: { id: 'user_a', name: setupInput.manager, role: '主理人', color: 'bg-slate-900', textColor: 'text-white', avatar: null },
      user_b: { id: 'user_b', name: setupInput.partner, role: '合伙人', color: 'bg-stone-500', textColor: 'text-white', avatar: null }
    };
    
    setProjectUsers(users);
    await setDocSupabase('config', 'main', { projectUsers: users, totalBudgetState: { value: 800000, status: 'locked', proposal: null } });
    
    // Initialize default data
    const defaultSpaces = [
      { id: 's_1', name: '玄关', icon: '👟' },
      { id: 's_2', name: '客厅', icon: '🛋️' },
      { id: 's_3', name: '餐厅', icon: '🍽️' },
      { id: 's_4', name: '主卧', icon: '🛏️' },
      { id: 's_5', name: '儿童房', icon: '👶' },
      { id: 's_6', name: '多功能房', icon: '📚' },
      { id: 's_7', name: '厨房', icon: '🍳' },
      { id: 's_8', name: '主卫', icon: '🚿' },
      { id: 's_9', name: '次卫', icon: '🚽' }
    ];
    
    const defaultCategories = [
      { 
        id: 'c_1', 
        name: '结构工程', 
        items: [
          { id: 'i_1_1', name: '拆除与砌墙工程（含敲墙、新砌轻体砖、工字钢加固、垃圾清运费）', budget: 20000, actual: 0 },
          { id: 'i_1_2', name: '封窗/系统窗（160平大平层窗户面积大，建议选三层夹胶LOW-E断桥铝，提升隔音隔热）', budget: 55000, actual: 0 },
          { id: 'i_1_3', name: '基础泥木工程（全屋地面找平、厨卫墙面基层处理、防水施工）', budget: 20000, actual: 0 }
        ] 
      },
      { 
        id: 'c_2', 
        name: '水电工程', 
        items: [
          { id: 'i_2_1', name: '强弱电施工（全屋电线更换、回路细分、增加插座点位）', budget: 25000, actual: 0 },
          { id: 'i_2_2', name: '给排水系统（品牌PPR管、墙排系统、移位器）', budget: 15000, actual: 0 },
          { id: 'i_2_3', name: '全屋水处理（前置过滤 + 中央净水 + 中央软水 + 末端直饮）', budget: 20000, actual: 0 },
          { id: 'i_2_4', name: '暖通系统（包含中央空调、地暖、新风系统的设备及安装调试）', budget: 30000, actual: 0 }
        ] 
      },
      { 
        id: 'c_3', 
        name: '装修主材', 
        items: [
          { id: 'i_3_1', name: '地材（建议：客厅大规格柔光砖或进口三层实木地板）', budget: 65000, actual: 0 },
          { id: 'i_3_2', name: '卫浴洁具（包含2-3个卫生间的智能马桶、恒温花洒、台盆、独立浴缸）', budget: 50000, actual: 0 },
          { id: 'i_3_3', name: '室内门/踢脚线（极简隐形门或2.4米以上顶天立地木门）', budget: 35000, actual: 0 },
          { id: 'i_3_4', name: '涂料/墙面艺术（进口乳胶漆或局部艺术涂料）', budget: 25000, actual: 0 },
          { id: 'i_3_5', name: '厨卫吊顶与照明（蜂窝铝板大板吊顶、线性灯带、基础射灯）', budget: 15000, actual: 0 }
        ] 
      },
      { 
        id: 'c_4', 
        name: '全屋定制', 
        items: [
          { id: 'i_4_1', name: '玄关/走廊收纳（入户柜、家政柜）', budget: 25000, actual: 0 },
          { id: 'i_4_2', name: '厨房橱柜（包含岩板台面、极简拉手、高标阻尼五金）', budget: 45000, actual: 0 },
          { id: 'i_4_3', name: '主卧衣帽间/次卧柜（大容量收纳，建议选用ENF级环保板材）', budget: 80000, actual: 0 },
          { id: 'i_4_4', name: '多功能书房/餐厅柜（结合学习、办公功能的定制一体化墙面）', budget: 35000, actual: 0 },
          { id: 'i_4_5', name: '电视背景墙/护墙（木饰面或岩板结合，提升极简感）', budget: 25000, actual: 0 }
        ] 
      },
      { 
        id: 'c_5', 
        name: '家用电器', 
        items: [
          { id: 'i_5_1', name: '厨房大电（嵌入式冰箱、洗碗机、集成灶或高标烟机、蒸烤一体机）', budget: 55000, actual: 0 },
          { id: 'i_5_2', name: '洗烘系统（独立热泵式烘干机 + 大容量洗衣机）', budget: 25000, actual: 0 },
          { id: 'i_5_3', name: '视听与智能家电（大尺寸电视、扫地机器人、智能窗帘电机、全屋WiFi）', budget: 40000, actual: 0 },
          { id: 'i_5_4', name: '生活小电（咖啡机、饮水机、空气净化器）', budget: 15000, actual: 0 }
        ] 
      },
      { 
        id: 'c_6', 
        name: '家具软装', 
        items: [
          { id: 'i_6_1', name: '客厅组合家具（品牌组合沙发、极简岩板/实木茶几、单人休闲椅）', budget: 35000, actual: 0 },
          { id: 'i_6_2', name: '餐厅家具（大长桌——满足办公与用餐、高质感餐椅）', budget: 15000, actual: 0 },
          { id: 'i_6_3', name: '卧室床品（主次卧床架、中高端乳胶/弹簧床垫）', budget: 20000, actual: 0 },
          { id: 'i_6_4', name: '窗帘布艺（全屋高精密遮光帘、柔纱帘）', budget: 10000, actual: 0 }
        ] 
      }
    ];

    const defaultTimeline = [
      { id: 't_1', date: '2026-03-01', title: '正式启动设计，开始确认各空间需求', done: false, phase: 'p1', phaseName: '第一阶段：深度设计与方案定稿' },
      { id: 't_2', date: '2026-03-15', title: '草图平面布局定案，明确墙体改动方向', done: false, phase: 'p1', phaseName: '第一阶段：深度设计与方案定稿' },
      { id: 't_3', date: '2026-04-01', title: 'CAD平面深化完成，确定插座/水路/灯位坐标', done: false, phase: 'p1', phaseName: '第一阶段：深度设计与方案定稿' },
      { id: 't_4', date: '2026-04-15', title: 'SU模型推敲完成，初步确定空间透视关系', done: false, phase: 'p1', phaseName: '第一阶段：深度设计与方案定稿' },
      { id: 't_5', date: '2026-04-30', title: 'SU模型深化完成，空间比例、材质拼缝、立面细节全面定稿', done: false, phase: 'p1', phaseName: '第一阶段：深度设计与方案定稿' },
      { id: 't_6', date: '2026-05-20', title: '全套施工图交付完成（保证20天深度制图期，含节点大样）', done: false, phase: 'p1', phaseName: '第一阶段：深度设计与方案定稿' },
      { id: 't_7', date: '2026-05-31', title: '主材选样确认，瓷砖、地板、卫浴及涂料样板封样', done: false, phase: 'p1', phaseName: '第一阶段：深度设计与方案定稿' },
      { id: 't_8', date: '2026-06-10', title: '预订系统窗（下单生产，确保9月初能封窗）', done: false, phase: 'p2', phaseName: '第二阶段：物资预订与交房准备' },
      { id: 't_9', date: '2026-07-15', title: '全屋定制初步选色、五金配件及板材型号锁定', done: false, phase: 'p2', phaseName: '第二阶段：物资预订与交房准备' },
      { id: 't_10', date: '2026-08-10', title: '选定全屋家电型号，向设计师交付嵌入式设备精准尺寸图', done: false, phase: 'p2', phaseName: '第二阶段：物资预订与交房准备' },
      { id: 't_11', date: '2026-08-31', title: '房屋正式交房，设计师及各工种现场复核原始结构', done: false, phase: 'p2', phaseName: '第二阶段：物资预订与交房准备' },
      { id: 't_12', date: '2026-09-05', title: '正式开工，办理装修证，完成工地成品保护', done: false, phase: 'p3', phaseName: '第三阶段：基础施工与隐蔽工程' },
      { id: 't_13', date: '2026-09-07', title: '开始结构拆改及铲墙皮（大噪音，周一启动）', done: false, phase: 'p3', phaseName: '第三阶段：基础施工与隐蔽工程' },
      { id: 't_14', date: '2026-09-15', title: '结构拆改完成，开始新砌墙体及门洞修整', done: false, phase: 'p3', phaseName: '第三阶段：基础施工与隐蔽工程' },
      { id: 't_15', date: '2026-09-21', title: '系统窗外框安装（周一进行，避免周末安装扰民）', done: false, phase: 'p3', phaseName: '第三阶段：基础施工与隐蔽工程' },
      { id: 't_16', date: '2026-09-23', title: '水电工进场，开始全屋强弱电、给排水开槽及布线', done: false, phase: 'p3', phaseName: '第三阶段：基础施工与隐蔽工程' },
      { id: 't_17', date: '2026-10-16', title: '水电验收完成，进行全屋水压及电路检测', done: false, phase: 'p3', phaseName: '第三阶段：基础施工与隐蔽工程' },
      { id: 't_18', date: '2026-10-19', title: '中央空调、新风系统、全屋地暖安装', done: false, phase: 'p3', phaseName: '第三阶段：基础施工与隐蔽工程' },
      { id: 't_19', date: '2026-10-30', title: '地暖回填及地面找平完成（需一周左右自然养护期）', done: false, phase: 'p3', phaseName: '第三阶段：基础施工与隐蔽工程' },
      { id: 't_20', date: '2026-11-02', title: '木工进场，开始吊顶造型、无主灯基层及木质背景墙施工', done: false, phase: 'p4', phaseName: '第四阶段：泥木攻坚与春节停工' },
      { id: 't_21', date: '2026-11-10', title: '泥工进场，卫生间防水施工及48小时闭水试验', done: false, phase: 'p4', phaseName: '第四阶段：泥木攻坚与春节停工' },
      { id: 't_22', date: '2026-11-16', title: '开始瓷砖铺贴（大规格岩板铺贴需避开周末切割）', done: false, phase: 'p4', phaseName: '第四阶段：泥木攻坚与春节停工' },
      { id: 't_23', date: '2026-12-15', title: '泥木基础完工，墙面找平完成（确保柜体背板严丝合缝）', done: false, phase: 'p4', phaseName: '第四阶段：泥木攻坚与春节停工' },
      { id: 't_24', date: '2026-12-17', title: '全屋定制最终精准复测', done: false, phase: 'p4', phaseName: '第四阶段：泥木攻坚与春节停工' },
      { id: 't_25', date: '2026-12-22', title: '定制工厂正式下单排产（赶在春节工厂停工潮前锁定档期）', done: false, phase: 'p4', phaseName: '第四阶段：泥木攻坚与春节停工' },
      { id: 't_26', date: '2027-01-04', title: '油漆工进场，批刮全屋第一、二遍腻子', done: false, phase: 'p4', phaseName: '第四阶段：泥木攻坚与春节停工' },
      { id: 't_27', date: '2027-01-15', title: '工人返乡，工地停工', done: false, phase: 'p4', phaseName: '第四阶段：泥木攻坚与春节停工' },
      { id: 't_28', date: '2027-01-16', title: '春节停工期（约20天，利用上海冬季干燥期让腻子自然干透）', done: false, phase: 'p4', phaseName: '第四阶段：泥木攻坚与春节停工' },
      { id: 't_29', date: '2027-02-15', title: '工人回沪复工，开始腻子精磨及乳胶漆/艺术涂料喷涂', done: false, phase: 'p4', phaseName: '第四阶段：泥木攻坚与春节停工' },
      { id: 't_30', date: '2027-03-01', title: '全屋定制柜体及护墙板进场安装', done: false, phase: 'p5', phaseName: '第五阶段：硬装封口与半年散味期' },
      { id: 't_31', date: '2027-03-15', title: '木地板铺设、室内门及踢脚线安装', done: false, phase: 'p5', phaseName: '第五阶段：硬装封口与半年散味期' },
      { id: 't_32', date: '2027-03-25', title: '灯具、开关面板、卫浴五金安装及细节收口', done: false, phase: 'p5', phaseName: '第五阶段：硬装封口与半年散味期' },
      { id: 't_33', date: '2027-03-31', title: '硬装施工正式完工，进行全屋开荒保洁', done: false, phase: 'p5', phaseName: '第五阶段：硬装封口与半年散味期' },
      { id: 't_34', date: '2027-04-01', title: '正式开始长期通风散味（核心除甲醛周期，配合新风开启）', done: false, phase: 'p5', phaseName: '第五阶段：硬装封口与半年散味期' },
      { id: 't_35', date: '2027-05-15', title: '全屋大家电进场安装及智能家居联网调试', done: false, phase: 'p5', phaseName: '第五阶段：硬装封口与半年散味期' },
      { id: 't_36', date: '2027-06-01', title: '活动家具（沙发、餐桌椅、床垫）陆续进场', done: false, phase: 'p5', phaseName: '第五阶段：硬装封口与半年散味期' },
      { id: 't_37', date: '2027-07-01', title: '环保治理公司上门检测，进行二次甲醛治理', done: false, phase: 'p5', phaseName: '第五阶段：硬装封口与半年散味期' },
      { id: 't_38', date: '2027-08-10', title: '环保验收合格，最终检测报告确认', done: false, phase: 'p5', phaseName: '第五阶段：硬装封口与半年散味期' },
      { id: 't_39', date: '2027-08-15', title: '正式搬入新家', done: false, phase: 'p5', phaseName: '第五阶段：硬装封口与半年散味期' }
    ];

    useAppStore.getState().setSpaces(defaultSpaces);
    useAppStore.getState().setCategories(defaultCategories);
    useAppStore.getState().setTimeline(defaultTimeline);

    // Save to Supabase
    for (const s of defaultSpaces) await setDocSupabase('spaces', s.id, s);
    for (const c of defaultCategories) await setDocSupabase('categories', c.id, c);
    for (const t of defaultTimeline) await setDocSupabase('timeline', t.id, t);
    
    setView('login');
    setGlobalMsg("");
    fetchInitial();
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleLoginAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file) return;
    
    // Read file as data URL for the cropper
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setOriginalFile(file);
      setIsCropping(true);
    };
    e.target.value = '';
  };

  const handleCropConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels || !originalFile) return;
    setIsCropping(false);
    setGlobalMsg("头像处理中...");
    
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, 0);
      if (!croppedBlob) { setGlobalMsg("图片裁剪失败"); return; }
      
      // Compress the cropped image
      const compressedBlob = await compressImage(new File([croppedBlob], originalFile.name, { type: 'image/jpeg' }));
      if (!compressedBlob) { setGlobalMsg("图片压缩失败"); return; }
      
      setGlobalMsg("头像上传中...");
      const path = `avatars/${Date.now()}_${originalFile.name}`;
      const url = await useAppStore.getState().uploadImageSupabase(compressedBlob, path);
      if (url) setLoginAvatar(url);
      setGlobalMsg("");
    } catch (e) {
      console.error(e);
      setGlobalMsg("图片处理出错");
    }
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    setImageSrc(null);
    setOriginalFile(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    let matchedId = null;
    
    if (projectUsers && projectUsers.user_a && loginInput === projectUsers.user_a.name) {
        matchedId = 'user_a';
    } else if (projectUsers && projectUsers.user_b && loginInput === projectUsers.user_b.name) {
        matchedId = 'user_b';
    }
    
    if (matchedId) {
      const updatedUser = { ...projectUsers[matchedId] };
      if (loginAvatar) {
          updatedUser.avatar = loginAvatar;
          await updateDocSupabase('config', 'main', { [`projectUsers.${matchedId}.avatar`]: loginAvatar });
      }
      setCurrentUser(updatedUser);
      localStorage.setItem('axis_user', JSON.stringify(updatedUser));
    } else {
      if (!projectUsers || Object.keys(projectUsers).length === 0) {
          if (dbError) {
            setGlobalMsg('网络错误，无法连接到数据库。');
          } else {
            setGlobalMsg('需要初始化项目注册！');
            setView('setup');
          }
      } else {
          setGlobalMsg('身份未识别，请输入主理人或合伙人的姓名');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans text-slate-900 relative">
      <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center flex flex-col items-center">
          <AxisLogo size="lg" />
          <h1 className="text-2xl font-black mt-6 italic">Axis 共线</h1>
          <p className="text-slate-400 text-[10px] mt-2 uppercase tracking-[0.2em] font-bold">Consensus Decision Ledger</p>
        </div>
        {(!projectUsers && view !== 'login' && !dbError) || view === 'setup' ? (
          <form onSubmit={handleSetup} className="space-y-4">
            <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 space-y-4">
              <input type="text" required value={setupInput.manager} onChange={e => setSetupInput({...setupInput, manager: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-[16px] font-bold outline-none focus:ring-2 focus:ring-slate-900 shadow-inner" placeholder="主理人姓名" />
              <input type="text" required value={setupInput.partner} onChange={e => setSetupInput({...setupInput, partner: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-[16px] font-bold outline-none focus:ring-2 focus:ring-slate-900 shadow-inner" placeholder="合伙人姓名" />
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all uppercase text-xs tracking-widest">Initialize</button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4 text-center">
            <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 flex flex-col items-center gap-4">
              <div className="relative w-24 h-24 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden hover:border-slate-400 transition-colors group cursor-pointer shadow-inner">
                {loginAvatar ? <img src={loginAvatar} alt="Avatar" className="w-full h-full object-cover" /> : <div className="flex flex-col items-center text-slate-400"><Camera size={24} /><span className="text-[9px] font-black uppercase mt-1">上传头像</span></div>}
                <input type="file" accept="image/*" onChange={handleLoginAvatarUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <input type="text" required value={loginInput} onChange={e => setLoginInput(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-center text-[16px] font-black focus:ring-2 focus:ring-slate-900 outline-none shadow-inner" placeholder="您的姓名 (需绝对匹配)" />
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all uppercase text-xs tracking-widest">Enter Space</button>
             <p className="text-[10px] text-slate-400 mt-4">
               {projectUsers ? "需要重置项目？" : "首次使用？请先"} 
               <button type="button" onClick={() => {
                 if (dbError) {
                   setGlobalMsg("网络错误，无法连接到数据库。");
                 } else {
                   setView('setup');
                 }
               }} className="text-slate-900 font-bold underline ml-1">初始化项目</button>
             </p>
          </form>
        )}
        {isCropping && imageSrc ? (
          <div className="fixed inset-0 bg-slate-900/90 z-50 flex flex-col items-center justify-center p-6">
            <div className="relative w-full max-w-md h-[60vh] bg-black rounded-3xl overflow-hidden shadow-2xl">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="w-full max-w-md mt-6 px-4">
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => {
                  setZoom(Number(e.target.value))
                }}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>
            <div className="flex gap-4 mt-8 w-full max-w-md px-4">
              <button onClick={handleCropCancel} className="flex-1 bg-slate-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                <X size={20} /> 取消
              </button>
              <button onClick={handleCropConfirm} className="flex-1 bg-white text-slate-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                <Check size={20} /> 确认
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
