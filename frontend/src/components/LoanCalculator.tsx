// ที่อยู่ไฟล์: src/components/LoanCalculator.tsx

'use client'; 

import React, { useState, useMemo } from 'react';

interface LoanCalculatorProps {
    propertyPrice: number;
}

// ⭐️ สูตรคำนวณสินเชื่อ (Monthly Payment Amortization Formula)
const calculateMonthlyPayment = (
    principal: number, 
    annualRate: number, 
    years: number
): number => {
    // ป้องกันการหารด้วยศูนย์ ถ้าดอกเบี้ยเป็น 0
    if (annualRate === 0 || years === 0) {
        return principal / (years * 12);
    }
    const monthlyRate = (annualRate / 100) / 12;
    const totalPayments = years * 12;

    const M = principal * (
        (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
        (Math.pow(1 + monthlyRate, totalPayments) - 1)
    );
    
    // คืนค่า 0 ถ้าผลลัพธ์ไม่ใช่ตัวเลข (เช่น principal = 0)
    return isFinite(M) ? M : 0;
};


const LoanCalculator: React.FC<LoanCalculatorProps> = ({ propertyPrice }) => {
    
    // ⭐️ Initial State (ตั้งค่าเริ่มต้นตามภาพ)
    const initialLoanAmount = propertyPrice * 0.90; // ยอดสินเชื่อเริ่มต้น 90% LTV
    
    const [loanAmount, setLoanAmount] = useState(initialLoanAmount);
    const [interestRate, setInterestRate] = useState(3.0); // 3%
    const [loanTerm, setLoanTerm] = useState(30);         // 30 ปี


    // ⭐️ การคำนวณหลัก (ใช้ useMemo เพื่อป้องกันการคำนวณซ้ำซ้อน)
    const calculation = useMemo(() => {
        const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
        const totalPayments = loanTerm * 12;
        
        // คำนวณเงินดาวน์และเปอร์เซ็นต์
        const downPayment = propertyPrice - loanAmount;
        const downPaymentPercentage = (downPayment / propertyPrice) * 100;
        
        // ส่วนประกอบยอดผ่อน (เงินต้น vs ดอกเบี้ย)
        // นี่คือการประมาณการแบบง่ายสำหรับแถบ bar
        const monthlyInterest = (loanAmount * (interestRate / 100)) / 12;
        const monthlyPrincipal = monthlyPayment - monthlyInterest;

        return {
            monthlyPayment: monthlyPayment,
            downPayment: downPayment,
            downPaymentPercentage: downPaymentPercentage,
            principalPercent: (monthlyPrincipal / monthlyPayment) * 100,
            interestPercent: (monthlyInterest / monthlyPayment) * 100,
            principalValue: monthlyPrincipal,
            interestValue: monthlyInterest,
        };
    }, [loanAmount, interestRate, loanTerm, propertyPrice]);


    // --- Handlers สำหรับ Input ---
    const handleLoanAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value.replace(/,/g, '')) || 0;
        // จำกัดยอดสินเชื่อไม่ให้เกินราคาสินทรัพย์
        setLoanAmount(Math.min(value, propertyPrice));
    };

    const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInterestRate(parseFloat(e.target.value) || 0);
    };

    const handleTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLoanTerm(parseInt(e.target.value) || 0);
    };


    // --- ส่วนแสดงผล (JSX) ---
    const { 
        monthlyPayment, 
        downPayment, 
        downPaymentPercentage,
        principalPercent,
        interestPercent,
        principalValue,
        interestValue
    } = calculation;

    return (
        <div className="p-6 bg-white border rounded-lg shadow-sm font-sans max-w-4xl mx-auto">
            <h2 className="text-xl font-bold mb-6 text-gray-800">ยอดสินเชื่อโดยประมาณ</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 1. รายละเอียดสินเชื่อ (ซ้าย) */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">รายละเอียดสินเชื่อ</h3>
                    
                    {/* ยอดผ่อนต่อเดือน */}
                    <div className="mb-4">
                        <p className="text-sm text-gray-500">ยอดสินเชื่อที่ต้องชำระต่อเดือนโดยประมาณ</p>
                        <p className="text-3xl font-bold text-gray-900">
                            ฿ {monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })} / เดือน
                        </p>
                        <div className="flex items-center mt-2 h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                                style={{ width: `${principalPercent}%` }} 
                                className="h-full bg-blue-600"
                            />
                            <div 
                                style={{ width: `${interestPercent}%` }} 
                                className="h-full bg-green-600"
                            />
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                             <span className="text-blue-600">฿ {principalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} เงินต้น</span>
                             <span className="text-green-600">฿ {interestValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} ดอกเบี้ย</span>
                        </div>
                    </div>
                    
                    {/* ค่าใช้จ่ายที่ต้องมีเบื้องต้น */}
                    <div className="mb-4 border-t pt-4">
                        <p className="text-sm text-gray-500">ค่าใช้จ่ายที่อาจต้องมีเบื้องต้น</p>
                        <p className="text-2xl font-bold text-gray-800">
                            ฿ {downPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })} 
                        </p>
                        <div className="flex items-center mt-2 h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                                style={{ width: `${downPaymentPercentage}%` }} 
                                className="h-full bg-blue-600"
                            />
                            <div 
                                style={{ width: `${100 - downPaymentPercentage}%` }} 
                                className="h-full bg-green-600"
                            />
                        </div>
                         <div className="flex justify-between text-xs mt-1">
                             <span className="text-blue-600">{downPaymentPercentage.toFixed(0)}% เงินดาวน์</span>
                             <span className="text-green-600">{(100 - downPaymentPercentage).toFixed(0)}% ของสินเชื่อ</span>
                        </div>
                    </div>

                    <button 
                        type="button" 
                        onClick={() => setLoanAmount(initialLoanAmount)}
                        className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition mt-4"
                    >
                        คำนวณอีกครั้ง
                    </button>
                </div>

                {/* 2. ข้อมูล Input (ขวา) */}
                <div className="space-y-4">
                    
                    {/* ราคาสินทรัพย์ */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">ราคาสินทรัพย์</label>
                        <div className="relative mt-1">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">฿</span>
                            <input 
                                type="text" 
                                value={propertyPrice.toLocaleString()}
                                disabled
                                className="w-full p-3 pl-7 border border-gray-300 rounded-lg bg-gray-50"
                            />
                        </div>
                    </div>

                    {/* ยอดสินเชื่อ */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">ยอดสินเชื่อ</label>
                        <div className="relative mt-1">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">฿</span>
                            <input 
                                type="text" 
                                value={loanAmount.toLocaleString()}
                                onChange={handleLoanAmountChange}
                                className="w-full p-3 pl-7 border border-gray-300 rounded-lg"
                            />
                        </div>
                    </div>
                    
                    {/* อัตราดอกเบี้ย และ ระยะเวลา */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">อัตรารดอกเบี้ย</label>
                            <div className="relative mt-1">
                                <input 
                                    type="number" 
                                    step="0.1"
                                    value={interestRate}
                                    onChange={handleRateChange}
                                    className="w-full p-3 pr-7 border border-gray-300 rounded-lg"
                                />
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">%</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">ระยะเวลาการกู้</label>
                            <div className="relative mt-1">
                                <input 
                                    type="number" 
                                    value={loanTerm}
                                    onChange={handleTermChange}
                                    className="w-full p-3 pr-7 border border-gray-300 rounded-lg"
                                />
                                 <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">ปี</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoanCalculator;