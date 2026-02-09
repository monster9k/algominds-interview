import { Card } from "@/components/ui/card";

export function CalendarWidget() {
  const currentDay = new Date().getDate(); // Lấy ngày hiện tại
  
  return (
    <Card className="bg-zinc-900/50 border-zinc-800 p-4">
        <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-zinc-200">Day {currentDay}</h3>
            <span className="text-xs text-rose-500 font-medium bg-rose-500/10 px-2 py-1 rounded-full">5 Day Streak 🔥</span>
        </div>
        
        {/* Simple Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-500">
            {['S','M','T','W','T','F','S'].map(d => <div key={d} className="font-bold pb-2">{d}</div>)}
            
            {Array.from({length: 30}).map((_, i) => {
                const day = i + 1;
                const isToday = day === currentDay;
                const isPast = day < currentDay;
                
                return (
                    <div 
                        key={i} 
                        className={`h-8 w-8 flex items-center justify-center rounded-md transition-all
                            ${isToday ? "bg-rose-600 text-white shadow-lg shadow-rose-900/50 scale-110" : ""}
                            ${isPast ? "text-emerald-500 bg-emerald-500/10" : "hover:bg-zinc-800"}
                        `}
                    >
                        {isPast ? "✓" : day}
                    </div>
                );
            })}
        </div>
    </Card>
  );
}