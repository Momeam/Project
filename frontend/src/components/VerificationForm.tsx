'use client';
import React, { useRef, useEffect } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { requestVerification } from '@/actions/users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileText, Phone, Mail, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 mt-6">
            {pending ? 'กำลังส่งคำขอ...' : 'ส่งคำขอยืนยันตัวตน'}
        </Button>
    );
}

export default function VerificationForm() {
    // ⭐️ เพิ่ม submittedData ใน initialState
    const initialState = { success: false, message: '', submittedData: undefined };
    const [state, formAction] = useActionState(requestVerification, initialState);
    const formRef = useRef<HTMLFormElement>(null);
    
    // ⭐️ เรียกใช้ action: submitVerificationRequest
    const submitVerificationRequest = useAuthStore((state) => state.submitVerificationRequest); 
    
    useEffect(() => {
        if (state.success && state.submittedData) {
            formRef.current?.reset();
            // ⭐️ บันทึกข้อมูลลง Store ทันทีที่ Server ตอบกลับ
            submitVerificationRequest(state.submittedData);
        }
    }, [state, submitVerificationRequest]);

    return (
        <Card className="max-w-xl mx-auto shadow-lg dark:bg-gray-800 border-t-4 border-t-blue-500">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center">
                    <FileText className="w-6 h-6 mr-2 text-blue-500" />
                    ยืนยันตัวตนผู้ขาย
                </CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อใช้ในการติดต่อและยืนยันตัวตน</p>
            </CardHeader>
            <CardContent>
                <form ref={formRef} action={formAction} className="space-y-4">
                    <div className="space-y-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white border-b pb-1">ข้อมูลส่วนตัว</h3>
                        <div><label className="text-sm">ชื่อ-สกุล</label><Input type="text" name="fullName" required placeholder="ชื่อ-สกุล" className="mt-1" /></div>
                        <div><label className="text-sm">เลขบัตรประชาชน</label><Input type="text" name="idCardNumber" required placeholder="xxxxxxxxxxxxx" className="mt-1" /></div>
                    </div>
                    <div className="space-y-3 pt-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white border-b pb-1">ข้อมูลการติดต่อ</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div><label className="text-sm flex items-center"><Phone className="w-3 h-3 mr-1"/> เบอร์โทรศัพท์</label><Input type="tel" name="phoneNumber" required className="mt-1" /></div>
                            <div><label className="text-sm flex items-center"><MessageSquare className="w-3 h-3 mr-1"/> Line ID</label><Input type="text" name="lineId" required className="mt-1" /></div>
                        </div>
                        <div><label className="text-sm flex items-center"><Mail className="w-3 h-3 mr-1"/> อีเมล</label><Input type="email" name="email" required className="mt-1" /></div>
                    </div>
                    <div className="space-y-3 pt-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white border-b pb-1">เอกสารยืนยัน</h3>
                        <div><label className="text-sm">รูปถ่ายหน้าบัตรประชาชน</label><Input type="file" name="document" required accept="image/*" className="mt-1" /></div>
                    </div>
                    {state.message && <div className={`p-3 rounded-md text-sm ${state.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{state.message}</div>}
                    <SubmitButton />
                </form>
            </CardContent>
        </Card>
    );
}