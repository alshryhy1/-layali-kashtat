"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
 import WeatherWidget from "./WeatherWidget";

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

export default function MapClient() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Fix Leaflet icon issue
    import("leaflet").then((L) => {
      // @ts-expect-error Leaflet default icon private API
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });
    });
  }, []);

  if (!isMounted) {
    return (
      <div className="h-full w-full bg-gray-100 flex items-center justify-center animate-pulse">
        <p className="text-gray-500 font-bold">جاري تحميل الخريطة...</p>
      </div>
    );
  }

  const SPOTS = [
    { name: "روضة خريم", desc: "مكان ربيعي ممتاز للعوائل", lat: 25.3854, lng: 47.2845, type: "green" },
    { name: "منتزه الثمامة", desc: "كشتات رملية قريبة من الرياض", lat: 25.2154, lng: 46.6698, type: "sand" },
    { name: "شاطئ العقير", desc: "أقدم ميناء وشاطئ جميل للتخييم", lat: 25.6567, lng: 50.2134, type: "beach" },
    { name: "جبال طويق (نهاية العالم)", desc: "إطلالة جبلية شاهقة", lat: 24.9452, lng: 45.9926, type: "mountain" },
    { name: "وادي لجب", desc: "وادي صخري في جازان", lat: 17.5967, lng: 42.9312, type: "mountain" },
    { name: "فوهة الوعبة", desc: "فوهة بركانية عملاقة", lat: 22.9056, lng: 41.1384, type: "mountain" },
    { name: "نفود الكبير", desc: "كثبان رملية حمراء", lat: 28.5, lng: 41.5, type: "sand" },
    { name: "عسير - السودة", desc: "أجواء باردة وطبيعة خضراء", lat: 18.2778, lng: 42.3611, type: "green" },
  ];

  return (
    <MapContainer center={[24.7136, 46.6753]} zoom={5} style={{ height: "100%", width: "100%", zIndex: 1 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {SPOTS.map((spot, idx) => (
        <Marker key={idx} position={[spot.lat, spot.lng]}>
          <Popup>
            <div className="text-center p-1">
              <h3 className="font-bold text-lg mb-1">{spot.name}</h3>
              <p className="text-sm text-gray-600">{spot.desc}</p>
              <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-bold text-white
                ${spot.type === 'sand' ? 'bg-yellow-500' : 
                  spot.type === 'green' ? 'bg-green-600' : 
                  spot.type === 'beach' ? 'bg-blue-500' : 'bg-gray-600'}`
              }>
                {spot.type === 'sand' ? 'رملي' : 
                 spot.type === 'green' ? 'ربيعي' : 
                 spot.type === 'beach' ? 'بحري' : 'جبلي'}
              </span>
              <WeatherWidget lat={spot.lat} lng={spot.lng} />
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
