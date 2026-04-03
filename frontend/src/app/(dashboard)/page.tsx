// src/app/(dashboard)/admin/users/page.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, UserCheck, Home, Trash2, LogOut } from 'lucide-react';

// (นำเข้า ... เหมือนเดิม)
import { getPendingRequests, approveUser, MockUser } from '@/lib/types'; 
import { usePropertyStore } from '@/stores/usePropertyStore';
import { useAuthStore } from '@/stores/useAuthStore';

// --- Component: จัดการการยืนยันตัวตน ---
const VerificationManager = () => {
  // (โค้ด ... เหมือนเดิม)
  const [pendingUsers, setPendingUsers] = useState<MockUser[]>([]);

  const loadRequests = () => {
    const users = getPendingRequests();
    setPendingUsers(users);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = (email: string) => {
    approveUser(email); 
    loadRequests(); 
    alert(`อนุมัติผู้ใช้ ${email} เป็น SELLER เรียบร้อยแล้ว!`);
  };

  return (
    <Card className="dark:bg-gray-800 shadow-xl">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="flex items-center">
          <UserCheck className="w-5 h-5 mr-2 text-blue-500" /> 
          คำขอยืนยันตัวตนเป็น Seller ({pendingUsers.length})
        </CardTitle>
        <Button onClick={loadRequests} variant="outline">
          รีเฟรชรายการ
        </Button>
      </CardHeader>
      <CardContent>
        {pendingUsers.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400 flex flex-col items-center">
            <AlertTriangle className="w-10 h-10 mb-2 text-yellow-500" />
            <p>ไม่มีคำขอที่กำลังรอการอนุมัติ</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingUsers.map(user => (
              <div key={user.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{user.email}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    ID: {user.id} | สถานะปัจจุบัน: {user.verificationStatus}
                  </p>
                  {/* 🟢 (ในอนาคต Admin สามารถกดดูข้อมูลที่ User กรอก (ชื่อ, เลขบัตร) ได้ที่นี่) */}
                </div>
                <Button 
                  onClick={() => handleApprove(user.email)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  อนุมัติ (Approve)
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Component: จัดการทุกประกาศ (สำหรับ Admin) ---
const AllListingsManager = () => {
    // (โค้ด ... เหมือนเดิม)
    const allListings = usePropertyStore((state) => state.properties);
    const deleteProperty = usePropertyStore((state) => state.deleteProperty);
    const currentUser = useAuthStore((state) => state.currentUser);
    const userId = currentUser?.id;
    const role = currentUser?.role;
    const title = role === 'ADMIN' ? 'Admin Dashboard' : role === 'SELLER' ? 'Partner Dashboard' : 'User Home';
    
    const handleDelete = (id: string) => {
        if (confirm('คุณ (Admin) แน่ใจหรือไม่ว่าต้องการลบประกาศนี้?')) {
            deleteProperty(id, userId ? String(userId) : '', role || 'USER'); 
        }
    };
    
    return (
        <Card className="dark:bg-gray-800 shadow-xl">
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Home className="w-5 h-5 mr-2 text-purple-500" /> 
                    จัดการประกาศทั้งหมดในระบบ ({allListings.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                 {allListings.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">ยังไม่มีประกาศในระบบ</p>
                 ) : (
                    allListings.map(listing => (
                        <div key={listing.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border mb-2">
                            <div>
                                <p className="font-semibold text-lg">{listing.title}</p>
                                <p className="text-sm">ผู้โพสต์ (User ID): {listing.userId}</p>
                            </div>
                            <Button onClick={() => handleDelete(listing.id)} variant="destructive" size="icon">
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        </div>
                    ))
                 )}
            </CardContent>
        </Card>
    );
}

// --- Component หลัก: Admin Page ---
export default function AdminUsersPage() {
    // (โค้ด ... เหมือนเดิม)
    const [isMounted, setIsMounted] = useState(false);
    const logout = useAuthStore((state) => state.logout);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="p-8 min-h-screen bg-gray-100 dark:bg-gray-900">
                <p className='text-gray-500 dark:text-gray-400'>กำลังโหลด Admin Panel...</p>
            </div>
        );
    }
    
    return (
        <div className="p-8 min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className='flex justify-between items-center mb-8'>
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">
                        ADMIN PANEL
                    </h1>
                </div>
                {/* 🟢 ลิงก์กลับหน้าบ้าน */}
                <div className='flex space-x-2'>
                    <Link href="/" passHref>
                        <Button variant="outline">กลับหน้าหลัก</Button>
                    </Link>
                    <Button onClick={logout} variant="destructive">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </div>
            
            <div className="space-y-8">
                <VerificationManager />
                <AllListingsManager />
            </div>
        </div>
    );
}