'use client';
import React, { useMemo } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCheck, Check, X, Clock } from 'lucide-react';

export default function AdminVerificationPage() {
    // ⭐️ ดึง State และ Actions ที่จำเป็น
    const { usersList, approveUserVerification, rejectUserVerification } = useAuthStore((state) => ({
        usersList: state.usersList,
        approveUserVerification: state.approveUserVerification,
        rejectUserVerification: state.rejectUserVerification,
    }));

    // กรองเฉพาะผู้ใช้ที่รออนุมัติ
    const pendingUsers = useMemo(() => {
        return usersList.filter(u => u.verificationStatus === 'PENDING');
    }, [usersList]);

    const handleApprove = (userId: string) => {
        approveUserVerification(userId);
    };

    const handleReject = (userId: string) => {
        rejectUserVerification(userId);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 flex items-center">
                <UserCheck className="w-7 h-7 mr-3 text-yellow-600" />
                จัดการคำขอยืนยันตัวตน ({pendingUsers.length})
            </h1>

            <Card className="shadow-lg dark:bg-gray-800 border-l-4 border-l-yellow-600">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-yellow-500" />
                        รายการที่รอการตรวจสอบ
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {pendingUsers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>ไม่มีคำขอที่รอการอนุมัติอยู่ในขณะนี้</p>
                        </div>
                    ) : (
                        pendingUsers.map(user => (
                            <div key={user.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-lg">{user.username}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                    {/* ⭐️ แสดงรายละเอียดการยืนยันตัวตน (ถ้ามี) */}
                                    {user.verificationDetails && (
                                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                            ชื่อ: {user.verificationDetails.fullName} | 
                                            <a href={user.verificationDetails.documentUrl} target="_blank" className="text-blue-500 hover:underline ml-2">
                                                ดูหลักฐาน
                                            </a>
                                        </div>
                                    )}
                                </div>
                                <div className="flex space-x-2">
                                    <Button onClick={() => handleApprove(user.id)} className="bg-green-600 hover:bg-green-700">
                                        <Check className="w-4 h-4 mr-1" /> อนุมัติ
                                    </Button>
                                    <Button onClick={() => handleReject(user.id)} variant="destructive">
                                        <X className="w-4 h-4 mr-1" /> ปฏิเสธ
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}