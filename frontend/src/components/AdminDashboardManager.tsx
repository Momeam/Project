// src/components/AdminDashboardManager.tsx
'use client'

import React, { useState } from 'react';
import { useAdminStore } from '@/stores/useAdminStore'; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, AlertTriangle, XCircle, Home } from 'lucide-react';

export function AdminDashboardManager() {
  const { listings, addListing, deleteListing, deleteAllListings } = useAdminStore();
  
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

  return (
    <div className="space-y-8">
      {/* 3. 🟢 ส่วนควบคุม (เพิ่ม Input Field สำหรับ Image URL) */}
      <Card className="dark:bg-gray-800 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2 text-green-500" /> เพิ่มประกาศอสังหาฯ (Admin)
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

            <Button onClick={handleAddItem} disabled={!newTitle.trim() || !newPrice.trim() || !newImageUrl.trim()} className="h-10 bg-green-600 hover:bg-green-700 md:col-span-2">
              <Plus className="w-4 h-4 mr-2" /> เพิ่มประกาศ
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 5. 🟢 ส่วนแสดงผล (เพิ่มการแสดงผลรูปภาพเล็กน้อย) */}
      <Card className="dark:bg-gray-800 shadow-xl">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="flex items-center">
            <Home className="w-5 h-5 mr-2 text-blue-500" /> ประกาศทั้งหมด ({listings.length})
          </CardTitle>
          <Button 
            onClick={deleteAllListings}
            disabled={listings.length === 0}
            variant="destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" /> ลบทั้งหมด
          </Button>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">...</div>
          ) : (
            <div className="space-y-3">
              {listings.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border">
                  {/* 🟢 เพิ่มรูปภาพ */}
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-16 h-16 object-cover rounded-md mr-4 bg-gray-300"
                    onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/150.png?text=Error'}
                  />
                  <div className="flex-grow">
                    <p className="font-semibold text-gray-900 dark:text-white">{item.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      ประเภท: {item.type} | ราคา: {item.price.toLocaleString()} บาท
                    </p>
                  </div>
                  <Button 
                    onClick={() => deleteListing(item.id)}
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:bg-red-50"
                  >
                    <XCircle className="w-5 h-5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}