
import React, { useState } from 'react';
import { Outfit } from '../types';
import { generateRunwayVideo } from '../services/gemini';

interface OutfitsSectionProps {
  outfits: Outfit[];
}

const OutfitsSection: React.FC<OutfitsSectionProps> = ({ outfits }) => {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});

  const handleGenerateVideo = async (outfit: Outfit) => {
    // Check for Veo Key with await as required
    if (!(await (window as any).aistudio?.hasSelectedApiKey())) {
      const proceed = confirm("Veo Video generation requires a paid API key. Please select a project with billing enabled: https://ai.google.dev/gemini-api/docs/billing");
      if (proceed) {
        await (window as any).aistudio?.openSelectKey();
      }
      return;
    }

    setGeneratingId(outfit.id);
    try {
      const desc = `A model wearing a ${outfit.items.map(i => i.color + ' ' + i.category).join(', ')}`;
      const video = await generateRunwayVideo(desc, outfit.items.map(i => i.imageUrl));
      setVideoUrls(prev => ({ ...prev, [outfit.id]: video }));
    } catch (err: any) {
      console.error(err);
      // Reset key if requested entity was not found (key issue)
      if (err.message?.includes("Requested entity was not found.")) {
        alert("API key error. Please re-select your key.");
        await (window as any).aistudio?.openSelectKey();
      } else {
        alert("Video generation failed. Please try again later.");
      }
    } finally {
      setGeneratingId(null);
    }
  };

  if (outfits.length === 0) {
    return (
      <div className="p-10 text-center flex flex-col items-center justify-center h-[60vh]">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <i className="fa-solid fa-shirt text-gray-200 text-3xl"></i>
        </div>
        <h3 className="text-gray-800 font-bold">No outfits yet</h3>
        <p className="text-gray-400 text-sm max-w-[200px] mt-2">Go to Try-On and save your first combination!</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {outfits.map(outfit => (
        <div key={outfit.id} className="bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
          <div className="p-4 flex justify-between items-center border-b border-gray-100 bg-white">
            <div>
              <h3 className="font-bold text-gray-800">{outfit.name}</h3>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                {outfit.items.length} ITEMS
              </p>
            </div>
            <button 
              onClick={() => handleGenerateVideo(outfit)}
              disabled={generatingId === outfit.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                videoUrls[outfit.id] 
                ? 'bg-blue-50 text-blue-600' 
                : 'bg-amber-400 text-white hover:bg-amber-500 active:scale-95 disabled:bg-gray-300'
              }`}
            >
              <i className={`fa-solid ${generatingId === outfit.id ? 'fa-spinner fa-spin' : 'fa-clapperboard'}`}></i>
              {videoUrls[outfit.id] ? 'Regenerate Runway' : 'Runway Video'}
            </button>
          </div>

          <div className="p-4">
            {videoUrls[outfit.id] ? (
               <div className="aspect-[9/16] bg-black rounded-2xl overflow-hidden relative shadow-lg">
                 <video 
                   src={videoUrls[outfit.id]} 
                   controls 
                   autoPlay 
                   loop 
                   className="w-full h-full object-cover" 
                 />
                 <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">
                   Veo 3.1 AI Vision
                 </div>
               </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {outfit.items.map(item => (
                  <div key={item.id} className="aspect-square bg-white rounded-xl p-2 flex items-center justify-center border border-gray-200">
                    <img src={item.imageUrl} className="max-w-full max-h-full object-contain" />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {generatingId === outfit.id && (
            <div className="px-4 pb-4 animate-pulse">
               <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
                 <div className="h-full bg-amber-500 w-1/3 animate-[loading_2s_ease-in-out_infinite]"></div>
               </div>
               <p className="text-[10px] text-center mt-2 font-bold text-amber-600">PREPARING RUNWAY SHOW...</p>
            </div>
          )}
        </div>
      ))}
      
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
};

export default OutfitsSection;
