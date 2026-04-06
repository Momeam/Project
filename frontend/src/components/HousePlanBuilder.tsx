'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { 
    Plus, Save, Trash2, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
    Home, Wand2, Square, Minus
} from 'lucide-react';

interface HouseRoom {
    id: string;
    type: 'BEDROOM' | 'BATHROOM' | 'KITCHEN' | 'LIVING' | 'GARAGE' | 'GARDEN' | 'BALCONY' | 'STAIRS' | 'STORAGE' | 'LAUNDRY' | 'DINING' | 'OFFICE' | 'CLOSET';
    name: string;
    x: number;
    y: number;
    w: number;
    h: number;
    floor: number;
}

interface HouseFloorData {
    floor: number;
    rooms: HouseRoom[];
}

interface HouseBoundary {
    x: number;
    y: number;
    w: number;
    h: number;
}

interface HousePlanBuilderProps {
    initialLayout?: { floors: HouseFloorData[]; boundary?: HouseBoundary; frontSide?: string } | null;
    houseFloors: number;
    onSave: (layout: { floors: HouseFloorData[]; boundary: HouseBoundary; frontSide: string }) => void;
    onClose: () => void;
}

const GRID_SIZE = 20;

const ROOM_CONFIG: Record<HouseRoom['type'], { label: string; emoji: string; color: string; darkColor: string; defaultW: number; defaultH: number; outdoor?: boolean }> = {
    BEDROOM:  { label: 'ห้องนอน',      emoji: '🛏️', color: 'bg-emerald-100 border-emerald-400 text-emerald-700', darkColor: 'bg-emerald-500/25 border-emerald-500/60 text-emerald-300', defaultW: 4, defaultH: 4 },
    BATHROOM: { label: 'ห้องน้ำ',      emoji: '🚿', color: 'bg-sky-100 border-sky-400 text-sky-700',             darkColor: 'bg-sky-500/25 border-sky-500/60 text-sky-300',           defaultW: 2, defaultH: 3 },
    KITCHEN:  { label: 'ห้องครัว',     emoji: '🍳', color: 'bg-orange-100 border-orange-400 text-orange-700',     darkColor: 'bg-orange-500/25 border-orange-500/60 text-orange-300',   defaultW: 3, defaultH: 3 },
    LIVING:   { label: 'ห้องนั่งเล่น', emoji: '🛋️', color: 'bg-purple-100 border-purple-400 text-purple-700',    darkColor: 'bg-purple-500/25 border-purple-500/60 text-purple-300',   defaultW: 5, defaultH: 4 },
    DINING:   { label: 'ห้องทานข้าว',  emoji: '🍽️', color: 'bg-amber-100 border-amber-400 text-amber-700',       darkColor: 'bg-amber-500/25 border-amber-500/60 text-amber-300',     defaultW: 3, defaultH: 3 },
    GARAGE:   { label: 'โรงจอดรถ',    emoji: '🚗', color: 'bg-slate-100 border-slate-400 text-slate-700',         darkColor: 'bg-slate-500/25 border-slate-500/60 text-slate-300',     defaultW: 4, defaultH: 3, outdoor: true },
    GARDEN:   { label: 'สวน',         emoji: '🌳', color: 'bg-green-100 border-green-400 text-green-700',         darkColor: 'bg-green-500/25 border-green-500/60 text-green-300',     defaultW: 5, defaultH: 3, outdoor: true },
    BALCONY:  { label: 'ระเบียง',     emoji: '🌅', color: 'bg-cyan-100 border-cyan-400 text-cyan-700',            darkColor: 'bg-cyan-500/25 border-cyan-500/60 text-cyan-300',       defaultW: 4, defaultH: 2 },
    STAIRS:   { label: 'บันได',       emoji: '🪜', color: 'bg-yellow-100 border-yellow-400 text-yellow-700',      darkColor: 'bg-yellow-500/25 border-yellow-500/60 text-yellow-300', defaultW: 2, defaultH: 2 },
    STORAGE:  { label: 'ห้องเก็บของ',  emoji: '📦', color: 'bg-stone-100 border-stone-400 text-stone-700',        darkColor: 'bg-stone-500/25 border-stone-500/60 text-stone-300',   defaultW: 2, defaultH: 2 },
    LAUNDRY:  { label: 'ซักรีด',      emoji: '🧺', color: 'bg-indigo-100 border-indigo-400 text-indigo-700',      darkColor: 'bg-indigo-500/25 border-indigo-500/60 text-indigo-300', defaultW: 2, defaultH: 2 },
    OFFICE:   { label: 'ห้องทำงาน',    emoji: '💼', color: 'bg-blue-100 border-blue-400 text-blue-700',            darkColor: 'bg-blue-500/25 border-blue-500/60 text-blue-300',       defaultW: 3, defaultH: 3 },
    CLOSET:   { label: 'ห้องแต่งตัว',  emoji: '👔', color: 'bg-pink-100 border-pink-400 text-pink-700',            darkColor: 'bg-pink-500/25 border-pink-500/60 text-pink-300',       defaultW: 2, defaultH: 2 },
};

const FRONT_SIDE_LABELS: Record<string, { front: string; back: string; left: string; right: string }> = {
    BOTTOM: { front: '🚗 หน้าบ้าน (ถนน)', back: '🌳 หลังบ้าน', left: 'ด้านซ้าย', right: 'ด้านขวา' },
    TOP:    { front: '🚗 หน้าบ้าน (ถนน)', back: '🌳 หลังบ้าน', left: 'ด้านซ้าย', right: 'ด้านขวา' },
    LEFT:   { front: '🚗 หน้าบ้าน (ถนน)', back: '🌳 หลังบ้าน', left: 'ด้านซ้าย', right: 'ด้านขวา' },
    RIGHT:  { front: '🚗 หน้าบ้าน (ถนน)', back: '🌳 หลังบ้าน', left: 'ด้านซ้าย', right: 'ด้านขวา' },
};

export default function HousePlanBuilder({ initialLayout, houseFloors, onSave, onClose }: HousePlanBuilderProps) {
    const [floors, setFloors] = useState<HouseFloorData[]>(() => {
        if (initialLayout?.floors?.length) return initialLayout.floors;
        return Array.from({ length: houseFloors }, (_, i) => ({ floor: i + 1, rooms: [] }));
    });
    const [activeFloor, setActiveFloor] = useState(1);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [frontSide, setFrontSide] = useState<string>(initialLayout?.frontSide || 'BOTTOM');
    const [boundary, setBoundary] = useState<HouseBoundary>(
        initialLayout?.boundary || { x: 3, y: 3, w: 14, h: 12 }
    );

    // Drag state
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialPos, setInitialPos] = useState({ x: 0, y: 0 });
    const gridRef = useRef<HTMLDivElement>(null);

    const currentFloor = floors.find(f => f.floor === activeFloor) || { floor: activeFloor, rooms: [] };

    const updateRoom = (roomId: string, updates: Partial<HouseRoom>) => {
        setFloors(prev => prev.map(f => {
            if (f.floor !== activeFloor) return f;
            return {
                ...f,
                rooms: f.rooms.map(r => {
                    if (r.id !== roomId) return r;
                    const next = { ...r, ...updates };
                    next.x = Math.max(0, Math.min(GRID_SIZE - next.w, next.x));
                    next.y = Math.max(0, Math.min(GRID_SIZE - next.h, next.y));
                    return next;
                })
            };
        }));
    };

    const addRoom = (type: HouseRoom['type']) => {
        const config = ROOM_CONFIG[type];
        const count = currentFloor.rooms.filter(r => r.type === type).length;
        // Place inside boundary by default (unless outdoor)
        const startX = config.outdoor ? 0 : boundary.x;
        const startY = config.outdoor ? (boundary.y + boundary.h) : boundary.y;
        const newRoom: HouseRoom = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            name: `${config.label} ${count + 1}`,
            x: startX, y: startY,
            w: config.defaultW, h: config.defaultH,
            floor: activeFloor
        };
        setFloors(prev => prev.map(f => 
            f.floor === activeFloor ? { ...f, rooms: [...f.rooms, newRoom] } : f
        ));
        setSelectedRoomId(newRoom.id);
    };

    const deleteRoom = (roomId: string) => {
        setFloors(prev => prev.map(f => 
            f.floor === activeFloor ? { ...f, rooms: f.rooms.filter(r => r.id !== roomId) } : f
        ));
        if (selectedRoomId === roomId) setSelectedRoomId(null);
    };

    const handleMouseDown = (e: React.MouseEvent, room: HouseRoom) => {
        e.stopPropagation();
        setDraggingId(room.id);
        setDragStart({ x: e.clientX, y: e.clientY });
        setInitialPos({ x: room.x, y: room.y });
        setSelectedRoomId(room.id);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggingId || !gridRef.current) return;
        const rect = gridRef.current.getBoundingClientRect();
        const cellSize = rect.width / GRID_SIZE;
        const moveX = Math.round((e.clientX - dragStart.x) / cellSize);
        const moveY = Math.round((e.clientY - dragStart.y) / cellSize);
        updateRoom(draggingId, { x: initialPos.x + moveX, y: initialPos.y + moveY });
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
        onSave({ floors, boundary, frontSide });
        setIsSaving(false);
    };

    // Check if two rooms share an edge (for wall rendering)
    const getSharedEdges = useCallback((room: HouseRoom) => {
        const edges: { side: string; neighbor: string }[] = [];
        const others = currentFloor.rooms.filter(r => r.id !== room.id);
        
        for (const other of others) {
            // Check if they share a horizontal edge
            const hOverlap = Math.max(0, Math.min(room.x + room.w, other.x + other.w) - Math.max(room.x, other.x));
            const vOverlap = Math.max(0, Math.min(room.y + room.h, other.y + other.h) - Math.max(room.y, other.y));
            
            if (hOverlap > 0) {
                // Room's bottom = other's top
                if (room.y + room.h === other.y) edges.push({ side: 'bottom', neighbor: other.name });
                // Room's top = other's top bottom
                if (room.y === other.y + other.h) edges.push({ side: 'top', neighbor: other.name });
            }
            if (vOverlap > 0) {
                // Room's right = other's left
                if (room.x + room.w === other.x) edges.push({ side: 'right', neighbor: other.name });
                // Room's left = other's right
                if (room.x === other.x + other.w) edges.push({ side: 'left', neighbor: other.name });
            }
        }
        return edges;
    }, [currentFloor.rooms]);

    // Check if room edge touches boundary (exterior wall)
    const getExteriorWalls = useCallback((room: HouseRoom) => {
        const walls: string[] = [];
        if (room.x === boundary.x) walls.push('left');
        if (room.y === boundary.y) walls.push('top');
        if (room.x + room.w === boundary.x + boundary.w) walls.push('right');
        if (room.y + room.h === boundary.y + boundary.h) walls.push('bottom');
        return walls;
    }, [boundary]);

    const handleAutoLayout = () => {
        if (currentFloor.rooms.length > 0 && !window.confirm('จะล้างห้องเดิมทั้งหมดในชั้นนี้ ต้องการดำเนินการหรือไม่?')) return;
        
        const rid = () => Math.random().toString(36).substr(2, 9);
        const bx = boundary.x, by = boundary.y, bw = boundary.w, bh = boundary.h;
        let rooms: HouseRoom[] = [];

        if (activeFloor === 1) {
            rooms = [
                { id: rid(), type: 'LIVING',   name: 'ห้องนั่งเล่น',   x: bx,             y: by,              w: Math.floor(bw * 0.45), h: Math.floor(bh * 0.45), floor: 1 },
                { id: rid(), type: 'KITCHEN',  name: 'ห้องครัว',       x: bx + Math.floor(bw * 0.45), y: by, w: Math.floor(bw * 0.3),  h: Math.floor(bh * 0.3),  floor: 1 },
                { id: rid(), type: 'DINING',   name: 'ห้องทานข้าว',    x: bx + Math.floor(bw * 0.45), y: by + Math.floor(bh * 0.3), w: Math.floor(bw * 0.3), h: Math.floor(bh * 0.25), floor: 1 },
                { id: rid(), type: 'BATHROOM', name: 'ห้องน้ำ 1',      x: bx + Math.floor(bw * 0.75), y: by,  w: Math.ceil(bw * 0.25),  h: Math.floor(bh * 0.3),  floor: 1 },
                { id: rid(), type: 'STAIRS',   name: 'บันได',         x: bx + Math.floor(bw * 0.75), y: by + Math.floor(bh * 0.3), w: Math.ceil(bw * 0.25), h: Math.floor(bh * 0.25), floor: 1 },
                { id: rid(), type: 'GARAGE',   name: 'โรงจอดรถ',      x: bx,             y: by + bh,          w: Math.floor(bw * 0.4),  h: 3,                     floor: 1 },
                { id: rid(), type: 'GARDEN',   name: 'สวนหน้าบ้าน',   x: bx + Math.floor(bw * 0.4), y: by + bh, w: Math.ceil(bw * 0.6), h: 3,                    floor: 1 },
            ];
        } else {
            rooms = [
                { id: rid(), type: 'BEDROOM',  name: 'ห้องนอนใหญ่',   x: bx,             y: by,              w: Math.floor(bw * 0.4),  h: Math.floor(bh * 0.5),  floor: activeFloor },
                { id: rid(), type: 'CLOSET',   name: 'ห้องแต่งตัว',    x: bx,             y: by + Math.floor(bh * 0.5), w: Math.floor(bw * 0.2),  h: Math.floor(bh * 0.25), floor: activeFloor },
                { id: rid(), type: 'BATHROOM', name: 'ห้องน้ำใหญ่',    x: bx + Math.floor(bw * 0.2), y: by + Math.floor(bh * 0.5), w: Math.floor(bw * 0.2), h: Math.floor(bh * 0.25), floor: activeFloor },
                { id: rid(), type: 'BEDROOM',  name: 'ห้องนอน 2',     x: bx + Math.floor(bw * 0.4), y: by, w: Math.floor(bw * 0.3),  h: Math.floor(bh * 0.45), floor: activeFloor },
                { id: rid(), type: 'BEDROOM',  name: 'ห้องนอน 3',     x: bx + Math.floor(bw * 0.7), y: by, w: Math.ceil(bw * 0.3),   h: Math.floor(bh * 0.45), floor: activeFloor },
                { id: rid(), type: 'BATHROOM', name: 'ห้องน้ำ 2',     x: bx + Math.floor(bw * 0.4), y: by + Math.floor(bh * 0.45), w: Math.floor(bw * 0.3), h: Math.floor(bh * 0.3), floor: activeFloor },
                { id: rid(), type: 'BALCONY',  name: 'ระเบียง',       x: bx + Math.floor(bw * 0.7), y: by + Math.floor(bh * 0.45), w: Math.ceil(bw * 0.3), h: Math.floor(bh * 0.2), floor: activeFloor },
                { id: rid(), type: 'STAIRS',   name: 'บันได',         x: bx + Math.floor(bw * 0.75), y: by + Math.floor(bh * 0.65), w: Math.ceil(bw * 0.25), h: Math.floor(bh * 0.35), floor: activeFloor },
            ];
        }

        setFloors(prev => prev.map(f => f.floor === activeFloor ? { ...f, rooms } : f));
    };

    const selectedRoom = currentFloor.rooms.find(r => r.id === selectedRoomId);

    // Get compass labels based on frontSide
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

    // Indoor room categories
    const indoorRooms: HouseRoom['type'][] = ['LIVING', 'BEDROOM', 'BATHROOM', 'KITCHEN', 'DINING', 'OFFICE', 'CLOSET', 'STORAGE', 'LAUNDRY', 'STAIRS', 'BALCONY'];
    const outdoorRooms: HouseRoom['type'][] = ['GARAGE', 'GARDEN'];

    return (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[100] flex flex-col animate-in fade-in duration-300 select-none">
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500/10 rounded-xl">
                        <Home className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">House Blueprint Builder</h2>
                        <p className="text-slate-400 text-[10px]">ออกแบบแปลนบ้านชั้น {activeFloor} จากทั้งหมด {houseFloors} ชั้น — ลากวางห้องภายในเขตบ้าน</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white rounded-xl text-sm h-9">
                        <X className="w-4 h-4 mr-1" /> ยกเลิก
                    </Button>
                    <Button type="button" onClick={handleSave} disabled={isSaving} className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold h-9 px-6 text-sm">
                        <Save className="w-4 h-4 mr-1" /> บันทึกแปลนบ้าน
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar */}
                <div className="w-72 border-r border-white/10 p-4 space-y-4 bg-slate-900/30 overflow-y-auto">
                    {/* Floor Selector */}
                    <div className="space-y-2">
                        <label className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">เลือกชั้น</label>
                        <div className="flex gap-1.5">
                            {Array.from({ length: houseFloors }, (_, i) => i + 1).map(f => (
                                <button
                                    type="button" key={f}
                                    onClick={() => { setActiveFloor(f); setSelectedRoomId(null); }}
                                    className={`flex-1 h-9 rounded-lg font-bold text-sm transition-all ${activeFloor === f ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                >
                                    ชั้น {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* House Boundary Config */}
                    <div className="space-y-2 pt-3 border-t border-white/5">
                        <label className="text-[9px] uppercase font-bold text-amber-400 tracking-widest flex items-center gap-1">
                            <Square className="w-3 h-3" /> ขนาดเขตบ้าน (Boundary)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-800 rounded-lg p-2 flex flex-col items-center">
                                <span className="text-[8px] text-slate-500 font-bold">กว้าง (W)</span>
                                <div className="flex items-center gap-1 mt-1">
                                    <button type="button" className="text-slate-400 hover:text-white" onClick={() => setBoundary(b => ({ ...b, w: Math.max(6, b.w - 1) }))}>
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-white text-xs font-bold w-6 text-center">{boundary.w}</span>
                                    <button type="button" className="text-slate-400 hover:text-white" onClick={() => setBoundary(b => ({ ...b, w: Math.min(GRID_SIZE - b.x, b.w + 1) }))}>
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                            <div className="bg-slate-800 rounded-lg p-2 flex flex-col items-center">
                                <span className="text-[8px] text-slate-500 font-bold">ยาว (H)</span>
                                <div className="flex items-center gap-1 mt-1">
                                    <button type="button" className="text-slate-400 hover:text-white" onClick={() => setBoundary(b => ({ ...b, h: Math.max(6, b.h - 1) }))}>
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-white text-xs font-bold w-6 text-center">{boundary.h}</span>
                                    <button type="button" className="text-slate-400 hover:text-white" onClick={() => setBoundary(b => ({ ...b, h: Math.min(GRID_SIZE - b.y, b.h + 1) }))}>
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Front Side Selector */}
                        <div className="mt-2">
                            <span className="text-[8px] text-slate-500 font-bold block mb-1.5">🧭 หน้าบ้านอยู่ด้านไหน?</span>
                            <div className="grid grid-cols-4 gap-1 bg-slate-800 p-1 rounded-lg">
                                {(['TOP', 'BOTTOM', 'LEFT', 'RIGHT'] as const).map(side => (
                                    <button
                                        key={side} type="button"
                                        onClick={() => setFrontSide(side)}
                                        className={`text-[9px] py-1.5 rounded font-bold transition-all ${frontSide === side ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700'}`}
                                    >
                                        {side === 'TOP' ? '▲ บน' : side === 'BOTTOM' ? '▼ ล่าง' : side === 'LEFT' ? '◀ ซ้าย' : '▶ ขวา'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Add Indoor Rooms */}
                    <div className="space-y-2 pt-3 border-t border-white/5">
                        <label className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">🏠 ห้องภายในบ้าน</label>
                        <div className="grid grid-cols-2 gap-1.5">
                            {indoorRooms.map(type => {
                                const cfg = ROOM_CONFIG[type];
                                return (
                                    <button
                                        type="button" key={type}
                                        onClick={() => addRoom(type)}
                                        className="flex items-center gap-1.5 px-2 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] text-slate-300 transition-all border border-white/5 hover:border-white/15"
                                    >
                                        <span>{cfg.emoji}</span>
                                        <span>{cfg.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Add Outdoor Rooms */}
                    <div className="space-y-2 pt-3 border-t border-white/5">
                        <label className="text-[9px] uppercase font-bold text-green-400 tracking-widest">🌿 พื้นที่ภายนอก (วางนอกเขตบ้านได้)</label>
                        <div className="grid grid-cols-2 gap-1.5">
                            {outdoorRooms.map(type => {
                                const cfg = ROOM_CONFIG[type];
                                return (
                                    <button
                                        type="button" key={type}
                                        onClick={() => addRoom(type)}
                                        className="flex items-center gap-1.5 px-2 py-2 rounded-lg bg-green-900/20 hover:bg-green-900/40 text-[10px] text-green-300 transition-all border border-green-500/20 hover:border-green-500/40"
                                    >
                                        <span>{cfg.emoji}</span>
                                        <span>{cfg.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Auto Layout */}
                    <Button type="button" onClick={handleAutoLayout} variant="ghost" className="w-full text-[10px] h-8 rounded-lg text-yellow-500 hover:bg-yellow-500/5 border border-yellow-500/20">
                        <Wand2 className="w-3 h-3 mr-1" /> จัดผังอัตโนมัติ
                    </Button>

                    {/* Selected Room Editor */}
                    {selectedRoom && (
                        <div className="space-y-3 pt-3 border-t border-white/10">
                            <label className="text-[9px] uppercase font-bold text-emerald-400 tracking-widest">แก้ไขห้องที่เลือก</label>
                            <div className="space-y-2">
                                <input
                                    type="text" value={selectedRoom.name}
                                    onChange={e => updateRoom(selectedRoom.id, { name: e.target.value })}
                                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[8px] text-slate-500">กว้าง</label>
                                        <div className="flex items-center gap-1">
                                            <Button type="button" variant="ghost" className="h-6 w-6 p-0 text-slate-400" onClick={() => updateRoom(selectedRoom.id, { w: Math.max(1, selectedRoom.w - 1) })}><ChevronDown className="w-3 h-3" /></Button>
                                            <span className="text-white text-xs font-bold w-6 text-center">{selectedRoom.w}</span>
                                            <Button type="button" variant="ghost" className="h-6 w-6 p-0 text-slate-400" onClick={() => updateRoom(selectedRoom.id, { w: Math.min(GRID_SIZE, selectedRoom.w + 1) })}><ChevronUp className="w-3 h-3" /></Button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[8px] text-slate-500">สูง</label>
                                        <div className="flex items-center gap-1">
                                            <Button type="button" variant="ghost" className="h-6 w-6 p-0 text-slate-400" onClick={() => updateRoom(selectedRoom.id, { h: Math.max(1, selectedRoom.h - 1) })}><ChevronDown className="w-3 h-3" /></Button>
                                            <span className="text-white text-xs font-bold w-6 text-center">{selectedRoom.h}</span>
                                            <Button type="button" variant="ghost" className="h-6 w-6 p-0 text-slate-400" onClick={() => updateRoom(selectedRoom.id, { h: Math.min(GRID_SIZE, selectedRoom.h + 1) })}><ChevronUp className="w-3 h-3" /></Button>
                                        </div>
                                    </div>
                                </div>
                                {/* Move Buttons */}
                                <div className="flex items-center justify-center gap-1 pt-1">
                                    <Button type="button" variant="ghost" className="h-7 w-7 p-0 text-slate-400" onClick={() => updateRoom(selectedRoom.id, { x: selectedRoom.x - 1 })}><ChevronLeft className="w-3 h-3" /></Button>
                                    <div className="flex flex-col gap-1">
                                        <Button type="button" variant="ghost" className="h-7 w-7 p-0 text-slate-400" onClick={() => updateRoom(selectedRoom.id, { y: selectedRoom.y - 1 })}><ChevronUp className="w-3 h-3" /></Button>
                                        <Button type="button" variant="ghost" className="h-7 w-7 p-0 text-slate-400" onClick={() => updateRoom(selectedRoom.id, { y: selectedRoom.y + 1 })}><ChevronDown className="w-3 h-3" /></Button>
                                    </div>
                                    <Button type="button" variant="ghost" className="h-7 w-7 p-0 text-slate-400" onClick={() => updateRoom(selectedRoom.id, { x: selectedRoom.x + 1 })}><ChevronRight className="w-3 h-3" /></Button>
                                </div>
                                {/* Is Inside Boundary indicator */}
                                {(() => {
                                    const isOutdoor = ROOM_CONFIG[selectedRoom.type]?.outdoor;
                                    const isInside = selectedRoom.x >= boundary.x && selectedRoom.y >= boundary.y 
                                        && selectedRoom.x + selectedRoom.w <= boundary.x + boundary.w 
                                        && selectedRoom.y + selectedRoom.h <= boundary.y + boundary.h;
                                    return (
                                        <div className={`text-[9px] font-bold px-2 py-1 rounded-md text-center ${isInside ? 'bg-emerald-500/10 text-emerald-400' : isOutdoor ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                            {isInside ? '✅ อยู่ภายในเขตบ้าน' : isOutdoor ? '🌿 พื้นที่ภายนอก' : '⚠️ อยู่นอกเขตบ้าน'}
                                        </div>
                                    );
                                })()}
                                <Button type="button" variant="ghost" onClick={() => deleteRoom(selectedRoom.id)} className="w-full text-[10px] h-7 text-rose-400 hover:bg-rose-500/10">
                                    <Trash2 className="w-3 h-3 mr-1" /> ลบห้องนี้
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Room Count Summary */}
                    <div className="pt-3 border-t border-white/5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">สรุปห้องชั้นนี้</label>
                        <div className="mt-2 space-y-1">
                            {Object.entries(
                                currentFloor.rooms.reduce((acc, r) => { acc[r.type] = (acc[r.type] || 0) + 1; return acc; }, {} as Record<string, number>)
                            ).map(([type, count]) => (
                                <div key={type} className="flex justify-between text-[10px]">
                                    <span className="text-slate-400">{ROOM_CONFIG[type as HouseRoom['type']]?.emoji} {ROOM_CONFIG[type as HouseRoom['type']]?.label}</span>
                                    <span className="text-white font-bold">{count}</span>
                                </div>
                            ))}
                            {currentFloor.rooms.length === 0 && <p className="text-[10px] text-slate-600 italic">ยังไม่มีห้อง</p>}
                        </div>
                    </div>
                </div>

                {/* Main Grid Area */}
                <div className="flex-1 flex items-center justify-center p-6 bg-slate-950/50">
                    <div className="w-full max-w-[700px] aspect-square">
                        <div className="text-center mb-3">
                            <span className="text-xs text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">
                                🏠 ชั้น {activeFloor} — ลากวางห้องได้อิสระ | กรอบสีขาว = เขตตัวบ้าน
                            </span>
                        </div>

                        {/* Compass Labels around grid */}
                        <div className="relative">
                            {/* Top label */}
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                {getEdgeLabel('top')}
                            </div>
                            {/* Bottom label */}
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                {getEdgeLabel('bottom')}
                            </div>
                            {/* Left label */}
                            <div className="absolute top-1/2 -left-2 -translate-y-1/2 -translate-x-full text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                {getEdgeLabel('left')}
                            </div>
                            {/* Right label */}
                            <div className="absolute top-1/2 -right-2 -translate-y-1/2 translate-x-full text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                {getEdgeLabel('right')}
                            </div>

                            <div
                                ref={gridRef}
                                onMouseMove={handleMouseMove}
                                onClick={() => setSelectedRoomId(null)}
                                className="relative w-full aspect-square rounded-2xl border-2 border-slate-700 bg-slate-900/80 overflow-hidden"
                                style={{ backgroundImage: 'radial-gradient(circle, rgba(100,116,139,0.12) 1px, transparent 1px)', backgroundSize: `${100/GRID_SIZE}% ${100/GRID_SIZE}%` }}
                            >
                                {/* Outside boundary overlay (dim area) */}
                                <div className="absolute inset-0 pointer-events-none z-[1]">
                                    {/* Top strip */}
                                    <div className="absolute bg-slate-950/40" style={{
                                        left: 0, top: 0, width: '100%',
                                        height: `${(boundary.y / GRID_SIZE) * 100}%`
                                    }} />
                                    {/* Bottom strip */}
                                    <div className="absolute bg-slate-950/40" style={{
                                        left: 0, width: '100%',
                                        top: `${((boundary.y + boundary.h) / GRID_SIZE) * 100}%`,
                                        height: `${((GRID_SIZE - boundary.y - boundary.h) / GRID_SIZE) * 100}%`
                                    }} />
                                    {/* Left strip */}
                                    <div className="absolute bg-slate-950/40" style={{
                                        left: 0, width: `${(boundary.x / GRID_SIZE) * 100}%`,
                                        top: `${(boundary.y / GRID_SIZE) * 100}%`,
                                        height: `${(boundary.h / GRID_SIZE) * 100}%`
                                    }} />
                                    {/* Right strip */}
                                    <div className="absolute bg-slate-950/40" style={{
                                        left: `${((boundary.x + boundary.w) / GRID_SIZE) * 100}%`,
                                        width: `${((GRID_SIZE - boundary.x - boundary.w) / GRID_SIZE) * 100}%`,
                                        top: `${(boundary.y / GRID_SIZE) * 100}%`,
                                        height: `${(boundary.h / GRID_SIZE) * 100}%`
                                    }} />
                                </div>

                                {/* House Boundary Box */}
                                <div 
                                    className="absolute border-[3px] border-white/80 rounded-xl pointer-events-none z-[2] shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                                    style={{
                                        left: `${(boundary.x / GRID_SIZE) * 100}%`,
                                        top: `${(boundary.y / GRID_SIZE) * 100}%`,
                                        width: `${(boundary.w / GRID_SIZE) * 100}%`,
                                        height: `${(boundary.h / GRID_SIZE) * 100}%`,
                                    }}
                                >
                                    {/* Boundary label */}
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[8px] font-black px-2 py-0.5 rounded-md whitespace-nowrap shadow-lg">
                                        🏠 เขตบ้าน {boundary.w}×{boundary.h}
                                    </div>
                                </div>

                                {/* Rooms */}
                                {currentFloor.rooms.map(room => {
                                    const cfg = ROOM_CONFIG[room.type];
                                    const isSelected = selectedRoomId === room.id;
                                    const exteriorWalls = getExteriorWalls(room);
                                    const sharedEdges = getSharedEdges(room);
                                    const isOutdoor = cfg.outdoor;
                                    const isInsideBoundary = room.x >= boundary.x && room.y >= boundary.y 
                                        && room.x + room.w <= boundary.x + boundary.w 
                                        && room.y + room.h <= boundary.y + boundary.h;

                                    return (
                                        <div
                                            key={room.id}
                                            onMouseDown={e => handleMouseDown(e, room)}
                                            onClick={e => { e.stopPropagation(); setSelectedRoomId(room.id); }}
                                            className={`absolute flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-shadow z-10 ${isSelected ? 'ring-2 ring-white/60 shadow-xl z-20' : 'hover:shadow-lg'}`}
                                            style={{
                                                left: `${(room.x / GRID_SIZE) * 100}%`,
                                                top: `${(room.y / GRID_SIZE) * 100}%`,
                                                width: `${(room.w / GRID_SIZE) * 100}%`,
                                                height: `${(room.h / GRID_SIZE) * 100}%`,
                                                // Wall borders: thick for exterior, dashed for interior shared
                                                borderTop: exteriorWalls.includes('top') ? '3px solid rgba(255,255,255,0.8)' : sharedEdges.some(e => e.side === 'top') ? '2px dashed rgba(148,163,184,0.5)' : '1px solid rgba(148,163,184,0.25)',
                                                borderBottom: exteriorWalls.includes('bottom') ? '3px solid rgba(255,255,255,0.8)' : sharedEdges.some(e => e.side === 'bottom') ? '2px dashed rgba(148,163,184,0.5)' : '1px solid rgba(148,163,184,0.25)',
                                                borderLeft: exteriorWalls.includes('left') ? '3px solid rgba(255,255,255,0.8)' : sharedEdges.some(e => e.side === 'left') ? '2px dashed rgba(148,163,184,0.5)' : '1px solid rgba(148,163,184,0.25)',
                                                borderRight: exteriorWalls.includes('right') ? '3px solid rgba(255,255,255,0.8)' : sharedEdges.some(e => e.side === 'right') ? '2px dashed rgba(148,163,184,0.5)' : '1px solid rgba(148,163,184,0.25)',
                                                borderRadius: '8px',
                                                backgroundColor: isOutdoor 
                                                    ? 'rgba(34,197,94,0.12)' 
                                                    : isInsideBoundary 
                                                        ? undefined 
                                                        : 'rgba(245,158,11,0.08)',
                                            }}
                                        >
                                            <div className={`absolute inset-0 rounded-lg ${cfg.darkColor} ${!isInsideBoundary && !isOutdoor ? 'opacity-50' : ''}`} />
                                            <div className="relative flex flex-col items-center justify-center gap-0.5 p-1">
                                                <span className="text-lg leading-none">{cfg.emoji}</span>
                                                <span className="text-[9px] font-bold mt-0.5 truncate max-w-full px-1 text-white/90">{room.name}</span>
                                                {room.w >= 3 && room.h >= 3 && (
                                                    <span className="text-[7px] opacity-60 text-white/60">{room.w}×{room.h}</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {currentFloor.rooms.length === 0 && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 z-[3]">
                                        <Home className="w-12 h-12 mb-3 opacity-30" />
                                        <p className="text-sm font-bold">ยังไม่มีห้องในชั้นนี้</p>
                                        <p className="text-[10px] mt-1">เริ่มเพิ่มห้องจากแถบด้านซ้าย หรือใช้ &quot;จัดผังอัตโนมัติ&quot;</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-[10px] text-slate-500">
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 border-[2px] border-white/80 rounded-sm" /> กำแพงภายนอก</div>
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 border-[2px] border-dashed border-slate-400/50 rounded-sm" /> ผนังกั้นห้อง</div>
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-slate-950/40 rounded-sm border border-slate-600" /> นอกเขตบ้าน</div>
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-500/15 rounded-sm border border-green-500/30" /> พื้นที่ภายนอก</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
