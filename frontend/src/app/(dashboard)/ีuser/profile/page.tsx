'use client';

import React from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, ShieldCheck, Building, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
    // 🟢 ดึงข้อมูลผู้ใช้งานตัวจริงจาก Store ที่เชื่อมกับ Database แล้ว
    const user = useAuthStore((state) => state.user);
    const role = user?.role || 'USER';

    if (!user) return <div className="min-h-screen flex items-center justify-center text-gray-500">กำลังโหลดข้อมูล...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 mt-10">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">ตั้งค่าบัญชี (Profile)</h1>

            {/* ส่วนที่ 1: ข้อมูลส่วนตัว */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <User className="w-6 h-6 text-blue-500" />
                    <h2 className="text-xl font-semibold dark:text-white">ข้อมูลส่วนตัว</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">ชื่อผู้ใช้งาน</label>
                        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 dark:text-white font-medium">
                            {user.username}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">อีเมล</label>
                        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 dark:text-white flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" /> {user.email}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">เบอร์โทรศัพท์</label>
                        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 dark:text-white flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" /> {user.tel || 'ไม่ได้ระบุ'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">ระดับสิทธิ์ (Role)</label>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 font-bold text-blue-600 dark:text-blue-400">
                            {role}
                        </div>
                    </div>
                </div>
            </div>

            {/* ส่วนที่ 2: สถานะบัญชีผู้ขาย */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <ShieldCheck className="w-6 h-6 text-green-500" />
                    <h2 className="text-xl font-semibold dark:text-white">สถานะการเป็นผู้ขาย</h2>
                </div>

                {role === 'SELLER' || role === 'ADMIN' ? (
                    <div className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 p-8 rounded-xl border border-green-200 dark:border-green-800 flex flex-col items-center text-center">
                        <ShieldCheck className="w-16 h-16 text-green-500 mb-4" />
                        <h3 className="font-bold text-2xl mb-2">คุณเป็นผู้ขายที่ได้รับการยืนยันแล้ว</h3>
                        <p className="text-sm opacity-80 mb-6">คุณสามารถลงประกาศอสังหาริมทรัพย์และจัดการรายการของคุณได้ทันที</p>
                        <Link href="/create-property">
                            <Button className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-6 rounded-xl text-lg">
                                <Building className="w-5 h-5 mr-2" /> ลงประกาศใหม่เลย!
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400 p-8 rounded-xl border border-orange-200 dark:border-orange-800 flex flex-col items-center text-center">
                        <AlertCircle className="w-16 h-16 text-orange-500 mb-4" />
                        <h3 className="font-bold text-2xl mb-2">บัญชีผู้ใช้ทั่วไป (USER)</h3>
                        <p className="text-sm opacity-80 mb-6">หากต้องการลงประกาศขายหรือเช่าอสังหาริมทรัพย์ คุณต้องทำการขออัปเกรดเป็นบัญชีผู้ขาย (SELLER) ก่อน</p>
                        <Button 
                            onClick={() => alert('🚀 ฟีเจอร์อัปเกรดเป็นผู้ขายกำลังอยู่ในช่วงพัฒนา (เร็วๆ นี้!) \n*ถ้าต้องการเป็นผู้ขายตอนนี้ กรุณาติดต่อ Admin ครับ')} 
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-6 rounded-xl text-lg"
                        >
                            ยืนยันตัวตนเพื่อเป็นผู้ขาย
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}