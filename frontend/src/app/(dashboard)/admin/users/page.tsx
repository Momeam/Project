'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore, UserRole } from '@/stores/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Users, 
    Shield, 
    User as UserIcon, 
    Mail, 
    Phone, 
    Calendar,
    Search,
    Loader2,
    MoreVertical,
    Trash2,
    Megaphone, // 👈 เพิ่มไอคอน
} from 'lucide-react';
import Link from 'next/link'; // 👈 นำเข้า Link
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminUsersPage() {
    const { usersList, fetchUsers, updateUserRole, deleteUser, currentUser } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadUsers = async () => {
            if (currentUser?.role === 'ADMIN') {
                await fetchUsers();
            }
            setIsLoading(false);
        };
        loadUsers();
    }, [fetchUsers, currentUser]);

    const safeUsersList = Array.isArray(usersList) ? usersList : [];
    const filteredUsers = safeUsersList.filter(user => 
        (user?.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user?.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleRoleChange = async (userId: string | number, newRole: UserRole) => {
        if (confirm(`คุณต้องการเปลี่ยนบทบาทเป็น ${newRole} ใช่หรือไม่?`)) {
            await updateUserRole(userId, newRole);
        }
    };

    const handleDeleteUser = async (userId: string | number, username: string) => {
        if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ "${username}"? การกระทำนี้ไม่สามารถย้อนกลับได้`)) {
            await deleteUser(userId);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (currentUser?.role !== 'ADMIN') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
                    <Shield className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-800">เข้าถึงข้อมูลไม่ได้</h2>
                    <p className="text-slate-500 mt-2">หน้านี้สำหรับแอดมินเท่านั้น</p>
                    <Link href="/">
                        <Button className="mt-6">กลับสู่หน้าหลัก</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center w-full">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <Users className="w-8 h-8 text-blue-600" />
                            จัดการผู้ใช้งาน
                        </h1>
                        <p className="text-slate-500">จัดการบทบาทและข้อมูลผู้ใช้งานทั้งหมดในระบบ</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/admin/announcements">
                        <Button variant="outline" className="w-full sm:w-auto border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-semibold gap-2">
                            <Megaphone className="w-5 h-5" />
                            จัดการประกาศ / สิทธิพิเศษ
                        </Button>
                    </Link>

                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="ค้นหาชื่อ หรือ อีเมล..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                        <Card key={user.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row items-center p-4 gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl shrink-0">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0 text-center md:text-left">
                                        <div className="flex flex-col md:flex-row md:items-center gap-2">
                                            <h3 className="text-lg font-bold text-slate-900 truncate">{user.username}</h3>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 
                                                user.role === 'SELLER' ? 'bg-blue-100 text-blue-800' : 
                                                'bg-slate-100 text-slate-800'
                                            }`}>
                                                {user.role === 'ADMIN' ? <Shield className="w-3 h-3 mr-1" /> : <UserIcon className="w-3 h-3 mr-1" />}
                                                {user.role}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                                            <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {user.email}</span>
                                            {user.tel && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {user.tel}</span>}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="w-5 h-5 text-slate-400" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'USER')}>
                                                    เปลี่ยนเป็น USER
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'SELLER')}>
                                                    เปลี่ยนเป็น SELLER
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'ADMIN')} className="text-purple-600 font-medium">
                                                    <Shield className="w-4 h-4 mr-2" /> ตั้งเป็น ADMIN
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => handleDeleteUser(user.id, user.username)} 
                                                    className="text-rose-600 font-medium"
                                                    disabled={user.role === 'ADMIN'}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" /> ลบผู้ใช้งาน
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-200">
                        <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">ไม่พบข้อมูลผู้ใช้งาน</p>
                    </div>
                )}
            </div>
        </div>
    );
}
