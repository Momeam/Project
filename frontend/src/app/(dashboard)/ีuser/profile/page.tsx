'use client'

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// 🟢 1. นำเข้า Store ฐานข้อมูล User
import { useUserStore } from '@/stores/useUserStore';

export default function ProfilePage() {
    // (ดึงจาก AuthStore ... เหมือนเดิม)
    const email = useAuthStore((state) => state.email);
    const currentUsername = useAuthStore((state) => state.username);
    const currentImageUrl = useAuthStore((state) => state.profileImageUrl);
    const updateProfileDisplay = useAuthStore((state) => state.updateProfileDisplay);
    const role = useAuthStore((state) => state.role);

    // 🟢 2. ดึง Action จาก Store ฐานข้อมูล User
    const updateUserProfile = useUserStore((state) => state.updateUserProfile);

    const [username, setUsername] = useState(currentUsername || '');
    const [profileImageUrl, setProfileImageUrl] = useState(currentImageUrl || '');
    
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
        setUsername(currentUsername || '');
        setProfileImageUrl(currentImageUrl || '');
    }, [currentUsername, currentImageUrl]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return alert("Error: ไม่พบอีเมลผู้ใช้");
        
        // 🟢 3. อัปเดต "ฐานข้อมูล" (ใน LocalStorage)
        updateUserProfile(email, { username, profileImageUrl });
        
        // 4. อัปเดต "Session ปัจจุบัน"
        updateProfileDisplay({ username, profileImageUrl });
        
        alert('อัปเดตโปรไฟล์สำเร็จ!');
    };

    if (!isMounted || !email) {
         return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
                <p>กำลังโหลดโปรไฟล์...</p>
            </div>
        );
    }

    const dashboardPath = role === 'ADMIN' ? '/admin/users' : '/user/dashboard';

    return (
        <div className="p-8 min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className='flex justify-between items-center mb-8'>
                <h1 className="text-4xl font-extrabold">My Profile</h1>
                <Button variant="outline" asChild>
                    <Link href={dashboardPath}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        กลับไป Dashboard
                    </Link>
                </Button>
            </div>
            <Card className="w-full max-w-2xl mx-auto shadow-lg dark:bg-gray-800">
                <CardHeader>
                    <CardTitle>แก้ไขข้อมูลโปรไฟล์</CardTitle>
                    <CardDescription>Email: {email}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex justify-center">
                            {profileImageUrl ? (
                                 <img src={profileImageUrl} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-gray-300" 
                                        onError={(e) => e.currentTarget.src = 'https://placehold.co/150'} />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <User className="w-16 h-16 text-gray-500" />
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username (ชื่อผู้ใช้)</Label>
                            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="profileImageUrl">Profile Image URL</Label>
                            <Input id="profileImageUrl" value={profileImageUrl} onChange={(e) => setProfileImageUrl(e.target.value)} placeholder="https://..." />
                        </div>
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                            <Save className="w-4 h-4 mr-2" />
                            บันทึกการเปลี่ยนแปลง
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}