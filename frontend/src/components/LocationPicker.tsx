'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { Search, Navigation, Loader2, MapPin, X } from 'lucide-react';

import { Input } from "@/components/ui/input"; 

interface LocationPickerProps {
    onLocationSelect: (lat: number, lng: number) => void;
    initialPosition?: [number, number];
}

interface SearchResult {
    place_id: number;
    lat: string;
    lon: string;
    display_name: string;
    address?: {
        road?: string;
        suburb?: string;
        city_district?: string;
        city?: string;
        state?: string;
        postcode?: string;
        country?: string;
        neighbourhood?: string;
        quarter?: string;
        village?: string;
        town?: string;
        county?: string;
    };
    type?: string;
    class?: string;
}

function MapController({ center }: { center: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, 17, { duration: 1.5 });
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

// ⭐️ ฟังก์ชันจัดรูปแบบที่อยู่ให้อ่านง่าย
function formatAddress(result: SearchResult): { main: string; detail: string } {
    const addr = result.address;
    if (!addr) return { main: result.display_name.split(',')[0], detail: result.display_name };

    const road = addr.road || '';
    const neighbourhood = addr.neighbourhood || addr.quarter || '';
    const suburb = addr.suburb || addr.village || addr.town || '';
    const district = addr.city_district || addr.county || '';
    const city = addr.city || addr.state || '';
    const postcode = addr.postcode || '';

    // สร้างชื่อหลัก (เน้นถนน/ซอย)
    const mainParts = [road, neighbourhood].filter(Boolean);
    const main = mainParts.length > 0 ? mainParts.join(', ') : result.display_name.split(',')[0];

    // สร้างรายละเอียด (แขวง/เขต/จังหวัด)
    const detailParts = [suburb, district, city, postcode].filter(Boolean);
    const detail = detailParts.join(', ');

    return { main, detail };
}

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect, initialPosition }) => {
    const defaultPosition: [number, number] = [13.7563, 100.5018]; // Default: Bangkok
    const [position, setPosition] = useState<[number, number] | null>(initialPosition || null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [mapCenter, setMapCenter] = useState<[number, number] | null>(initialPosition || defaultPosition);
    
    // ⭐️ ระบบ Autocomplete Search
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState('');
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    const handleSelectLocation = (lat: number, lng: number) => {
        setPosition([lat, lng]);
        onLocationSelect(lat, lng);
    };

    // ⭐️ ค้นหาแบบ Autocomplete (แสดงผลหลายรายการ + รายละเอียดที่อยู่)
    const performSearch = useCallback(async (query: string) => {
        if (!query.trim() || query.trim().length < 2) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        setIsSearching(true);
        try {
            // ใช้ addressdetails=1 เพื่อให้ได้ข้อมูลที่อยู่ละเอียด, limit=8 เพื่อแสดงหลายรายการ
            // ใช้ viewbox ของประเทศไทยเพื่อให้ผลลัพธ์แม่นยำขึ้น
            const params = new URLSearchParams({
                format: 'json',
                q: query,
                countrycodes: 'th',
                limit: '8',
                addressdetails: '1',
                'accept-language': 'th,en',
                viewbox: '97.3,20.5,105.7,5.6',  // Bounding box ของประเทศไทย
                bounded: '1',
            });
            
            const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
            const data: SearchResult[] = await response.json();
            
            if (data && data.length > 0) {
                setSearchResults(data);
                setShowDropdown(true);
            } else {
                setSearchResults([]);
                setShowDropdown(true); // แสดง "ไม่พบ"
            }
        } catch (error) {
            console.error("Search error:", error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // ⭐️ Debounce การพิมพ์ (รอ 400ms หลังหยุดพิมพ์)
    const handleSearchInput = (value: string) => {
        setSearchQuery(value);
        setSelectedAddress('');
        
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        
        if (value.trim().length >= 2) {
            debounceTimer.current = setTimeout(() => {
                performSearch(value);
            }, 400);
        } else {
            setSearchResults([]);
            setShowDropdown(false);
        }
    };

    // ⭐️ เลือกผลลัพธ์จาก Dropdown
    const handleSelectResult = (result: SearchResult) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        const { main, detail } = formatAddress(result);
        
        setMapCenter([lat, lon]);
        handleSelectLocation(lat, lon);
        setSearchQuery(`${main}${detail ? ', ' + detail : ''}`);
        setSelectedAddress(`${main}${detail ? ', ' + detail : ''}`);
        setShowDropdown(false);
        setSearchResults([]);
    };

    // ⭐️ กด Enter = ค้นหาทันที
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            performSearch(searchQuery);
        }
        if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    // ⭐️ ปิด Dropdown เมื่อคลิกข้างนอก
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const handleCurrentLocation = () => {
        if (navigator.geolocation) {
            setIsSearching(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setMapCenter([latitude, longitude]);
                    handleSelectLocation(latitude, longitude);
                    setIsSearching(false);
                    setSelectedAddress('ตำแหน่งปัจจุบันของคุณ');
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
            {/* ส่วนค้นหาแบบ Autocomplete */}
            <div className="flex gap-2 relative z-10" ref={searchContainerRef}>
                <div className="relative flex-1">
                    <Input 
                        type="text" 
                        value={searchQuery} 
                        onChange={(e) => handleSearchInput(e.target.value)} 
                        onKeyDown={handleKeyDown}
                        onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                        placeholder="ค้นหาสถานที่ เช่น ซอยสุขุมวิท 8 คลองเตย, ถนนพระราม 9..." 
                        className="w-full pl-4 pr-10 py-2 dark:bg-gray-700 dark:text-white" 
                    />
                    <button 
                        type="button" 
                        onClick={() => {
                            if (searchQuery) {
                                if (debounceTimer.current) clearTimeout(debounceTimer.current);
                                performSearch(searchQuery);
                            }
                        }} 
                        disabled={isSearching} 
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 dark:text-gray-400"
                    >
                        {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    </button>

                    {/* ⭐️ Dropdown ผลการค้นหา */}
                    {showDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-h-72 overflow-y-auto z-50">
                            {searchResults.length > 0 ? (
                                <>
                                    <div className="px-3 py-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                        พบ {searchResults.length} ผลลัพธ์ — เลือกสถานที่ที่ถูกต้อง
                                    </div>
                                    {searchResults.map((result, index) => {
                                        const { main, detail } = formatAddress(result);
                                        return (
                                            <button
                                                key={result.place_id || index}
                                                type="button"
                                                onClick={() => handleSelectResult(result)}
                                                className="w-full text-left px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-b-0 flex items-start gap-2.5"
                                            >
                                                <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                                                        {main}
                                                    </p>
                                                    {detail && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                            {detail}
                                                        </p>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </>
                            ) : (
                                <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                                    <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                    <p className="font-medium">ไม่พบสถานที่นี้</p>
                                    <p className="text-xs mt-1">ลองเพิ่มรายละเอียดเช่น ถนน, แขวง, เขต</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <button type="button" onClick={handleCurrentLocation} className="p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 transition-colors" title="ใช้ตำแหน่งปัจจุบัน">
                    <Navigation className="w-5 h-5" />
                </button>
            </div>

            {/* แสดงที่อยู่ที่เลือก */}
            {selectedAddress && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{selectedAddress}</span>
                    <button 
                        type="button" 
                        onClick={() => { setSelectedAddress(''); setSearchQuery(''); setPosition(null); }}
                        className="ml-auto flex-shrink-0 hover:text-red-500 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
            
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