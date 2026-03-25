'use client'

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Megaphone, X, Sparkles, Info, AlertTriangle } from 'lucide-react';

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  is_active: boolean;
  admin_name: string;
  createdat: string;
}

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/announcements');
        setAnnouncements(res.data);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      }
    };
    fetchAnnouncements();
  }, []);

  if (!isVisible || announcements.length === 0) return null;

  const current = announcements[currentIndex];

  const getIcon = (type: string) => {
    switch (type) {
      case 'URGENT': return <AlertTriangle className="w-6 h-6 text-red-600 animate-pulse" />;
      case 'PROMOTION': return <Sparkles className="w-6 h-6 text-amber-600" />;
      default: return <Info className="w-6 h-6 text-blue-600" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'URGENT': return 'bg-red-50 border-red-200';
      case 'PROMOTION': return 'bg-amber-50 border-amber-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const nextAnnouncement = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  return (
    <div className={`relative mb-6 p-4 rounded-2xl border ${getBgColor(current.type)} transition-all duration-500 shadow-sm overflow-hidden`}>
      <div className="flex items-start gap-4">
        <div className="p-2 bg-white rounded-xl shadow-sm">
          {getIcon(current.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              current.type === 'URGENT' ? 'text-red-600' : 
              current.type === 'PROMOTION' ? 'text-amber-600' : 'text-blue-600'
            }`}>
              {current.type === 'PROMOTION' ? '✨ สิทธิพิเศษ' : 
               current.type === 'URGENT' ? '🚨 ประกาศด่วน' : 'ℹ️ ข่าวสาร'}
            </span>
            <span className="text-[10px] text-gray-400">•</span>
            <span className="text-[10px] text-gray-500 font-medium">โดย {current.admin_name || 'System'}</span>
          </div>
          <h3 className="text-sm font-bold text-gray-800 leading-tight mb-1">{current.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{current.content}</p>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
          
          {announcements.length > 1 && (
            <button 
              onClick={nextAnnouncement}
              className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              ถัดไป ({currentIndex + 1}/{announcements.length})
            </button>
          )}
        </div>
      </div>
      
      {/* Decorative Background Element */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-20 rounded-full blur-2xl pointer-events-none"></div>
    </div>
  );
}
