// src/components/AddAnnouncementForm.tsx
'use client'

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { X, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

interface AddAnnouncementFormProps {
  onClose: () => void;
  onSubmit: (formData: any) => void;
}

export function AddAnnouncementForm({ onClose, onSubmit }: AddAnnouncementFormProps) {
  const [formData, setFormData] = useState({
    type: 'sell', // 'sell' or 'rent'
    title: '',
    description: '',
    bedrooms: '',
    bathrooms: '',
    price: '',
    images: [] as File[],
    contact: '',
    facilities: [] as string[],
  });

  const [newFacility, setNewFacility] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({ ...prev, images: Array.from(e.target.files) }));
    }
  };

  const handleFacilityToggle = (facility: string) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  };

  const handleAddFacility = () => {
    if (newFacility.trim() && !formData.facilities.includes(newFacility.trim())) {
      setFormData(prev => ({
        ...prev,
        facilities: [...prev.facilities, newFacility.trim()]
      }));
      setNewFacility('');
    }
  };

  const handleRemoveFacility = (facility: string) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.filter(f => f !== facility)
    }));
  };

  const handleMoveFacility = (index: number, direction: 'up' | 'down') => {
    const newFacilities = [...formData.facilities];
    if (direction === 'up' && index > 0) {
      [newFacilities[index], newFacilities[index - 1]] = [newFacilities[index - 1], newFacilities[index]];
    } else if (direction === 'down' && index < newFacilities.length - 1) {
      [newFacilities[index], newFacilities[index + 1]] = [newFacilities[index + 1], newFacilities[index]];
    }
    setFormData(prev => ({ ...prev, facilities: newFacilities }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center animate-fade-in p-4">
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slide-up {
          animation: slideUp 0.4s ease-out;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <Card className="w-full max-w-2xl animate-slide-up shadow-2xl bg-white dark:bg-[#16161a] border-slate-200 dark:border-white/10">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 dark:border-white/10">
          <CardTitle className="text-2xl text-slate-900 dark:text-white">เพิ่มประกาศของคุณ</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:text-slate-400 transition-colors">
            <X className="h-6 w-6" />
          </Button>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto scrollbar-hide pt-6 text-slate-900 dark:text-slate-200">

            <div className="space-y-2">
              <Label>ประเภทประกาศ</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={formData.type === 'sell' ? 'default' : 'outline'}
                  onClick={() => setFormData(prev => ({ ...prev, type: 'sell' }))}
                >
                  ขาย
                </Button>
                <Button
                  type="button"
                  variant={formData.type === 'rent' ? 'default' : 'outline'}
                  onClick={() => setFormData(prev => ({ ...prev, type: 'rent' }))}
                >
                  เช่า
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">หัวข้อประกาศ</Label>
              <Input id="title" name="title" value={formData.title} onChange={handleInputChange} placeholder="เช่น ขายคอนโดใจกลางเมือง" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">รายละเอียด</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="รายละเอียดเกี่ยวกับอสังหาริมทรัพย์ของคุณ"
                className="w-full p-3 border rounded-xl bg-white dark:bg-[#0a0a0c] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                rows={4}
              />

            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">จำนวนห้องนอน</Label>
                <Input id="bedrooms" name="bedrooms" type="number" value={formData.bedrooms} onChange={handleInputChange} placeholder="เช่น 1, 2" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">จำนวนห้องน้ำ</Label>
                <Input id="bathrooms" name="bathrooms" type="number" value={formData.bathrooms} onChange={handleInputChange} placeholder="เช่น 1, 2" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>สิ่งอำนวยความสะดวก</Label>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {['แอร์', 'ตู้เย็น', 'เครื่องซักผ้า', 'ห้องครัว', 'ระเบียง', 'ที่จอดรถ'].map(facility => (
                  <div key={facility} className="flex items-center">
                    <input
                      type="checkbox"
                      id={facility}
                      checked={formData.facilities.includes(facility)}
                      onChange={() => handleFacilityToggle(facility)}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                    <Label htmlFor={facility} className="ml-2 cursor-pointer text-sm font-normal">
                      {facility}
                    </Label>
                  </div>
                ))}
              </div>
              
              {/* เพิ่มสิ่งอำนวยความสะดวกใหม่ */}
              <div className="flex gap-2 mb-3">
                <Input
                  value={newFacility}
                  onChange={(e) => setNewFacility(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddFacility()}
                  placeholder="เพิ่มสิ่งอำนวยความสะดวกใหม่"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddFacility}
                  className="px-4"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* รายการสิ่งอำนวยความสะดวกที่เพิ่มแล้ว */}
              {formData.facilities.length > 0 && (
                <div className="space-y-2 border rounded-xl p-3 bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/5 max-h-48 overflow-y-auto scrollbar-hide">
                  {formData.facilities.map((facility, index) => (
                    <div key={index} className="flex items-center justify-between bg-white dark:bg-[#1a1a20] p-2 rounded-lg border border-slate-200 dark:border-white/5 shadow-sm">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{facility}</span>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleMoveFacility(index, 'up')}
                          disabled={index === 0}
                          className="h-6 w-6"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleMoveFacility(index, 'down')}
                          disabled={index === formData.facilities.length - 1}
                          className="h-6 w-6"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveFacility(facility)}
                          className="h-6 w-6 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">ราคา</Label>
              <Input id="price" name="price" type="number" value={formData.price} onChange={handleInputChange} placeholder="ระบุราคา (บาท)" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">ข้อมูลติดต่อ</Label>
              <Input id="contact" name="contact" value={formData.contact} onChange={handleInputChange} placeholder="เช่น เบอร์โทรศัพท์, Line ID" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="images">รูปภาพ</Label>
              <Input id="images" name="images" type="file" onChange={handleImageChange} multiple accept="image/*" />
            </div>
            {formData.images.length > 0 && (
              <div className="text-sm text-gray-500">
                เลือกแล้ว {formData.images.length} รูป
              </div>
            )}
          </CardContent>
          <CardFooter className="gap-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 p-6 flex justify-end rounded-b-xl">
            <Button type="button" variant="outline" onClick={onClose} className="transition-all hover:bg-slate-100 dark:hover:bg-white/5 border-slate-200 dark:border-white/10 dark:text-white">
              ยกเลิก
            </Button>
            <Button type="submit" className="transition-all hover:shadow-lg font-bold">ยืนยันและส่งประกาศ</Button>
          </CardFooter>

        </form>
      </Card>
    </div>
  );
}
