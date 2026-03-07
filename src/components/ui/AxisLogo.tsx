import React, { useState } from 'react';
import { cn } from '../../lib/utils';

// 假设你已经上传了图片并获取了其 URL，或者将其放入了 public 目录
// 这里我们使用你提供的图片作为 base64 数据或直接引用
// 鉴于我无法直接访问你上传的图片文件，请确保你已经将该图片放入了 public 目录并命名为 axis-logo.png
// 或者直接在此处使用 base64 字符串

interface AxisLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export const AxisLogo: React.FC<AxisLogoProps> = ({ size = 'md' }) => {
  const [imgError, setImgError] = useState(false);
  const sizes = { 
    sm: "w-8 h-8 rounded-lg p-0.5", 
    md: "w-16 h-16 rounded-2xl p-1", 
    lg: "w-24 h-24 rounded-3xl p-1.5" 
  };

  if (imgError) {
    return (
      <div className={cn(sizes[size], "bg-slate-900 flex items-center justify-center shadow-lg border border-slate-700")}>
        <span className="text-white font-black italic tracking-tighter text-center" style={{ fontSize: size === 'lg' ? '24px' : '12px' }}>AX</span>
      </div>
    );
  }
  return (
    <div className={cn(sizes[size], "bg-white flex items-center justify-center shadow-2xl overflow-hidden border border-slate-100")}>
      {/* 替换为你的新 logo 图片路径 */}
      <img src="/axis-logo.png" alt="Axis Logo" className="w-full h-full object-contain" onError={() => setImgError(true)} />
    </div>
  );
};
