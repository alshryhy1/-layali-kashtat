import MapClient from "@/components/MapClient";
import { MapPin } from "lucide-react";

export default function MapPage() {
  return (
    <div className="page-container flex flex-col h-[calc(100vh-80px)]">
      <div className="bg-white p-4 shadow-sm z-10">
        <div className="container mx-auto flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-full text-green-700">
            <MapPin size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">خريطة الكشتات التفاعلية</h1>
            <p className="text-sm text-gray-500">استكشف أفضل أماكن التخييم في المملكة</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 relative bg-gray-100">
        <MapClient />
      </div>
    </div>
  );
}
