'use client'

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, X, Info, Sparkles, AlertTriangle, MessageSquare, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  is_active: boolean;
  admin_name: string;
  createdat: string;
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await axios.get(`/api/announcements`);
        setAnnouncements(res.data);
        if (res.data.length > 0) setHasNew(true);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      }
    };
    fetchAnnouncements();
    
    // Polling ทุกๆ 1 นาที
    const interval = setInterval(fetchAnnouncements, 60000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'URGENT': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'PROMOTION': return <Sparkles className="w-5 h-5 text-amber-600" />;
      default: return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="relative">
      {/* 🔔 ปุ่มกระดิ่งแจ้งเตือน */}
      <Button 
        variant="outline" 
        size="icon" 
        className="relative rounded-full hover:bg-slate-100 transition-colors border-slate-200"
        onClick={() => {
          setIsOpen(!isOpen);
          setHasNew(false);
        }}
      >
        <Bell className={`w-5 h-5 ${hasNew ? 'text-blue-600' : 'text-slate-600'}`} />
        {hasNew && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
        )}
      </Button>

      {/* 📦 กล่องข้อความแจ้งเตือน (Popover) */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)}></div>
          <Card className="absolute right-0 mt-3 w-80 md:w-96 max-h-[500px] overflow-hidden shadow-2xl z-[70] border-slate-200 animate-in fade-in zoom-in slide-in-from-top-2 duration-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <MessageSquare className="w-5 h-5" />
                กล่องข้อความประกาศ
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-slate-800 p-1 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <CardContent className="p-0 overflow-y-auto max-h-[400px]">
              {announcements.length === 0 ? (
                <div className="p-10 text-center text-slate-400 italic flex flex-col items-center gap-2">
                  <Bell className="w-10 h-10 opacity-20" />
                  ไม่มีประกาศใหม่ในขณะนี้
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {announcements.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors cursor-default group">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-white shadow-sm transition-colors">
                          {getIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${
                              item.type === 'URGENT' ? 'text-red-600' : 
                              item.type === 'PROMOTION' ? 'text-amber-600' : 'text-blue-600'
                            }`}>
                              {item.type === 'PROMOTION' ? '✨ สิทธิพิเศษ' : 
                               item.type === 'URGENT' ? '🚨 ประกาศด่วน' : 'ℹ️ ข่าวสาร'}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3" />
                              {formatDate(item.createdat)}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-800 mb-1 leading-tight group-hover:text-blue-600 transition-colors">{item.title}</h3>
                          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                          <div className="mt-2 text-[10px] text-slate-400 font-medium">
                            ส่งโดย: {item.admin_name || 'System Admin'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-medium">ประกาศล่าสุดจากแอดมิน HomeLink</p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
