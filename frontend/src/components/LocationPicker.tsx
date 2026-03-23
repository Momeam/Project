'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { Search, Navigation, Loader2 } from 'lucide-react';

// ⭐️⭐️ เพิ่ม Import นี้ครับ ⭐️⭐️
import { Input } from "@/components/ui/input"; 

interface LocationPickerProps {
    onLocationSelect: (lat: number, lng: number) => void;
    initialPosition?: [number, number];
}

function MapController({ center }: { center: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, 16, { duration: 1.5 });
    }, [center, map]);
    return null;
}

function DraggableMarker({ position, onPositionChange }: { position: [number, number] | null, onPositionChange: (lat: number, lng: number) => void }) {
    const markerRef = useRef<any>(null);
    useMapEvents({ click(e) { onPositionChange(e.latlng.lat, e.latlng.lng); }, });
    const eventHandlers = useMemo(() => ({
        dragend() {
            const marker = markerRef.current;
            if (marker) {
                const { lat, lng } = marker.getLatLng();
                onPositionChange(lat, lng);
            }
        },
    }), [onPositionChange]);

    return position === null ? null : (
        <Marker draggable={true} eventHandlers={eventHandlers} position={position} ref={markerRef} />
    );
}

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect, initialPosition }) => {
    const defaultPosition: [number, number] = [13.7563, 100.5018]; // Default: Bangkok
    const [position, setPosition] = useState<[number, number] | null>(initialPosition || null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [mapCenter, setMapCenter] = useState<[number, number] | null>(initialPosition || defaultPosition);

    const handleSelectLocation = (lat: number, lng: number) => {
        setPosition([lat, lng]);
        onLocationSelect(lat, lng);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=th&limit=1`);
            const data = await response.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                setMapCenter([lat, lon]);
                handleSelectLocation(lat, lon);
            } else {
                alert("ไม่พบสถานที่นี้");
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsSearching(false);
        }
    };
    
    const handleCurrentLocation = () => {
        if (navigator.geolocation) {
            setIsSearching(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setMapCenter([latitude, longitude]);
                    handleSelectLocation(latitude, longitude);
                    setIsSearching(false);
                },
                (err) => {
                    console.error(err);
                    alert("ไม่สามารถดึงตำแหน่งปัจจุบันได้");
                    setIsSearching(false);
                }
            );
        } else {
            alert("เบราว์เซอร์ไม่รองรับ");
        }
    };

    return (
        <div className="flex flex-col gap-3 h-full w-full">
            {/* ส่วนควบคุม (Search & Current Location) */}
            <div className="flex gap-2 relative z-10">
                <div className="relative flex-1">
                    {/* ใช้ Component Input ที่ import มา */}
                    <Input 
                        type="text" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())} 
                        placeholder="ค้นหาสถานที่..." 
                        className="w-full pl-4 pr-10 py-2 dark:bg-gray-700 dark:text-white" 
                    />
                    <button type="button" onClick={handleSearch} disabled={isSearching} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 dark:text-gray-400">
                        {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    </button>
                </div>
                <button type="button" onClick={handleCurrentLocation} className="p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 transition-colors">
                    <Navigation className="w-5 h-5" />
                </button>
            </div>
            
            {/* ส่วนแสดงแผนที่ */}
            <div className="h-full w-full rounded-lg border border-gray-300 overflow-hidden relative z-0">
                <MapContainer 
                    center={mapCenter || defaultPosition} 
                    zoom={13} 
                    scrollWheelZoom={true} 
                    style={{ height: '100%', width: '100%', cursor: 'crosshair' }}
                >
                    <TileLayer attribution='© OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapController center={mapCenter} />
                    <DraggableMarker position={position} onPositionChange={handleSelectLocation} />
                </MapContainer>
            </div>
            
            {/* แสดงพิกัด */}
            <div className="text-xs text-gray-500 text-center dark:text-gray-400">
                {position ? `พิกัด: ${position[0].toFixed(6)}, ${position[1].toFixed(6)}` : "ค้นหา หรือ คลิกบนแผนที่เพื่อระบุตำแหน่ง"}
            </div>
        </div>
    );
};

export default LocationPicker;