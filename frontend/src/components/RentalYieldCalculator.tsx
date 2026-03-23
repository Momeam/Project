'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TrendingUp, DollarSign, Info } from 'lucide-react';

interface RentalYieldCalculatorProps {
    price: number;
}

export default function RentalYieldCalculator({ price }: RentalYieldCalculatorProps) {
    // ตั้งค่าเริ่มต้น: สมมติค่าเช่าประมาณ 0.4% ของราคาขาย (มาตรฐานเบื้องต้น)
    const [monthlyRent, setMonthlyRent] = useState(Math.floor(price * 0.004));
    const [yieldRate, setYieldRate] = useState(0);

    useEffect(() => {
        if (price > 0 && monthlyRent > 0) {
            // สูตร Gross Rental Yield = (ค่าเช่าต่อปี / ราคาขาย) * 100
            const annualRent = monthlyRent * 12;
            const calculatedYield = (annualRent / price) * 100;
            setYieldRate(calculatedYield);
        } else {
            setYieldRate(0);
        }
    }, [price, monthlyRent]);

    // ประเมินระดับความคุ้มค่า
    const getYieldColor = (rate: number) => {
        if (rate >= 6) return 'text-green-600';
        if (rate >= 4) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getYieldLabel = (rate: number) => {
        if (rate >= 6) return 'น่าลงทุนมาก (High Return)';
        if (rate >= 4) return 'น่าลงทุน (Standard)';
        return 'ผลตอบแทนน้อย (Low Return)';
    };

    return (
        <Card className="bg-emerald-50/50 border border-emerald-100 shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg text-emerald-900">
                    <TrendingUp className="w-5 h-5 mr-2 text-emerald-600" />
                    วิเคราะห์ผลตอบแทน (Rental Yield)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <label className="text-sm text-emerald-800 mb-1 block font-medium flex items-center gap-1">
                        คาดว่าจะปล่อยเช่าได้ (บาท/เดือน) 
                        <span className="text-xs text-emerald-600 font-normal">(แก้ไขได้)</span>
                    </label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 w-4 h-4" />
                        <Input 
                            type="number" 
                            value={monthlyRent} 
                            onChange={(e) => setMonthlyRent(Number(e.target.value))} 
                            className="pl-9 bg-white border-emerald-200 focus:ring-emerald-500 text-emerald-900 font-semibold"
                        />
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-emerald-200 flex justify-between items-center">
                    <div>
                        <span className="text-sm text-gray-500 block">Gross Rental Yield</span>
                        <span className={`text-xs font-medium ${getYieldColor(yieldRate)}`}>
                            {getYieldLabel(yieldRate)}
                        </span>
                    </div>
                    <div className="text-right">
                        <span className={`text-3xl font-bold ${getYieldColor(yieldRate)}`}>
                            {yieldRate.toFixed(2)}%
                        </span>
                        <span className="text-xs text-gray-400 block">ต่อปี</span>
                    </div>
                </div>
                
                <div className="flex gap-2 text-xs text-gray-500 bg-white/50 p-2 rounded border border-emerald-100">
                    <Info className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                    <p>Yield ทั่วไปในกทม. อยู่ที่ 4-6% หากเกิน 6% ถือว่าทำเลดีมาก</p>
                </div>
            </CardContent>
        </Card>
    );
}