'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useAdStore } from '@/stores/useAdStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdBanner({ position }: { position: 'TOP_BANNER' | 'SIDEBAR' }) {
  const ads = useAdStore((state) => state.ads);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // 1. ดึงโฆษณาทั้งหมดที่ Active ในตำแหน่งนี้ (เป็น Array)
  const targetAds = useMemo(() => {
      return ads.filter(ad => ad.position === position && ad.isActive);
  }, [ads, position]);

  // 2. ตั้งเวลาเลื่อนอัตโนมัติ (Auto Play) ทุก 5 วินาที
  useEffect(() => {
      if (targetAds.length <= 1) return; // ถ้ามีรูปเดียวไม่ต้องเลื่อน

      const timer = setInterval(() => {
          setCurrentIndex((prev) => (prev + 1) % targetAds.length);
      }, 5000);

      return () => clearInterval(timer);
  }, [targetAds.length]);

  // ฟังก์ชันกดเลื่อน
  const prevSlide = () => {
      setCurrentIndex((prev) => (prev - 1 + targetAds.length) % targetAds.length);
  };
  const nextSlide = () => {
      setCurrentIndex((prev) => (prev + 1) % targetAds.length);
  };

  // ถ้าไม่มีโฆษณาเลย
  if (targetAds.length === 0) return null;

  // กำหนดความสูงตามตำแหน่ง
  const heightClass = position === 'TOP_BANNER' ? 'h-[200px] md:h-[280px]' : 'h-[600px]';

  return (
    <div className="container mx-auto px-4 max-w-7xl my-8">
        <div className={`relative group w-full ${heightClass} rounded-2xl overflow-hidden shadow-md border border-slate-100 bg-white`}>
            
            {/* รูปภาพ (Slider Track) */}
            <div 
                className="w-full h-full flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {targetAds.map((ad) => (
                    <a 
                        key={ad.id}
                        href={ad.linkUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-full h-full flex-shrink-0 relative block"
                    >
                        <img 
                            src={ad.imageUrl} 
                            alt="Advertisement" 
                            className="w-full h-full object-cover"
                        />
                        {/* ป้าย Sponsored */}
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded uppercase font-semibold tracking-wider z-10">
                            Sponsored
                        </div>
                    </a>
                ))}
            </div>

            {/* ปุ่มควบคุม (แสดงเฉพาะเมื่อมีมากกว่า 1 รูป) */}
            {targetAds.length > 1 && (
                <>
                    {/* ปุ่มซ้าย */}
                    <button 
                        onClick={(e) => { e.preventDefault(); prevSlide(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* ปุ่มขวา */}
                    <button 
                        onClick={(e) => { e.preventDefault(); nextSlide(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* จุดไข่ปลา (Dots Indicator) */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {targetAds.map((_, idx) => (
                            <div 
                                key={idx}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    currentIndex === idx ? 'bg-white w-6' : 'bg-white/50'
                                }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    </div>
  );
}