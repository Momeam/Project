'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calculator, Banknote } from 'lucide-react';

interface MortgageCalculatorProps {
    price: number;
}

export default function MortgageCalculator({ price }: MortgageCalculatorProps) {
    const [loanAmount, setLoanAmount] = useState(price * 0.9); 
    const [interestRate, setInterestRate] = useState(6.5); 
    const [loanTerm, setLoanTerm] = useState(30); 
    const [monthlyPayment, setMonthlyPayment] = useState(0);

    useEffect(() => {
        const principal = loanAmount;
        const calculatedInterest = interestRate / 100 / 12;
        const calculatedPayments = loanTerm * 12;

        if (principal > 0 && calculatedInterest > 0 && calculatedPayments > 0) {
             const x = Math.pow(1 + calculatedInterest, calculatedPayments);
             const monthly = (principal * x * calculatedInterest) / (x - 1);
             if (isFinite(monthly)) {
                 setMonthlyPayment(monthly);
             }
        } else {
            setMonthlyPayment(0);
        }
    }, [loanAmount, interestRate, loanTerm]);

    return (
        <Card className="bg-gray-50 dark:bg-gray-800 border-none shadow-inner">
            <CardHeader>
                <CardTitle className="flex items-center text-lg">
                    <Calculator className="w-5 h-5 mr-2 text-blue-600" />
                    คำนวณสินเชื่อเบื้องต้น
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* ⭐️ แก้ไขตรงนี้: เปลี่ยนเป็น grid-cols-1 เพื่อให้เรียงลงมาแนวตั้งเสมอ */}
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="text-sm text-gray-500 mb-1 block whitespace-nowrap">วงเงินกู้ (บาท)</label>
                        <Input 
                            type="number" 
                            value={loanAmount} 
                            onChange={(e) => setLoanAmount(Number(e.target.value))} 
                            className="bg-white dark:bg-gray-700"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-500 mb-1 block whitespace-nowrap">ดอกเบี้ย (%)</label>
                        <Input 
                            type="number" 
                            value={interestRate} 
                            onChange={(e) => setInterestRate(Number(e.target.value))} 
                            className="bg-white dark:bg-gray-700"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-500 mb-1 block whitespace-nowrap">ระยะเวลา (ปี)</label>
                        <Input 
                            type="number" 
                            value={loanTerm} 
                            onChange={(e) => setLoanTerm(Number(e.target.value))} 
                            className="bg-white dark:bg-gray-700"
                        />
                    </div>
                </div>
                
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg flex justify-between items-center border border-blue-100 dark:border-blue-900 mt-4">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">ผ่อนเริ่มต้น:</span>
                    <span className="text-2xl font-bold text-blue-600 flex items-center">
                        <Banknote className="w-6 h-6 mr-2" />
                        ฿{monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-sm text-gray-500 font-normal ml-1">/ เดือน</span>
                    </span>
                </div>
                <p className="text-xs text-gray-400 text-center mt-2">*ราคาเป็นเพียงการประมาณการ อัตราดอกเบี้ยจริงขึ้นอยู่กับเงื่อนไขของแต่ละธนาคาร</p>
            </CardContent>
        </Card>
    );
}