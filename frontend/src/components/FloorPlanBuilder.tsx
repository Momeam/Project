'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { 
    Plus, Minus, Save, Trash2, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
    DoorOpen, Layout, Maximize2, AlertTriangle, Home, Bed, Bath, 
    Smartphone as Tv, Coffee, Utensils, AlignLeft, RotateCw, Copy, ClipboardCheck, Wand2
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
    unit_type: 'ROOM' | 'LIFT' | 'HALLWAY' | 'EXIT' | 'MAIN_GATE' | 'OFFICE' | 'FITNESS' | 'POOL' | 'GARDEN' | 'LIBRARY';
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
    const [activeFloor, setActiveFloor] = useState(totalFloors > 1 ? 2 : 1);
    const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
    const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [selectedUnitIds, setSelectedUnitIds] = useState<number[]>([]);
    const [copiedLayout, setCopiedLayout] = useState<any | null>(null);

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

    const handleAddRoom = async (type: Unit['unit_type'] = 'ROOM', name?: string) => {
        const roomName = name || newRoomName || (type === 'ROOM' ? 'New' : type);
        if (!roomName.trim()) return;
        
        const config: Record<string, { w: number, h: number, color?: string }> = {
            ROOM: { w: 4, h: 4 },
            LIFT: { w: 2, h: 2 },
            HALLWAY: { w: 4, h: 2 },
            EXIT: { w: 2, h: 2 },
            MAIN_GATE: { w: 4, h: 2 },
            OFFICE: { w: 4, h: 4 },
            FITNESS: { w: 6, h: 6 },
            POOL: { w: 10, h: 6 },
            GARDEN: { w: 6, h: 4 },
            LIBRARY: { w: 6, h: 4 }
        };

        try {
            const res = await fetch(`/api/properties/units`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    property_id: propertyId,
                    floor_number: activeFloor,
                    room_number: roomName,
                    unit_type: type,
                    grid_x: 0,
                    grid_y: 0,
                    grid_w: config[type]?.w || 4,
                    grid_h: config[type]?.h || 4
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

    const handleCopyFloor = async (fromFloor: number) => {
        if (fromFloor === activeFloor) return;
        if (!window.confirm(`คัดลอกผังจากชั้น ${fromFloor} มายังชั้น ${activeFloor}?\n\n⚠️ ข้อมูลเดิมในชั้นนี้จะถูกลบ\n✅ สถานะทุกห้องจะถูกรีเซ็ตเป็น "ว่าง"\n✅ ราคาจะถูกรีเซ็ตเป็น 0\n📐 เก็บเฉพาะรูปแบบการวางและผังภายใน`)) return;

        setIsSaving(true);
        try {
            // 1. ลบหน่วยในชั้นปัจจุบันก่อน
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || `/api`}/properties/${propertyId}/floors/${activeFloor}/units`, {
                method: 'DELETE'
            });

            // 2. กรองหน่วยจากชั้นต้นทาง — รีเซ็ตข้อมูลธุรกรรมทั้งหมด คงไว้แค่เลย์เอ้าท์
            const sourceUnits = units.filter(u => u.floor_number === fromFloor);
            const unitsToCopy = sourceUnits.map(u => ({
                property_id: u.property_id,
                floor_number: activeFloor,
                // เก็บเฉพาะ layout & placement data
                grid_x: u.grid_x,
                grid_y: u.grid_y,
                grid_w: u.grid_w,
                grid_h: u.grid_h,
                door_side: u.door_side,
                window_side: u.window_side,
                unit_type: u.unit_type,
                layout_json: u.layout_json,
                // รีเซ็ตข้อมูลธุรกรรม
                status: 'AVAILABLE',
                price: 0,
                // เปลี่ยนเลขห้องให้ตรงกับชั้นใหม่
                room_number: u.unit_type === 'ROOM' ? u.room_number.replace(new RegExp(`^${fromFloor}`), `${activeFloor}`) : u.room_number
            }));

            const res = await fetch(`/api/properties/units/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ units: unitsToCopy })
            });

            if (res.ok) {
                const { units: newUnits } = await res.json();
                setUnits(prev => [
                    ...prev.filter(u => u.floor_number !== activeFloor),
                    ...newUnits
                ]);
                alert('คัดลอกผังสำเร็จ! 🎉\nสถานะทุกห้องถูกรีเซ็ตเป็น "ว่าง" แล้ว');
            }
        } catch (error) {
            console.error('Error copying floor:', error);
            alert('เกิดข้อผิดพลาดในการคัดลอกผัง');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAlignDoor = (unitId: number) => {
        const unit = units.find(u => u.id === unitId);
        if (!unit) return;

        // Find nearest hallway
        const hallways = units.filter(u => u.floor_number === activeFloor && u.unit_type === 'HALLWAY');
        if (hallways.length === 0) {
            alert('ไม่พบพื้นที่ทางเดินในชั้นนี้สำหรับใช้อ้างอิง');
            return;
        }

        let nearestHallway = hallways[0];
        let minDistance = Infinity;

        hallways.forEach(hall => {
            const dx = Math.max(unit.grid_x, hall.grid_x) - Math.min(unit.grid_x + unit.grid_w, hall.grid_x + hall.grid_w);
            const dy = Math.max(unit.grid_y, hall.grid_y) - Math.min(unit.grid_y + unit.grid_h, hall.grid_y + hall.grid_h);
            const dist = Math.sqrt(Math.max(0, dx)**2 + Math.max(0, dy)**2);
            if (dist < minDistance) {
                minDistance = dist;
                nearestHallway = hall;
            }
        });

        // Determine side
        let side: string = 'TOP';
        if (unit.grid_y >= nearestHallway.grid_y + nearestHallway.grid_h) side = 'TOP';
        else if (unit.grid_y + unit.grid_h <= nearestHallway.grid_y) side = 'BOTTOM';
        else if (unit.grid_x >= nearestHallway.grid_x + nearestHallway.grid_w) side = 'LEFT';
        else if (unit.grid_x + unit.grid_w <= nearestHallway.grid_x) side = 'RIGHT';

        updateUnit(unitId, { door_side: side });
    };

    const handleAutoLayout = async () => {
        if (!window.confirm('คำเตือน: การจัดผังอัตโนมัติจะล้างข้อมูลห้องเดิมในชั้นนี้ทั้งหมด และแทนที่ด้วยเทมเพลตมาตรฐาน คุณต้องการดำเนินการต่อหรือไม่?')) return;
        
        setIsSaving(true);
        try {
            const deleteRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `/api`}/properties/${propertyId}/floors/${activeFloor}/units`, {
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

            const createRes = await fetch(`/api/properties/units/bulk`, {
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `/api`}/properties/units/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setUnits(prev => prev.filter(u => u.id !== id));
                setSelectedUnitId(null);
                setSelectedUnitIds(prev => prev.filter(uid => uid !== id));
            }
        } catch (error) {
            console.error('Error deleting unit:', error);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedUnitIds.length === 0) return;
        if (!window.confirm(`ลบห้องที่เลือกทั้งหมด ${selectedUnitIds.length} ห้อง?`)) return;

        setIsSaving(true);
        try {
            const res = await fetch(`/api/properties/units/bulk-delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedUnitIds })
            });
            if (res.ok) {
                setUnits(prev => prev.filter(u => !selectedUnitIds.includes(u.id)));
                setSelectedUnitIds([]);
                setSelectedUnitId(null);
                alert('ลบห้องที่เลือกสำเร็จ!');
            }
        } catch (error) {
            console.error('Error in bulk delete:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClearFloor = async () => {
        if (!window.confirm(`⚠️ คำเตือน: คุณต้องการลบห้องทั้งหมดในชั้นที่ ${activeFloor} ใช่หรือไม่? ข้อมูลจะหายไปถาวร`)) return;

        setIsSaving(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `/api`}/properties/${propertyId}/floors/${activeFloor}/units`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setUnits(prev => prev.filter(u => u.floor_number !== activeFloor));
                setSelectedUnitIds([]);
                setSelectedUnitId(null);
                alert('ล้างข้อมูลชั้นสำเร็จ!');
            }
        } catch (error) {
            console.error('Error clearing floor:', error);
        } finally {
            setIsSaving(false);
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
            const res = await fetch(`/api/properties/units/bulk`, {
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

    const handleCopyUnitLayout = (unit: Unit) => {
        if (!unit.layout_json) {
            alert('ห้องนี้ยังไม่มีผังภายใน กรุณาออกแบบผังก่อนคัดลอก');
            return;
        }
        setCopiedLayout({
            layout_json: unit.layout_json,
            door_side: unit.door_side,
            window_side: unit.window_side,
        });
        alert(`คัดลอกผังภายในห้อง ${unit.room_number} แล้ว! ✨\n(รวมถึงทิศทางประตูและหน้าต่าง)`);
    };

    const handlePasteUnitLayout = (unitId: number) => {
        if (!copiedLayout) return;
        updateUnit(unitId, {
            layout_json: copiedLayout.layout_json,
            door_side: copiedLayout.door_side,
            window_side: copiedLayout.window_side,
        });
        alert('วางผังภายในที่คัดลอกสำเร็จ! 📋');
    };

    const handleBulkPasteLayout = () => {
        if (!copiedLayout) return;
        const roomUnits = floorUnits.filter(u => u.unit_type === 'ROOM');
        if (roomUnits.length === 0) {
            alert('ไม่มีห้องพักในชั้นนี้');
            return;
        }
        if (!window.confirm(`วางผังภายในที่คัดลอกไว้ลงในห้องพักทุกห้องในชั้น ${activeFloor} (${roomUnits.length} ห้อง)?\n\n⚠️ ผังเดิมของทุกห้องจะถูกแทนที่`)) return;
        
        setUnits(prev => prev.map(u => {
            if (u.floor_number === activeFloor && u.unit_type === 'ROOM') {
                return {
                    ...u,
                    layout_json: copiedLayout.layout_json,
                    door_side: copiedLayout.door_side,
                    window_side: copiedLayout.window_side,
                };
            }
            return u;
        }));
        alert(`วางผังภายในลงห้องพักทั้ง ${roomUnits.length} ห้องสำเร็จ! 🎉`);
    };

    const handleAutoInternalLayout = () => {
        if (!editingUnit) return;
        if (editingUnit.layout_json?.components?.length && editingUnit.layout_json.components.length > 0) {
            if (!window.confirm('ห้องนี้มีผังภายในอยู่แล้ว ต้องการจัดใหม่ทั้งหมดหรือไม่?')) return;
        }
        const side = editingUnit.door_side || 'BOTTOM';
        
        // จัดวางอัตโนมัติตามทิศทางประตู — ประตูอยู่ด้านไหน เตียงจะอยู่ฝั่งตรงข้าม
        // เพิ่ม CLOSET + BALCONY ให้ครบ
        let components: RoomComponent[] = [];
        const rid = () => Math.random().toString(36).substr(2, 9);

        if (side === 'TOP') {
            // ประตูอยู่ด้านบน → เตียงอยู่ด้านล่าง, ห้องน้ำมุมบนขวา
            components = [
                { id: rid(), type: 'BED',     x: 0, y: 5, w: 5, h: 4 },
                { id: rid(), type: 'BATH',    x: 7, y: 0, w: 3, h: 3 },
                { id: rid(), type: 'LIVING',  x: 0, y: 1, w: 5, h: 3 },
                { id: rid(), type: 'KITCHEN', x: 6, y: 4, w: 4, h: 2 },
                { id: rid(), type: 'TV',      x: 6, y: 7, w: 2, h: 2 },
                { id: rid(), type: 'CLOSET',  x: 5, y: 5, w: 1, h: 4 },
                { id: rid(), type: 'BALCONY', x: 0, y: 9, w: 10, h: 1 },
            ];
        } else if (side === 'BOTTOM') {
            // ประตูอยู่ด้านล่าง → เตียงอยู่ด้านบน, ห้องน้ำมุมล่างขวา
            components = [
                { id: rid(), type: 'BED',     x: 0, y: 1, w: 5, h: 4 },
                { id: rid(), type: 'BATH',    x: 7, y: 7, w: 3, h: 3 },
                { id: rid(), type: 'LIVING',  x: 0, y: 6, w: 5, h: 3 },
                { id: rid(), type: 'KITCHEN', x: 6, y: 4, w: 4, h: 2 },
                { id: rid(), type: 'TV',      x: 6, y: 1, w: 2, h: 2 },
                { id: rid(), type: 'CLOSET',  x: 5, y: 1, w: 1, h: 4 },
                { id: rid(), type: 'BALCONY', x: 0, y: 0, w: 10, h: 1 },
            ];
        } else if (side === 'LEFT') {
            // ประตูอยู่ด้านซ้าย → เตียงอยู่ด้านขวา, ห้องน้ำมุมซ้ายบน
            components = [
                { id: rid(), type: 'BED',     x: 5, y: 0, w: 4, h: 5 },
                { id: rid(), type: 'BATH',    x: 0, y: 0, w: 3, h: 3 },
                { id: rid(), type: 'LIVING',  x: 0, y: 4, w: 4, h: 3 },
                { id: rid(), type: 'KITCHEN', x: 0, y: 7, w: 4, h: 3 },
                { id: rid(), type: 'TV',      x: 5, y: 6, w: 2, h: 2 },
                { id: rid(), type: 'CLOSET',  x: 5, y: 5, w: 4, h: 1 },
                { id: rid(), type: 'BALCONY', x: 9, y: 0, w: 1, h: 10 },
            ];
        } else { // RIGHT — ประตูอยู่ด้านขวา → เตียงอยู่ด้านซ้าย
            components = [
                { id: rid(), type: 'BED',     x: 1, y: 0, w: 4, h: 5 },
                { id: rid(), type: 'BATH',    x: 7, y: 0, w: 3, h: 3 },
                { id: rid(), type: 'LIVING',  x: 6, y: 4, w: 4, h: 3 },
                { id: rid(), type: 'KITCHEN', x: 6, y: 7, w: 4, h: 3 },
                { id: rid(), type: 'TV',      x: 1, y: 6, w: 2, h: 2 },
                { id: rid(), type: 'CLOSET',  x: 1, y: 5, w: 4, h: 1 },
                { id: rid(), type: 'BALCONY', x: 0, y: 0, w: 1, h: 10 },
            ];
        }

        updateUnit(editingUnit.id, { layout_json: { components } });
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
                                            onClick={() => { setActiveFloor(f); setSelectedUnitId(null); setSelectedUnitIds([]); }}
                                            className={`h-10 rounded-lg font-bold text-sm transition-all ${activeFloor === f ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Add Room / Facilities */}
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest pl-1">เครื่องมือสร้างและจัดการ</label>
                                
                                {activeFloor !== 1 && (
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
                                )}

                                <div className="space-y-4">
                                    {/* Common Facilities - Available on ALL Floors */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">Common Facilities</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button type="button" onClick={() => handleAddRoom('FITNESS', 'ฟิตเนส')} variant="outline" className="text-[10px] h-9 rounded-xl border-purple-500/30 text-purple-400">
                                                🏋️ ฟิตเนส
                                            </Button>
                                            <Button type="button" onClick={() => handleAddRoom('POOL', 'สระว่ายน้ำ')} variant="outline" className="text-[10px] h-9 rounded-xl border-cyan-500/30 text-cyan-400">
                                                🏊 สระว่ายน้ำ
                                            </Button>
                                            <Button type="button" onClick={() => handleAddRoom('GARDEN', 'สวนหย่อม')} variant="outline" className="text-[10px] h-9 rounded-xl border-green-500/30 text-green-400">
                                                🌳 สวนหย่อม
                                            </Button>
                                            <Button type="button" onClick={() => handleAddRoom('LIBRARY', 'ห้องสมุด')} variant="outline" className="text-[10px] h-9 rounded-xl border-orange-500/30 text-orange-400">
                                                📚 ห้องสมุด
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Ground Floor Only Tools */}
                                    {activeFloor === 1 && (
                                        <div className="space-y-2 pt-2 border-t border-white/5">
                                            <label className="text-[9px] font-bold text-rose-400 uppercase tracking-tighter">Ground Floor Only</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button type="button" onClick={() => handleAddRoom('MAIN_GATE', 'ทางเข้าหลัก')} variant="outline" className="text-[10px] h-9 rounded-xl border-emerald-500/30 text-emerald-400">
                                                    🚪 ประตูหลัก
                                                </Button>
                                                <Button type="button" onClick={() => handleAddRoom('OFFICE', 'ห้องนิติ')} variant="outline" className="text-[10px] h-9 rounded-xl border-blue-500/30 text-blue-400">
                                                    🏢 ห้องนิติ
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Infrastructure */}
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
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

                                    {activeFloor !== 1 && (
                                        <Button type="button" onClick={handleAutoLayout} variant="ghost" className="w-full text-[10px] h-9 rounded-xl text-yellow-500 hover:bg-yellow-500/5 border border-yellow-500/20">
                                            ✨ จัดผังมาตรฐาน (Auto Layout)
                                        </Button>
                                    )}

                                    {/* Copy Floor Tool */}
                                    <div className="pt-2 border-t border-white/5">
                                        <label className="text-[9px] uppercase font-bold text-slate-500 tracking-widest pl-1 mb-2 block">คัดลอกผังจากชั้นอื่น</label>
                                        <div className="flex gap-2">
                                            <select 
                                                onChange={(e) => handleCopyFloor(Number(e.target.value))}
                                                className="flex-1 bg-slate-900 border border-white/5 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none"
                                                defaultValue=""
                                            >
                                                <option value="" disabled>เลือกชั้นต้นทาง...</option>
                                                {Array.from({ length: totalFloors }, (_, i) => i + 1)
                                                    .filter(f => f !== activeFloor && f !== 1)
                                                    .map(f => (
                                                        <option key={f} value={f}>ชั้น {f}</option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                        <p className="text-[8px] text-slate-500 mt-1 pl-1 italic">
                                            * ไม่สามารถก็อปปี้ชั้น 1 ได้เนื่องจากมีความพิเศษเฉพาะตัว
                                        </p>
                                    </div>

                                    {/* Bulk Paste Layout Section */}
                                    {copiedLayout && (
                                        <div className="pt-2 border-t border-emerald-500/20">
                                            <label className="text-[9px] uppercase font-bold text-emerald-500 tracking-widest pl-1 mb-2 block flex items-center gap-1">
                                                <ClipboardCheck className="w-3 h-3" /> ผังภายในที่คัดลอกไว้
                                            </label>
                                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 space-y-2">
                                                <p className="text-[9px] text-emerald-300 italic">
                                                    📋 มีผังภายในอยู่ใน Clipboard พร้อมวาง
                                                </p>
                                                <Button 
                                                    type="button"
                                                    onClick={handleBulkPasteLayout}
                                                    className="w-full bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 text-[10px] h-9 rounded-xl font-bold transition-all"
                                                >
                                                    <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" /> วางผังภายในทุกห้องในชั้นนี้
                                                </Button>
                                                <Button 
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => setCopiedLayout(null)}
                                                    className="w-full text-[9px] h-7 text-slate-500 hover:text-rose-400"
                                                >
                                                    ล้าง Clipboard
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Bulk Operations Section */}
                                    <div className="pt-4 border-t border-rose-500/20 space-y-4">
                                        <div className="flex items-center justify-between pl-1">
                                            <label className="text-[10px] uppercase font-black text-rose-500 tracking-widest">Bulk Operations 🗑️</label>
                                            {selectedUnitIds.length > 0 && (
                                                <span className="text-[9px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                                                    {selectedUnitIds.length} Selected
                                                </span>
                                            )}
                                        </div>

                                        <div className="bg-slate-900/50 rounded-xl border border-white/5 overflow-hidden">
                                            <div className="max-h-48 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
                                                {floorUnits.length > 0 ? (
                                                    <>
                                                        <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={selectedUnitIds.length === floorUnits.length && floorUnits.length > 0}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) setSelectedUnitIds(floorUnits.map(u => u.id));
                                                                    else setSelectedUnitIds([]);
                                                                }}
                                                                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                                                            />
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">เลือกทั้งหมด (Select All)</span>
                                                        </div>
                                                        {floorUnits.map(u => (
                                                            <div key={u.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={selectedUnitIds.includes(u.id)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) setSelectedUnitIds(prev => [...prev, u.id]);
                                                                        else setSelectedUnitIds(prev => prev.filter(id => id !== u.id));
                                                                    }}
                                                                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                                                                />
                                                                <span className="text-[10px] text-slate-300 font-medium truncate flex-1">
                                                                    {u.unit_type === 'ROOM' ? `ห้อง ${u.room_number}` : u.room_number}
                                                                </span>
                                                                <span className="text-[8px] text-slate-500 uppercase">{u.unit_type}</span>
                                                            </div>
                                                        ))}
                                                    </>
                                                ) : (
                                                    <p className="text-[10px] text-slate-600 text-center py-4 italic">ไม่มีห้องในชั้นนี้</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <Button 
                                                type="button" 
                                                disabled={selectedUnitIds.length === 0 || isSaving}
                                                onClick={handleBulkDelete}
                                                className="bg-rose-600/20 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/30 text-[10px] h-9 rounded-xl font-bold transition-all disabled:opacity-30 disabled:hover:bg-rose-600/20 disabled:hover:text-rose-500"
                                            >
                                                <Trash2 className="w-3 h-3 mr-1" /> ลบที่เลือก
                                            </Button>
                                            <Button 
                                                type="button" 
                                                disabled={floorUnits.length === 0 || isSaving}
                                                onClick={handleClearFloor}
                                                variant="outline"
                                                className="border-rose-500/50 text-rose-500 hover:bg-rose-500 hover:text-white text-[10px] h-9 rounded-xl font-bold transition-all disabled:opacity-30"
                                            >
                                                <AlertTriangle className="w-3 h-3 mr-1" /> ลบหมดทั้งชั้น
                                            </Button>
                                        </div>
                                    </div>
                                </div>
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
                                    
                                    {selectedUnit.unit_type === 'ROOM' && (
                                        <div className="space-y-2">
                                            <Button 
                                                type="button"
                                                onClick={() => setEditingRoomId(selectedUnit.id)}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-10 flex items-center justify-center gap-2"
                                            >
                                                <Maximize2 className="w-4 h-4" /> แก้ไขผังภายใน (Edit Internal)
                                            </Button>
                                            
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button 
                                                    type="button"
                                                    onClick={() => handleCopyUnitLayout(selectedUnit)}
                                                    variant="outline" 
                                                    className="h-9 text-[10px] rounded-xl border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
                                                >
                                                    <Copy className="w-3.5 h-3.5 mr-1" /> คัดลอกผัง
                                                </Button>
                                                <Button 
                                                    type="button"
                                                    onClick={() => handlePasteUnitLayout(selectedUnit.id)}
                                                    disabled={!copiedLayout}
                                                    variant="outline" 
                                                    className="h-9 text-[10px] rounded-xl border-slate-700 bg-slate-800 text-emerald-400 hover:text-emerald-300 disabled:opacity-30"
                                                >
                                                    <ClipboardCheck className="w-3.5 h-3.5 mr-1" /> วางผัง
                                                </Button>
                                            </div>
                                        </div>
                                    )}

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
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                onClick={() => handleAlignDoor(selectedUnit.id)}
                                                className="w-full h-6 text-[8px] text-blue-400 hover:text-blue-300 p-0"
                                            >
                                                🎯 ปรับทิศให้ตรงทางเดิน
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Status & Price Editor */}
                                    {selectedUnit.unit_type === 'ROOM' && (
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
                                    )}

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
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest pl-1">องค์ประกอบในห้อง (Components)</label>
                                <Button 
                                    type="button"
                                    onClick={handleAutoInternalLayout}
                                    variant="outline" 
                                    className="h-8 px-2 text-[9px] rounded-lg border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                >
                                    <Wand2 className="w-3 h-3 mr-1" /> จัดผังให้ออโต้
                                </Button>
                            </div>
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
                                <Button type="button" onClick={() => handleAddComponent('LIVING')} variant="outline" className="h-14 flex-col text-[10px] rounded-xl border-purple-500/20 hover:bg-purple-500/10 text-purple-400">
                                    <Coffee className="w-5 h-5 mb-1" /> Living
                                </Button>
                                <Button type="button" onClick={() => handleAddComponent('TV')} variant="outline" className="h-14 flex-col text-[10px] rounded-xl border-slate-500/20 hover:bg-slate-500/10 text-slate-300">
                                    <Tv className="w-5 h-5 mb-1" /> TV Area
                                </Button>
                                <Button type="button" onClick={() => handleAddComponent('CLOSET')} variant="outline" className="h-14 flex-col text-[10px] rounded-xl border-yellow-500/20 hover:bg-yellow-500/10 text-yellow-400">
                                    <Home className="w-5 h-5 mb-1" /> Closet
                                </Button>
                                <Button type="button" onClick={() => handleAddComponent('BALCONY')} variant="outline" className="h-14 flex-col text-[10px] rounded-xl border-cyan-500/20 hover:bg-cyan-500/10 text-cyan-400">
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
                                else if (unit.unit_type === 'HALLWAY') bgColor = 'bg-slate-100 border-slate-300 text-slate-400';
                                else if (unit.unit_type === 'EXIT') bgColor = 'bg-rose-600 border-rose-400 text-white';
                                else if (unit.unit_type === 'MAIN_GATE') bgColor = 'bg-emerald-600 border-emerald-400 text-white';
                                else if (unit.unit_type === 'OFFICE') bgColor = 'bg-indigo-600 border-indigo-400 text-white';
                                else if (unit.unit_type === 'FITNESS') bgColor = 'bg-purple-600 border-purple-400 text-white';
                                else if (unit.unit_type === 'POOL') bgColor = 'bg-cyan-500 border-cyan-300 text-white';
                                else if (unit.unit_type === 'GARDEN') bgColor = 'bg-green-600 border-green-400 text-white';
                                else if (unit.unit_type === 'LIBRARY') bgColor = 'bg-orange-600 border-orange-400 text-white';

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
                                        <div className="flex flex-col items-center gap-1 pointer-events-none">
                                           {unit.unit_type === 'FITNESS' && <span className="text-lg">🏋️</span>}
                                           {unit.unit_type === 'POOL' && <span className="text-lg">🏊</span>}
                                           {unit.unit_type === 'MAIN_GATE' && <span className="text-lg">🚪</span>}
                                           {unit.unit_type === 'OFFICE' && <span className="text-lg">🏢</span>}
                                           {unit.unit_type === 'LIBRARY' && <span className="text-lg">📚</span>}
                                           <span className={`font-black text-[10px] ${unit.unit_type === 'HALLWAY' ? 'opacity-30' : ''}`}>{unit.room_number}</span>
                                        </div>
                                        {unit.door_side && (
                                            <div className={`absolute w-1.5 h-1.5 bg-blue-500 rounded-full pointer-events-none ${
                                                unit.door_side === 'TOP' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' :
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

                                {/* Door Position Indicator */}
                                {editingUnit?.door_side && (
                                    <div className={`absolute pointer-events-none z-40 flex items-center justify-center
                                        ${editingUnit.door_side === 'TOP' ? 'top-0 left-1/2 -translate-x-1/2 w-16 h-6' : ''}
                                        ${editingUnit.door_side === 'BOTTOM' ? 'bottom-0 left-1/2 -translate-x-1/2 w-16 h-6' : ''}
                                        ${editingUnit.door_side === 'LEFT' ? 'left-0 top-1/2 -translate-y-1/2 w-6 h-16' : ''}
                                        ${editingUnit.door_side === 'RIGHT' ? 'right-0 top-1/2 -translate-y-1/2 w-6 h-16' : ''}
                                    `}>
                                        <div className="bg-blue-500 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-lg shadow-blue-500/30 flex items-center gap-1 whitespace-nowrap">
                                            <DoorOpen className="w-3 h-3" /> ประตู
                                        </div>
                                    </div>
                                )}

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
                                            {comp.type === 'CLOSET' && <Home className="w-5 h-5" />}
                                            {comp.type === 'BALCONY' && <AlignLeft className="w-5 h-5" />}
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
