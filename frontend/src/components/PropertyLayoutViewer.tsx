'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Maximize2, DoorOpen, Map as MapIcon, Home, LayoutGrid } from 'lucide-react';
import { Property } from '@/lib/types';

// ========================
// 1. CONDO ROOM VIEWER
// ========================

const ROOM_GRID = 12;
const COMP_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    BED:     { label: 'ห้องนอน',      color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-200' },
    BATH:    { label: 'ห้องน้ำ',      color: 'text-blue-600',    bgColor: 'bg-blue-50 border-blue-200' },
    KITCHEN: { label: 'ห้องครัว',     color: 'text-orange-600',  bgColor: 'bg-orange-50 border-orange-200' },
    LIVING:  { label: 'ห้องนั่งเล่น', color: 'text-purple-600',  bgColor: 'bg-purple-50 border-purple-200' },
    TV:      { label: 'มุม TV',       color: 'text-slate-600',   bgColor: 'bg-slate-50 border-slate-200' },
    CLOSET:  { label: 'ตู้เสื้อผ้า',  color: 'text-yellow-600',  bgColor: 'bg-yellow-50 border-yellow-200' },
    BALCONY: { label: 'ระเบียง',      color: 'text-cyan-600',   bgColor: 'bg-cyan-50 border-cyan-200' },
    DINING:  { label: 'โต๊ะกินข้าว',  color: 'text-amber-600',   bgColor: 'bg-amber-50 border-amber-200' },
    LAUNDRY: { label: 'ซักรีด',       color: 'text-indigo-600',  bgColor: 'bg-indigo-50 border-indigo-200' },
};

function CondoRoomViewer({ layout }: { layout: any }) {
    const { doorSide = 'BOTTOM', windowSide = 'TOP', components = [] } = layout;

    const getDoorPosition = () => {
        switch (doorSide) {
            case 'TOP':    return 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2';
            case 'BOTTOM': return 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2';
            case 'LEFT':   return 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2';
            case 'RIGHT':  return 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2';
            default: return 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2';
        }
    };

    const getWindowPosition = () => {
        switch (windowSide) {
            case 'TOP':    return 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2';
            case 'BOTTOM': return 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2';
            case 'LEFT':   return 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2';
            case 'RIGHT':  return 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2';
            default: return 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2';
        }
    };

    const getWallStyle = () => {
        const thick = '8px solid #1e293b';
        const thin = '3px solid #334155';
        return {
            borderTop: windowSide === 'TOP' ? thick : thin,
            borderBottom: doorSide === 'BOTTOM' ? thick : thin,
            borderLeft: (doorSide === 'LEFT' || windowSide === 'LEFT') ? thick : thin,
            borderRight: (doorSide === 'RIGHT' || windowSide === 'RIGHT') ? thick : thin,
        };
    };

    return (
        <div className="flex justify-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
            <div className="relative w-full max-w-[400px] aspect-square mx-auto">
                {/* Door indicator */}
                <div className={`absolute z-40 ${getDoorPosition()}`}>
                    <div className="bg-blue-500 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
                        <DoorOpen className="w-3 h-3" /> ประตู
                    </div>
                </div>

                {/* Window indicator */}
                <div className={`absolute z-40 ${getWindowPosition()}`}>
                    <div className="bg-cyan-500 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
                        <Maximize2 className="w-3 h-3" /> หน้าต่าง
                    </div>
                </div>

                <div className="relative bg-white rounded-2xl shadow-lg w-full h-full overflow-hidden" style={getWallStyle()}>
                    {/* Grid lines */}
                    <div className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
                            backgroundSize: `${100 / ROOM_GRID}% ${100 / ROOM_GRID}%`
                        }}
                    />

                    {components.map((comp: any) => {
                        const cfg = COMP_CONFIG[comp.type] || { label: comp.name, color: 'text-gray-600', bgColor: 'bg-gray-100 border-gray-300' };
                        return (
                            <div
                                key={comp.id}
                                className={`absolute flex flex-col items-center justify-center border-2 rounded-xl text-center pointer-events-none p-1
                                    ${cfg.bgColor}
                                `}
                                style={{
                                    left: `${(comp.x / ROOM_GRID) * 100}%`,
                                    top: `${(comp.y / ROOM_GRID) * 100}%`,
                                    width: `${(comp.w / ROOM_GRID) * 100}%`,
                                    height: `${(comp.h / ROOM_GRID) * 100}%`,
                                }}
                            >
                                <span className={`text-[10px] font-bold leading-tight ${cfg.color}`}>{cfg.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ========================
// 2. HOUSE PLAN VIEWER
// ========================

const HOUSE_GRID = 20;

const HOUSE_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
    BEDROOM:  { label: 'ห้องนอน',      emoji: '🛏️', color: 'bg-emerald-500/20' },
    BATHROOM: { label: 'ห้องน้ำ',      emoji: '🚿', color: 'bg-sky-500/20' },
    KITCHEN:  { label: 'ห้องครัว',     emoji: '🍳', color: 'bg-orange-500/20' },
    LIVING:   { label: 'ห้องนั่งเล่น', emoji: '🛋️', color: 'bg-purple-500/20' },
    DINING:   { label: 'ห้องทานข้าว',  emoji: '🍽️', color: 'bg-amber-500/20' },
    GARAGE:   { label: 'โรงจอดรถ',    emoji: '🚗', color: 'bg-slate-500/20' },
    GARDEN:   { label: 'สวน',         emoji: '🌳', color: 'bg-green-500/20' },
    BALCONY:  { label: 'ระเบียง',     emoji: '🌅', color: 'bg-cyan-500/20' },
    STAIRS:   { label: 'บันได',       emoji: '🪜', color: 'bg-yellow-500/20' },
    STORAGE:  { label: 'ห้องเก็บของ',  emoji: '📦', color: 'bg-stone-500/20' },
    LAUNDRY:  { label: 'ซักรีด',      emoji: '🧺', color: 'bg-indigo-500/20' },
    OFFICE:   { label: 'ห้องทำงาน',    emoji: '💼', color: 'bg-blue-500/20' },
    CLOSET:   { label: 'ห้องแต่งตัว',  emoji: '👔', color: 'bg-pink-500/20' },
};

function HousePlanViewer({ layout }: { layout: any }) {
    const [activeFloor, setActiveFloor] = useState(1);
    const { floors = [], boundary = { x: 3, y: 3, w: 14, h: 12 }, frontSide = 'BOTTOM' } = layout;
    
    if (floors.length === 0) return null;
    
    const currentFloor = floors.find((f: any) => f.floor === activeFloor) || floors[0];

    const getEdgeLabel = (edge: 'top' | 'bottom' | 'left' | 'right') => {
        if (frontSide === 'BOTTOM') {
            if (edge === 'bottom') return '🚗 หน้าบ้าน';
            if (edge === 'top') return '🌳 หลังบ้าน';
            if (edge === 'left') return '◀ ซ้าย';
            if (edge === 'right') return '▶ ขวา';
        } else if (frontSide === 'TOP') {
            if (edge === 'top') return '🚗 หน้าบ้าน';
            if (edge === 'bottom') return '🌳 หลังบ้าน';
            if (edge === 'left') return '◀ ซ้าย';
            if (edge === 'right') return '▶ ขวา';
        } else if (frontSide === 'LEFT') {
            if (edge === 'left') return '🚗 หน้าบ้าน';
            if (edge === 'right') return '🌳 หลังบ้าน';
            if (edge === 'top') return '▲ ซ้าย';
            if (edge === 'bottom') return '▼ ขวา';
        } else {
            if (edge === 'right') return '🚗 หน้าบ้าน';
            if (edge === 'left') return '🌳 หลังบ้าน';
            if (edge === 'top') return '▲ ซ้าย';
            if (edge === 'bottom') return '▼ ขวา';
        }
        return '';
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6">
            {/* Floor Tabs */}
            {floors.length > 1 && (
                <div className="flex justify-center gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                    {floors.map((f: any) => (
                        <button
                            key={f.floor}
                            onClick={() => setActiveFloor(f.floor)}
                            className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
                                activeFloor === f.floor 
                                ? 'bg-amber-500 text-white shadow-md' 
                                : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                            }`}
                        >
                            ชั้น {f.floor}
                        </button>
                    ))}
                </div>
            )}

            <div className="relative w-full max-w-[500px] aspect-square mx-auto mt-4 mb-4">
                {/* Labels */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400 whitespace-nowrap">{getEdgeLabel('top')}</div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400 whitespace-nowrap">{getEdgeLabel('bottom')}</div>
                <div className="absolute top-1/2 -left-2 -translate-y-1/2 -translate-x-full text-[10px] font-bold text-gray-400 whitespace-nowrap">{getEdgeLabel('left')}</div>
                <div className="absolute top-1/2 -right-2 -translate-y-1/2 translate-x-full text-[10px] font-bold text-gray-400 whitespace-nowrap">{getEdgeLabel('right')}</div>

                <div className="relative w-full h-full border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-slate-800 overflow-hidden"
                    style={{ backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.15) 1px, transparent 1px)', backgroundSize: `${100/HOUSE_GRID}% ${100/HOUSE_GRID}%` }}
                >
                    {/* Boundary Box */}
                    <div className="absolute border-[3px] border-slate-300 dark:border-slate-500 rounded-lg pointer-events-none"
                         style={{ left: `${(boundary.x / HOUSE_GRID) * 100}%`, top: `${(boundary.y / HOUSE_GRID) * 100}%`, width: `${(boundary.w / HOUSE_GRID) * 100}%`, height: `${(boundary.h / HOUSE_GRID) * 100}%` }}
                    />

                    {/* Rooms */}
                    {currentFloor.rooms?.map((room: any) => {
                        const isInsideBoundary = room.x >= boundary.x && room.y >= boundary.y && room.x + room.w <= boundary.x + boundary.w && room.y + room.h <= boundary.y + boundary.h;
                        const cfg = HOUSE_CONFIG[room.type] || { label: room.name, emoji: '📍', color: 'bg-gray-500/20' };
                        
                        return (
                            <div key={room.id}
                                className={`absolute flex flex-col items-center justify-center border border-slate-300/50 dark:border-slate-600/50 rounded-lg ${cfg.color} ${!isInsideBoundary ? 'opacity-80' : ''}`}
                                style={{ left: `${(room.x / HOUSE_GRID) * 100}%`, top: `${(room.y / HOUSE_GRID) * 100}%`, width: `${(room.w / HOUSE_GRID) * 100}%`, height: `${(room.h / HOUSE_GRID) * 100}%` }}
                            >
                                <span className="text-sm">{cfg.emoji}</span>
                                <span className="text-[8px] font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate w-full text-center px-0.5">{room.name}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ========================
// MAIN EXPORT COMPONENT
// ========================

export default function PropertyLayoutViewer({ property }: { property: Property }) {
    // 1. Parse JSON safely
    let parsedBlueprintImages: string[] = [];
    if (property.blueprint_images) {
        if (typeof property.blueprint_images === 'string') {
            try { parsedBlueprintImages = JSON.parse(property.blueprint_images); } catch { parsedBlueprintImages = []; }
        } else if (Array.isArray(property.blueprint_images)) {
            parsedBlueprintImages = property.blueprint_images;
        }
    }

    let parsedHouseLayout: any = null;
    if (property.house_layout) {
        if (typeof property.house_layout === 'string') {
            try { parsedHouseLayout = JSON.parse(property.house_layout); } catch { parsedHouseLayout = null; }
        } else {
            parsedHouseLayout = property.house_layout;
        }
    }

    const hasBlueprintImages = parsedBlueprintImages.length > 0;
    const hasLayoutJson = !!parsedHouseLayout && (parsedHouseLayout.components !== undefined || parsedHouseLayout.floors !== undefined);
    
    if (!hasBlueprintImages && !hasLayoutJson) {
        return null; // ไม่มีแปลน ไม่ต้องแสดง
    }

    const isCondoComponent = hasLayoutJson && parsedHouseLayout.components !== undefined;
    const isHouseFloor = hasLayoutJson && parsedHouseLayout.floors !== undefined;

    return (
        <Card className="dark:bg-gray-800 border-2 border-amber-500/20 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-amber-100 dark:border-amber-900">
                <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                    <MapIcon className="w-6 h-6 text-amber-500" />
                    แบบแปลน (Floor Plan)
                </CardTitle>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                    แปลนโครงสร้างของทรัพย์สิน
                </p>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-8">
                    {/* 1. แสดงรูปภาพ (Blueprint Images) */}
                    {hasBlueprintImages && (
                        <div className="space-y-3">
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <LayoutGrid className="w-4 h-4 text-blue-500" /> ภาพถ่ายแปลน
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {parsedBlueprintImages.map((url, i) => (
                                    <div key={i} className="relative w-full h-80 rounded-xl overflow-hidden border-2 border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                        <Image
                                            src={url}
                                            alt={`แปลน ${i + 1}`}
                                            fill
                                            className="object-contain bg-gray-50 dark:bg-gray-900"
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 2. แสดง JSON Layout ด้วย Viewer */}
                    {hasLayoutJson && (
                        <div className="space-y-3 mt-4">
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Home className="w-4 h-4 text-emerald-500" /> ผังแบบ Interactive
                            </h3>
                            {isCondoComponent ? (
                                <CondoRoomViewer layout={parsedHouseLayout} />
                            ) : isHouseFloor ? (
                                <HousePlanViewer layout={parsedHouseLayout} />
                            ) : null}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
