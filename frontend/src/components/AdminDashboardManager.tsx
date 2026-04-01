// src/components/AdminDashboardManager.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { useAdminStore } from '@/stores/useAdminStore'; 
import { usePropertyStore } from '@/stores/usePropertyStore'; // 👈 ดึงข้อมูลจริง
import { useAuthStore } from '@/stores/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, AlertTriangle, XCircle, Home, User } from 'lucide-react';

export function AdminDashboardManager() {
  const { listings: mockListings, addListing, deleteListing: deleteMockListing, deleteAllListings } = useAdminStore();
  const { properties, fetchProperties, deleteProperty } = usePropertyStore();
  const currentUser = useAuthStore((state) => state.currentUser);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // 1. 🟢 เพิ่ม State สำหรับ Image URL
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newType, setNewType] = useState<'For Sale' | 'For Rent'>('For Sale');
  const [newImageUrl, setNewImageUrl] = useState(''); // 🟢

  const handleAddItem = () => {
    // 2. 🟢 ตรวจสอบว่ามี Image URL ด้วย
    if (newTitle.trim() && newPrice.trim() && newImageUrl.trim()) {
      addListing(
        newTitle.trim(), 
        parseFloat(newPrice) || 0,
        newType,
        newImageUrl.trim() // 🟢 ส่ง URL ไปที่ Store
      );
      setNewTitle('');
      setNewPrice('');
      setNewType('For Sale');
      setNewImageUrl(''); // 🟢 รีเซ็ตค่า
    } else {
      alert('กรุณากรอกข้อมูลทั้งหมด (รวมถึง Image URL)');
    }
  };

  const handleDeleteRealProperty = (id: string) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบประกาศนี้ในฐานะแอดมิน?")) {
      deleteProperty(id, currentUser?.id ? String(currentUser.id) : '', 'ADMIN');
    }
  };

  return (
    <div className="space-y-8">
      {/* 🟢 ส่วนจัดการประกาศจริง (Database) */}
      <Card className="dark:bg-gray-800 shadow-xl border-blue-100 dark:border-blue-900">
        <CardHeader className="flex flex-row justify-between items-center bg-blue-50/50 dark:bg-blue-950/20">
          <CardTitle className="flex items-center text-blue-700 dark:text-blue-400">
            <Home className="w-5 h-5 mr-2" /> จัดการประกาศทั้งหมดจาก SELLER ({properties.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {properties.length === 0 ? (
            <div className="text-center py-10 text-gray-500">ไม่มีประกาศในระบบ</div>
          ) : (
            <div className="space-y-4">
              {properties.map(item => (
                <div key={item.id} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <img 
                      src={item.images?.[0]?.url || 'https://via.placeholder.com/150.png?text=No+Image'} 
                      alt={item.title} 
                      className="w-20 h-20 object-cover rounded-lg bg-gray-100"
                    />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-lg line-clamp-1">{item.title}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.type === 'SALE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {item.type === 'SALE' ? 'ขาย' : 'เช่า'}
                        </span>
                        <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <User className="w-2 h-2" /> ID: {item.userId}
                        </span>
                      </div>
                      <p className="text-red-600 font-black mt-1">฿{item.price.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 w-full md:w-auto">
                    <Link href={`/listings/${item.id}`} target="_blank" className="flex-1 md:flex-none">
                      <Button variant="outline" size="sm" className="w-full h-10 rounded-lg">
                        <Eye className="w-4 h-4 mr-2" /> ดู
                      </Button>
                    </Link>
                    <Button 
                      onClick={() => handleDeleteRealProperty(item.id)}
                      variant="destructive"
                      size="sm"
                      className="flex-1 md:flex-none h-10 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> ลบประกาศ
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. 🟢 ส่วนควบคุม Mock (เดิม) */}
      <Card className="dark:bg-gray-800 shadow-xl opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-500">
            <Plus className="w-5 h-5 mr-2" /> เพิ่มประกาศจำลอง (Mock Data)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            
            {/* Input Title */}
            <div className="md:col-span-2">
              <Label htmlFor="item-name">หัวข้อประกาศ</Label>
              <Input
                id="item-name"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="เช่น คอนโด 3 ห้องนอน"
              />
            </div>

            {/* Input Price */}
            <div>
              <Label htmlFor="item-price">ราคา (บาท)</Label>
              <Input
                id="item-price"
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="5000000"
              />
            </div>

            {/* 4. Input Image URL (เพิ่มเข้ามาใหม่) */}
            <div className="md:col-span-2">
              <Label htmlFor="item-image">Image URL</Label>
              <Input
                id="item-image"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://example.com/image.png"
              />
            </div>

            {/* Input Type (ใช้ Input เพื่อเลี่ยงบัค Select) */}
            <div className="md:col-span-3">
              <Label htmlFor="item-type">ประเภท (For Sale / For Rent)</Label>
              <Input
                id="item-type"
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                placeholder="For Sale"
              />
            </div>

            <Button onClick={handleAddItem} disabled={!newTitle.trim() || !newPrice.trim() || !newImageUrl.trim()} className="h-10 bg-gray-600 hover:bg-gray-700 md:col-span-2">
              <Plus className="w-4 h-4 mr-2" /> เพิ่ม (จำลอง)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}