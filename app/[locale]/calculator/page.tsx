 "use client";
 
 import { useState } from "react";
 import { Calculator, Droplets, Flame, Utensils, Users, Calendar, Sun, Snowflake } from "lucide-react";
 import { usePathname } from "next/navigation";
 
type ResultItemProps = { icon: React.ReactNode; label: string; value: string };
function ResultItem({ icon, label, value }: ResultItemProps) {
  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 grid place-items-center">{icon}</div>
        <div className="font-bold text-gray-800">{label}</div>
      </div>
      <div className="text-gray-600 font-bold">{value}</div>
    </div>
  );
}

 export default function SuppliesCalculator({
   params,
 }: {
   params: Promise<{ locale: string }>;
 }) {
   const [inputs, setInputs] = useState({
     adults: 2,
     children: 0,
     days: 1,
     season: "winter",
     meals: {
       breakfast: true,
       lunch: true,
       dinner: true,
     },
   });
 
   const [results, setResults] = useState<any>(null);
 
   const calculate = () => {
     const isSummer = inputs.season === "summer";
     const totalPeople = inputs.adults + inputs.children * 0.5;
 
     const drinkingPerPerson = isSummer ? 4 : 2.5;
     const washingPerPerson = isSummer ? 10 : 6;
     
     const waterDrinking = Math.ceil((inputs.adults * drinkingPerPerson + inputs.children * (drinkingPerPerson / 2)) * inputs.days);
     const waterWashing = Math.ceil((inputs.adults * washingPerPerson + inputs.children * (washingPerPerson / 2)) * inputs.days);
 
     const meatPerPerson = 0.35;
     const chickenPerPerson = 0.5;
     const ricePerPerson = 0.2;
 
     let meat = 0;
     let chicken = 0;
     let rice = 0;
 
     if (inputs.meals.dinner) {
       meat = (inputs.adults * meatPerPerson + inputs.children * (meatPerPerson / 2)) * inputs.days;
     }
     if (inputs.meals.lunch) {
       chicken = (inputs.adults * chickenPerPerson + inputs.children * (chickenPerPerson / 2)) * inputs.days;
       rice += (inputs.adults * ricePerPerson + inputs.children * (ricePerPerson / 2)) * inputs.days;
     }
     if (inputs.meals.dinner) {
         rice += (inputs.adults * ricePerPerson + inputs.children * (ricePerPerson / 2)) * inputs.days;
     }
 
     const charcoalPerDay = isSummer ? 2 : 4;
     const woodPerDay = isSummer ? 1 : 3;
 
     const charcoal = charcoalPerDay * inputs.days;
     const wood = woodPerDay * inputs.days;
 
     setResults({
       waterDrinking,
       waterWashing,
       meat: Math.ceil(meat * 10) / 10,
       chicken: Math.ceil(chicken),
       rice: Math.ceil(rice * 10) / 10,
       charcoal,
       wood,
     });
   };
 
   return (
     <div className="page-container p-6 bg-amber-50 min-h-screen">
       <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
         <div className="bg-amber-600 p-6 text-white text-center">
           <Calculator className="mx-auto mb-3" size={48} />
           <h1 className="text-3xl font-bold mb-2">حاسبة العزبة الذكية</h1>
           <p className="opacity-90">احسب احتياجات كشتتك بدقة وبدون هدر</p>
         </div>
 
         <div className="p-8 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="flex items-center gap-2 font-bold text-gray-700">
                 <Users size={20} className="text-amber-600" />
                 عدد البالغين
               </label>
               <input
                 type="number"
                 min="1"
                 value={inputs.adults}
                 onChange={(e) => setInputs({ ...inputs, adults: parseInt(e.target.value) || 0 })}
                 className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
               />
             </div>
 
             <div className="space-y-2">
               <label className="flex items-center gap-2 font-bold text-gray-700">
                 <Users size={20} className="text-amber-600" />
                 عدد الأطفال
               </label>
               <input
                 type="number"
                 min="0"
                 value={inputs.children}
                 onChange={(e) => setInputs({ ...inputs, children: parseInt(e.target.value) || 0 })}
                 className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
               />
             </div>
 
             <div className="space-y-2">
               <label className="flex items-center gap-2 font-bold text-gray-700">
                 <Calendar size={20} className="text-amber-600" />
                 مدة الرحلة (أيام)
               </label>
               <input
                 type="number"
                 min="1"
                 value={inputs.days}
                 onChange={(e) => setInputs({ ...inputs, days: parseInt(e.target.value) || 1 })}
                 className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
               />
             </div>
 
             <div className="space-y-2">
               <label className="flex items-center gap-2 font-bold text-gray-700">
                 {inputs.season === "winter" ? <Snowflake size={20} className="text-blue-500" /> : <Sun size={20} className="text-orange-500" />}
                 الموسم
               </label>
               <div className="flex bg-gray-100 rounded-xl p-1">
                 <button
                   onClick={() => setInputs({ ...inputs, season: "winter" })}
                   className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                     inputs.season === "winter" ? "bg-white shadow text-blue-600" : "text-gray-500"
                   }`}
                 >
                   شتاء
                 </button>
                 <button
                   onClick={() => setInputs({ ...inputs, season: "summer" })}
                   className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                     inputs.season === "summer" ? "bg-white shadow text-orange-600" : "text-gray-500"
                   }`}
                 >
                   صيف
                 </button>
               </div>
             </div>
           </div>
 
           <div className="space-y-2">
             <label className="flex items-center gap-2 font-bold text-gray-700 mb-2">
               <Utensils size={20} className="text-amber-600" />
               الوجبات المخطط لها
             </label>
             <div className="flex gap-4">
               {["breakfast", "lunch", "dinner"].map((meal) => (
                 <label key={meal} className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-100">
                   <input
                     type="checkbox"
                     checked={inputs.meals[meal as keyof typeof inputs.meals]}
                     onChange={(e) =>
                       setInputs({
                         ...inputs,
                         meals: { ...inputs.meals, [meal]: e.target.checked },
                       })
                     }
                     className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                   />
                   <span className="text-gray-700 font-medium">
                     {meal === "breakfast" ? "فطور" : meal === "lunch" ? "غداء" : "عشاء"}
                   </span>
                 </label>
               ))}
             </div>
           </div>
 
           <button
             onClick={calculate}
             className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-xl text-lg shadow-lg transform transition active:scale-95"
           >
             احسب المقادير
           </button>
 
           {results && (
             <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                 <h3 className="text-xl font-bold text-amber-900 mb-4 text-center">القائمة المقترحة</h3>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <ResultItem
                     icon={<Droplets className="text-blue-500" />}
                     label="ماء شرب"
                     value={`${results.waterDrinking} لتر`}
                   />
                   <ResultItem
                     icon={<Droplets className="text-cyan-500" />}
                     label="ماء غسيل/طبخ"
                     value={`${results.waterWashing} لتر`}
                   />
                   <ResultItem
                     icon={<Utensils className="text-red-500" />}
                     label="لحم"
                     value={`${results.meat} كجم`}
                   />
                   <ResultItem
                     icon={<Utensils className="text-orange-500" />}
                     label="دجاج"
                     value={`${results.chicken} حبة`}
                   />
                   <ResultItem
                     icon={<Utensils className="text-yellow-600" />}
                     label="رز"
                     value={`${results.rice} كجم`}
                   />
                   <ResultItem
                     icon={<Flame className="text-gray-700" />}
                     label="فحم"
                     value={`${results.charcoal} كجم`}
                   />
                   <ResultItem
                     icon={<Flame className="text-amber-800" />}
                     label="حطب"
                     value={`${results.wood} حزمة`}
                   />
                 </div>
 
                 <div className="mt-6 text-center">
                     <p className="text-sm text-gray-500 mb-4">هذه الكميات تقديرية وتعتمد على متوسط الاستهلاك</p>
                     <button 
                         onClick={() => window.print()}
                         className="bg-gray-900 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-gray-800 transition"
                     >
                         طباعة القائمة
                     </button>
                 </div>
               </div>
             </div>
           )}
         </div>
       </div>
     </div>
   );
 }
