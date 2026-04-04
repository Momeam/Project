'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { 
    Plus, Minus, Save, Trash2, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
    DoorOpen, Layout, Maximize2, AlertTriangle, Home, Bed, Bath, 
    Smartphone as Tv, Coffee, Utensils, AlignLeft, RotateCw
} from 'lucide-react';

interface RoomComponent {
    id: string;
    type: 'BED' | 'BATH' | 'KITCHEN' | 'LIVING' | 'TV' | 'CLOSET' | 'BALCONY';
    x: number;
    y: number;
    w: number;
    h: number;
}

interface Unit {
    id: number;
    room_number: string;
    property_id: number;
    floor_number: number;
    grid_x: number;
    grid_y: number;
    grid_w: number;
    grid_h: number;
    door_side?: string | null;
    window_side?: string | null;
    unit_type: 'ROOM' | 'LIFT' | 'HALLWAY' | 'EXIT';
    status: string;
    price?: number;
    layout_json?: {
        components: RoomComponent[];
    } | null;
}

interface FloorPlanBuilderProps {
    propertyId: number;
    existingUnits: Unit[];
    totalFloors: number;
    onSaveSuccess: () => void;
    onClose: () => void;
}

const GRID_SIZE = 20;
const ROOM_GRID_SIZE = 10;

export default function FloorPlanBuilder({ propertyId, existingUnits, totalFloors, onSaveSuccess, onClose }: FloorPlanBuilderProps) {
    const [units, setUnits] = useState<Unit[]>(existingUnits);
    const [activeFloor, setActiveFloor] = useState(1);
    const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
    const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');

    // --- Drag & Drop state for internal components ---
    const [draggingCompId, setDraggingCompId] = useState<string | null>(null);
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
    const [initialCompPos, setInitialCompPos] = useState({ x: 0, y: 0 });
    const roomGridRef = useRef<HTMLDivElement>(null);

    // กรองห้องตามชั้น
    const floorUnits = useMemo(() => units.filter(u => u.floor_number === activeFloor), [units, activeFloor]);

    // ตรวจสอบการทับซ้อนในผังใหญ่
    const checkCollision = (unit1: Partial<Unit>, otherUnits: Unit[]) => {
        return otherUnits.some(unit2 => {
            if (unit1.id === unit2.id) return false;
            if (unit2.unit_type === 'HALLWAY') return false; 
            const u1 = { x: unit1.grid_x || 0, y: unit1.grid_y || 0, w: unit1.grid_w || 1, h: unit1.grid_h || 1 };
            const u2 = { x: unit2.grid_x, y: unit2.grid_y, w: unit2.grid_w, h: unit2.grid_h };
            
            return (
                u1.x < u2.x + u2.w &&
                u1.x + u1.w > u2.x &&
                u1.y < u2.y + u2.h &&
                u1.y + u1.h > u2.y
            );
        });
    };

    const updateUnit = (id: number, updates: Partial<Unit>) => {
        setUnits(prev => {
            const currentUnit = prev.find(u => u.id === id);
            if (!currentUnit) return prev;
            
            const nextUnit = { ...currentUnit, ...updates };
            if (nextUnit.grid_x < 0) nextUnit.grid_x = 0;
            if (nextUnit.grid_y < 0) nextUnit.grid_y = 0;
            if (nextUnit.grid_x + nextUnit.grid_w > GRID_SIZE) nextUnit.grid_x = GRID_SIZE - nextUnit.grid_w;
            if (nextUnit.grid_y + nextUnit.grid_h > GRID_SIZE) nextUnit.grid_y = GRID_SIZE - nextUnit.grid_h;

            return prev.map(u => u.id === id ? nextUnit : u);
        });
    };

    const handleAddRoom = async (type: 'ROOM' | 'LIFT' | 'HALLWAY' | 'EXIT' = 'ROOM', name?: string) => {
        const roomName = name || newRoomName || (type === 'ROOM' ? 'New' : type);
        if (!roomName.trim()) return;
        
        const config = {
            TV: { color: 'bg-slate-50', icon: Tv, textColor: 'text-slate-700', label: 'TV Area' },
            BALCONY: { color: 'bg-cyan-50', icon: AlignLeft, textColor: 'text-cyan-700', label: 'Balcony' },
            CLOSET: { color: 'bg-yellow-50', icon: Layout, textColor: 'text-yellow-700', label: 'Closet' },
            ROOM: { w: 4, h: 4, color: 'bg-slate-800' },
            LIFT: { w: 2, h: 2, color: 'bg-blue-600' },
            HALLWAY: { w: 4, h: 2, color: 'bg-slate-200' },
            EXIT: { w: 2, h: 2, color: 'bg-rose-600' }
        };

        try {
            const res = await fetch('http://localhost:5000/api/properties/units', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    property_id: propertyId,
                    floor_number: activeFloor,
                    room_number: roomName,
                    unit_type: type,
                    grid_x: 0,
                    grid_y: 0,
                    grid_w: config[type].w,
                    grid_h: config[type].h
                })
            });
            if (res.ok) {
                const { unit } = await res.json();
                setUnits(prev => [...prev, unit]);
                if (type === 'ROOM') setNewRoomName('');
                setSelectedUnitId(unit.id);
            }
        } catch (error) {
            console.error('Error adding room:', error);
        }
    };

    const handleAutoLayout = async () => {
        if (!window.confirm('คำเตือน: การจัดผังอัตโนมัติจะล้างข้อมูลห้องเดิมในชั้นนี้ทั้งหมด และแทนที่ด้วยเทมเพลตมาตรฐาน คุณต้องการดำเนินการต่อหรือไม่?')) return;
        
        setIsSaving(true);
        try {
            const deleteRes = await fetch(`http://localhost:5000/api/properties/${propertyId}/floors/${activeFloor}/units`, {
                method: 'DELETE'
            });

            if (!deleteRes.ok) throw new Error('Failed to reset floor');

            const templateUnits: any[] = [
                // Hallway in middle (9-11)
                { property_id: propertyId, floor_number: activeFloor, room_number: 'ทางเดินหลัก', unit_type: 'HALLWAY', grid_x: 0, grid_y: 9, grid_w: 20, grid_h: 2, door_side: null, window_side: null },
                // Lift & Exit at the corners of the hallway level
                { property_id: propertyId, floor_number: activeFloor, room_number: 'LIFT', unit_type: 'LIFT', grid_x: 9, grid_y: 11, grid_w: 2, grid_h: 2, door_side: 'TOP', window_side: null },
                { property_id: propertyId, floor_number: activeFloor, room_number: 'EXIT', unit_type: 'EXIT', grid_x: 0, grid_y: 11, grid_w: 2, grid_h: 2, door_side: 'TOP', window_side: null },
            ];

            for(let i=0; i<5; i++) {
                // แถวบน (Y: 5-9)
                templateUnits.push({ 
                    property_id: propertyId, floor_number: activeFloor, 
                    room_number: `${activeFloor}0${i+1}`, unit_type: 'ROOM', 
                    grid_x: i*4, grid_y: 5, grid_w: 4, grid_h: 4, 
                    door_side: 'BOTTOM', window_side: 'TOP' 
                });
                // แถวล่าง (Y: 13-17) - ขยับลงมาเพื่อให้ไม่ทับกับ Lift/Exit ที่ Y: 11
                templateUnits.push({ 
                    property_id: propertyId, floor_number: activeFloor, 
                    room_number: `${activeFloor}0${i+6}`, unit_type: 'ROOM', 
                    grid_x: i*4, grid_y: 13, grid_w: 4, grid_h: 4, 
                    door_side: 'TOP', window_side: 'BOTTOM' 
                });
            }

            const createRes = await fetch('http://localhost:5000/api/properties/units/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ units: templateUnits })
            });

            if (createRes.ok) {
                const { units: newUnits } = await createRes.json();
                setUnits(prev => [
                    ...prev.filter(u => u.floor_number !== activeFloor),
                    ...newUnits
                ]);
                alert('สร้างผังมาตรฐานสำเร็จ! 🎉');
            }
        } catch (error) {
            console.error('Error in auto layout:', error);
            alert('เกิดข้อผิดพลาดในการสร้างผังอัตโนมัติ');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteUnit = async (id: number) => {
        if (!window.confirm('ลบห้องพักนี้?')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/properties/units/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setUnits(prev => prev.filter(u => u.id !== id));
                setSelectedUnitId(null);
            }
        } catch (error) {
            console.error('Error deleting unit:', error);
        }
    };

    const handleSave = async () => {
        const hasCollision = floorUnits.some(u => checkCollision(u, floorUnits));
        if (hasCollision) {
            alert('⚠️ มีห้องที่วางทับซ้อนกันอยู่ กรุณาจัดระเบียบก่อนบันทึก!');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('http://localhost:5000/api/properties/units/bulk', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ units })
            });
            if (res.ok) {
                alert('บันทึกผังโครงการสำเร็จ! 🎉');
                onSaveSuccess();
            }
        } catch (error) {
            console.error('Error saving units:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const selectedUnit = units.find(u => u.id === selectedUnitId);
    const collisionInActiveFloor = floorUnits.some(u => checkCollision(u, floorUnits));

    // ---------- Room Layout Sub-Editor Logic ----------
    const editingUnit = units.find(u => u.id === editingRoomId);
    
    const handleAddComponent = (type: RoomComponent['type']) => {
        if (!editingUnit) return;
        const newComp: RoomComponent = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            x: 2, y: 2, w: 2, h: 2
        };
        const nextLayout = {
            components: [...(editingUnit.layout_json?.components || []), newComp]
        };
        updateUnit(editingUnit.id, { layout_json: nextLayout });
    };

    const updateComponent = (compId: string, updates: Partial<RoomComponent>) => {
        if (!editingUnit) return;
        const nextLayout = {
            components: (editingUnit.layout_json?.components || []).map(c => 
                c.id === compId ? { ...c, ...updates } : c
            )
        };
        updateUnit(editingUnit.id, { layout_json: nextLayout });
    };

    const removeComponent = (compId: string) => {
        if (!editingUnit) return;
        const nextLayout = {
            components: (editingUnit.layout_json?.components || []).filter(c => c.id !== compId)
        };
        updateUnit(editingUnit.id, { layout_json: nextLayout });
    };

    // --- Main Floor Drag Logic ---
    const [draggingFloorId, setDraggingFloorId] = useState<number | null>(null);
    const mainGridRef = useRef<HTMLDivElement>(null);

    const handleFloorMouseDown = (e: React.MouseEvent, unit: Unit) => {
        if (editingRoomId) return;
        e.stopPropagation();
        setDraggingFloorId(unit.id);
        setDragStartPos({ x: e.clientX, y: e.clientY });
        setInitialCompPos({ x: unit.grid_x, y: unit.grid_y });
    };

    const handleFloorMouseMove = (e: React.MouseEvent) => {
        if (!draggingFloorId || !mainGridRef.current) return;

        const deltaX = e.clientX - dragStartPos.x;
        const deltaY = e.clientY - dragStartPos.y;

        const gridRect = mainGridRef.current.getBoundingClientRect();
        const gridCellSize = gridRect.width / GRID_SIZE;

        const moveX = Math.round(deltaX / gridCellSize);
        const moveY = Math.round(deltaY / gridCellSize);

        const unit = units.find(u => u.id === draggingFloorId);
        if (!unit) return;

        let nextX = initialCompPos.x + moveX;
        let nextY = initialCompPos.y + moveY;

        // ขอบเขต
        nextX = Math.max(0, Math.min(GRID_SIZE - unit.grid_w, nextX));
        nextY = Math.max(0, Math.min(GRID_SIZE - unit.grid_h, nextY));

        if (nextX !== unit.grid_x || nextY !== unit.grid_y) {
            updateUnit(draggingFloorId, { grid_x: nextX, grid_y: nextY });
        }
    };

    const handleFloorMouseUp = () => {
        setDraggingFloorId(null);
    };

    useEffect(() => {
        if (draggingFloorId) {
            window.addEventListener('mouseup', handleFloorMouseUp);
            return () => window.removeEventListener('mouseup', handleFloorMouseUp);
        }
    }, [draggingFloorId]);

    // --- Internal Component Mouse Drag Logic ---
    const handleCompMouseDown = (e: React.MouseEvent, comp: RoomComponent) => {
        e.stopPropagation(); // กันไม่ให้ไปทริกเกอร์ Click อื่นๆ
        setDraggingCompId(comp.id);
        setDragStartPos({ x: e.clientX, y: e.clientY });
        setInitialCompPos({ x: comp.x, y: comp.y });
    };

    const handleCompMouseMove = (e: React.MouseEvent) => {
        if (!draggingCompId || !editingUnit || !roomGridRef.current) return;

        const deltaX = e.clientX - dragStartPos.x;
        const deltaY = e.clientY - dragStartPos.y;

        const gridRect = roomGridRef.current.getBoundingClientRect();
        const gridCellSize = gridRect.width / ROOM_GRID_SIZE;

        const moveX = Math.round(deltaX / gridCellSize);
        const moveY = Math.round(deltaY / gridCellSize);

        const comp = (editingUnit.layout_json?.components || []).find(c => c.id === draggingCompId);
        if (!comp) return;

        let nextX = initialCompPos.x + moveX;
        let nextY = initialCompPos.y + moveY;

        // ขอบเขต
        nextX = Math.max(0, Math.min(ROOM_GRID_SIZE - comp.w, nextX));
        nextY = Math.max(0, Math.min(ROOM_GRID_SIZE - comp.h, nextY));

        if (nextX !== comp.x || nextY !== comp.y) {
            updateComponent(draggingCompId, { x: nextX, y: nextY });
        }
    };

    const handleCompMouseUp = () => {
        setDraggingCompId(null);
    };

    useEffect(() => {
        if (draggingCompId) {
            window.addEventListener('mouseup', handleCompMouseUp);
            return () => window.removeEventListener('mouseup', handleCompMouseUp);
        }
    }, [draggingCompId]);

    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100] flex flex-col animate-in fade-in duration-300 select-none">
            {/* Header */}
            <div className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-slate-900/50">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl">
                        <Layout className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            {editingRoomId ? `Room Editor: ห้อง ${editingUnit?.room_number}` : 'Interactive Floor Plan Builder'}
                        </h2>
                        <p className="text-slate-400 text-xs">
                            {editingRoomId ? 'กำลังจัดวางองค์ประกอบภายในห้อง (ใช้เมาส์ลากวางได้เลย)' : `จัดผังชั้น ${activeFloor} จากทั้งหมด ${totalFloors} ชั้น`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {editingRoomId ? (
                        <Button type="button" onClick={() => setEditingRoomId(null)} className="bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold h-12 px-8">
                            เสร็จสิ้น (Back to Floor)
                        </Button>
                    ) : (
                        <>
                            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl">
                                <X className="w-5 h-5 mr-2" /> ยกเลิก
                            </Button>
                            <Button type="button" onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold h-12 px-8 shadow-lg shadow-emerald-600/20">
                                {isSaving ? 'กำลังบันทึก...' : <><Save className="w-5 h-5 mr-2" /> บันทึกผังทั้งหมด</>}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar */}
                <div className="w-80 border-r border-white/10 p-6 space-y-8 bg-slate-900/30 overflow-y-auto">
                    {!editingRoomId ? (
                        <>
                            {/* Floor Selector */}
                            <div className="space-y-3">
                                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest pl-1">เลือกชั้นที่ต้องการแก้ไข</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {Array.from({ length: totalFloors }, (_, i) => i + 1).map(f => (
                                        <button
                                            type="button"
                                            key={f}
                                            onClick={() => { setActiveFloor(f); setSelectedUnitId(null); }}
                                            className={`h-10 rounded-lg font-bold text-sm transition-all ${activeFloor === f ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Add Room */}
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest pl-1">เครื่องมือสร้างและจัดการ</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text"
                                        placeholder="ชื่อห้อง เช่น 101"
                                        value={newRoomName}
                                        onChange={(e) => setNewRoomName(e.target.value)}
                                        className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <Button type="button" onClick={() => handleAddRoom('ROOM')} className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 h-10 rounded-xl">
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button type="button" onClick={() => handleAddRoom('LIFT', 'ลิฟต์')} variant="outline" className="text-[10px] h-9 rounded-xl border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                                        <DoorOpen className="w-3 h-3 mr-1" /> + ลิฟต์
                                    </Button>
                                    <Button type="button" onClick={() => handleAddRoom('EXIT', 'ทางหนีไฟ')} variant="outline" className="text-[10px] h-9 rounded-xl border-rose-500/30 text-rose-400 hover:bg-rose-500/10">
                                        <AlertTriangle className="w-3 h-3 mr-1" /> + ทางหนีไฟ
                                    </Button>
                                    <Button type="button" onClick={() => handleAddRoom('HALLWAY', 'ทางเดิน')} variant="outline" className="col-span-2 text-[10px] h-9 rounded-xl border-slate-500/30 text-slate-400 hover:bg-slate-500/10">
                                        <Layout className="w-3 h-3 mr-1" /> + เพิ่มพื้นที่ทางเดิน
                                    </Button>
                                </div>
                                <Button type="button" onClick={handleAutoLayout} variant="ghost" className="w-full text-[10px] h-9 rounded-xl text-yellow-500 hover:bg-yellow-500/5 border border-yellow-500/20">
                                    ✨ จัดผังมาตรฐาน (Auto Layout)
                                </Button>
                            </div>

                            {/* Selected Room Settings */}
                            {selectedUnit && (
                                <div className="space-y-6 pt-6 border-t border-emerald-500/20 animate-in slide-in-from-left-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-white text-lg">ห้อง {selectedUnit.room_number}</h3>
                                        <Button type="button" variant="destructive" size="icon" onClick={() => handleDeleteUnit(selectedUnit.id)} className="h-8 w-8 rounded-lg">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    
                                    <Button 
                                        type="button"
                                        onClick={() => setEditingRoomId(selectedUnit.id)}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-10 flex items-center justify-center gap-2"
                                    >
                                        <Maximize2 className="w-4 h-4" /> แก้ไขผังภายใน (Edit Internal)
                                    </Button>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500">ทิศทางหน้าต่าง</label>
                                            <div className="grid grid-cols-2 gap-1 bg-slate-800 p-1 rounded-lg">
                                                {['TOP', 'BOTTOM', 'LEFT', 'RIGHT'].map(side => (
                                                    <button key={side} type="button" onClick={() => updateUnit(selectedUnit.id, { window_side: side })} className={`text-[9px] py-1 rounded font-bold ${selectedUnit.window_side === side ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>
                                                        {side}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500">ทิศทางประตู</label>
                                            <div className="grid grid-cols-2 gap-1 bg-slate-800 p-1 rounded-lg">
                                                {['TOP', 'BOTTOM', 'LEFT', 'RIGHT'].map(side => (
                                                    <button key={side} type="button" onClick={() => updateUnit(selectedUnit.id, { door_side: side })} className={`text-[9px] py-1 rounded font-bold ${selectedUnit.door_side === side ? 'bg-blue-500 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>
                                                        {side}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status & Price Editor */}
                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">สถานะห้อง (Status)</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                <button 
                                                    type="button" 
                                                    onClick={() => updateUnit(selectedUnit.id, { status: 'AVAILABLE' })}
                                                    className={`py-2 rounded-xl text-[10px] font-bold border-2 transition-all ${selectedUnit.status === 'AVAILABLE' ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700'}`}
                                                >
                                                    ว่าง
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => updateUnit(selectedUnit.id, { status: 'BOOKED' })}
                                                    className={`py-2 rounded-xl text-[10px] font-bold border-2 transition-all ${selectedUnit.status === 'BOOKED' ? 'bg-yellow-500 border-yellow-400 text-white shadow-lg shadow-yellow-500/20' : 'bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700'}`}
                                                >
                                                    จองแล้ว
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => updateUnit(selectedUnit.id, { status: 'SOLD' })}
                                                    className={`py-2 rounded-xl text-[10px] font-bold border-2 transition-all ${selectedUnit.status === 'SOLD' ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700'}`}
                                                >
                                                    ขายแล้ว
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">ราคาห้องนี้ (Price - THB)</label>
                                            <input 
                                                type="number"
                                                value={selectedUnit.price || 0}
                                                onChange={(e) => updateUnit(selectedUnit.id, { price: Number(e.target.value) })}
                                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                                placeholder="ระบุราคาห้อง..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-slate-500">ขนาดและตำแหน่ง (Use Arrows)</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-slate-800 p-2 rounded-xl flex flex-col items-center gap-1">
                                                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Width (W)</p>
                                                <div className="flex gap-2 text-white font-black text-xs">
                                                    <ChevronLeft className="w-4 h-4 cursor-pointer hover:text-emerald-400" onClick={() => updateUnit(selectedUnit.id, { grid_w: Math.max(1, selectedUnit.grid_w - 1) })} />
                                                    {selectedUnit.grid_w}
                                                    <ChevronRight className="w-4 h-4 cursor-pointer hover:text-emerald-400" onClick={() => updateUnit(selectedUnit.id, { grid_w: Math.min(GRID_SIZE - selectedUnit.grid_x, selectedUnit.grid_w + 1) })} />
                                                </div>
                                            </div>
                                            <div className="bg-slate-800 p-2 rounded-xl flex flex-col items-center gap-1">
                                                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Height (H)</p>
                                                <div className="flex gap-2 text-white font-black text-xs">
                                                    <ChevronDown className="w-4 h-4 cursor-pointer hover:text-emerald-400" onClick={() => updateUnit(selectedUnit.id, { grid_h: Math.max(1, selectedUnit.grid_h - 1) })} />
                                                    {selectedUnit.grid_h}
                                                    <ChevronUp className="w-4 h-4 cursor-pointer hover:text-emerald-400" onClick={() => updateUnit(selectedUnit.id, { grid_h: Math.min(GRID_SIZE - selectedUnit.grid_y, selectedUnit.grid_h + 1) })} />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <Button 
                                            type="button"
                                            variant="outline" 
                                            onClick={() => {
                                                // Rotate: Swap W and H
                                                const nextW = selectedUnit.grid_h;
                                                const nextH = selectedUnit.grid_w;
                                                // Check bounds after rotation
                                                const finalW = Math.min(GRID_SIZE - selectedUnit.grid_x, nextW);
                                                const finalH = Math.min(GRID_SIZE - selectedUnit.grid_y, nextH);
                                                updateUnit(selectedUnit.id, { grid_w: finalW, grid_h: finalH });
                                            }}
                                            className="w-full text-[10px] h-8 rounded-xl border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                                        >
                                            <RotateCw className="w-3 h-3 mr-2" /> หมุนห้อง (Rotate 90°)
                                        </Button>

                                        <div className="bg-slate-800 p-3 rounded-xl flex flex-col items-center gap-1">
                                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Position</p>
                                            <div className="flex gap-4 text-white">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-500">X:</span>
                                                    <ChevronLeft className="w-4 h-4 cursor-pointer hover:text-blue-400" onClick={() => updateUnit(selectedUnit.id, { grid_x: selectedUnit.grid_x - 1 })} />
                                                    <span className="text-xs">{selectedUnit.grid_x}</span>
                                                    <ChevronRight className="w-4 h-4 cursor-pointer hover:text-blue-400" onClick={() => updateUnit(selectedUnit.id, { grid_x: selectedUnit.grid_x + 1 })} />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-500">Y:</span>
                                                    <ChevronDown className="w-4 h-4 cursor-pointer hover:text-blue-400" onClick={() => updateUnit(selectedUnit.id, { grid_y: selectedUnit.grid_y - 1 })} />
                                                    <span className="text-xs">{selectedUnit.grid_y}</span>
                                                    <ChevronUp className="w-4 h-4 cursor-pointer hover:text-blue-400" onClick={() => updateUnit(selectedUnit.id, { grid_y: selectedUnit.grid_y + 1 })} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {collisionInActiveFloor && (
                                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-rose-200 leading-relaxed">พบการทับซ้อนในชั้นนี้ กรุณาจัดระเบียบผัง</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-6">
                            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest pl-1">องค์ประกอบในห้อง (Components)</label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button type="button" onClick={() => handleAddComponent('BED')} variant="outline" className="h-14 flex-col text-[10px] rounded-xl border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-400">
                                    <Bed className="w-5 h-5 mb-1" /> Bedroom
                                </Button>
                                <Button type="button" onClick={() => handleAddComponent('BATH')} variant="outline" className="h-14 flex-col text-[10px] rounded-xl border-blue-500/20 hover:bg-blue-500/10 text-blue-400">
                                    <Bath className="w-5 h-5 mb-1" /> Bathroom
                                </Button>
                                <Button type="button" onClick={() => handleAddComponent('KITCHEN')} variant="outline" className="h-14 flex-col text-[10px] rounded-xl border-orange-500/20 hover:bg-orange-500/10 text-orange-400">
                                    <Utensils className="w-5 h-5 mb-1" /> Kitchen
                                </Button>
                                <Button onClick={() => handleAddComponent('LIVING')} variant="outline" className="h-14 flex-col text-[10px] rounded-xl border-purple-500/20 hover:bg-purple-500/10 text-purple-400">
                                    <Coffee className="w-5 h-5 mb-1" /> Living
                                </Button>
                                <Button onClick={() => handleAddComponent('TV')} variant="outline" className="h-14 flex-col text-[10px] rounded-xl border-slate-500/20 hover:bg-slate-500/10 text-slate-300">
                                    <Tv className="w-5 h-5 mb-1" /> TV Area
                                </Button>
                                <Button onClick={() => handleAddComponent('BALCONY')} variant="outline" className="h-14 flex-col text-[10px] rounded-xl border-cyan-500/20 hover:bg-cyan-500/10 text-cyan-400">
                                    <AlignLeft className="w-5 h-5 mb-1" /> Balcony
                                </Button>
                            </div>
                            
                            <p className="text-[10px] text-slate-500 leading-relaxed italic">
                                * คุณสามารถลากองค์ประกอบภายในผังได้เลย หรือใช้ปุ่มลูกศรที่โผล่มาตอนเอาเมาส์จิ้มเพื่อปรับขนาด
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex-1 bg-slate-950 p-8 flex items-center justify-center relative overflow-auto custom-scrollbar">
                    {!editingRoomId ? (
                        <div 
                            ref={mainGridRef}
                            onMouseMove={handleFloorMouseMove}
                            className="relative bg-slate-900 shadow-2xl border border-white/5"
                            style={{ 
                                width: 600, height: 600, 
                                display: 'grid', 
                                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                                gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
                            }}
                        >
                            <div className="absolute inset-0 pointer-events-none opacity-20" 
                                 style={{ 
                                    backgroundImage: `linear-gradient(to right, #475569 1px, transparent 1px), linear-gradient(to bottom, #475569 1px, transparent 1px)`,
                                    backgroundSize: `${600 / GRID_SIZE}px ${600 / GRID_SIZE}px`
                                 }}
                            ></div>
                            {floorUnits.map(unit => {
                                const isSelected = selectedUnitId === unit.id;
                                const hasCollision = checkCollision(unit, floorUnits);
                                let bgColor = isSelected ? 'bg-emerald-500/20 border-emerald-500 z-10 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-slate-800/80 border-slate-700 hover:border-slate-500';
                                if (unit.unit_type === 'LIFT') bgColor = 'bg-blue-600 border-blue-400 text-white';
                                if (unit.unit_type === 'HALLWAY') bgColor = 'bg-slate-100 border-slate-300 text-slate-400';
                                if (unit.unit_type === 'EXIT') bgColor = 'bg-rose-600 border-rose-400 text-white';

                                return (
                                    <div
                                        key={unit.id}
                                        onMouseDown={(e) => handleFloorMouseDown(e, unit)}
                                        onClick={() => setSelectedUnitId(unit.id)}
                                        className={`absolute cursor-move transition-all duration-200 flex flex-col items-center justify-center border-2 ${bgColor} 
                                            ${hasCollision ? 'border-yellow-500 animate-pulse' : ''}
                                            ${draggingFloorId === unit.id ? 'z-50 scale-105 shadow-2xl ring-2 ring-emerald-500/20' : ''}
                                        `}
                                        style={{
                                            left: `${(unit.grid_x / GRID_SIZE) * 100}%`,
                                            top: `${(unit.grid_y / GRID_SIZE) * 100}%`,
                                            width: `${(unit.grid_w / GRID_SIZE) * 100}%`,
                                            height: `${(unit.grid_h / GRID_SIZE) * 100}%`,
                                            borderRadius: unit.unit_type === 'HALLWAY' ? '0' : '8px'
                                        }}
                                    >
                                        <span className={`font-black text-[10px] pointer-events-none ${unit.unit_type === 'HALLWAY' ? 'opacity-30' : ''}`}>{unit.room_number}</span>
                                        {unit.door_side && (
                                            <div className={`absolute w-1.5 h-1.5 bg-blue-500 rounded-full pointer-events-none ${
                                                unit.door_side === 'TOP' ? 'top-0 left-1/2 -px-1/2 -translate-y-1/2' :
                                                unit.door_side === 'BOTTOM' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' :
                                                unit.door_side === 'LEFT' ? 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2' :
                                                'right-0 top-1/2 translate-x-1/2 -translate-y-1/2'
                                            }`}></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="relative flex flex-col items-center gap-8 animate-in zoom-in-95 duration-500">
                             <div 
                                ref={roomGridRef}
                                onMouseMove={handleCompMouseMove}
                                className="relative bg-white shadow-2xl rounded-3xl border-8 border-slate-800 overflow-hidden"
                                style={{ 
                                    width: 500, height: 500, 
                                    display: 'grid', 
                                    gridTemplateColumns: `repeat(${ROOM_GRID_SIZE}, 1fr)`,
                                    gridTemplateRows: `repeat(${ROOM_GRID_SIZE}, 1fr)`
                                }}
                            >
                                {/* Grid Lines */}
                                <div className="absolute inset-0 pointer-events-none opacity-[0.05]" 
                                     style={{ 
                                        backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
                                        backgroundSize: `${500 / ROOM_GRID_SIZE}px ${500 / ROOM_GRID_SIZE}px`
                                     }}
                                ></div>

                                {(editingUnit?.layout_json?.components || []).map(comp => (
                                    <div
                                        key={comp.id}
                                        onMouseDown={(e) => handleCompMouseDown(e, comp)}
                                        className={`absolute flex flex-col items-center justify-center border-2 rounded-xl group transition-all cursor-move
                                            ${draggingCompId === comp.id ? 'z-50 opacity-100 scale-105 shadow-2xl ring-4 ring-blue-500/20' : 'opacity-100 shadow-sm'}
                                            ${comp.type === 'BED' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : ''}
                                            ${comp.type === 'BATH' ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}
                                            ${comp.type === 'KITCHEN' ? 'bg-orange-50 border-orange-200 text-orange-600' : ''}
                                            ${comp.type === 'LIVING' ? 'bg-purple-50 border-purple-200 text-purple-600' : ''}
                                            ${comp.type === 'TV' ? 'bg-slate-50 border-slate-200 text-slate-600' : ''}
                                            ${comp.type === 'BALCONY' ? 'bg-cyan-50 border-cyan-200 text-cyan-600' : ''}
                                            ${comp.type === 'CLOSET' ? 'bg-yellow-50 border-yellow-200 text-yellow-600' : ''}
                                        `}
                                        style={{
                                            left: `${(comp.x / ROOM_GRID_SIZE) * 100}%`,
                                            top: `${(comp.y / ROOM_GRID_SIZE) * 100}%`,
                                            width: `${(comp.w / ROOM_GRID_SIZE) * 100}%`,
                                            height: `${(comp.h / ROOM_GRID_SIZE) * 100}%`
                                        }}
                                    >
                                        <div className="flex flex-col items-center gap-1 p-1 pointer-events-none">
                                            {comp.type === 'BED' && <Bed className="w-6 h-6" />}
                                            {comp.type === 'BATH' && <Bath className="w-5 h-5" />}
                                            {comp.type === 'KITCHEN' && <Utensils className="w-5 h-5" />}
                                            {comp.type === 'LIVING' && <Coffee className="w-5 h-5" />}
                                            {comp.type === 'TV' && <Tv className="w-5 h-5" />}
                                            <span className="text-[10px] font-bold uppercase">{comp.type}</span>
                                        </div>

                                        {/* Resize/Action Overlay */}
                                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-2">
                                            <div className="bg-white/95 backdrop-blur-sm p-3 rounded-2xl shadow-2xl flex flex-col gap-3 scale-90 origin-center transition-transform hover:scale-100">
                                                <div className="flex flex-col gap-2">
                                                    {/* Width Controls */}
                                                    <div className="flex items-center justify-between gap-4 border-b border-black/5 pb-2">
                                                        <span className="text-[10px] font-black text-slate-400">WIDTH</span>
                                                        <div className="flex items-center gap-3">
                                                            <button 
                                                                type="button"
                                                                onMouseDown={(e) => e.stopPropagation()} 
                                                                onClick={(e) => { e.stopPropagation(); updateComponent(comp.id, { w: Math.max(1, comp.w - 1) }); }}
                                                                className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                                                            >
                                                                <Minus className="w-3 h-3" />
                                                            </button>
                                                            <span className="text-xs font-black text-slate-800 w-4 text-center">{comp.w}</span>
                                                            <button 
                                                                type="button"
                                                                onMouseDown={(e) => e.stopPropagation()} 
                                                                onClick={(e) => { e.stopPropagation(); updateComponent(comp.id, { w: Math.min(ROOM_GRID_SIZE - comp.x, comp.w + 1) }); }}
                                                                className="w-6 h-6 flex items-center justify-center bg-emerald-100 hover:bg-emerald-200 rounded-lg text-emerald-600 transition-colors"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Height Controls */}
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-[10px] font-black text-slate-400">HEIGHT</span>
                                                        <div className="flex items-center gap-3">
                                                            <button 
                                                                type="button"
                                                                onMouseDown={(e) => e.stopPropagation()} 
                                                                onClick={(e) => { e.stopPropagation(); updateComponent(comp.id, { h: Math.max(1, comp.h - 1) }); }}
                                                                className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                                                            >
                                                                <Minus className="w-3 h-3" />
                                                            </button>
                                                            <span className="text-xs font-black text-slate-800 w-4 text-center">{comp.h}</span>
                                                            <button 
                                                                type="button"
                                                                onMouseDown={(e) => e.stopPropagation()} 
                                                                onClick={(e) => { e.stopPropagation(); updateComponent(comp.id, { h: Math.min(ROOM_GRID_SIZE - comp.y, comp.h + 1) }); }}
                                                                className="w-6 h-6 flex items-center justify-center bg-emerald-100 hover:bg-emerald-200 rounded-lg text-emerald-600 transition-colors"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button 
                                                    type="button"
                                                    variant="destructive" 
                                                    size="sm" 
                                                    onMouseDown={(e) => e.stopPropagation()} 
                                                    onClick={(e) => { e.stopPropagation(); removeComponent(comp.id); }}
                                                    className="w-full h-8 rounded-xl text-[10px] font-bold"
                                                >
                                                    <Trash2 className="w-3 h-3 mr-2" /> ลบออก
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-slate-900/80 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/10 flex gap-10 items-center">
                                <p className="text-white font-bold text-sm flex items-center gap-2">
                                    <Maximize2 className="w-4 h-4 text-emerald-400" /> Mouse Drag Enabled
                                </p>
                                <div className="h-6 w-px bg-white/10"></div>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase"><Bed className="w-4 h-4" /> Bed</div>
                                    <div className="flex items-center gap-2 text-[10px] text-blue-400 font-bold uppercase"><Bath className="w-4 h-4" /> Bath</div>
                                    <div className="flex items-center gap-2 text-[10px] text-orange-400 font-bold uppercase"><Utensils className="w-4 h-4" /> Kitchen</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
