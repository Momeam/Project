'use client'

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/stores/useAuthStore';

// สร้าง axios instance ที่จัดการ 401 อัตโนมัติ
const api = axios.create();
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Announcements: Token expired — logging out...');
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
import { Megaphone, Trash2, CheckCircle2, XCircle, AlertTriangle, Edit3 } from 'lucide-react';

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  is_active: boolean;
  admin_name: string;
  createdat: string;
}

export default function AdminAnnouncementsPage() {
  const { currentUser, token } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'PROMOTION'
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(`/api/announcements`);
      setAnnouncements(res.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;

    try {
      if (editingId) {
        // Update existing
        await api.put(`${process.env.NEXT_PUBLIC_API_URL || `/api`}/announcements/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('อัปเดตประกาศสำเร็จ! 🎉');
      } else {
        // Create new
        await api.post(`/api/announcements`, {
          ...formData,
          admin_id: currentUser?.id
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('ส่งประกาศสำเร็จ! 🎉');
      }
      
      setFormData({ title: '', content: '', type: 'PROMOTION' });
      setEditingId(null);
      fetchAnnouncements();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving announcement:', error);
      setMessage('เกิดข้อผิดพลาดในการบันทึกประกาศ');
    }
  };

  const handleEdit = (item: Announcement) => {
    setFormData({
      title: item.title,
      content: item.content,
      type: item.type
    });
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setFormData({ title: '', content: '', type: 'PROMOTION' });
    setEditingId(null);
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await api.put(`${process.env.NEXT_PUBLIC_API_URL || `/api`}/announcements/${id}/status`, {
        is_active: !currentStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteAnnouncement = async (id: number) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบประกาศนี้?')) return;
    try {
      await api.delete(`${process.env.NEXT_PUBLIC_API_URL || `/api`}/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
            <Megaphone className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">จัดการประกาศและสิทธิพิเศษ</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm">ส่งข้อความแจ้งเตือนสิทธิพิเศษให้ผู้ใช้เห็นบนหน้าหลัก</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg text-white ${message.includes('สำเร็จ') ? 'bg-green-500' : 'bg-red-500'}`}>
          {message}
        </div>
      )}

      {/* Form Section */}
      <div className="bg-white dark:bg-[#16161a] rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 p-6 mb-10 ring-1 ring-blue-500/10">
        <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-white flex items-center gap-2">
          {editingId ? <Edit3 className="w-5 h-5 text-amber-500" /> : <Megaphone className="w-5 h-5 text-blue-500" />}
          {editingId ? 'แก้ไขประกาศ' : 'สร้างประกาศใหม่'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">หัวข้อประกาศ</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0c] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                placeholder="เช่น สิทธิพิเศษสำหรับผู้ขายใหม่..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">ประเภท</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0c] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value="PROMOTION">สิทธิพิเศษ / โปรโมชั่น</option>
                <option value="INFO">ข่าวสารทั่วไป</option>
                <option value="URGENT">ประกาศด่วน</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">เนื้อหาประกาศ</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0c] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all h-32 placeholder:text-slate-400 dark:placeholder:text-slate-600"
              placeholder="รายละเอียดสิทธิพิเศษต่างๆ..."
              required
            ></textarea>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className={`${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'} text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/10`}
            >
              <Megaphone className="w-5 h-5" />
              {editingId ? 'บันทึกการแก้ไข' : 'ส่งประกาศทันที'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-semibold py-2 px-6 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                ยกเลิก
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List Section */}
      <div className="bg-white dark:bg-[#16161a] rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-white/10">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-white">รายการประกาศทั้งหมด</h2>
        </div>
        
        {loading ? (
          <div className="p-10 text-center text-gray-500">กำลังโหลด...</div>
        ) : announcements.length === 0 ? (
          <div className="p-10 text-center text-gray-400 italic">ยังไม่มีประกาศในขณะนี้</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-slate-400 text-sm uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">ประเภท</th>
                  <th className="px-6 py-4">หัวข้อ</th>
                  <th className="px-6 py-4">โดยแอดมิน</th>
                  <th className="px-6 py-4">สถานะ</th>
                  <th className="px-6 py-4">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {announcements.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.type === 'URGENT' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' :
                        item.type === 'PROMOTION' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                        'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800 dark:text-white">{item.title}</div>
                      <div className="text-sm text-gray-500 dark:text-slate-400 truncate max-w-xs">{item.content}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300">
                      {item.admin_name || 'System'}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleStatus(item.id, item.is_active)}
                        className={`flex items-center gap-1 text-sm font-medium ${item.is_active ? 'text-green-600' : 'text-gray-400'}`}
                      >
                        {item.is_active ? (
                          <><CheckCircle2 className="w-5 h-5" /> แสดงอยู่</>
                        ) : (
                          <><XCircle className="w-5 h-5" /> ปิดการใช้งาน</>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors"
                          title="แก้ไขประกาศ"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteAnnouncement(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          title="ลบประกาศ"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
