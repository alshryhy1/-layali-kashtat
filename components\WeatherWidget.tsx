 "use client";
 
 import { useEffect, useState } from "react";
 import { Cloud, Sun, CloudRain, Wind, Thermometer } from "lucide-react";
 
 interface WeatherData {
   temperature: number;
   windspeed: number;
   weathercode: number;
 }
 
 export default function WeatherWidget({ lat, lng }: { lat: number; lng: number }) {
   const [weather, setWeather] = useState<WeatherData | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(false);
 
   useEffect(() => {
     const fetchWeather = async () => {
       try {
         setLoading(true);
         const res = await fetch(
           `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`
         );
         const data = await res.json();
         if (data.current_weather) {
           setWeather(data.current_weather);
         } else {
           setError(true);
         }
       } catch (err) {
         console.error("Weather fetch error:", err);
         setError(true);
       } finally {
         setLoading(false);
       }
     };
 
     fetchWeather();
   }, [lat, lng]);
 
   if (loading) return <div className="text-xs text-gray-500 animate-pulse">جاري تحميل الطقس...</div>;
   if (error || !weather) return null;
 
   const getWeatherIcon = (code: number) => {
     if (code <= 1) return <Sun size={16} className="text-orange-500" />;
     if (code <= 3) return <Cloud size={16} className="text-gray-500" />;
     if (code <= 67) return <CloudRain size={16} className="text-blue-500" />;
     return <Wind size={16} className="text-gray-600" />;
   };
 
   const getWeatherDesc = (code: number) => {
     if (code <= 1) return "صافي";
     if (code <= 3) return "غائم جزئياً";
     if (code <= 67) return "مطر";
     return "عاصف";
   };
 
   return (
     <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-3 text-sm">
       <div className="flex items-center gap-1">
         <Thermometer size={14} className="text-red-500" />
         <span className="font-bold">{weather.temperature}°C</span>
       </div>
       <div className="flex items-center gap-1">
         {getWeatherIcon(weather.weathercode)}
         <span>{getWeatherDesc(weather.weathercode)}</span>
       </div>
       <div className="flex items-center gap-1 text-xs text-gray-500">
         <Wind size={12} />
         <span>{weather.windspeed} km/h</span>
       </div>
     </div>
   );
 }
