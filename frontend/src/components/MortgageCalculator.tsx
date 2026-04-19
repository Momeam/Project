'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calculator, Banknote, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';

interface MortgageCalculatorProps {
    price: number;
}

// 🏦 อัตราดอกเบี้ยอิงจากธนาคารไทยจริง (2024-2025)
// แบงค์ A = อิงจากธนาคารพาณิชย์ขนาดใหญ่ (อัตราเฉลี่ยประมาณ SCB/KBANK)
// แบงค์ B = อิงจากธนาคารรัฐ/สินเชื่อพิเศษ (อัตราเฉลี่ยประมาณ GHB/GSB)
const BANK_PLANS = [
    {
        id: 'A',
        name: 'แผน A — อัตราตลาด',
        desc: 'อิงจากอัตราดอกเบี้ยธนาคารพาณิชย์ทั่วไป',
        color: 'blue',
        bgCard: 'bg-blue-50 dark:bg-blue-950/40',
        borderCard: 'border-blue-200 dark:border-blue-800',
        textColor: 'text-blue-600 dark:text-blue-400',
        badgeBg: 'bg-blue-100 dark:bg-blue-900',
        // ปีที่ 1-3: ดอกเบี้ยคงที่ 3 ปี, หลังจากนั้น MRR-based
        fixedYears: 3,
        fixedRate: 3.99,    // % ต่อปี (ช่วงคงที่ 3 ปีแรก)
        floatingRate: 6.80, // % ต่อปี (หลังพ้นช่วงคงที่ → MRR - 0.50 โดย MRR ~7.30)
        maxLTV: 0.90,       // ปล่อยสูงสุด 90% ของราคาประเมิน
    },
    {
        id: 'B',
        name: 'แผน B — อัตราพิเศษ',
        desc: 'อิงจากอัตราดอกเบี้ยสินเชื่อบ้านพิเศษ',
        color: 'pink',
        bgCard: 'bg-pink-50 dark:bg-pink-950/40',
        borderCard: 'border-pink-200 dark:border-pink-800',
        textColor: 'text-pink-600 dark:text-pink-400',
        badgeBg: 'bg-pink-100 dark:bg-pink-900',
        fixedYears: 3,
        fixedRate: 2.99,    // % ต่อปี (ช่วงคงที่ 3 ปีแรก)
        floatingRate: 5.95, // % ต่อปี (หลังพ้นช่วงคงที่ → MRR - 1.25 โดย MRR ~7.20)
        maxLTV: 0.95,       // ปล่อยสูงสุด 95%
    },
];

/**
 * คำนวณยอดผ่อนรายเดือนแบบ Step Interest Rate
 * (ดอกเบี้ยคงที่ X ปีแรก แล้วเปลี่ยนเป็น Floating Rate)
 */
function calcMortgage(principal: number, fixedRate: number, floatingRate: number, fixedYears: number, totalYears: number) {
    const fixedMonths = fixedYears * 12;
    const totalMonths = totalYears * 12;
    const floatingMonths = totalMonths - fixedMonths;

    // คำนวณ weighted average rate สำหรับ monthly preview
    const rFixed = fixedRate / 100 / 12;
    const rFloat = floatingRate / 100 / 12;

    // ยอดผ่อนช่วงดอกเบี้ยคงที่ (ปี 1-3)
    const xFixed = Math.pow(1 + rFixed, totalMonths);
    const monthlyFixed = (principal * xFixed * rFixed) / (xFixed - 1);

    // ยอดผ่อนช่วงดอกเบี้ยลอยตัว (ปี 4 เป็นต้นไป)
    // คำนวณ remaining principal หลังจ่ายดอกเบี้ยคงที่ไปแล้ว fixedYears
    let balance = principal;
    for (let i = 0; i < fixedMonths; i++) {
        const interest = balance * rFixed;
        balance = balance - (monthlyFixed - interest);
    }
    const remainingBalance = Math.max(balance, 0);

    let monthlyFloat = 0;
    if (floatingMonths > 0 && remainingBalance > 0) {
        const xFloat = Math.pow(1 + rFloat, floatingMonths);
        monthlyFloat = (remainingBalance * xFloat * rFloat) / (xFloat - 1);
    }

    // ดอกเบี้ยรวมทั้งหมด
    const totalFixedPaid = monthlyFixed * fixedMonths;
    const totalFloatPaid = monthlyFloat * floatingMonths;
    const totalPaid = totalFixedPaid + totalFloatPaid;
    const totalInterest = totalPaid - principal;

    return {
        monthlyFixed: isFinite(monthlyFixed) ? monthlyFixed : 0,
        monthlyFloat: isFinite(monthlyFloat) ? monthlyFloat : 0,
        totalInterest: isFinite(totalInterest) ? totalInterest : 0,
        totalPaid: isFinite(totalPaid) ? totalPaid : 0,
    };
}

export default function MortgageCalculator({ price }: MortgageCalculatorProps) {
    const [downPercent, setDownPercent] = useState(10);
    const [loanTerm, setLoanTerm] = useState(30);
    const [showDetail, setShowDetail] = useState<string | null>(null);

    const loanAmount = price * (1 - downPercent / 100);
    const downPayment = price * (downPercent / 100);

    const results = useMemo(() => {
        return BANK_PLANS.map(plan => {
            const effectiveLTV = 1 - downPercent / 100;
            const canApply = effectiveLTV <= plan.maxLTV;
            const calc = calcMortgage(loanAmount, plan.fixedRate, plan.floatingRate, plan.fixedYears, loanTerm);
            return { ...plan, ...calc, canApply };
        });
    }, [loanAmount, downPercent, loanTerm]);

    // หาแผนที่ถูกกว่า
    const cheapest = results.reduce((a, b) => a.totalPaid < b.totalPaid ? a : b);

    return (
        <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="p-0 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                        <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">คำนวณสินเชื่อบ้าน</h3>
                        <p className="text-xs text-slate-400">เปรียบเทียบ 2 แผนอัตราดอกเบี้ย</p>
                    </div>
                </div>

                {/* Input Controls */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">เงินดาวน์ (%)</label>
                        <Input
                            type="number"
                            value={downPercent}
                            min={5} max={50}
                            onChange={(e) => setDownPercent(Math.max(5, Math.min(50, Number(e.target.value))))}
                            className="bg-white dark:bg-slate-800 rounded-xl h-11 font-bold"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">= ฿{downPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">ระยะเวลา (ปี)</label>
                        <Input
                            type="number"
                            value={loanTerm}
                            min={5} max={40}
                            onChange={(e) => setLoanTerm(Math.max(5, Math.min(40, Number(e.target.value))))}
                            className="bg-white dark:bg-slate-800 rounded-xl h-11 font-bold"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">= {loanTerm * 12} งวด</p>
                    </div>
                </div>

                <p className="text-xs text-slate-500 text-center font-medium">
                    วงเงินกู้: <span className="text-slate-900 dark:text-white font-bold">฿{loanAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </p>

                {/* Bank Plan Cards */}
                <div className="space-y-3">
                    {results.map((plan) => {
                        const isOpen = showDetail === plan.id;
                        const isCheapest = plan.id === cheapest.id;
                        return (
                            <div
                                key={plan.id}
                                className={`rounded-2xl border-2 ${plan.borderCard} ${plan.bgCard} p-4 transition-all duration-300`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-3 h-3 rounded-full bg-${plan.color}-500`}></span>
                                            <span className="font-bold text-sm text-slate-900 dark:text-white">{plan.name}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-0.5 ml-5">{plan.desc}</p>
                                    </div>
                                    {isCheapest && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${plan.badgeBg} ${plan.textColor}`}>
                                            ✨ ประหยัดกว่า
                                        </span>
                                    )}
                                </div>

                                {/* Rate Info */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="bg-white/70 dark:bg-slate-800/70 rounded-xl p-2.5 text-center">
                                        <p className="text-[10px] text-slate-400 font-medium">ปีที่ 1-{plan.fixedYears} (คงที่)</p>
                                        <p className={`text-lg font-black ${plan.textColor}`}>{plan.fixedRate}%</p>
                                    </div>
                                    <div className="bg-white/70 dark:bg-slate-800/70 rounded-xl p-2.5 text-center">
                                        <p className="text-[10px] text-slate-400 font-medium">ปีที่ {plan.fixedYears + 1}+ (ลอยตัว)</p>
                                        <p className={`text-lg font-black ${plan.textColor}`}>{plan.floatingRate}%</p>
                                    </div>
                                </div>

                                {/* Monthly Payment */}
                                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 flex justify-between items-center border border-slate-100 dark:border-slate-700">
                                    <div>
                                        <p className="text-[10px] text-slate-400">ผ่อนเริ่มต้น (ปี 1-{plan.fixedYears})</p>
                                        <p className={`text-xl font-black ${plan.textColor} flex items-center gap-1`}>
                                            <Banknote className="w-5 h-5" />
                                            ฿{plan.monthlyFixed.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            <span className="text-xs text-slate-400 font-normal">/เดือน</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowDetail(isOpen ? null : plan.id)}
                                        className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${plan.textColor}`}
                                    >
                                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Expandable Detail */}
                                {isOpen && (
                                    <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                                            <span>ผ่อนหลังปีที่ {plan.fixedYears} (ลอยตัว)</span>
                                            <span className="font-bold">฿{plan.monthlyFloat.toLocaleString(undefined, { maximumFractionDigits: 0 })}/เดือน</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                                            <span>ดอกเบี้ยรวมตลอดสัญญา</span>
                                            <span className="font-bold text-red-500">฿{plan.totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                                            <span>จ่ายรวมทั้งหมด</span>
                                            <span className="font-bold">฿{plan.totalPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                                            <span>วงเงินกู้สูงสุด (LTV)</span>
                                            <span className="font-bold">{(plan.maxLTV * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Savings Compare */}
                {results.length === 2 && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-center">
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-1">
                            <TrendingDown className="w-3.5 h-3.5" />
                            แผน {cheapest.id} ประหยัดกว่า ฿{Math.abs(results[0].totalPaid - results[1].totalPaid).toLocaleString(undefined, { maximumFractionDigits: 0 })} ตลอดสัญญา
                        </p>
                    </div>
                )}

                <p className="text-[10px] text-slate-400 text-center">
                    *อัตราดอกเบี้ยอ้างอิงจากอัตราเฉลี่ยของธนาคารพาณิชย์ไทย (MRR ~7.0-7.5%) &middot; ผลการคำนวณเป็นการประมาณการเท่านั้น
                </p>
            </CardContent>
        </Card>
    );
}