import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const compressImage = (file: File, maxWidth = 800): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width; 
        let height = img.height;
        if (width > maxWidth) { 
          height = Math.round((height * maxWidth) / width); 
          width = maxWidth; 
        }
        canvas.width = width; 
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
        } else {
          resolve(null);
        }
      };
    };
  });
};

export const formatTime = (ts: number) => { 
  const d = new Date(ts); 
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; 
};

export const getDaysDiff = (d1: string, d2: string) => Math.round((new Date(d2).getTime() - new Date(d1).getTime()) / 86400000);

export const getDaysFromToday = (d1: string) => Math.round((new Date().setHours(0,0,0,0) - new Date(d1).getTime()) / 86400000);
