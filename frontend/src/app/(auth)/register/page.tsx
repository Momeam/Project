'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [tel, setTel] = useState(''); // ⭐️ เพิ่ม State สำหรับเก็บเบอร์โทรศัพท์
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false); // ⭐️ เพิ่ม State กันคนกดย้ำ
    const router = useRouter();
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // 🚀 ยิง API ข้ามไปหา Backend พอร์ต 5000
            const response = await fetch('http://localhost:5000/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // ส่งข้อมูลแพ็กใส่กล่อง JSON ไปให้เซิร์ฟเวอร์
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    tel
                }),
            });

            // รอรับกล่องข้อความที่เซิร์ฟเวอร์ตอบกลับมา
            const data = await response.json();

            // ถ้าสถานะโอเค (201 Created)
            if (response.ok) {
                alert('สมัครสมาชิกสำเร็จ! 🎉 ระบบกำลังพาท่านไปหน้าเข้าสู่ระบบ...');
                router.push('/login');
            } else {
                // ถ้ามี Error จากเซิร์ฟเวอร์ (เช่น อีเมลซ้ำ)
                setError(data.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
            }
        } catch (err) {
            console.error('Error:', err);
            setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบ Backend');
        } finally {
            setIsLoading(false); // ปลดล็อกปุ่ม
        }
    };

    return (
        <Card className="w-full max-w-md shadow-xl dark:bg-gray-800">
            <CardHeader>
                <CardTitle className="text-3xl text-center">สมัครสมาชิก</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">ชื่อผู้ใช้</label>
                        <Input 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                            placeholder="Username" 
                            className="mt-1" 
                        />
                    </div>
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
                            minLength={6}
                        />
                    </div>
                    {/* ⭐️ เพิ่มช่องกรอกเบอร์โทรศัพท์ */}
                    <div>
                        <label className="text-sm font-medium">เบอร์โทรศัพท์</label>
                        <Input 
                            type="tel" 
                            value={tel} 
                            onChange={(e) => setTel(e.target.value)} 
                            placeholder="08X-XXX-XXXX" 
                            className="mt-1" 
                        />
                    </div>
                    
                    {error && <p className="text-sm text-red-600 text-center font-medium bg-red-50 p-2 rounded-md">{error}</p>}

                    <Button 
                        type="submit" 
                        disabled={isLoading} // ล็อกปุ่มถ้าระบบกำลังโหลด
                        className={`w-full text-white ${isLoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        {isLoading ? 'กำลังประมวลผล...' : 'สมัครสมาชิก'}
                    </Button>

                    <div className="text-center text-sm mt-4">
                        มีบัญชีอยู่แล้ว? <Link href="/login" className="text-blue-600 hover:underline">เข้าสู่ระบบ</Link>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}