'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { Train, School, ShoppingBag, Stethoscope, Utensils, Navigation, Clock, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface MapDisplayProps {
  lat?: number;
  lng?: number;
}

// 1. นิยามหมวดหมู่และ Query (Overpass API)
const CATEGORIES = [
    { id: 'transport', label: 'ขนส่ง', icon: Train, query: `(node["public_transport"="station"](around:2000,LAT,LON);node["railway"="station"](around:2000,LAT,LON););` },
    { id: 'education', label: 'โรงเรียน', icon: School, query: `node["amenity"="school"](around:2000,LAT,LON);` },
    { id: 'shopping', label: 'ช้อปปิ้ง', icon: ShoppingBag, query: `(node["shop"="mall"](around:2000,LAT,LON);node["shop"="supermarket"](around:2000,LAT,LON);node["shop"="convenience"](around:2000,LAT,LON););` },
    { id: 'health', label: 'สุขภาพ', icon: Stethoscope, query: `(node["amenity"="hospital"](around:2000,LAT,LON);node["amenity"="clinic"](around:2000,LAT,LON););` },
    { id: 'food', label: 'อาหาร', icon: Utensils, query: `(node["amenity"="restaurant"](around:1000,LAT,LON);node["amenity"="cafe"](around:1000,LAT,LON););` },
];

// 2. ฟังก์ชันคำนวณระยะทาง
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI/180);
    const dLon = (lon2 - lon1) * (Math.PI/180);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
}

// 3. ตัวควบคุมแผนที่
function MapController({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, 15);
    }, [center, map]);
    return null;
}

const MapDisplay: React.FC<MapDisplayProps> = ({ lat, lng }) => {
  if (!lat || !lng) return null;

  const position: [number, number] = [lat, lng];
  const [selectedCategory, setSelectedCategory] = useState('transport');
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Custom Icons
  const homeIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div style="background-color: #ef4444; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

  const placeIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

  // Fetch Data
  useEffect(() => {
    const fetchPlaces = async () => {
        if (!lat || !lng) return;

        setLoading(true);
        try {
            const category = CATEGORIES.find(c => c.id === selectedCategory);
            if (!category) return;

            // ⭐️ เพิ่ม [timeout:25] และ [out:json]
            const query = `[out:json][timeout:25];${category.query.replace(/LAT/g, lat.toString()).replace(/LON/g, lng.toString())}out 10;`;
            const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

            const res = await fetch(url);

            // ⭐️ เช็ค Status ก่อน
            if (!res.ok) throw new Error(`API Error: ${res.status}`);

            // ⭐️ อ่านเป็น Text ก่อนเพื่อกัน Error XML
            const textData = await res.text();
            
            try {
                const data = JSON.parse(textData);
                
                const formattedPlaces = data.elements.map((el: any) => {
                    const dist = getDistance(lat, lng, el.lat, el.lon);
                    return {
                        id: el.id,
                        name: el.tags.name || el.tags.name_en || 'สถานที่',
                        lat: el.lat,
                        lon: el.lon,
                        distance: dist,
                        walkTime: Math.ceil((dist * 1000) / 80),
                        driveTime: Math.ceil((dist * 60) / 30),
                    };
                }).sort((a: any, b: any) => a.distance - b.distance);

                setPlaces(formattedPlaces);
            } catch (jsonError) {
                console.error("Overpass API returned invalid JSON (Likely XML Error):", textData);
                setPlaces([]); // เคลียร์ข้อมูลถ้า API เออเร่อ
            }

        } catch (error) {
            console.error("Error fetching places:", error);
            setPlaces([]);
        } finally {
            setLoading(false);
        }
    };

    fetchPlaces();
  }, [selectedCategory, lat, lng]);

  return (
    <div className="relative h-[500px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
        
        {/* Categories */}
        <div className="absolute top-4 left-4 right-4 z-[500] flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {CATEGORIES.map((cat) => (
                <Button 
                    key={cat.id} 
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`rounded-full shadow-md whitespace-nowrap ${selectedCategory === cat.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                >
                    <cat.icon className="w-4 h-4 mr-2" /> {cat.label}
                </Button>
            ))}
        </div>

        {/* Sidebar List (Desktop) */}
        <div className="absolute top-16 left-4 bottom-4 w-72 z-[500] hidden md:flex flex-col gap-2">
            <Card className="flex-1 bg-white/95 backdrop-blur-sm border border-slate-200 shadow-lg overflow-hidden flex flex-col">
                <div className="p-3 border-b bg-slate-50 text-xs font-semibold text-slate-500">
                    สถานที่ใกล้เคียง ({places.length})
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-xs">กำลังค้นหา...</span>
                        </div>
                    ) : places.length > 0 ? (
                        places.map((place) => (
                            <div key={place.id} className="p-3 rounded-lg bg-white border border-slate-100 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group/item">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-sm font-bold text-slate-800 line-clamp-2">{place.name}</h4>
                                    <span className="text-xs font-semibold text-blue-600 whitespace-nowrap">{place.distance < 1 ? `${(place.distance * 1000).toFixed(0)} ม.` : `${place.distance.toFixed(1)} กม.`}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                                    <span className="flex items-center"><Navigation className="w-3 h-3 mr-1"/> {place.driveTime} น.</span>
                                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/> {place.walkTime} น. (เดิน)</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-xs text-slate-400">ไม่พบสถานที่ หรือ API ขัดข้อง</div>
                    )}
                </div>
            </Card>
        </div>

        {/* Map */}
        <MapContainer 
          center={position} 
          zoom={15} 
          scrollWheelZoom={true} 
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          zoomControl={false} 
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController center={position} />

          {/* Home Marker */}
          <Marker position={position} icon={homeIcon}>
            <Popup>ตำแหน่งที่ตั้งทรัพย์สิน</Popup>
          </Marker>

          {/* Nearby Markers */}
          {!loading && places.map((place) => (
              <Marker key={place.id} position={[place.lat, place.lon]} icon={placeIcon}>
                  <Popup>
                      <b className="text-sm">{place.name}</b><br/>
                      <span className="text-xs text-slate-500">ห่าง {place.distance < 1 ? `${(place.distance * 1000).toFixed(0)} ม.` : `${place.distance.toFixed(1)} กม.`}</span>
                  </Popup>
              </Marker>
          ))}

        </MapContainer>
    </div>
  );
};

export default MapDisplay;