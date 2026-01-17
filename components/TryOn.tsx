
import React, { useState, useMemo } from 'react';
import { Outfit, CalendarMap } from '../types';
import { 
  Search, 
  History, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Plus,
  ArrowUp,
  X,
  Check
} from 'lucide-react';

interface CalendarViewProps {
  outfits: Outfit[];
  calendarMap: CalendarMap;
  onUpdateCalendar: (map: CalendarMap) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ outfits, calendarMap, onUpdateCalendar }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isPickingOutfit, setIsPickingOutfit] = useState(false);

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const startOffset = firstDay.getDay(); // 0 for Sunday
    
    // Padding from prev month
    for (let i = 0; i < startOffset; i++) {
      const d = new Date(year, month, -startOffset + i + 1);
      days.push({ date: d, currentMonth: false });
    }
    
    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), currentMonth: true });
    }
    
    // Padding for next month to complete 6 rows (42 cells)
    while (days.length < 42) {
      const d = new Date(year, month + 1, days.length - (startOffset + lastDay.getDate()) + 1);
      days.push({ date: d, currentMonth: false });
    }
    
    return days;
  }, [currentDate]);

  const selectedOutfit = useMemo(() => {
    const id = calendarMap[selectedDateStr];
    return outfits.find(o => o.id === id);
  }, [selectedDateStr, calendarMap, outfits]);

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const resetToToday = () => {
    setCurrentDate(new Date());
    setSelectedDateStr(new Date().toISOString().split('T')[0]);
  };

  const handleSelectOutfit = (outfitId: string) => {
    onUpdateCalendar({
      ...calendarMap,
      [selectedDateStr]: outfitId
    });
    setIsPickingOutfit(false);
  };

  const removeOutfitFromDay = () => {
    const newMap = { ...calendarMap };
    delete newMap[selectedDateStr];
    onUpdateCalendar(newMap);
  };

  const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-500">
      {/* Calendar Header */}
      <header className="px-5 pt-8 pb-4 flex flex-col space-y-4 bg-white sticky top-0 z-40">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => changeMonth(-1)}
              className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <div 
              onClick={resetToToday}
              className="flex items-center space-x-1 group cursor-pointer px-2"
            >
              <h2 className="text-[22px] font-black text-gray-900 tracking-tight">
                {currentDate.getMonth() + 1}月 {currentDate.getFullYear()}
              </h2>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-900 rotate-90" />
            </div>
            <button 
              onClick={() => changeMonth(1)}
              className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>
          <div className="flex items-center space-x-4 text-gray-700">
            <Search size={22} />
            <History size={22} />
            <MoreHorizontal size={22} />
          </div>
        </div>
        <div className="grid grid-cols-7 text-center">
          {weekdayNames.map(name => (
            <span key={name} className="text-[11px] font-bold text-gray-300 uppercase">{name}</span>
          ))}
        </div>
      </header>

      {/* Calendar Grid */}
      <div className="px-1 grid grid-cols-7 border-t border-gray-50 flex-shrink-0">
        {daysInMonth.map((dayObj, idx) => {
          const dateStr = dayObj.date.toISOString().split('T')[0];
          const outfitId = calendarMap[dateStr];
          const outfit = outfits.find(o => o.id === outfitId);
          const isSelected = dateStr === selectedDateStr;
          const isToday = dateStr === new Date().toISOString().split('T')[0];

          return (
            <div 
              key={idx}
              onClick={() => setSelectedDateStr(dateStr)}
              className={`aspect-[1/1.5] border-b border-r border-gray-50 p-1 relative cursor-pointer group transition-all overflow-hidden ${
                isSelected ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-blue-600 text-white shadow-lg' : 
                  isToday ? 'bg-[#fde18b] text-[#1a1a1a]' : 
                  dayObj.currentMonth ? 'text-gray-400' : 'text-gray-200'
                }`}>
                  {dayObj.date.getDate()}
                </span>
              </div>

              {outfit && (
                <div className="mt-1 w-full h-[70%] rounded-lg overflow-hidden border border-gray-100 shadow-sm animate-in zoom-in-95 bg-white">
                  <img src={outfit.previewUrl || outfit.localPreviewUrl} className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Detail Section */}
      <div className="flex-1 bg-white border-t-4 border-gray-50 p-5 mt-2">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
             <span className="text-lg font-black text-gray-800">{selectedDateStr}</span>
             <History size={16} className="text-gray-300" />
          </div>
          <div className="flex items-center space-x-2">
             <button className="p-2 bg-blue-50 text-blue-600 rounded-xl">
               <MoreHorizontal size={20} />
             </button>
             <button className="p-2 bg-gray-50 text-gray-400 rounded-xl">
               <ArrowUp size={20} />
             </button>
          </div>
        </div>

        {selectedOutfit ? (
          <div className="flex items-center space-x-5 animate-in slide-in-from-bottom-5">
            <div className="w-24 h-32 bg-gray-50 rounded-[24px] overflow-hidden border border-gray-100 shadow-lg flex-shrink-0 group relative">
               <img src={selectedOutfit.previewUrl || selectedOutfit.localPreviewUrl} className="w-full h-full object-cover" />
               <button 
                onClick={removeOutfitFromDay}
                className="absolute top-1 right-1 p-1 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
               >
                 <X size={12} />
               </button>
            </div>
            <div className="flex-1">
               <h4 className="font-black text-lg text-gray-900 truncate mb-1">{selectedOutfit.name}</h4>
               <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest mb-3">{selectedOutfit.scenario}</p>
               <div className="flex -space-x-2">
                  {selectedOutfit.items.slice(0, 3).map(it => (
                    <div key={it.id} className="w-10 h-10 rounded-full border-2 border-white bg-white shadow-sm flex items-center justify-center p-1 overflow-hidden">
                       <img src={it.imageUrl} className="w-full h-full object-contain" />
                    </div>
                  ))}
                  {selectedOutfit.items.length > 3 && (
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 shadow-sm flex items-center justify-center text-[10px] font-black text-gray-400">
                       +{selectedOutfit.items.length - 3}
                    </div>
                  )}
               </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-100 rounded-[32px] group hover:border-[#fde18b] transition-colors cursor-pointer" onClick={() => setIsPickingOutfit(true)}>
             <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-[#fde18b] transition-colors">
               <Plus size={24} className="text-gray-300 group-hover:text-[#1a1a1a]" />
             </div>
             <p className="text-xs font-black text-gray-300 uppercase tracking-[0.2em] group-hover:text-gray-500">记录今日穿搭</p>
          </div>
        )}
      </div>

      <div className="py-8 px-5 text-center">
         <h3 className="text-2xl font-black text-gray-900 mb-1">每日穿搭</h3>
         <p className="text-sm font-medium text-gray-400">记录过去，规划未来</p>
      </div>

      {/* Outfit Selection Modal */}
      {isPickingOutfit && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-500">
           <header className="px-6 pt-12 pb-6 flex items-center justify-between">
              <button onClick={() => setIsPickingOutfit(false)} className="p-2 -ml-2 text-gray-400">
                 <X size={24} />
              </button>
              <h1 className="text-lg font-black tracking-tight uppercase">选择穿搭</h1>
              <div className="w-8" />
           </header>
           
           <div className="flex-1 overflow-y-auto no-scrollbar px-6 grid grid-cols-2 gap-4 pb-10">
              {outfits.length === 0 ? (
                <div className="col-span-2 text-center py-20 opacity-30">
                  <Sparkles size={32} className="mx-auto mb-4" />
                  <p className="text-xs font-black tracking-widest uppercase">请先去“Outfits”生成穿搭</p>
                </div>
              ) : (
                outfits.map(o => (
                  <div key={o.id} onClick={() => handleSelectOutfit(o.id)} className="group cursor-pointer">
                    <div className="relative aspect-[3/4] rounded-[24px] overflow-hidden border border-gray-100 shadow-sm group-hover:shadow-lg transition-all">
                       <img src={o.previewUrl || o.localPreviewUrl} className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <Check size={32} className="text-white opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all" />
                       </div>
                    </div>
                    <p className="mt-2 text-[10px] font-black text-gray-800 text-center uppercase tracking-widest">{o.name}</p>
                  </div>
                ))
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
