'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import {
    Save, Trash2, X, Plus, Minus, Wand2,
    Home, Bed, Bath, Utensils, Sofa, DoorOpen, Maximize2,
    Smartphone as Tv, Coffee, AlignLeft, Layout
} from 'lucide-react';

interface RoomComponent {
    id: string;
    type: 'BED' | 'BATH' | 'KITCHEN' | 'LIVING' | 'TV' | 'CLOSET' | 'BALCONY' | 'DINING' | 'LAUNDRY';
    x: number;
    y: number;
    w: number;
    h: number;
}

interface CondoRoomLayout {
    doorSide: string;
    windowSide: string;
    components: RoomComponent[];
}

interface CondoRoomEditorProps {
    initialLayout?: CondoRoomLayout | null;
    onSave: (layout: CondoRoomLayout) => void;
    onClose: () => void;
}

const ROOM_GRID = 12; // 12x12 grid for condo room

const COMP_CONFIG: Record<RoomComponent['type'], { label: string; labelEn: string; icon: any; color: string; bgColor: string; defaultW: number; defaultH: number }> = {
    BED:     { label: 'ห้องนอน',      labelEn: 'Bedroom',  icon: Bed,      color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-200',     defaultW: 4, defaultH: 4 },
    BATH:    { label: 'ห้องน้ำ',      labelEn: 'Bathroom', icon: Bath,     color: 'text-blue-600',    bgColor: 'bg-blue-50 border-blue-200',           defaultW: 2, defaultH: 3 },
    KITCHEN: { label: 'ห้องครัว',     labelEn: 'Kitchen',  icon: Utensils, color: 'text-orange-600',  bgColor: 'bg-orange-50 border-orange-200',       defaultW: 3, defaultH: 2 },
    LIVING:  { label: 'ห้องนั่งเล่น', labelEn: 'Living',   icon: Coffee,   color: 'text-purple-600',  bgColor: 'bg-purple-50 border-purple-200',       defaultW: 4, defaultH: 3 },
    TV:      { label: 'มุม TV',       labelEn: 'TV Area',  icon: Tv,       color: 'text-slate-600',   bgColor: 'bg-slate-50 border-slate-200',         defaultW: 2, defaultH: 2 },
    CLOSET:  { label: 'ตู้เสื้อผ้า',  labelEn: 'Closet',   icon: Home,     color: 'text-yellow-600',  bgColor: 'bg-yellow-50 border-yellow-200',       defaultW: 2, defaultH: 1 },
    BALCONY: { label: 'ระเบียง',      labelEn: 'Balcony',  icon: AlignLeft, color: 'text-cyan-600',   bgColor: 'bg-cyan-50 border-cyan-200',           defaultW: 5, defaultH: 1 },
    DINING:  { label: 'โต๊ะกินข้าว',  labelEn: 'Dining',   icon: Utensils, color: 'text-amber-600',   bgColor: 'bg-amber-50 border-amber-200',         defaultW: 2, defaultH: 2 },
    LAUNDRY: { label: 'ซักรีด',       labelEn: 'Laundry',  icon: Home,     color: 'text-indigo-600',  bgColor: 'bg-indigo-50 border-indigo-200',       defaultW: 1, defaultH: 2 },
};

export default function CondoRoomEditor({ initialLayout, onSave, onClose }: CondoRoomEditorProps) {
    const [components, setComponents] = useState<RoomComponent[]>(initialLayout?.components || []);
    const [doorSide, setDoorSide] = useState(initialLayout?.doorSide || 'BOTTOM');
    const [windowSide, setWindowSide] = useState(initialLayout?.windowSide || 'TOP');
    const [isSaving, setIsSaving] = useState(false);

    // Drag state
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialPos, setInitialPos] = useState({ x: 0, y: 0 });
    const gridRef = useRef<HTMLDivElement>(null);

    const updateComponent = (compId: string, updates: Partial<RoomComponent>) => {
        setComponents(prev => prev.map(c => {
            if (c.id !== compId) return c;
            const next = { ...c, ...updates };
            next.x = Math.max(0, Math.min(ROOM_GRID - next.w, next.x));
            next.y = Math.max(0, Math.min(ROOM_GRID - next.h, next.y));
            return next;
        }));
    };

    const addComponent = (type: RoomComponent['type']) => {
        const cfg = COMP_CONFIG[type];
        const newComp: RoomComponent = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            x: 1, y: 1,
            w: cfg.defaultW, h: cfg.defaultH,
        };
        setComponents(prev => [...prev, newComp]);
    };

    const removeComponent = (compId: string) => {
        setComponents(prev => prev.filter(c => c.id !== compId));
    };

    const handleMouseDown = (e: React.MouseEvent, comp: RoomComponent) => {
        e.stopPropagation();
        setDraggingId(comp.id);
        setDragStart({ x: e.clientX, y: e.clientY });
        setInitialPos({ x: comp.x, y: comp.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggingId || !gridRef.current) return;
        const rect = gridRef.current.getBoundingClientRect();
        const cellSize = rect.width / ROOM_GRID;
        const moveX = Math.round((e.clientX - dragStart.x) / cellSize);
        const moveY = Math.round((e.clientY - dragStart.y) / cellSize);
        updateComponent(draggingId, { x: initialPos.x + moveX, y: initialPos.y + moveY });
    };

    const handleMouseUp = () => setDraggingId(null);

    useEffect(() => {
        if (draggingId) {
            window.addEventListener('mouseup', handleMouseUp);
            return () => window.removeEventListener('mouseup', handleMouseUp);
        }
    }, [draggingId]);

    const handleSave = () => {
        setIsSaving(true);
        onSave({ doorSide, windowSide, components });
        setIsSaving(false);
    };

    const handleAutoLayout = () => {
        if (components.length > 0 && !window.confirm('จะล้างผังเดิมทั้งหมด ต้องการดำเนินการหรือไม่?')) return;

        const rid = () => Math.random().toString(36).substr(2, 9);
        let newComps: RoomComponent[] = [];

        if (doorSide === 'BOTTOM') {
            newComps = [
                { id: rid(), type: 'BALCONY', x: 0,  y: 0,  w: 12, h: 1 },
                { id: rid(), type: 'BED',     x: 0,  y: 1,  w: 5,  h: 5 },
                { id: rid(), type: 'CLOSET',  x: 5,  y: 1,  w: 2,  h: 1 },
                { id: rid(), type: 'LIVING',  x: 5,  y: 2,  w: 4,  h: 4 },
                { id: rid(), type: 'TV',      x: 9,  y: 2,  w: 3,  h: 2 },
                { id: rid(), type: 'BATH',    x: 9,  y: 4,  w: 3,  h: 3 },
                { id: rid(), type: 'KITCHEN', x: 0,  y: 6,  w: 4,  h: 3 },
                { id: rid(), type: 'DINING',  x: 4,  y: 6,  w: 3,  h: 3 },
                { id: rid(), type: 'LAUNDRY', x: 7,  y: 7,  w: 2,  h: 2 },
            ];
        } else if (doorSide === 'TOP') {
            newComps = [
                { id: rid(), type: 'BALCONY', x: 0,  y: 11, w: 12, h: 1 },
                { id: rid(), type: 'BED',     x: 0,  y: 6,  w: 5,  h: 5 },
                { id: rid(), type: 'CLOSET',  x: 5,  y: 10, w: 2,  h: 1 },
                { id: rid(), type: 'LIVING',  x: 5,  y: 6,  w: 4,  h: 4 },
                { id: rid(), type: 'TV',      x: 9,  y: 8,  w: 3,  h: 2 },
                { id: rid(), type: 'BATH',    x: 9,  y: 5,  w: 3,  h: 3 },
                { id: rid(), type: 'KITCHEN', x: 0,  y: 3,  w: 4,  h: 3 },
                { id: rid(), type: 'DINING',  x: 4,  y: 3,  w: 3,  h: 3 },
                { id: rid(), type: 'LAUNDRY', x: 7,  y: 3,  w: 2,  h: 2 },
            ];
        } else if (doorSide === 'LEFT') {
            newComps = [
                { id: rid(), type: 'BALCONY', x: 11, y: 0,  w: 1,  h: 12 },
                { id: rid(), type: 'BED',     x: 6,  y: 0,  w: 5,  h: 5 },
                { id: rid(), type: 'CLOSET',  x: 10, y: 5,  w: 1,  h: 2 },
                { id: rid(), type: 'LIVING',  x: 6,  y: 5,  w: 4,  h: 4 },
                { id: rid(), type: 'TV',      x: 8,  y: 9,  w: 2,  h: 3 },
                { id: rid(), type: 'BATH',    x: 5,  y: 9,  w: 3,  h: 3 },
                { id: rid(), type: 'KITCHEN', x: 3,  y: 0,  w: 3,  h: 4 },
                { id: rid(), type: 'DINING',  x: 3,  y: 4,  w: 3,  h: 3 },
                { id: rid(), type: 'LAUNDRY', x: 3,  y: 7,  w: 2,  h: 2 },
            ];
        } else {
            newComps = [
                { id: rid(), type: 'BALCONY', x: 0,  y: 0,  w: 1,  h: 12 },
                { id: rid(), type: 'BED',     x: 1,  y: 0,  w: 5,  h: 5 },
                { id: rid(), type: 'CLOSET',  x: 1,  y: 5,  w: 1,  h: 2 },
                { id: rid(), type: 'LIVING',  x: 2,  y: 5,  w: 4,  h: 4 },
                { id: rid(), type: 'TV',      x: 2,  y: 9,  w: 2,  h: 3 },
                { id: rid(), type: 'BATH',    x: 4,  y: 9,  w: 3,  h: 3 },
                { id: rid(), type: 'KITCHEN', x: 6,  y: 0,  w: 3,  h: 4 },
                { id: rid(), type: 'DINING',  x: 6,  y: 4,  w: 3,  h: 3 },
                { id: rid(), type: 'LAUNDRY', x: 7,  y: 7,  w: 2,  h: 2 },
            ];
        }

        setComponents(newComps);
        setWindowSide(doorSide === 'BOTTOM' ? 'TOP' : doorSide === 'TOP' ? 'BOTTOM' : doorSide === 'LEFT' ? 'RIGHT' : 'LEFT');
    };

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

    // Wall thickness based on side
    const getWallStyle = () => {
        const thick = '8px solid #1e293b'; // exterior wall
        const thin = '3px solid #334155';
        return {
            borderTop: windowSide === 'TOP' ? thick : thin,
            borderBottom: doorSide === 'BOTTOM' ? thick : thin,
            borderLeft: (doorSide === 'LEFT' || windowSide === 'LEFT') ? thick : thin,
            borderRight: (doorSide === 'RIGHT' || windowSide === 'RIGHT') ? thick : thin,
        };
    };

    return (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[100] flex flex-col animate-in fade-in duration-300 select-none">
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                        <Layout className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Condo Room Layout Editor</h2>
                        <p className="text-slate-400 text-[10px]">ออกแบบผังภายในห้องคอนโดของคุณ — ลากวางส่วนต่างๆ ได้อิสระ</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white rounded-xl text-sm h-9">
                        <X className="w-4 h-4 mr-1" /> ยกเลิก
                    </Button>
                    <Button type="button" onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold h-9 px-6 text-sm">
                        <Save className="w-4 h-4 mr-1" /> บันทึกผังห้อง
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar */}
                <div className="w-72 border-r border-white/10 p-4 space-y-4 bg-slate-900/30 overflow-y-auto">
                    {/* Door & Window Side */}
                    <div className="space-y-3">
                        <div>
                            <label className="text-[9px] uppercase font-bold text-blue-400 tracking-widest flex items-center gap-1 mb-1.5">
                                <DoorOpen className="w-3 h-3" /> ทิศทางประตู
                            </label>
                            <div className="grid grid-cols-4 gap-1 bg-slate-800 p-1 rounded-lg">
                                {(['TOP', 'BOTTOM', 'LEFT', 'RIGHT'] as const).map(side => (
                                    <button key={side} type="button" onClick={() => setDoorSide(side)}
                                        className={`text-[9px] py-1.5 rounded font-bold transition-all ${doorSide === side ? 'bg-blue-500 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                                    >
                                        {side === 'TOP' ? '▲' : side === 'BOTTOM' ? '▼' : side === 'LEFT' ? '◀' : '▶'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-[9px] uppercase font-bold text-cyan-400 tracking-widest flex items-center gap-1 mb-1.5">
                                <Maximize2 className="w-3 h-3" /> ทิศทางหน้าต่าง / วิว
                            </label>
                            <div className="grid grid-cols-4 gap-1 bg-slate-800 p-1 rounded-lg">
                                {(['TOP', 'BOTTOM', 'LEFT', 'RIGHT'] as const).map(side => (
                                    <button key={side} type="button" onClick={() => setWindowSide(side)}
                                        className={`text-[9px] py-1.5 rounded font-bold transition-all ${windowSide === side ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                                    >
                                        {side === 'TOP' ? '▲' : side === 'BOTTOM' ? '▼' : side === 'LEFT' ? '◀' : '▶'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Add Components */}
                    <div className="space-y-2 pt-3 border-t border-white/5">
                        <label className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">เพิ่มส่วนต่างๆ ในห้อง</label>
                        <div className="grid grid-cols-2 gap-1.5">
                            {(Object.entries(COMP_CONFIG) as [RoomComponent['type'], typeof COMP_CONFIG[RoomComponent['type']]][]).map(([type, cfg]) => {
                                const Icon = cfg.icon;
                                return (
                                    <button
                                        type="button" key={type}
                                        onClick={() => addComponent(type)}
                                        className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-[10px] text-slate-300 transition-all border border-white/5 hover:border-white/15"
                                    >
                                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                                        <span className="font-medium">{cfg.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Auto Layout */}
                    <Button type="button" onClick={handleAutoLayout} variant="ghost" className="w-full text-[10px] h-8 rounded-lg text-yellow-500 hover:bg-yellow-500/5 border border-yellow-500/20">
                        <Wand2 className="w-3 h-3 mr-1" /> จัดผังอัตโนมัติตามทิศประตู
                    </Button>

                    {/* Component List */}
                    <div className="pt-3 border-t border-white/5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">ส่วนต่างๆ ที่วางแล้ว</label>
                        <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                            {components.length > 0 ? components.map(comp => {
                                const cfg = COMP_CONFIG[comp.type];
                                const Icon = cfg.icon;
                                return (
                                    <div key={comp.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800">
                                        <div className="flex items-center gap-2">
                                            <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                                            <span className="text-[10px] text-slate-300 font-medium">{cfg.label}</span>
                                            <span className="text-[8px] text-slate-500">{comp.w}×{comp.h}</span>
                                        </div>
                                        <button type="button" onClick={() => removeComponent(comp.id)} className="text-slate-500 hover:text-rose-400 transition-colors">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                );
                            }) : (
                                <p className="text-[10px] text-slate-600 italic">ยังไม่ได้วางส่วนใดเลย</p>
                            )}
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5">
                        <p className="text-[9px] text-slate-500 leading-relaxed">
                            💡 <strong className="text-slate-400">Tips:</strong> ลากส่วนต่างๆ ไปวางตำแหน่งที่ต้องการ เอาเมาส์ไปชี้แล้วจะมีปุ่มปรับขนาดและลบ ใช้ &quot;จัดผังอัตโนมัติ&quot; เพื่อเริ่มด้วยเทมเพลตมาตรฐาน
                        </p>
                    </div>
                </div>

                {/* Main Grid Area */}
                <div className="flex-1 flex items-center justify-center p-8 bg-slate-950/50">
                    <div className="flex flex-col items-center gap-6">
                        <div className="text-center">
                            <span className="text-xs text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">
                                🏢 ผังห้องคอนโด — ลากวางได้เลย | เอาเมาส์ชี้เพื่อปรับขนาด
                            </span>
                        </div>

                        {/* Room Grid */}
                        <div className="relative">
                            {/* Door indicator */}
                            <div className={`absolute z-40 ${getDoorPosition()}`}>
                                <div className="bg-blue-500 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-lg shadow-blue-500/30 flex items-center gap-1 whitespace-nowrap">
                                    <DoorOpen className="w-3 h-3" /> ประตู
                                </div>
                            </div>

                            {/* Window indicator */}
                            <div className={`absolute z-40 ${getWindowPosition()}`}>
                                <div className="bg-cyan-500 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-lg shadow-cyan-500/30 flex items-center gap-1 whitespace-nowrap">
                                    <Maximize2 className="w-3 h-3" /> หน้าต่าง
                                </div>
                            </div>

                            <div
                                ref={gridRef}
                                onMouseMove={handleMouseMove}
                                className="relative bg-white rounded-2xl shadow-2xl overflow-hidden"
                                style={{
                                    width: 540, height: 540,
                                    ...getWallStyle(),
                                }}
                            >
                                {/* Grid lines */}
                                <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
                                    style={{
                                        backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
                                        backgroundSize: `${540 / ROOM_GRID}px ${540 / ROOM_GRID}px`
                                    }}
                                />

                                {/* Components */}
                                {components.map(comp => {
                                    const cfg = COMP_CONFIG[comp.type];
                                    const Icon = cfg.icon;
                                    const isDragging = draggingId === comp.id;
                                    return (
                                        <div
                                            key={comp.id}
                                            onMouseDown={e => handleMouseDown(e, comp)}
                                            className={`absolute flex flex-col items-center justify-center border-2 rounded-xl group transition-all cursor-move
                                                ${cfg.bgColor}
                                                ${isDragging ? 'z-50 scale-105 shadow-2xl ring-4 ring-blue-400/30' : 'shadow-sm hover:shadow-lg z-10'}
                                            `}
                                            style={{
                                                left: `${(comp.x / ROOM_GRID) * 100}%`,
                                                top: `${(comp.y / ROOM_GRID) * 100}%`,
                                                width: `${(comp.w / ROOM_GRID) * 100}%`,
                                                height: `${(comp.h / ROOM_GRID) * 100}%`,
                                            }}
                                        >
                                            <div className="flex flex-col items-center gap-0.5 p-1 pointer-events-none">
                                                <Icon className={`w-5 h-5 ${cfg.color}`} />
                                                <span className={`text-[9px] font-bold ${cfg.color}`}>{cfg.label}</span>
                                                {comp.w >= 2 && comp.h >= 2 && (
                                                    <span className="text-[7px] text-slate-400">{comp.w}×{comp.h}</span>
                                                )}
                                            </div>

                                            {/* Resize / Delete Overlay */}
                                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                                                <div className="bg-white/95 backdrop-blur-sm p-2.5 rounded-xl shadow-2xl flex flex-col gap-2 scale-90 origin-center transition-transform group-hover:scale-100">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="text-[8px] font-bold text-slate-400">W</span>
                                                        <div className="flex items-center gap-2">
                                                            <button type="button" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); updateComponent(comp.id, { w: Math.max(1, comp.w - 1) }); }}
                                                                className="w-5 h-5 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-600"><Minus className="w-2.5 h-2.5" /></button>
                                                            <span className="text-[10px] font-bold w-3 text-center">{comp.w}</span>
                                                            <button type="button" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); updateComponent(comp.id, { w: Math.min(ROOM_GRID - comp.x, comp.w + 1) }); }}
                                                                className="w-5 h-5 flex items-center justify-center bg-emerald-100 hover:bg-emerald-200 rounded text-emerald-600"><Plus className="w-2.5 h-2.5" /></button>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="text-[8px] font-bold text-slate-400">H</span>
                                                        <div className="flex items-center gap-2">
                                                            <button type="button" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); updateComponent(comp.id, { h: Math.max(1, comp.h - 1) }); }}
                                                                className="w-5 h-5 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-600"><Minus className="w-2.5 h-2.5" /></button>
                                                            <span className="text-[10px] font-bold w-3 text-center">{comp.h}</span>
                                                            <button type="button" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); updateComponent(comp.id, { h: Math.min(ROOM_GRID - comp.y, comp.h + 1) }); }}
                                                                className="w-5 h-5 flex items-center justify-center bg-emerald-100 hover:bg-emerald-200 rounded text-emerald-600"><Plus className="w-2.5 h-2.5" /></button>
                                                        </div>
                                                    </div>
                                                    <button type="button" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); removeComponent(comp.id); }}
                                                        className="w-full py-1 bg-rose-100 hover:bg-rose-200 rounded-lg text-rose-600 text-[9px] font-bold flex items-center justify-center gap-1">
                                                        <Trash2 className="w-2.5 h-2.5" /> ลบ
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Empty state */}
                                {components.length === 0 && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                                        <Layout className="w-12 h-12 mb-3 opacity-30" />
                                        <p className="text-sm font-bold text-slate-400">ยังไม่มีส่วนต่างๆ ในห้อง</p>
                                        <p className="text-[10px] mt-1 text-slate-400">เพิ่มส่วนต่างๆ จากแถบซ้าย หรือใช้ &quot;จัดผังอัตโนมัติ&quot;</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bottom bar */}
                        <div className="bg-slate-900/80 backdrop-blur-md px-8 py-3 rounded-2xl border border-white/10 flex gap-8 items-center">
                            <p className="text-white font-bold text-sm flex items-center gap-2">
                                <Maximize2 className="w-4 h-4 text-emerald-400" /> Drag & Drop
                            </p>
                            <div className="h-5 w-px bg-white/10" />
                            <div className="flex gap-4">
                                {(['BED', 'BATH', 'KITCHEN', 'LIVING', 'BALCONY'] as const).map(type => {
                                    const cfg = COMP_CONFIG[type];
                                    const Icon = cfg.icon;
                                    return (
                                        <div key={type} className={`flex items-center gap-1.5 text-[10px] font-bold ${cfg.color.replace('600', '400')}`}>
                                            <Icon className="w-3.5 h-3.5" /> {cfg.labelEn}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
