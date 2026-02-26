"use client";

import { useState } from "react";
import { AlertTriangle, MapPin, Phone, ShieldAlert, Compass, Bug } from "lucide-react";

export default function SOSPage() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getHelp = () => {
    setLoading(true);
    setError(null);
    
    if (!navigator.geolocation) {
      setError("المتصفح لا يدعم تحديد الموقع");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setLoading(false);
        
        const text = `احتاج فزعة!%0Aموقعي:%0Ahttps://maps.google.com/?q=${latitude},${longitude}`;
        window.open(`https://wa.me/?text=${text}`, "_blank");
      },
      (err) => {
        setError("تعذر تحديد الموقع. تأكد من تفعيل GPS.");
        setLoading(false);
        console.error(err);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="page-container p-6 bg-red-50 min-h-screen">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* SOS Button */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden text-center p-8 border-b-8 border-red-600">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <AlertTriangle className="text-red-600" size={40} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">طلب فزعة عاجلة</h1>
          <p className="text-gray-600 mb-8">اضغط الزر أدناه لتحديد موقعك وإرساله عبر واتساب</p>
          
          <button
            onClick={getHelp}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-2xl py-6 rounded-2xl shadow-lg transform transition active:scale-95 flex items-center justify-center gap-3"
          >
            {loading ? (
              "جاري تحديد الموقع..."
            ) : (
              <>
                <MapPin size={32} />
                أرسل موقعي الآن
              </>
            )}
          </button>
          
          {error && (
            <p className="mt-4 text-red-600 font-bold bg-red-50 p-3 rounded-lg">{error}</p>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-800 pr-2 border-r-4 border-amber-500">دليل الطوارئ</h2>

        {/* Safety Guides */}
        <div className="space-y-4">
          
          {/* Car Stuck */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 p-3 rounded-xl text-amber-700">
                <Compass size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">إذا غرزت السيارة</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                  <li>لا تستمر بالدعس على البنزين حتى لا تحفر الكفرات أكثر.</li>
                  <li>نسم الكفرات إلى 10-15 PSI لزيادة مساحة التلامس.</li>
                  <li>حاول إزالة الرمل من أمام الكفرات.</li>
                  <li>استخدم وضع الدبل الثقيل (4L) إذا توفر.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Scorpion/Snake Bite */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="bg-red-100 p-3 rounded-xl text-red-700">
                <Bug size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">لدغات العقارب والثعابين</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                  <li>هدئ المصاب وامنع حركته لتقليل انتشار السم.</li>
                  <li>اجعل مكان اللدغة في مستوى أخفض من القلب.</li>
                  <li>لا تحاول مص السم أو جرح المكان.</li>
                  <li>انقل المصاب لأقرب مستشفى فوراً.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Lost */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-xl text-blue-700">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">إذا تهت في الصحراء</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                  <li>ابق بجانب سيارتك ولا تغادرها أبداً، فهي أسهل للرؤية من الجو.</li>
                  <li>افتح غطاء المحرك كإشارة طلب نجدة.</li>
                  <li>وفر الماء ولا تشربه إلا عند الضرورة القصوى.</li>
                  <li>أشعل ناراً في الليل ليرى ضوءها من بعيد.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Emergency Numbers */}
          <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-lg mt-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Phone size={24} /> أرقام تهمك
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 p-3 rounded-lg text-center">
                <span className="block text-2xl font-black text-red-400">911</span>
                <span className="text-xs text-gray-400">الطوارئ الموحد</span>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg text-center">
                <span className="block text-2xl font-black text-green-400">998</span>
                <span className="text-xs text-gray-400">الدفاع المدني</span>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg text-center">
                <span className="block text-2xl font-black text-amber-400">996</span>
                <span className="text-xs text-gray-400">أمن الطرق</span>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg text-center">
                <span className="block text-2xl font-black text-blue-400">997</span>
                <span className="text-xs text-gray-400">الهلال الأحمر</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
