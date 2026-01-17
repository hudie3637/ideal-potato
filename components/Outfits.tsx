
import React, { useState, useMemo, useEffect } from 'react';
import { ClosetItem, Category, Outfit, UserProfile } from '../types';
import { Plus, Sparkles, X, Check, Loader2, Star, Trash2, ChevronRight, User, Info, ArrowLeft, CalendarCheck } from 'lucide-react';
import { evaluateOutfit, generateOutfitPreview } from '../services/geminiService';

interface OutfitsProps {
  items: ClosetItem[];
  outfits: Outfit[];
  userProfile?: UserProfile;
  onSaveOutfit: (outfit: Outfit) => void;
  onUpdateOutfit: (outfit: Outfit) => void;
  onDeleteOutfit: (id: string) => void;
  onSetTodayOutfit?: (id: string) => void;
}

const DEFAULT_SCENARIOS = ['Casual', 'Work', 'Party', 'Sport', 'Vacation'];

const STAGES = [
  { p: 0, m: "Initializing AI..." },
  { p: 15, m: "Designing Silhouette..." },
  { p: 35, m: "Texture Synthesis..." },
  { p: 60, m: "Adjusting Fit..." },
  { p: 80, m: "Cinematic Rendering..." },
  { p: 92, m: "Final Polish..." }
];

const generateLocalPreview = async (selectedItems: { [key in Category]?: ClosetItem | null }): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve('');

    canvas.width = 400;
    canvas.height = 533; 
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const top = selectedItems[Category.TOPS] || selectedItems[Category.DRESSES];
    const bottom = selectedItems[Category.BOTTOMS];

    const loadImage = (url: string): Promise<HTMLImageElement> => new Promise((res) => {
      if (!url) return res(new Image());
      const img = new Image();
      if (url.startsWith('http')) {
        img.crossOrigin = "anonymous";
        const separator = url.includes('?') ? '&' : '?';
        img.src = `${url}${separator}cors=${Date.now()}`;
      } else {
        img.src = url;
      }
      
      const timeout = setTimeout(() => res(new Image()), 5000);
      img.onload = () => { clearTimeout(timeout); res(img); };
      img.onerror = () => { clearTimeout(timeout); res(new Image()); };
    });

    const draw = async () => {
      try {
        if (bottom && bottom.imageUrl) {
          const bImg = await loadImage(bottom.imageUrl);
          if (bImg.width > 0) ctx.drawImage(bImg, 80, 240, 240, 240);
        }
        if (top && top.imageUrl) {
          const tImg = await loadImage(top.imageUrl);
          if (tImg.width > 0) ctx.drawImage(tImg, 80, 80, 240, 240);
        }
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } catch (e) {
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      }
    };
    draw();
  });
};

const OutfitCluster: React.FC<{ outfit: Outfit; onDelete: (id: string) => void; onWearToday: (id: string) => void; onClick: () => void }> = ({ outfit, onDelete, onWearToday, onClick }) => {
  const isGenerating = outfit.previewStatus === 'generating';
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(STAGES[0].m);

  useEffect(() => {
    if (!isGenerating) return;
    
    let startTime = Date.now();
    const duration = 12000 + Math.random() * 5000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawProgress = (elapsed / duration) * 100;
      const newProgress = Math.min(rawProgress, 92);
      setProgress(newProgress);

      const currentStage = [...STAGES].reverse().find(s => newProgress >= s.p);
      if (currentStage) setMessage(currentStage.m);
    }, 100);

    return () => clearInterval(interval);
  }, [isGenerating]);

  return (
    <div className="min-w-[160px] max-w-[160px] group animate-in zoom-in-95 duration-300">
      <div 
        onClick={onClick}
        className="relative aspect-[3/4] bg-[#f0f0f0] rounded-[32px] overflow-hidden border border-gray-100 shadow-sm transition-all group-hover:shadow-md cursor-pointer active:scale-[0.98]"
      >
        {(outfit.previewUrl || outfit.localPreviewUrl) ? (
          <img 
            src={outfit.previewUrl || outfit.localPreviewUrl} 
            className={`w-full h-full object-cover transition-all duration-1000 ${isGenerating ? 'opacity-40 brightness-75 blur-[2px]' : 'opacity-100'}`} 
            alt={outfit.name} 
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
             <Info className="text-gray-400" />
          </div>
        )}
        
        {isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
            <div className="w-full space-y-3">
              <div className="flex flex-col items-center space-y-2">
                 <div className="w-8 h-8 relative">
                    <div className="absolute inset-0 border-2 border-white/20 rounded-full" />
                    <div className="absolute inset-0 border-2 border-[#fde18b] border-t-transparent rounded-full animate-spin" />
                 </div>
                 <span className="text-[10px] font-black text-white uppercase tracking-widest text-center h-4 drop-shadow-md">
                   {message}
                 </span>
              </div>
              
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-[#fde18b] via-[#fff] to-[#fde18b] transition-all duration-300 relative"
                  style={{ width: `${progress}%`, backgroundSize: '200% 100%' }}
                >
                  <div className="absolute inset-0 animate-[shimmer_1.5s_infinite_linear] bg-gradient-to-r from-transparent via-white/40 to-transparent" style={{ backgroundSize: '100% 100%' }} />
                </div>
              </div>
              <div className="flex justify-between items-center px-0.5">
                 <span className="text-[8px] font-bold text-white/60">GEN-AI</span>
                 <span className="text-[8px] font-black text-[#fde18b]">{Math.floor(progress)}%</span>
              </div>
            </div>
          </div>
        )}

        {outfit.previewStatus === 'failed' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-center">
            <X size={24} className="text-red-400 mb-2" />
            <p className="text-[10px] font-bold text-white leading-tight">AI Generation Failed.<br/>Using local preview.</p>
          </div>
        )}

        {!isGenerating && (
          <div className="absolute top-3 left-3 right-3 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity z-30">
            <button 
              onClick={(e) => { e.stopPropagation(); onWearToday(outfit.id); }}
              className="p-2 bg-[#fde18b] text-gray-900 rounded-full shadow-lg hover:scale-110 active:scale-90 transition-all"
              title="Wear Today"
            >
              <CalendarCheck size={14} strokeWidth={3} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(outfit.id); }}
              className="p-2 bg-white/90 backdrop-blur rounded-full shadow-sm text-red-500 hover:bg-red-50 hover:scale-110 active:scale-90 transition-all"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/20 to-transparent">
          <div className="bg-white/90 backdrop-blur-md rounded-xl p-2 border border-white/20">
             <p className="text-[10px] font-black text-gray-800 truncate leading-none mb-1">{outfit.name}</p>
             <div className="flex items-center space-x-1">
               <Star size={8} fill="#e8b628" className="text-[#e8b628]" />
               <span className="text-[9px] font-bold text-gray-500">{outfit.score || '85'} Score</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Outfits: React.FC<OutfitsProps> = ({ items = [], outfits = [], userProfile, onSaveOutfit, onUpdateOutfit, onDeleteOutfit, onSetTodayOutfit }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [viewingOutfit, setViewingOutfit] = useState<Outfit | null>(null);
  const [selectedItems, setSelectedItems] = useState<{ [key in Category]?: ClosetItem | null }>({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<{ score: number, review: string } | null>(null);
  const [outfitName, setOutfitName] = useState('');
  const [selectedScenario, setSelectedScenario] = useState('Casual');

  useEffect(() => {
    if (!Array.isArray(outfits)) return;
    const generating = outfits.find(o => o && o.previewStatus === 'generating');
    if (generating) {
      const triggerGeneration = async () => {
        try {
          await new Promise(r => setTimeout(r, 800));
          const referencePhoto = userProfile?.bodyPhotoUrl || userProfile?.photoUrl;
          const aiUrl = await generateOutfitPreview(generating.items, referencePhoto);
          onUpdateOutfit({ ...generating, previewUrl: aiUrl, previewStatus: 'done' });
          if (viewingOutfit?.id === generating.id) {
            setViewingOutfit(prev => prev ? ({ ...prev, previewUrl: aiUrl, previewStatus: 'done' }) : null);
          }
        } catch (err) {
          console.error("Background AI Gen Error:", err);
          onUpdateOutfit({ ...generating, previewStatus: 'failed' });
          if (viewingOutfit?.id === generating.id) {
            setViewingOutfit(prev => prev ? ({ ...prev, previewStatus: 'failed' }) : null);
          }
        }
      };
      triggerGeneration();
    }
  }, [outfits, userProfile]);

  const groupedOutfits = useMemo(() => {
    const groups: { [key: string]: Outfit[] } = {};
    if (!Array.isArray(outfits)) return groups;
    outfits.forEach(o => {
      if (!o || !o.scenario) return;
      if (!groups[o.scenario]) groups[o.scenario] = [];
      groups[o.scenario].push(o);
    });
    return groups;
  }, [outfits]);

  const availableScenarios = useMemo(() => {
    const fromOutfits = Object.keys(groupedOutfits);
    return Array.from(new Set([...DEFAULT_SCENARIOS, ...fromOutfits]));
  }, [groupedOutfits]);

  const handleSelectItem = (item: ClosetItem) => {
    setSelectedItems(prev => ({
      ...prev,
      [item.category]: prev[item.category]?.id === item.id ? null : item
    }));
    setEvaluation(null);
  };

  const selectedList = useMemo(() => {
    return Object.values(selectedItems).filter((item): item is ClosetItem => !!item);
  }, [selectedItems]);

  const handleEvaluate = async () => {
    if (selectedList.length < 2) return;
    setIsEvaluating(true);
    try {
      const res = await evaluateOutfit(selectedList);
      setEvaluation(res);
      if (!outfitName) setOutfitName(`${selectedScenario} Set`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSave = async () => {
    if (selectedList.length === 0) return;
    setIsEvaluating(true);
    try {
      const localUrl = await generateLocalPreview(selectedItems).catch(() => '');
      const newOutfit: Outfit = {
        id: `outfit-${Date.now()}`,
        name: outfitName || `New Look`,
        scenario: selectedScenario,
        items: [...selectedList],
        score: evaluation?.score || 85,
        review: evaluation?.review || "Manually styled look.",
        createdAt: Date.now(),
        localPreviewUrl: localUrl,
        previewStatus: 'generating'
      };
      onSaveOutfit(newOutfit);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsCreating(false);
      setIsEvaluating(false);
      setSelectedItems({});
      setEvaluation(null);
      setOutfitName('');
    }
  };

  const handleSetToday = () => {
    if (viewingOutfit && onSetTodayOutfit) {
      onSetTodayOutfit(viewingOutfit.id);
      setViewingOutfit(null);
    }
  };

  const handleQuickSetToday = (id: string) => {
    if (onSetTodayOutfit) {
      onSetTodayOutfit(id);
    }
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-500 pb-24 h-full bg-[#fcfcfc]">
      <div className="px-5 pt-4 flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Gallery</h2>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Styled by Gemini</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="w-12 h-12 bg-gray-900 text-[#fde18b] rounded-2xl shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 space-y-10 pb-10">
        {Object.keys(groupedOutfits).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
             <Sparkles size={32} className="text-gray-400 mb-4" />
             <p className="text-xs font-black uppercase tracking-widest">No collections yet</p>
          </div>
        ) : (
          (Object.entries(groupedOutfits) as [string, Outfit[]][]).map(([scenario, group]) => (
            <div key={scenario} className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-1.5 h-1.5 bg-[#fde18b] rounded-full" />
                  <h3 className="text-[13px] font-black text-gray-800 tracking-widest uppercase">{scenario}</h3>
                </div>
              </div>

              <div className="flex space-x-5 overflow-x-auto no-scrollbar py-2">
                {group.map(outfit => outfit && (
                  <OutfitCluster 
                    key={outfit.id} 
                    outfit={outfit} 
                    onDelete={onDeleteOutfit} 
                    onWearToday={handleQuickSetToday}
                    onClick={() => setViewingOutfit(outfit)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Outfit Detail Modal */}
      {viewingOutfit && (
        <div className="fixed inset-0 z-[110] bg-white flex flex-col animate-in slide-in-from-right duration-300">
           <header className="px-6 pt-12 pb-4 flex items-center justify-between bg-white sticky top-0 z-10">
              <button onClick={() => setViewingOutfit(null)} className="flex items-center space-x-2 text-gray-900 font-bold">
                 <ArrowLeft size={20} />
                 <span className="text-sm">Back</span>
              </button>
              <h1 className="text-sm font-black uppercase tracking-widest text-gray-400">Outfit Details</h1>
              <div className="w-10" />
           </header>

           <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="px-6 pt-2 pb-6">
                 <div className="relative aspect-[3/4] rounded-[48px] overflow-hidden shadow-2xl border border-gray-100">
                    <img 
                      src={viewingOutfit.previewUrl || viewingOutfit.localPreviewUrl} 
                      className={`w-full h-full object-cover transition-all ${viewingOutfit.previewStatus === 'generating' ? 'blur-md opacity-50' : ''}`} 
                      alt="" 
                    />
                    {viewingOutfit.previewStatus === 'generating' && (
                       <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10">
                          <Loader2 size={32} className="animate-spin text-[#fde18b] mb-2" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">Synthesizing...</span>
                       </div>
                    )}
                 </div>
              </div>

              <div className="px-8 space-y-8 pb-32">
                 <div className="flex justify-between items-start">
                    <div>
                       <h2 className="text-2xl font-black text-gray-900">{viewingOutfit.name}</h2>
                       <div className="flex items-center space-x-2 mt-1">
                          <span className="px-2 py-0.5 bg-[#fde18b]/30 text-[#e8b628] rounded-full text-[9px] font-black uppercase tracking-widest">{viewingOutfit.scenario}</span>
                          <span className="text-[11px] text-gray-400 font-bold">{new Date(viewingOutfit.createdAt).toLocaleDateString()}</span>
                       </div>
                    </div>
                    <div className="flex flex-col items-end">
                       <div className="flex items-center space-x-1">
                          <Star size={18} fill="#e8b628" className="text-[#e8b628]" />
                          <span className="text-xl font-black text-gray-900">{viewingOutfit.score}</span>
                       </div>
                       <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">AI Rating</span>
                    </div>
                 </div>

                 <div className="bg-gray-50 rounded-[32px] p-6 border border-gray-100">
                    <div className="flex items-center space-x-2 mb-3">
                       <Sparkles size={16} className="text-[#e8b628]" />
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Stylist Review</span>
                    </div>
                    <p className="text-[15px] text-gray-700 font-medium leading-relaxed italic">
                       "{viewingOutfit.review}"
                    </p>
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">Includes Items</h3>
                    <div className="grid grid-cols-2 gap-4">
                       {viewingOutfit.items.map(item => (
                          <div key={item.id} className="flex items-center space-x-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                             <div className="w-12 h-12 bg-[#f4f4f4] rounded-xl flex items-center justify-center p-2 flex-shrink-0">
                                <img src={item.imageUrl} alt="" className="w-full h-full object-contain" />
                             </div>
                             <div className="overflow-hidden">
                                <p className="text-[11px] font-black text-gray-800 truncate leading-tight">{item.name}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase">{item.category}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>

           <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t z-50">
              <button 
                onClick={handleSetToday}
                className="w-full h-16 bg-gray-900 text-[#fde18b] rounded-[24px] font-black text-sm flex items-center justify-center space-x-3 shadow-xl active:scale-95 transition-all"
              >
                <CalendarCheck size={20} />
                <span>Wear Today</span>
              </button>
           </footer>
        </div>
      )}

      {isCreating && (
        <div className="fixed inset-0 z-[120] bg-white flex flex-col animate-in slide-in-from-bottom duration-500">
          <header className="px-6 pt-12 pb-4 flex justify-between items-center bg-white sticky top-0 z-10">
            <button onClick={() => setIsCreating(false)} className="p-2 -ml-2 text-gray-400">
              <X size={24} />
            </button>
            <h1 className="text-lg font-black tracking-tight uppercase">New Outfit</h1>
            <div className="w-8" />
          </header>

          <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
            <div className="px-6 py-6">
              <div className="w-full aspect-[4/5] bg-gray-50 rounded-[50px] flex items-center justify-center relative overflow-hidden border border-gray-100">
                {selectedList.length === 0 ? (
                  <div className="text-center opacity-20">
                    <User size={120} strokeWidth={1} className="mx-auto mb-4" />
                    <p className="text-[9px] font-black uppercase tracking-[0.3em]">Pick your items</p>
                  </div>
                ) : (
                  <div className="relative w-full h-full flex flex-col items-center justify-center -space-y-16 scale-110">
                     {selectedItems[Category.BOTTOMS] && (
                       <img src={selectedItems[Category.BOTTOMS].imageUrl} className="w-56 h-56 object-contain drop-shadow-lg" />
                     )}
                     {(selectedItems[Category.TOPS] || selectedItems[Category.DRESSES]) && (
                       <img src={(selectedItems[Category.TOPS] || selectedItems[Category.DRESSES])!.imageUrl} className="w-56 h-56 object-contain drop-shadow-2xl z-20" />
                     )}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Style Type</p>
                   <select className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3.5 text-[13px] font-bold" value={selectedScenario} onChange={(e) => setSelectedScenario(e.target.value)}>
                     {availableScenarios.map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                 </div>
                 <div className="space-y-2">
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Name</p>
                   <input className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3.5 text-[13px] font-bold" placeholder="E.g. Monday Look" value={outfitName} onChange={(e) => setOutfitName(e.target.value)} />
                 </div>
              </div>

              {evaluation && (
                <div className="bg-[#1a1a1a] rounded-[32px] p-6 shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-[#fde18b] uppercase tracking-widest">Analysis</span>
                    <span className="text-[12px] font-black text-[#fde18b]">{evaluation.score} Score</span>
                  </div>
                  <p className="text-[13px] text-gray-300 font-medium italic">"{evaluation.review}"</p>
                </div>
              )}

              <div className="grid grid-cols-4 gap-3">
                {items.map(item => (
                  <button key={item.id} onClick={() => handleSelectItem(item)} className={`aspect-square rounded-[22px] border-2 p-2 flex items-center justify-center relative ${selectedItems[item.category]?.id === item.id ? 'border-[#fde18b] bg-[#fdfaf2]' : 'border-transparent bg-gray-50'}`}>
                    <img src={item.imageUrl} className="w-full h-full object-contain" />
                    {selectedItems[item.category]?.id === item.id && <Check size={10} strokeWidth={4} className="absolute top-1 right-1 text-[#e8b628]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-xl border-t flex space-x-3 z-20">
            <button onClick={handleEvaluate} disabled={isEvaluating || selectedList.length < 2} className="flex-1 h-14 bg-gray-100 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 disabled:opacity-30">
              {isEvaluating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={16} />}
              <span>AI Analyze</span>
            </button>
            <button onClick={handleSave} disabled={isEvaluating || selectedList.length === 0} className="flex-[1.5] h-14 bg-gray-900 text-[#fde18b] rounded-2xl font-black text-sm flex items-center justify-center">
              {isEvaluating ? <Loader2 className="animate-spin" /> : "Quick Save Look"}
            </button>
          </footer>
        </div>
      )}
    </div>
  );
};

export default Outfits;
