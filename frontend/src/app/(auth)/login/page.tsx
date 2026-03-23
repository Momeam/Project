'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false); // ⭐️ เพิ่มกันคนกดย้ำ
    const router = useRouter();

    // ⭐️ ดึงฟังก์ชัน login แบบใหม่ (สำหรับอัปเดตสถานะใน Store)
    const loginSuccess = useAuthStore((state) => state.loginSuccess);
    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement> | React.FormEvent) => {
        e.preventDefault(); 
        setError('');
        setSuccessMsg('');
        setIsLoading(true); // ล็อกปุ่ม

        try {
            // 🚀 ยิง API ไปเช็กอีเมลและรหัสผ่านที่ Database (Neon)
            const response = await fetch('http://localhost:5000/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            // ถ้าล็อกอินสำเร็จ (Backend ตอบ 200 OK)
            if (response.ok) {
                setSuccessMsg('ล็อกอินสำเร็จ! กำลังพาท่านไป...');
                
                // 📦 1. สั่งให้ Zustand Store อัปเดตข้อมูล User ลงในระบบหน้าบ้าน
                // หมายเหตุ: โค้ดนี้สมมติว่าฟังก์ชัน login ใน store รับค่าแค่ email/password 
                // แต่ของจริงเราอยากให้มันรับ object User เข้าไปเลย เดี๋ยวเราอาจจะต้องไปปรับ store นิดหน่อยครับ
                // แต่เพื่อความง่ายตอนนี้ เราแค่เรียกใช้เพื่อเปลี่ยนสถานะ isAuthenticated ให้เป็น true ก่อน
              loginSuccess(data.user);

                // 🧭 2. เช็กสิทธิ์ (Role) จากข้อมูลที่ Backend ส่งกลับมาเพื่อพาไปหน้าให้ถูก
                const userRole = data.user.role; 

                setTimeout(() => {
                    if (userRole === 'ADMIN') {
                        router.push('/admin/users');
                    } else if (userRole === 'SELLER') { 
                        router.push('/user/dashboard');
                    } else {
                        router.push('/'); // User ทั่วไปไปหน้าแรก
                    }
                }, 1000);

            } else {
                // ถ้าล็อกอินพลาด (รหัสผิด / ไม่มีอีเมล)
                setError(data.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
            }
        } catch (err) {
            console.error('Login Error:', err);
            setError('ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่');
        } finally {
            setIsLoading(false); // ปลดล็อกปุ่ม
        }
    };

    return (
        <Card className="w-full max-w-md shadow-xl dark:bg-gray-800">
            <CardHeader>
                <CardTitle className="text-3xl text-center flex items-center justify-center">
                    <LogIn className="w-6 h-6 mr-3 text-blue-600" />
                    เข้าสู่ระบบ
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">อีเมล</label>
                        <Input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            placeholder="name@example.com" 
                            className="mt-1" 
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">รหัสผ่าน</label>
                        <Input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            placeholder="••••••••" 
                            className="mt-1" 
                        />
                    </div>
                    
                    {error && <p className="text-sm text-red-600 text-center font-medium bg-red-50 p-2 rounded-md">{error}</p>}
                    {successMsg && <p className="text-sm text-green-600 text-center font-medium bg-green-50 p-2 rounded-md">{successMsg}</p>}

                    <Button 
                        type="button" 
                        onClick={handleSubmit} 
                        disabled={isLoading}
                        className={`w-full text-white ${isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
                    </Button>

                    <div className="text-center text-sm mt-4">
                        ยังไม่มีบัญชี? <Link href="/register" className="text-blue-600 hover:underline">สมัครสมาชิก</Link>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}