
import React, { useState, useEffect, useRef } from 'react';
import { ClosetItem, AIRecommendation, Outfit } from '../types';
import { Sparkles, Star, Plus, Check, Loader2, RefreshCw, Heart, Share2, Info } from 'lucide-react';
import { getAIRecommendations, generateOutfitPreview } from '../services/geminiService';

interface DiscoverProps {
  items: ClosetItem[];
  userPhoto?: string;
  onSaveOutfit: (outfit: Outfit) => void;
}

const Discover: React.FC<DiscoverProps> = ({ items, userPhoto, onSaveOutfit }) => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNewRecommendations = async () => {
    if (items.length < 2) return;
    setLoading(true);
    try {
      const suggested = await getAIRecommendations(items);
      const formatted: AIRecommendation[] = suggested.map((s, idx) => ({
        ...s,
        id: `rec-${Date.now()}-${idx}`,
        isGenerating: true
      }));
      setRecommendations(prev => [...prev, ...formatted]);
      
      // Parallel generate images for each
      formatted.forEach(async (rec) => {
        try {
          const recItems = rec.itemIds.map(id => items.find(i => i.id === id)).filter(Boolean) as ClosetItem[];
          const url = await generateOutfitPreview(recItems, userPhoto);
          setRecommendations(prev => prev.map(r => r.id === rec.id ? { ...r, previewUrl: url, isGenerating: false } : r));
        } catch (e) {
          setRecommendations(prev => prev.map(r => r.id === rec.id ? { ...r, isGenerating: false } : r));
        }
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (recommendations.length === 0) fetchNewRecommendations();
  }, []);

  const handleSave = (rec: AIRecommendation) => {
    if (savedIds.has(rec.id)) return;
    const outfitItems = rec.itemIds.map(id => items.find(i => i.id === id)).filter(Boolean) as ClosetItem[];
    const newOutfit: Outfit = {
      id: `outfit-rec-${Date.now()}`,
      name: rec.name,
      scenario: rec.scenario,
      items: outfitItems,
      score: rec.score,
      review: rec.review,
      createdAt: Date.now(),
      previewUrl: rec.previewUrl,
      previewStatus: 'done'
    };
    onSaveOutfit(newOutfit);
    setSavedIds(new Set([...Array.from(savedIds), rec.id]));
  };

  if (items.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-center space-y-4">
        <Sparkles size={48} className="text-gray-200" />
        <h2 className="text-xl font-black text-gray-800">Add More Items</h2>
        <p className="text-sm text-gray-400 font-medium">Upload at least 2 items to your closet for AI to start generating style inspirations.</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-black overflow-hidden relative">
      <div 
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      >
        {recommendations.map((rec) => (
          <div key={rec.id} className="h-full w-full snap-start relative flex flex-col bg-gray-900">
            {/* Background Image / Loading */}
            <div className="absolute inset-0">
              {rec.previewUrl ? (
                <img src={rec.previewUrl} className="w-full h-full object-cover opacity-80" alt={rec.name} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="animate-spin text-[#fde18b]" size={40} />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Generating Lookbook...</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
            </div>

            {/* Interaction Buttons (Vertical Right) */}
            <div className="absolute right-4 bottom-32 flex flex-col space-y-6 items-center z-20">
              <button 
                onClick={() => handleSave(rec)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${savedIds.has(rec.id) ? 'bg-[#fde18b] text-gray-900 scale-110' : 'bg-white/10 backdrop-blur-xl text-white active:scale-90'}`}
              >
                {savedIds.has(rec.id) ? <Check size={28} strokeWidth={3} /> : <Heart size={28} />}
              </button>
              <button className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white active:scale-90">
                <Share2 size={24} />
              </button>
              <button className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white active:scale-90">
                <Info size={24} />
              </button>
            </div>

            {/* Content Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 space-y-4 animate-in slide-in-from-bottom-10 duration-700">
              <div className="flex items-center space-x-3">
                <div className="px-3 py-1 bg-[#fde18b] text-gray-900 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {rec.scenario}
                </div>
                <div className="flex items-center space-x-1 text-white">
                  <Star size={12} fill="#fde18b" className="text-[#fde18b]" />
                  <span className="text-sm font-black">{rec.score}</span>
                </div>
              </div>

              <h2 className="text-3xl font-black text-white tracking-tight leading-none">{rec.name}</h2>
              <p className="text-sm text-gray-300 font-medium leading-relaxed italic max-w-[85%]">
                "{rec.review}"
              </p>

              <div className="flex space-x-2 pt-2">
                {rec.itemIds.map(id => {
                  const item = items.find(i => i.id === id);
                  return item ? (
                    <div key={id} className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-xl p-1 border border-white/10">
                      <img src={item.imageUrl} className="w-full h-full object-contain" />
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Refresh Loader at bottom */}
        <div className="h-full snap-start flex flex-col items-center justify-center bg-black">
          {loading ? (
            <Loader2 className="animate-spin text-[#fde18b]" size={40} />
          ) : (
            <button 
              onClick={fetchNewRecommendations}
              className="flex flex-col items-center space-y-4 group"
            >
              <div className="w-20 h-20 bg-[#fde18b] rounded-full flex items-center justify-center text-gray-900 shadow-2xl group-active:scale-90 transition-all">
                <RefreshCw size={32} />
              </div>
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Find More Inspiration</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 pt-12 flex justify-between items-center pointer-events-none z-30">
        <h1 className="text-white text-xl font-black tracking-tighter drop-shadow-lg">Discover</h1>
        <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 pointer-events-auto cursor-pointer" onClick={fetchNewRecommendations}>
          <Sparkles size={14} className="text-[#fde18b]" />
          <span className="text-[10px] font-bold text-white uppercase tracking-widest">AI Refresh</span>
        </div>
      </div>
    </div>
  );
};

export default Discover;
