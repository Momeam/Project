'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore, UserRole } from '@/stores/useAuthStore';
import { Button } from "@/components/ui/button";
import { 
    Users, 
    Shield, 
    User as UserIcon, 
    Mail, 
    Phone, 
    Search,
    Loader2,
    MoreVertical,
    Trash2,
    Megaphone,
    TrendingUp,
    UserCheck,
    Briefcase,
    ChevronRight,
    ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from 'framer-motion';

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

    const stats = {
        total: safeUsersList.length,
        sellers: safeUsersList.filter(u => u.role === 'SELLER').length,
        admins: safeUsersList.filter(u => u.role === 'ADMIN').length,
    };

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
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-slate-400 font-medium animate-pulse">กำลังโหลดข้อมูลระบบ...</p>
                </div>
            </div>
        );
    }

    if (currentUser?.role !== 'ADMIN') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center p-12 bg-[#16161a] rounded-3xl shadow-2xl border border-white/5 max-w-md mx-4"
                >
                    <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Shield className="w-10 h-10 text-rose-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                    <p className="text-slate-400 mb-8">พื้นที่นี้จำกัดสิทธิ์เฉพาะผู้ดูแลระบบที่มีสิทธิ์สูงเท่านั้น</p>
                    <Link href="/">
                        <Button className="w-full bg-white text-black hover:bg-slate-200 rounded-xl h-12 font-bold transition-all">
                            <ArrowLeft className="w-4 h-4 mr-2" /> กลับสู่หน้าหลัก
                        </Button>
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0c] text-slate-900 dark:text-slate-200 transition-colors duration-500 ease-in-out">
            {/* Header Section */}
            <div className="relative overflow-hidden border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0f0f12] transition-colors duration-500">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
                <div className="max-w-7xl mx-auto p-8 relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-2 text-primary font-bold tracking-wider uppercase text-xs mb-3">
                                <Shield className="w-4 h-4" /> Admin Console
                            </div>
                            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white flex items-center gap-4 tracking-tight">
                                User Management
                                <span className="text-sm font-medium bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 px-3 py-1 rounded-full text-slate-600 dark:text-slate-400">
                                    {stats.total} Total
                                </span>
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">จัดการบทบาท สิทธิ์ และดูแลความเรียบร้อยของผู้ใช้งานในระบบ</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/admin/announcements">
                                <Button className="bg-white dark:bg-[#1a1a20] hover:bg-slate-50 dark:hover:bg-[#25252d] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-2xl h-14 px-6 font-bold gap-3 shadow-xl transition-all">
                                    <Megaphone className="w-5 h-5 text-primary" />
                                    Broadcast Center
                                </Button>
                            </Link>
                            
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-primary transition-colors w-5 h-5" />
                                <input 
                                    type="text" 
                                    placeholder="ค้นหา Account..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full md:w-80 pl-12 pr-4 h-14 rounded-2xl bg-white dark:bg-[#16161a] border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                        {[
                            { label: 'Active Users', value: stats.total, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                            { label: 'Verified Sellers', value: stats.sellers, icon: Briefcase, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                            { label: 'System Admins', value: stats.admins, icon: Shield, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                        ].map((item, idx) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                key={idx} 
                                className="bg-white dark:bg-[#16161a] border border-slate-200 dark:border-white/5 p-6 rounded-3xl flex items-center gap-5 hover:border-slate-300 dark:hover:border-white/10 transition-all shadow-sm"
                            >
                                <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                                    <item.icon className={`w-7 h-7 ${item.color}`} />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-sm font-bold uppercase tracking-wide">{item.label}</p>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1 transition-colors">{item.value}</h3>
                                </div>
                                <div className="ml-auto opacity-5 dark:opacity-10 dark:text-white">
                                    <TrendingUp className="w-12 h-12" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto p-8 pb-24">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3 transition-colors">
                         Account Records
                        <div className="h-px w-20 bg-slate-200 dark:bg-white/10" />
                    </h2>
                </div>

                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user, idx) => (
                                <motion.div 
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: idx * 0.03 }}
                                    key={user.id} 
                                    className="group relative overflow-hidden bg-white dark:bg-[#121217] hover:bg-slate-50 dark:hover:bg-[#181820] border border-slate-200 dark:border-white/5 rounded-3xl transition-all duration-300 shadow-sm"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-primary transition-all" />
                                    <div className="flex flex-col md:flex-row items-center p-6 gap-6">
                                        {/* Avatar and Name */}
                                        <div className="flex items-center gap-5 flex-1 min-w-0">
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-gradient-to-br dark:from-primary/20 dark:to-primary/5 flex items-center justify-center text-primary font-black text-xl shrink-0 border border-slate-200 dark:border-white/5 shadow-inner leading-none transition-colors">
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                                {user.role === 'ADMIN' && (
                                                    <div className="absolute -top-2 -right-2 bg-purple-500 text-white p-1 rounded-lg shadow-lg">
                                                        <Shield className="w-3 h-3" />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">{user.username}</h3>
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                                        user.role === 'ADMIN' ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20' : 
                                                        user.role === 'SELLER' ? 'bg-blue-100 dark:bg-primary/10 text-blue-700 dark:text-primary border border-blue-200 dark:border-primary/20' : 
                                                        'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20'
                                                    }`}>
                                                        {user.role}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500 font-medium transition-colors">
                                                    <span className="flex items-center gap-2"><Mail className="w-4 h-4 opacity-50" /> {user.email}</span>
                                                    {user.tel && <span className="flex items-center gap-2"><Phone className="w-4 h-4 opacity-50" /> {user.tel}</span>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-4 shrink-0">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/5 transition-all">
                                                        <MoreVertical className="w-5 h-5 text-slate-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-white dark:bg-[#1a1a20] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 w-56 p-2 rounded-2xl shadow-2xl transition-colors">
                                                    <div className="px-2 py-2 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-600 tracking-widest">Manage Role</div>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleRoleChange(user.id, 'USER')}
                                                        className="rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 focus:bg-slate-100 dark:focus:bg-white/5 py-3 cursor-pointer transition-colors"
                                                        disabled={user.role === 'ADMIN' && currentUser?.id !== user.id} 
                                                    >
                                                        <UserIcon className="w-4 h-4 mr-3 text-slate-400 dark:text-slate-500" /> Change to USER
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleRoleChange(user.id, 'SELLER')}
                                                        className="rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 focus:bg-slate-100 dark:focus:bg-white/5 py-3 cursor-pointer transition-colors"
                                                        disabled={user.role === 'ADMIN' && currentUser?.id !== user.id}
                                                    >
                                                        <UserCheck className="w-4 h-4 mr-3 text-primary" /> Change to SELLER
                                                    </DropdownMenuItem>
                                                    
                                                    <div className="h-px bg-slate-100 dark:bg-white/5 my-2" />
                                                    
                                                    <DropdownMenuItem 
                                                        onClick={() => handleDeleteUser(user.id, user.username)} 
                                                        className="text-rose-500 hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/5 focus:bg-rose-50 dark:focus:bg-rose-500/5 rounded-xl py-3 cursor-pointer font-bold transition-colors"
                                                        disabled={user.role === 'ADMIN'}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-3" /> ลบผู้ใช้งาน
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            
                                            <div className="hidden lg:flex flex-col items-end text-right min-w-[120px]">
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Join Date</p>
                                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 transition-colors">Mar 12, 2024</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-800 group-hover:text-primary transition-all group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-32 bg-slate-50 dark:bg-[#121217] rounded-[40px] border border-slate-200 dark:border-white/5 transition-colors"
                            >
                                <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors">
                                    <Users className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">ไม่พบรายการผู้ใช้งาน</h3>
                                <p className="text-slate-500 dark:text-slate-400">ลองตรวจสอบคำค้นหา หรือกรองข้อมูลรายการใหม่อีกครั้ง</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Custom Styles for Glossy Text */}
            <style jsx global>{`
                .text-primary {
                    color: var(--primary);
                }
                .bg-primary {
                    background-color: var(--primary);
                }
                .border-primary {
                    border-color: var(--primary);
                }
                .focus\\:ring-primary\\/20:focus {
                    --tw-ring-color: color-mix(in srgb, var(--primary) 20%, transparent);
                }
            `}</style>
        </div>
    );
}
